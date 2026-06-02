import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { signInWithOAuthProvider } from "@/lib/authOAuth";

const BUNDLE_ID = import.meta.env.VITE_APPLE_BUNDLE_ID?.trim() || "com.frigyapp.app";
const APPLE_REDIRECT_URI =
  import.meta.env.VITE_APPLE_REDIRECT_URI?.trim() || "https://app.frigy.app/auth/callback";

function generateNonce(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isAppleSignInAvailable(): boolean {
  return Capacitor.getPlatform() === "ios";
}

/**
 * Native Sign in with Apple (iOS) → Supabase `signInWithIdToken`.
 * Falls back to OAuth in browser on other platforms.
 */
export async function signInWithApple(): Promise<{ error: unknown | null }> {
  if (!supabase) {
    return { error: new Error("Supabase not configured") };
  }

  if (!isAppleSignInAvailable()) {
    return signInWithOAuthProvider("apple");
  }

  try {
    const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
    const nonce = generateNonce();

    const result = await SignInWithApple.authorize({
      clientId: import.meta.env.VITE_APPLE_CLIENT_ID?.trim() || BUNDLE_ID,
      redirectURI: APPLE_REDIRECT_URI,
      scopes: "email name",
      state: nonce,
      nonce,
    });

    const identityToken = result.response?.identityToken;
    if (!identityToken) {
      return { error: new Error("Apple identity token missing") };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: identityToken,
      nonce,
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
    return signInWithOAuthProvider("apple");
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
      redirectTo: import.meta.env.VITE_APPLE_REDIRECT_URI?.trim() || "https://app.frigy.app/auth/callback",
      skipBrowserRedirect: false,
    },
  });

  return { error: error ? resolveAppleAuthError(error) : null };
}

function resolveAppleAuthError(error: { message?: string; code?: string }): Error {
  const msg = error.message ?? "";
  if (/already registered|already exists|identity/i.test(msg)) {
    return new Error(
      "Diese Apple-ID ist bereits mit einem anderen Konto verknüpft. Melde dich mit Apple an oder nutze die E-Mail-Anmeldung und verknüpfe Apple in den Einstellungen.",
    );
  }
  return new Error(msg || "Apple-Anmeldung fehlgeschlagen");
}
