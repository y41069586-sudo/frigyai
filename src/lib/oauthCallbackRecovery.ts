/** Stashed OAuth callback for cold-start / PKCE retry on native. */
export const OAUTH_CALLBACK_STASH_KEY = "frigy_oauth_callback_url";

export function stashOAuthCallbackUrl(url: string): void {
  if (!url?.trim()) return;
  try {
    localStorage.setItem(OAUTH_CALLBACK_STASH_KEY, url.trim());
  } catch {
    // ignore
  }
}

export function peekStashedOAuthCallbackUrl(): string | null {
  try {
    return localStorage.getItem(OAUTH_CALLBACK_STASH_KEY);
  } catch {
    return null;
  }
}

export function clearStashedOAuthCallbackUrl(): void {
  try {
    localStorage.removeItem(OAUTH_CALLBACK_STASH_KEY);
  } catch {
    // ignore
  }
}

export function isRetriableOAuthExchangeError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("pkce") ||
    m.includes("code verifier") ||
    m.includes("invalid grant") ||
    m.includes("flow state") ||
    m.includes("not found") ||
    m.includes("expired")
  );
}
