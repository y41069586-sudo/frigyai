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
import {
  clearOAuthPending,
  resolveFromOnboarding,
  resolveOAuthAuthIntent,
} from "@/lib/oauthPending";
import {
  ensureAuthSessionForRouting,
  resolvePostAuthDestination,
  type PostAuthIntent,
  type PostAuthPhase,
} from "@/lib/resolvePostAuthDestination";
import type { SubscriptionStatusLike } from "@/lib/subscription";
import { isMealPlanGenerationActive } from "@/lib/mealPlanGenerationLock";
import { isOnboardingInProgress, isOnboardingOAuthPending } from "@/lib/onboardingSession";

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
  authIntent?: PostAuthIntent;
  /** Set for email/password sign-in from /auth (existing account). */
  emailPasswordLogin?: boolean;
};

const WATCHDOG_MS = 20_000;
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

/** Routes where manual bottom-nav taps should not be overridden by late auth redirects. */
export const POST_AUTH_MANUAL_NAV_PATHS = new Set([
  "/",
  "/meal-plans",
  "/profile",
  "/scan",
  "/badges",
]);

function isOnboardingAuthRouteActive(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has("onboardingStep")) return true;
  if (params.get("from") === "onboarding") return true;
  return isOnboardingInProgress() || isOnboardingOAuthPending();
}

function isOnboardingPaywallRoute(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("onboardingStep") === "paywall";
}

/** Overlay until pipeline done AND navigation executed (or still pending). */
export function isAuthFlowOverlayVisible(): boolean {
  if (isMealPlanGenerationActive()) {
    return false;
  }

  const { result, navigation } = snapshot;
  const onboardingRoute = isOnboardingAuthRouteActive();

  if (result.status === "pending") {
    if (onboardingRoute || isOnboardingPaywallRoute()) return false;
    return true;
  }
  if (navigation.executing) {
    if (onboardingRoute || isOnboardingPaywallRoute()) return false;
    return true;
  }
  if (isAuthNavigationPending()) {
    if (onboardingRoute || isOnboardingPaywallRoute()) return false;
    if (snapshot.result.status === "success" && snapshot.result.routePhase === "onboarding_paywall") {
      return false;
    }
    return true;
  }

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (POST_AUTH_MANUAL_NAV_PATHS.has(path)) {
    return false;
  }

  return false;
}

/** User navigated manually — drop stale post-auth redirect state (keeps in-flight OAuth pending). */
export function dismissStalledAuthNavigation(): void {
  if (isMealPlanGenerationActive()) return;

  const { result } = getAuthFlowSnapshot();
  if (result.status === "pending" && result.phase === "oauth_exchange") return;

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (POST_AUTH_MANUAL_NAV_PATHS.has(path)) {
    resetAuthFlow();
    return;
  }

  const { navigation } = getAuthFlowSnapshot();
  if (navigation.executing) return;
  resetAuthFlow();
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

export async function closeNativeOAuthBrowser(): Promise<void> {
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
  authIntent?: PostAuthIntent;
  emailPasswordLogin?: boolean;
  sessionWaitMs?: number;
}): Promise<AuthResult> {
  setResult({ status: "pending", phase: "premium" });

  const route = await resolvePostAuthDestination({
    userId: options.userId,
    checkSubscription: options.checkSubscription,
    fromOnboarding: options.fromOnboarding,
    explicitPath: options.explicitPath,
    sessionWaitMs: options.sessionWaitMs ?? 6000,
    authIntent: options.authIntent,
    emailPasswordLogin: options.emailPasswordLogin,
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
    authIntent: authIntentOpt,
    emailPasswordLogin,
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

    const authIntent: PostAuthIntent =
      authIntentOpt ?? resolveOAuthAuthIntent(oauthUrl);

    setResult({ status: "pending", phase: "session" });
    const oauthSessionWaitMs = authIntent === "login" ? 2000 : 3500;
    const sessionAfterOAuth = await ensureAuthSessionForRouting({ maxWaitMs: oauthSessionWaitMs });
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
      authIntent,
      sessionWaitMs: 800,
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
    authIntent: authIntentOpt ?? (fromOnboardingOpt ? "signup" : "login"),
    emailPasswordLogin,
    sessionWaitMs:
      authIntentOpt === "login" || (!fromOnboardingOpt && authIntentOpt !== "signup")
        ? 2500
        : 6000,
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
