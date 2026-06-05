/** Tracks in-flight OAuth (web sessionStorage + native localStorage). */
export const OAUTH_PENDING_KEY = "frigy_oauth_pending";

export type OAuthPendingFlag = "onboarding" | "1";

export function setOAuthPending(fromOnboarding: boolean): void {
  const flag: OAuthPendingFlag = fromOnboarding ? "onboarding" : "1";
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

export function getOAuthPending(): OAuthPendingFlag | null {
  try {
    const fromSession = sessionStorage.getItem(OAUTH_PENDING_KEY);
    if (fromSession === "onboarding" || fromSession === "1") return fromSession;
  } catch {
    // ignore
  }
  try {
    const fromLocal = localStorage.getItem(OAUTH_PENDING_KEY);
    if (fromLocal === "onboarding" || fromLocal === "1") return fromLocal;
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
