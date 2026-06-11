import { getOAuthPending } from "@/lib/oauthPending";

/** Stashed OAuth callback for cold-start / PKCE retry on native. */
export const OAUTH_CALLBACK_STASH_KEY = "frigy_oauth_callback_url";
const OAUTH_USED_CODES_KEY = "frigy_oauth_used_codes";
const OAUTH_STASH_TTL_MS = 15 * 60 * 1000;
const MAX_USED_CODES = 24;

export type StashedOAuthContext = {
  authIntent?: "login" | "signup";
  fromOnboarding?: boolean;
};

type StashedOAuthPayload = {
  url: string;
  savedAt: number;
  authIntent?: "login" | "signup";
  fromOnboarding?: boolean;
};

function readUsedOAuthCodes(): Set<string> {
  try {
    const raw =
      sessionStorage.getItem(OAUTH_USED_CODES_KEY) ?? localStorage.getItem(OAUTH_USED_CODES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((entry): entry is string => typeof entry === "string"));
  } catch {
    return new Set();
  }
}

function writeUsedOAuthCodes(codes: Set<string>): void {
  const list = Array.from(codes).slice(-MAX_USED_CODES);
  const raw = JSON.stringify(list);
  try {
    sessionStorage.setItem(OAUTH_USED_CODES_KEY, raw);
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(OAUTH_USED_CODES_KEY, raw);
  } catch {
    // ignore
  }
}

export function extractOAuthCode(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const parsed = new URL(url);
    const hash = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
    const hashParams = new URLSearchParams(hash);
    return parsed.searchParams.get("code") ?? hashParams.get("code");
  } catch {
    return null;
  }
}

export function isOAuthCallbackConsumed(url: string): boolean {
  const code = extractOAuthCode(url);
  if (!code) return false;
  return readUsedOAuthCodes().has(code);
}

export function markOAuthCallbackConsumed(url: string): void {
  const code = extractOAuthCode(url);
  if (!code) return;
  const codes = readUsedOAuthCodes();
  codes.add(code);
  writeUsedOAuthCodes(codes);
}

function resolveStashContext(context?: StashedOAuthContext): StashedOAuthContext {
  if (context?.authIntent) return context;

  const pending = getOAuthPending();
  if (pending === "login") return { authIntent: "login", fromOnboarding: false };
  if (pending === "onboarding") return { authIntent: "signup", fromOnboarding: true };
  if (pending === "signup") return { authIntent: "signup", fromOnboarding: false };
  return context ?? {};
}

function parseStashedPayload(raw: string): StashedOAuthPayload | null {
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("frigy:")) {
    return null;
  }

  const parsed = JSON.parse(raw) as Partial<StashedOAuthPayload>;
  if (!parsed.url || typeof parsed.savedAt !== "number") {
    return null;
  }

  if (Date.now() - parsed.savedAt > OAUTH_STASH_TTL_MS) {
    return null;
  }

  return parsed as StashedOAuthPayload;
}

export function stashOAuthCallbackUrl(url: string, context?: StashedOAuthContext): void {
  if (!url?.trim()) return;
  const resolved = resolveStashContext(context);
  try {
    const payload: StashedOAuthPayload = {
      url: url.trim(),
      savedAt: Date.now(),
      authIntent: resolved.authIntent,
      fromOnboarding: resolved.fromOnboarding,
    };
    localStorage.setItem(OAUTH_CALLBACK_STASH_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function peekStashedOAuthCallbackUrl(): string | null {
  return peekStashedOAuthPayload()?.url ?? null;
}

export function peekStashedOAuthPayload(): StashedOAuthPayload | null {
  try {
    const raw = localStorage.getItem(OAUTH_CALLBACK_STASH_KEY);
    if (!raw) return null;

    const payload = parseStashedPayload(raw);
    if (!payload) {
      clearStashedOAuthCallbackUrl();
      return null;
    }

    return payload;
  } catch {
    clearStashedOAuthCallbackUrl();
    return null;
  }
}

export function peekStashedOAuthContext(): StashedOAuthContext | null {
  const payload = peekStashedOAuthPayload();
  if (!payload) return null;
  return {
    authIntent: payload.authIntent,
    fromOnboarding: payload.fromOnboarding,
  };
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
