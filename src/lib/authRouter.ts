import type { NavigateFunction } from "react-router-dom";
import {
  computeAuthCompletionOnce,
  computeStashedOAuthCompletion,
  getAuthFlowSnapshot,
  isAuthCompletionPending,
  isAuthNavigationPending,
  POST_AUTH_MANUAL_NAV_PATHS,
  publishAuthResult,
  resetAuthFlow,
  setAuthNavigationState,
  type AuthResult,
  type RunAuthCompletionInput,
} from "@/lib/authCompletion";
import { clearOnboardingOAuthPending } from "@/lib/onboardingSession";
import { peekStashedOAuthCallbackUrl } from "@/lib/oauthCallbackRecovery";
import type { PostAuthIntent } from "@/lib/resolvePostAuthDestination";
import type { SubscriptionStatusLike } from "@/lib/subscription";

const NAV_DEDUPE_MS = 1500;
let lastNavigation = { path: "", at: 0 };

function navigateOnce(navigate: NavigateFunction, path: string): void {
  const now = Date.now();
  if (lastNavigation.path === path && now - lastNavigation.at < NAV_DEDUPE_MS) {
    return;
  }
  lastNavigation = { path, at: now };
  navigate(path, { replace: true });
}

function targetRouteFor(result: AuthResult): string | null {
  if (result.status === "success") return result.route;
  if (result.status === "error") return result.exitRoute;
  return null;
}

/**
 * Router — ONLY place that performs navigation from auth completion.
 * Updates navigation.executing / navigation.executed on the snapshot.
 */
export function executeAuthNavigation(
  result: AuthResult,
  navigate: NavigateFunction,
): boolean {
  const target = targetRouteFor(result);
  if (!target) return false;

  const { navigation } = getAuthFlowSnapshot();
  if (navigation.executing) return false;
  if (navigation.executed && navigation.targetRoute === target) return true;

  setAuthNavigationState({
    executing: true,
    executed: false,
    failed: false,
    targetRoute: target,
    startedAt: Date.now(),
  });

  try {
    if (result.status === "success" && result.routePhase === "dashboard") {
      localStorage.setItem("onboardingComplete", "true");
    }

    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : null;
    if (
      result.status === "success" &&
      result.routePhase === "dashboard" &&
      currentPath &&
      currentPath !== target &&
      POST_AUTH_MANUAL_NAV_PATHS.has(currentPath)
    ) {
      setAuthNavigationState({
        executing: false,
        executed: true,
        failed: false,
        targetRoute: target,
        startedAt: null,
      });
      window.setTimeout(() => resetAuthFlow(), 0);
      return true;
    }

    navigateOnce(navigate, target);
    setAuthNavigationState({
      executing: false,
      executed: true,
      failed: false,
      targetRoute: target,
      startedAt: null,
    });
    if (result.status === "success" && result.routePhase === "onboarding_paywall") {
      clearOnboardingOAuthPending();
      resetAuthFlow();
    }
    return true;
  } catch (error) {
    console.warn("[AuthRouter] Navigation failed:", error);
    setAuthNavigationState({
      executing: false,
      executed: false,
      failed: false,
      targetRoute: null,
      startedAt: null,
    });
    publishAuthResult({
      status: "error",
      reason: "Navigation fehlgeschlagen. Bitte erneut versuchen.",
      exitRoute: "/auth?oauth_error=1",
    });
    return false;
  }
}

/** @deprecated use executeAuthNavigation */
export function applyAuthResult(result: AuthResult, navigate: NavigateFunction): void {
  executeAuthNavigation(result, navigate);
}

export type RunAuthCompletionOptions = RunAuthCompletionInput & {
  navigate: NavigateFunction;
};

/** Pipeline only — AuthFlowRouter executes navigation from snapshot. */
export async function runAuthCompletion(options: RunAuthCompletionOptions): Promise<AuthResult> {
  const { navigate: _navigate, ...input } = options;
  return computeAuthCompletionOnce(input);
}

export async function runStashedOAuthCompletion(options: {
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  navigate: NavigateFunction;
}): Promise<AuthResult> {
  return computeStashedOAuthCompletion({
    checkSubscription: options.checkSubscription,
  });
}

export function scheduleStashedOAuthRetry(options: {
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  navigate: NavigateFunction;
}): void {
  const delays = [400, 1200, 2800];
  for (const delayMs of delays) {
    window.setTimeout(() => {
      if (!peekStashedOAuthCallbackUrl()) return;
      const { navigation } = getAuthFlowSnapshot();
      if (navigation.executed) return;
      void runStashedOAuthCompletion(options);
    }, delayMs);
  }
}

/** Skip duplicate redirect while pipeline or navigation is in flight. */
export function wasPostAuthRedirectRecentlyHandled(): boolean {
  const { navigation } = getAuthFlowSnapshot();
  return isAuthCompletionPending() || navigation.executing || isAuthNavigationPending();
}

export async function redirectAfterSignIn(options: {
  userId?: string | null;
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  navigate: NavigateFunction;
  fromOnboarding?: boolean;
  explicitPath?: string | null;
  authIntent?: PostAuthIntent;
  emailPasswordLogin?: boolean;
}): Promise<AuthResult> {
  return runAuthCompletion({
    userId: options.userId,
    checkSubscription: options.checkSubscription,
    navigate: options.navigate,
    fromOnboarding: options.fromOnboarding,
    explicitPath: options.explicitPath,
    authIntent: options.authIntent,
    emailPasswordLogin: options.emailPasswordLogin,
  });
}

export { getAuthFlowSnapshot };
