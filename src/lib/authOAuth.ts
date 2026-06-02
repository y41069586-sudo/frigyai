import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { FRIGY_APP_SCHEME } from "@/lib/appDeepLink";
import { openExternalUrl } from "@/lib/openExternalUrl";

export type OAuthProvider = "google" | "apple";

/** Redirect URL registered in Supabase Auth → URL Configuration. */
export function getOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return `${FRIGY_APP_SCHEME}://callback`;
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/auth`;
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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.warn("[AuthOAuth] exchangeCodeForSession failed:", error.message);
      return false;
    }
    return true;
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

export function isOAuthCallbackUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (!lower.includes("callback") && !lower.includes("access_token") && !lower.includes("code=")) {
    return false;
  }
  return lower.includes("code=") || lower.includes("access_token=");
}

export async function signInWithOAuthProvider(
  provider: OAuthProvider,
  options?: { redirectPath?: string },
): Promise<{ error: unknown | null }> {
  if (!supabase) {
    return { error: new Error("Supabase not configured") };
  }

  const redirectTo = options?.redirectPath
    ? `${getOAuthRedirectUrl().split("?")[0]}?next=${encodeURIComponent(options.redirectPath)}`
    : getOAuthRedirectUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: Capacitor.isNativePlatform(),
    },
  });

  if (error) return { error };

  if (Capacitor.isNativePlatform() && data?.url) {
    await openExternalUrl(data.url);
  }

  return { error: null };
}
