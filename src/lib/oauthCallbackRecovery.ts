/** Stashed OAuth callback for cold-start / PKCE retry on native. */
export const OAUTH_CALLBACK_STASH_KEY = "frigy_oauth_callback_url";
const OAUTH_STASH_TTL_MS = 15 * 60 * 1000;

type StashedOAuthPayload = {
  url: string;
  savedAt: number;
};

export function stashOAuthCallbackUrl(url: string): void {
  if (!url?.trim()) return;
  try {
    const payload: StashedOAuthPayload = { url: url.trim(), savedAt: Date.now() };
    localStorage.setItem(OAUTH_CALLBACK_STASH_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function peekStashedOAuthCallbackUrl(): string | null {
  try {
    const raw = localStorage.getItem(OAUTH_CALLBACK_STASH_KEY);
    if (!raw) return null;

    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("frigy:")) {
      clearStashedOAuthCallbackUrl();
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StashedOAuthPayload>;
    if (!parsed.url || typeof parsed.savedAt !== "number") {
      clearStashedOAuthCallbackUrl();
      return null;
    }

    if (Date.now() - parsed.savedAt > OAUTH_STASH_TTL_MS) {
      clearStashedOAuthCallbackUrl();
      return null;
    }

    return parsed.url;
  } catch {
    clearStashedOAuthCallbackUrl();
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
