/** Tracks in-flight OAuth (web sessionStorage + native localStorage). */
export const OAUTH_PENDING_KEY = "frigy_oauth_pending";

export type OAuthPendingFlag = "onboarding" | "login";

/** Only onboarding OAuth needs a persisted pending flag (native deep-link fallback). */
export function setOAuthPending(fromOnboarding: boolean): void {
  if (!fromOnboarding) {
    clearOAuthPending();
    return;
  }

  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, "onboarding");
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(OAUTH_PENDING_KEY, "onboarding");
  } catch {
    // ignore
  }
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

  const pending = getOAuthPending();
  if (!pending) return;

  // Login pending without callback strands AuthPage on the loading screen.
  if (pending === "login") {
    clearOAuthPending();
  }
}

export function getOAuthPending(): OAuthPendingFlag | null {
  try {
    const fromSession = sessionStorage.getItem(OAUTH_PENDING_KEY);
    if (fromSession === "onboarding" || fromSession === "login" || fromSession === "1") {
      return fromSession === "1" ? "login" : (fromSession as OAuthPendingFlag);
    }
  } catch {
    // ignore
  }
  try {
    const fromLocal = localStorage.getItem(OAUTH_PENDING_KEY);
    if (fromLocal === "onboarding" || fromLocal === "login" || fromLocal === "1") {
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
