import { Capacitor } from "@capacitor/core";
import {
  completeOAuthFromUrl,
  isOAuthCallbackUrl,
  isOAuthErrorUrl,
} from "@/lib/authOAuth";
import {
  clearStashedOAuthCallbackUrl,
  peekStashedOAuthCallbackUrl,
  stashOAuthCallbackUrl,
} from "@/lib/oauthCallbackRecovery";
import { clearOAuthPending, resolveFromOnboarding } from "@/lib/oauthPending";
import {
  ensureAuthSessionForRouting,
  resolvePostAuthDestination,
  type PostAuthPhase,
} from "@/lib/resolvePostAuthDestination";
import type { SubscriptionStatusLike } from "@/lib/subscription";

/** Pipeline phases while work is in progress. */
export type AuthPendingPhase = "oauth_exchange" | "session" | "premium";

/**
 * PIPELINE OUTPUT CONTRACT — UI and router consume ONLY this.
 */
export type AuthResult =
  | { status: "idle" }
  | { status: "pending"; phase: AuthPendingPhase }
  | { status: "success"; route: string; routePhase: PostAuthPhase }
  | { status: "error"; reason: string; exitRoute: string }
  | { status: "deferred" }
  | { status: "ignored" };

/** Result ≠ executed — tracks whether router side-effects finished. */
export type AuthNavigationState = {
  executing: boolean;
  executed: boolean;
  failed: boolean;
  targetRoute: string | null;
  /** When `executing` became true — used for execution timeout recovery. */
  startedAt: number | null;
};

export type AuthFlowSnapshot = {
  result: AuthResult;
  navigation: AuthNavigationState;
};

export type RunAuthCompletionInput = {
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  fromOnboarding?: boolean;
  explicitPath?: string | null;
  userId?: string | null;
  oauthUrl?: string;
  onOAuthExchangeSuccess?: () => void;
  allowOAuthDefer?: boolean;
};

const WATCHDOG_MS = 12_000;
/** Max time navigation may stay in `executing` before forced recovery. */
export const NAV_EXECUTION_TIMEOUT_MS = 5_000;
const IDLE_NAVIGATION: AuthNavigationState = {
  executing: false,
  executed: false,
  failed: false,
  targetRoute: null,
  startedAt: null,
};

let snapshot: AuthFlowSnapshot = {
  result: { status: "idle" },
  navigation: { ...IDLE_NAVIGATION },
};
const listeners = new Set<() => void>();
let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
let executionWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
let activeRun: Promise<AuthResult> | null = null;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function clearWatchdog(): void {
  if (watchdogTimer) {
    clearTimeout(watchdogTimer);
    watchdogTimer = null;
  }
}

function clearExecutionWatchdog(): void {
  if (executionWatchdogTimer) {
    clearTimeout(executionWatchdogTimer);
    executionWatchdogTimer = null;
  }
}

function armExecutionWatchdog(): void {
  clearExecutionWatchdog();
  const { navigation } = snapshot;
  if (!navigation.executing || navigation.executed || navigation.startedAt == null) {
    return;
  }

  const delay = Math.max(0, navigation.startedAt + NAV_EXECUTION_TIMEOUT_MS - Date.now());
  executionWatchdogTimer = setTimeout(() => {
    const snap = getAuthFlowSnapshot();
    if (!snap.navigation.executing || snap.navigation.executed) return;
    recoverFromStuckAuthNavigation();
  }, delay);
}

function navigationForResult(result: AuthResult): AuthNavigationState {
  if (result.status === "success") {
    return {
      executing: false,
      executed: false,
      failed: false,
      targetRoute: result.route,
      startedAt: null,
    };
  }
  if (result.status === "error") {
    return {
      executing: false,
      executed: false,
      failed: false,
      targetRoute: result.exitRoute,
      startedAt: null,
    };
  }
  return { ...IDLE_NAVIGATION };
}

function setSnapshot(result: AuthResult, navigation?: AuthNavigationState): void {
  snapshot = {
    result,
    navigation: navigation ?? navigationForResult(result),
  };
  notify();
}

function setResult(result: AuthResult): void {
  setSnapshot(result);

  if (result.status === "pending") {
    clearWatchdog();
    watchdogTimer = setTimeout(() => {
      setResult({
        status: "error",
        reason: "Anmeldung dauert zu lange. Bitte erneut versuchen.",
        exitRoute: "/auth?oauth_error=1",
      });
    }, WATCHDOG_MS);
    return;
  }

  clearWatchdog();
}

export function getAuthFlowSnapshot(): AuthFlowSnapshot {
  return snapshot;
}

export function subscribeAuthFlow(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isAuthCompletionPending(): boolean {
  return snapshot.result.status === "pending";
}

export function isAuthNavigationPending(): boolean {
  const { result, navigation } = snapshot;
  return (
    (result.status === "success" || result.status === "error") &&
    !navigation.executed
  );
}

/** Overlay until pipeline done AND navigation executed (or still pending). */
export function isAuthFlowOverlayVisible(): boolean {
  const { result, navigation } = snapshot;
  if (result.status === "pending") return true;
  if (navigation.executing) return true;
  if (isAuthNavigationPending()) return true;
  return false;
}

export function publishAuthResult(result: AuthResult): void {
  setResult(result);
}

export function setAuthNavigationState(navigation: AuthNavigationState): void {
  snapshot = { ...snapshot, navigation };
  notify();
  if (navigation.executing && !navigation.executed) {
    armExecutionWatchdog();
  } else {
    clearExecutionWatchdog();
  }
}

/**
 * Execution stuck: `executing` without `executed` past timeout — force error + recovery UI.
 * Uses atomic snapshot update so pipeline `setResult` does not wipe `failed`.
 */
export function recoverFromStuckAuthNavigation(
  reason = "Weiterleitung hängt. Bitte erneut versuchen.",
): void {
  clearExecutionWatchdog();
  clearWatchdog();
  const result: AuthResult = {
    status: "error",
    reason,
    exitRoute: "/auth?oauth_error=1",
  };
  setSnapshot(result, {
    executing: false,
    executed: false,
    failed: true,
    targetRoute: result.exitRoute,
    startedAt: null,
  });
}

export function resetAuthFlow(): void {
  clearWatchdog();
  clearExecutionWatchdog();
  activeRun = null;
  setSnapshot({ status: "idle" }, { ...IDLE_NAVIGATION });
}

async function closeNativeOAuthBrowser(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    // ignore
  }
}

