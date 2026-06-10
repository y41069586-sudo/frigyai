import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { signInWithOAuthProvider } from "@/lib/authOAuth";

export const APPLE_BUNDLE_ID =
  import.meta.env.VITE_APPLE_BUNDLE_ID?.trim() || "com.frigyapp.app";
const APPLE_REDIRECT_URI =
  import.meta.env.VITE_APPLE_REDIRECT_URI?.trim() || "https://app.frigy.app/auth/callback";

function generateRawNonce(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function isAppleSignInAvailable(): boolean {
  return Capacitor.getPlatform() === "ios";
}

/**
 * Native Sign in with Apple (iOS) → Supabase `signInWithIdToken`.
 * Falls back to OAuth in browser on other platforms.
 *
 * Supabase must list the iOS bundle ID under Apple → Client IDs, e.g. `com.frigyapp.app`.
 */
export async function signInWithApple(options?: {
  authQuery?: Record<string, string>;
}): Promise<{ error: unknown | null }> {
  if (!supabase) {
    return { error: new Error("Supabase not configured") };
  }

  if (!isAppleSignInAvailable()) {
    return signInWithOAuthProvider("apple", { authQuery: options?.authQuery });
  }

  try {
    const { AppleSignIn, SignInScope } = await import("@capawesome/capacitor-apple-sign-in");
    const rawNonce = generateRawNonce();
    const hashedNonce = await sha256Hex(rawNonce);

    const result = await AppleSignIn.signIn({
      scopes: [SignInScope.Email, SignInScope.FullName],
      nonce: hashedNonce,
      state: rawNonce,
    });

    const identityToken = result.idToken;
    if (!identityToken) {
      return { error: new Error("Apple identity token missing") };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: identityToken,
      nonce: rawNonce,
    });

    if (error) {
      return { error: resolveAppleAuthError(error) };
    }

    return { error: null };
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string };
    if (err?.code === "1001" || /cancel/i.test(String(err?.message || ""))) {
      return { error: null };
    }
    console.warn("[AppleSignIn] native failed, trying OAuth:", e);
    return signInWithOAuthProvider("apple", { authQuery: options?.authQuery });
  }
}

/** Link Apple to the currently signed-in user (opens Apple OAuth / native flow). */
export async function linkAppleIdentity(): Promise<{ error: unknown | null }> {
  if (!supabase) return { error: new Error("Supabase not configured") };

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { error: new Error("Not signed in") };
  }

  const { error } = await supabase.auth.linkIdentity({
    provider: "apple",
    options: {
      redirectTo: APPLE_REDIRECT_URI,
      skipBrowserRedirect: false,
    },
  });

  return { error: error ? resolveAppleAuthError(error) : null };
}

function resolveAppleAuthError(error: { message?: string; code?: string }): Error {
  const msg = error.message ?? "";

  if (/unacceptable audience/i.test(msg)) {
    console.error(
      `[AppleSignIn] Supabase rejected native Apple token. Add bundle ID "${APPLE_BUNDLE_ID}" ` +
        "to Dashboard → Authentication → Providers → Apple → Client IDs " +
        "(comma-separated with your Services ID if you use web OAuth too).",
    );
    return new Error(
      "Apple-Anmeldung ist gerade nicht verfügbar. Bitte nutze E-Mail oder Google, oder versuche es später erneut.",
    );
  }

  if (/already registered|already exists|identity/i.test(msg)) {
    return new Error(
      "Diese Apple-ID ist bereits mit einem anderen Konto verknüpft. Melde dich mit Apple an oder nutze die E-Mail-Anmeldung.",
    );
  }

  return new Error(msg || "Apple-Anmeldung fehlgeschlagen");
}
