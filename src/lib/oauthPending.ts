import { Capacitor } from "@capacitor/core";
import { peekStashedOAuthCallbackUrl } from "@/lib/oauthCallbackRecovery";

/** Tracks in-flight OAuth (web sessionStorage + native localStorage). */
export const OAUTH_PENDING_KEY = "frigy_oauth_pending";

export type OAuthPendingFlag = "onboarding" | "login" | "signup";

export function setOAuthPendingFromAuthQuery(authQuery?: Record<string, string>): void {
  let flag: OAuthPendingFlag = "signup";
  if (authQuery?.from === "onboarding") {
    flag = "onboarding";
  } else if (authQuery?.from === "login") {
    flag = "login";
  }

  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, flag);
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(OAUTH_PENDING_KEY, flag);
  } catch {
    // ignore
  }
}

/** @deprecated use setOAuthPendingFromAuthQuery */
export function setOAuthPending(fromOnboarding: boolean): void {
  setOAuthPendingFromAuthQuery(
    fromOnboarding ? { from: "onboarding" } : { from: "signup" },
  );
}

/** Drop leftover flags when OAuth was cancelled or the app cold-started mid-flow. */
export function clearStaleOAuthPendingIfIdle(): void {
  if (typeof window === "undefined") return;

  const href = window.location.href;
  const hasCallback =
    href.includes("code=") ||
    href.includes("access_token=") ||
    href.includes("oauth_error=");

  if (hasCallback) return;

  // Native OAuth returns via frigy://callback — keep pending until deep link is handled.
  if (Capacitor.isNativePlatform()) return;

  if (peekStashedOAuthCallbackUrl()) return;

  const pending = getOAuthPending();
  if (!pending) return;

  if (pending === "login" || pending === "signup") {
    clearOAuthPending();
  }
}

export function getOAuthPending(): OAuthPendingFlag | null {
  try {
    const fromSession = sessionStorage.getItem(OAUTH_PENDING_KEY);
    if (
      fromSession === "onboarding" ||
      fromSession === "login" ||
      fromSession === "signup" ||
      fromSession === "1"
    ) {
      return fromSession === "1" ? "login" : (fromSession as OAuthPendingFlag);
    }
  } catch {
    // ignore
  }
  try {
    const fromLocal = localStorage.getItem(OAUTH_PENDING_KEY);
    if (
      fromLocal === "onboarding" ||
      fromLocal === "login" ||
      fromLocal === "signup" ||
      fromLocal === "1"
    ) {
      return fromLocal === "1" ? "login" : (fromLocal as OAuthPendingFlag);
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearOAuthPending(): void {
  try {
    sessionStorage.removeItem(OAUTH_PENDING_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(OAUTH_PENDING_KEY);
  } catch {
    // ignore
  }
}

export function resolveFromOnboarding(url?: string): boolean {
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.searchParams.get("from") === "onboarding") return true;
    } catch {
      // ignore
    }
  }
  return getOAuthPending() === "onboarding";
}

export function resolveOAuthAuthIntent(url?: string): "login" | "signup" {
  return resolveOAuthContext(url).authIntent;
}

/** Read onboarding/login flags before `clearOAuthPending()` wipes storage. */
export function resolveOAuthContext(url?: string): {
  fromOnboarding: boolean;
  authIntent: "login" | "signup";
} {
  const fromOnboarding = resolveFromOnboarding(url);
  const authIntent: "login" | "signup" = fromOnboarding
    ? "signup"
    : getOAuthPending() === "login"
      ? "login"
      : "signup";
  return { fromOnboarding, authIntent };
}
