import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { FRIGY_APP_SCHEME } from "@/lib/appDeepLink";
import {
  isAuthCompletionPending,
  isAuthNavigationPending,
  resetAuthFlow,
} from "@/lib/authCompletion";
import {
  clearStashedOAuthCallbackUrl,
  isRetriableOAuthExchangeError,
  peekStashedOAuthCallbackUrl,
} from "@/lib/oauthCallbackRecovery";
import { DEV_SERVER_PORT, LOCAL_OAUTH_REDIRECT } from "@/lib/devServerPort";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { clearOAuthPending, getOAuthPending, setOAuthPendingFromAuthQuery } from "@/lib/oauthPending";

export type OAuthProvider = "google" | "apple";

/**
 * Where Supabase sends the user AFTER OAuth (with ?code=…).
 * Register this exact URL in Supabase → Authentication → Redirect URLs.
 *
 * Do NOT use `${SUPABASE_URL}/auth/v1/callback` here — that URL is only for
 * Google/Apple → Supabase (configured in Google Cloud, not in app code).
 */
function isLocalWebHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local")
  );
}

function isPrivateLanHost(hostname: string): boolean {
  return (
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

/** After sign-in without premium — standalone paywall (not onboarding step 1). */
export const POST_AUTH_PAYWALL_ROUTE = "/premium-pricing";

function shouldForceLocalOAuthRedirect(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  const { hostname, port } = window.location;
  return port === String(DEV_SERVER_PORT) && (isLocalWebHost(hostname) || isPrivateLanHost(hostname));
}

export function getOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return `${FRIGY_APP_SCHEME}://callback`;
  }

  // Local dev — never LAN IP (Supabase rejects → Site URL app.frigy.app).
  if (shouldForceLocalOAuthRedirect()) {
    const explicit = import.meta.env.VITE_OAUTH_REDIRECT_URL?.trim();
    return (explicit || LOCAL_OAUTH_REDIRECT).replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (isLocalWebHost(hostname)) {
      return `${origin}/auth`;
    }
  }

  const explicit = import.meta.env.VITE_OAUTH_REDIRECT_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (origin) {
    return `${origin}/auth`;
  }

  return "https://app.frigy.app/auth";
}

function parseAuthParams(url: string): { code: string | null; accessToken: string | null; refreshToken: string | null } {
  try {
    const parsed = new URL(url);
    const hash = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
    const hashParams = new URLSearchParams(hash);
    const queryParams = parsed.searchParams;
    return {
      code: queryParams.get("code") ?? hashParams.get("code"),
      accessToken: hashParams.get("access_token"),
      refreshToken: hashParams.get("refresh_token"),
    };
  } catch {
    return { code: null, accessToken: null, refreshToken: null };
  }
}

/** Completes Supabase OAuth after frigy://callback or web redirect. */
export async function completeOAuthFromUrl(url: string): Promise<boolean> {
  if (!supabase) return false;

  const { code, accessToken, refreshToken } = parseAuthParams(url);
  if (!code && !accessToken) return false;

  const retryDelaysMs = Capacitor.isNativePlatform()
    ? [0, 400, 900, 1800, 3200, 5000]
    : [0, 200, 500];

  if (code) {
    let lastError = "";
    for (const delayMs of retryDelaysMs) {
      if (delayMs > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, delayMs));
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return true;

      lastError = error.message;
      if (!isRetriableOAuthExchangeError(error.message)) {
        console.warn("[AuthOAuth] exchangeCodeForSession failed:", error.message);
        return false;
      }
    }

    console.warn("[AuthOAuth] exchangeCodeForSession failed after retries:", lastError);
    return false;
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      console.warn("[AuthOAuth] setSession failed:", error.message);
      return false;
    }
    return true;
  }

  return false;
}

function getSupabaseAuthBase(): string {
  const base = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!base) throw new Error("VITE_SUPABASE_URL fehlt");
  return base;
}

/** Ensures Google OAuth shows the account picker (web + native in-app browser). */
function ensureGoogleAccountPicker(authorizeUrl: string, provider: OAuthProvider): string {
  if (provider !== "google" || !authorizeUrl) return authorizeUrl;
  try {
    const url = new URL(authorizeUrl);
    if (!url.searchParams.has("prompt")) {
      url.searchParams.set("prompt", "select_account");
    }
    return url.toString();
  } catch {
    return authorizeUrl;
  }
}

/** Direct authorize URL (same as Supabase server expects for Google). */
export function buildProviderAuthorizeUrl(
  provider: OAuthProvider,
  redirectTo: string,
): string {
  const params = new URLSearchParams({
    provider,
    redirect_to: redirectTo,
  });
  if (provider === "google") {
    params.set("prompt", "select_account");
  }
  return `${getSupabaseAuthBase()}/auth/v1/authorize?${params.toString()}`;
}

