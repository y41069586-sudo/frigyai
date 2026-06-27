import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

/** Session is truly gone — not a transient network blip. */
export function isDefinitiveSessionError(error: unknown): boolean {
  const msg = errorMessage(error).toLowerCase();
  return (
    /invalid refresh token|refresh token not found|refresh_token_not_found|session not found|user not found|invalid jwt|signed out|revoked|auth session missing|invalid claim|token has expired/.test(
      msg,
    ) && !/network|fetch|timeout|failed to fetch/.test(msg)
  );
}

export function isTransientSessionError(error: unknown): boolean {
  const msg = errorMessage(error).toLowerCase();
  return /fetch|network|timeout|failed to fetch|temporarily|econnreset|etimedout|aborterror|503|502|504|offline/.test(
    msg,
  );
}

function sessionExpiresWithin(session: Session, withinMs: number): boolean {
  if (!session.expires_at) return false;
  return session.expires_at * 1000 - Date.now() < withinMs;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export type ResumeAuthSessionOptions = {
  maxAttempts?: number;
  /** Extra wait after foreground (network / WebView wake-up). */
  initialDelayMs?: number;
};

/**
 * Restore auth after background / long inactivity.
 * Retries refresh on resume; keeps cached session on transient failures.
 */
export async function resumeAuthSession(
  maxAttemptsOrOptions: number | ResumeAuthSessionOptions = 3,
): Promise<Session | null> {
  const options =
    typeof maxAttemptsOrOptions === "number"
      ? { maxAttempts: maxAttemptsOrOptions }
      : maxAttemptsOrOptions;
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 0;

  if (initialDelayMs > 0) {
    await sleep(initialDelayMs);
  }

  const readSession = async () => (await supabase.auth.getSession()).data.session;

  let current = await readSession();

  if (current?.user && !sessionExpiresWithin(current, 5 * 60_000)) {
    return current;
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await sleep(Math.min(2_000, 400 * attempt));
    }

    try {
      const { data, error } = await supabase.auth.refreshSession();
      const refreshed = data.session;
      if (!error && refreshed?.user) {
        return refreshed;
      }
      lastError = error;
      if (error && isDefinitiveSessionError(error)) {
        break;
      }
    } catch (err) {
      lastError = err;
      if (isDefinitiveSessionError(err)) {
        break;
      }
    }

    current = await readSession();
    if (current?.user && !sessionExpiresWithin(current, 60_000)) {
      return current;
    }
  }

  current = await readSession();
  if (current?.user) {
    if (lastError && isDefinitiveSessionError(lastError)) {
      return null;
    }
    return current;
  }

  return null;
}

/** Capacitor / mobile: pause token timers in background, refresh on foreground. */
export function setSupabaseAutoRefreshEnabled(enabled: boolean): void {
  const auth = supabase.auth as {
    startAutoRefresh?: () => void;
    stopAutoRefresh?: () => void;
  };
  if (enabled) {
    auth.startAutoRefresh?.();
  } else {
    auth.stopAutoRefresh?.();
  }
}