function failResult(reason: string, exitRoute = "/auth?oauth_error=1"): AuthResult {
  clearStashedOAuthCallbackUrl();
  clearOAuthPending();
  const result: AuthResult = { status: "error", reason, exitRoute };
  setResult(result);
  return result;
}

async function resolveSuccessRoute(options: {
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  fromOnboarding?: boolean;
  explicitPath?: string | null;
  userId?: string | null;
}): Promise<AuthResult> {
  setResult({ status: "pending", phase: "premium" });

  const route = await resolvePostAuthDestination({
    userId: options.userId,
    checkSubscription: options.checkSubscription,
    fromOnboarding: options.fromOnboarding,
    explicitPath: options.explicitPath,
    sessionWaitMs: 6000,
  });

  if (route.phase === "no_session") {
    return failResult("Session konnte nicht bestätigt werden.");
  }

  const result: AuthResult = {
    status: "success",
    route: route.path,
    routePhase: route.phase,
  };
  setResult(result);
  return result;
}

/**
 * Pure completion pipeline — computes AuthResult only (no navigation / no localStorage).
 */
export async function computeAuthCompletion(input: RunAuthCompletionInput): Promise<AuthResult> {
  const {
    checkSubscription,
    fromOnboarding: fromOnboardingOpt,
    explicitPath,
    userId: userIdOpt,
    oauthUrl,
    onOAuthExchangeSuccess,
    allowOAuthDefer = true,
  } = input;

  if (oauthUrl) {
    if (isOAuthErrorUrl(oauthUrl)) {
      return failResult("Google/Apple-Anmeldung fehlgeschlagen.");
    }

    if (!isOAuthCallbackUrl(oauthUrl)) {
      setResult({ status: "idle" });
      return { status: "ignored" };
    }

    setResult({ status: "pending", phase: "oauth_exchange" });
    await closeNativeOAuthBrowser();

    const fromOnboarding = fromOnboardingOpt ?? resolveFromOnboarding(oauthUrl);
    const exchanged = await completeOAuthFromUrl(oauthUrl);

    if (!exchanged) {
      if (allowOAuthDefer && Capacitor.isNativePlatform()) {
        stashOAuthCallbackUrl(oauthUrl);
        setResult({ status: "idle" });
        return { status: "deferred" };
      }
      return failResult("OAuth-Code konnte nicht eingelöst werden. Bitte erneut anmelden.");
    }

    clearStashedOAuthCallbackUrl();
    clearOAuthPending();
    onOAuthExchangeSuccess?.();

    setResult({ status: "pending", phase: "session" });
    const sessionAfterOAuth = await ensureAuthSessionForRouting({ maxWaitMs: 6000 });
    if (!sessionAfterOAuth.ok) {
      if (allowOAuthDefer && Capacitor.isNativePlatform()) {
        stashOAuthCallbackUrl(oauthUrl);
        setResult({ status: "idle" });
        return { status: "deferred" };
      }
      return failResult("Session nach OAuth nicht verfügbar.");
    }

    return resolveSuccessRoute({
      checkSubscription,
      fromOnboarding,
      explicitPath,
      userId: sessionAfterOAuth.userId,
    });
  }

  setResult({ status: "pending", phase: "session" });
  const sessionResult = await ensureAuthSessionForRouting({
    userId: userIdOpt,
    maxWaitMs: 6000,
  });

  if (!sessionResult.ok) {
    return failResult("Bitte melde dich an, um fortzufahren.", "/auth");
  }

  return resolveSuccessRoute({
    checkSubscription,
    fromOnboarding: fromOnboardingOpt,
    explicitPath,
    userId: sessionResult.userId,
  });
}

/** Coalesced in-flight run — returns pipeline result (router executes side effects). */
export function computeAuthCompletionOnce(input: RunAuthCompletionInput): Promise<AuthResult> {
  if (activeRun) {
    return activeRun;
  }

  activeRun = computeAuthCompletion(input).finally(() => {
    activeRun = null;
    if (snapshot.result.status === "deferred" || snapshot.result.status === "ignored") {
      setResult({ status: "idle" });
    }
  });

  return activeRun;
}

export function computeStashedOAuthCompletion(input: {
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
}): Promise<AuthResult> {
  const url = peekStashedOAuthCallbackUrl();
  if (!url) {
    return Promise.resolve({ status: "ignored" });
  }

  return computeAuthCompletionOnce({
    oauthUrl: url,
    checkSubscription: input.checkSubscription,
    allowOAuthDefer: false,
  });
}

/** @deprecated use subscribeAuthFlow */
export function subscribeAuthFlowBusy(listener: () => void): () => void {
  return subscribeAuthFlow(listener);
}