export function isOAuthCallbackUrl(url: string): boolean {
  if (!url?.trim()) return false;
  const { code, accessToken } = parseAuthParams(url);
  return Boolean(code || accessToken);
}

/** Supabase OAuth error redirect (?error=… or #error=…). */
export function isOAuthErrorUrl(url: string): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("error")) return true;
    const hash = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
    return new URLSearchParams(hash).has("error");
  } catch {
    return url.toLowerCase().includes("error=");
  }
}

function buildAuthRedirectTo(options?: {
  redirectPath?: string;
  authQuery?: Record<string, string>;
}): string {
  // Supabase allow-list matches the redirect URL exactly — no query params (use oauthPending / localStorage instead).
  void options?.redirectPath;
  void options?.authQuery;
  return getOAuthRedirectUrl().split("?")[0];
}

let oauthBrowserDismissHandle: { remove: () => void } | null = null;
let oauthBrowserOpenedAt = 0;

/** Deep link may arrive after the in-app browser closes (e.g. Google single-account). */
const OAUTH_BROWSER_GRACE_MS = 10_000;

async function registerOAuthBrowserDismissWatcher(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (oauthBrowserDismissHandle) {
      await oauthBrowserDismissHandle.remove();
      oauthBrowserDismissHandle = null;
    }

    oauthBrowserOpenedAt = Date.now();

    const { Browser } = await import("@capacitor/browser");
    const handle = await Browser.addListener("browserFinished", async () => {
      await handle.remove();
      oauthBrowserDismissHandle = null;

      const elapsed = Date.now() - oauthBrowserOpenedAt;
      const remainingGrace = OAUTH_BROWSER_GRACE_MS - elapsed;
      if (remainingGrace > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, Math.min(2500, remainingGrace)));
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) return;

      if (isAuthCompletionPending() || isAuthNavigationPending()) return;
      if (getOAuthPending()) return;
      if (peekStashedOAuthCallbackUrl()) return;

      clearOAuthPending();
      resetAuthFlow();
    });
    oauthBrowserDismissHandle = handle;
  } catch {
    // ignore
  }
}

export async function signInWithOAuthProvider(
  provider: OAuthProvider,
  options?: { redirectPath?: string; authQuery?: Record<string, string> },
): Promise<{ error: unknown | null }> {
  if (!supabase) {
    return { error: new Error("Supabase not configured") };
  }

  const redirectTo = buildAuthRedirectTo(options);

  clearStashedOAuthCallbackUrl();
  setOAuthPendingFromAuthQuery(options?.authQuery);

  if (import.meta.env.DEV) {
    console.info("[AuthOAuth] redirectTo:", redirectTo);
    if (
      typeof window !== "undefined" &&
      !isLocalWebHost(window.location.hostname) &&
      window.location.hostname !== "localhost"
    ) {
      console.warn(
        "[AuthOAuth] Du bist nicht auf localhost (z. B. 192.168.x.x). " +
          "OAuth nutzt trotzdem",
        redirectTo,
        "— in Supabase muss diese URL unter Redirect URLs stehen.",
      );
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      // Always show Google account picker (native in-app browser reuses Chrome/Safari cookies otherwise).
      ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
    },
  });

  if (error) return { error };

  let authorizeUrl = data?.url?.trim() || "";

  const expectedRedirect = redirectTo.split("?")[0];
  const redirectBroken =
    !authorizeUrl ||
    !authorizeUrl.includes("redirect_to=") ||
    !authorizeUrl.includes(encodeURIComponent(expectedRedirect));

  if (redirectBroken) {
    authorizeUrl = buildProviderAuthorizeUrl(provider, expectedRedirect);
    if (import.meta.env.DEV) {
      console.warn("[AuthOAuth] SDK-URL ohne passendes redirect_to — nutze direkte Authorize-URL:", authorizeUrl);
    }
  }

  if (!authorizeUrl) {
    return {
      error: new Error(
        "Keine OAuth-URL von Supabase. Prüfe Google-Provider im Dashboard und starte npm run dev neu.",
      ),
    };
  }

  if (shouldForceLocalOAuthRedirect() && authorizeUrl.includes("app.frigy.app") && !expectedRedirect.includes("app.frigy.app")) {
    return {
      error: new Error(
        `OAuth würde auf app.frigy.app gehen statt Google. Browser-Cache leeren (F12 → Application → Clear site data) und nur ${LOCAL_OAUTH_REDIRECT} nutzen.`,
      ),
    };
  }

  authorizeUrl = ensureGoogleAccountPicker(authorizeUrl, provider);

  console.info("[AuthOAuth] opening:", authorizeUrl);

  if (Capacitor.isNativePlatform()) {
    await openExternalUrl(authorizeUrl);
    void registerOAuthBrowserDismissWatcher();
  } else {
    window.location.assign(authorizeUrl);
  }

  return { error: null };
}
