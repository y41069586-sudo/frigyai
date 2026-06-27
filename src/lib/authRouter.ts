import type { NavigateFunction } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  computeAuthCompletionOnce,
  computeStashedOAuthCompletion,
  getAuthFlowSnapshot,
  isAuthCompletionPending,
  isAuthFlowRecentlySettled,
  isAuthNavigationPending,
  markAuthFlowSettled,
  POST_AUTH_MANUAL_NAV_PATHS,
  publishAuthResult,
  resetAuthFlow,
  setAuthNavigationState,
  type AuthResult,
  type RunAuthCompletionInput,
} from "@/lib/authCompletion";
import {
  clearOnboardingOAuthPending,
  shouldDeferAuthOnboardingStartRedirect,
  shouldDeferAuthPaywallRedirect,
} from "@/lib/onboardingSession";
import { peekStashedOAuthCallbackUrl } from "@/lib/oauthCallbackRecovery";
import { isStoreBillingConfigured, prefetchStoreOfferingPrices } from "@/lib/storeBilling";
import { usesStoreBilling } from "@/lib/billingPlatform";
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
      if (result.status === "success") {
        void supabase.auth.getSession().then(({ data }) => {
          markAuthFlowSettled(data.session?.user?.id ?? null);
        });
      }
      window.setTimeout(() => resetAuthFlow(), 0);
      return true;
    }

    if (
      result.status === "success" &&
      result.routePhase === "onboarding_paywall" &&
      shouldDeferAuthPaywallRedirect()
    ) {
      setAuthNavigationState({
        executing: false,
        executed: true,
        failed: false,
        targetRoute: null,
        startedAt: null,
      });
      void supabase.auth.getSession().then(({ data }) => {
        markAuthFlowSettled(data.session?.user?.id ?? null);
      });
      window.setTimeout(() => resetAuthFlow(), 0);
      return true;
    }

    if (
      result.status === "success" &&
      result.routePhase === "onboarding_start" &&
      shouldDeferAuthOnboardingStartRedirect()
    ) {
      setAuthNavigationState({
        executing: false,
        executed: true,
        failed: false,
        targetRoute: null,
        startedAt: null,
      });
      void supabase.auth.getSession().then(({ data }) => {
        markAuthFlowSettled(data.session?.user?.id ?? null);
      });
      window.setTimeout(() => resetAuthFlow(), 0);
      return true;
    }

    if (
      result.status === "success" &&
      (result.routePhase === "onboarding_paywall" ||
        result.routePhase === "standalone_paywall" ||
        result.routePhase === "onboarding_start") &&
      usesStoreBilling() &&
      isStoreBillingConfigured()
    ) {
      void prefetchStoreOfferingPrices(null);
    }

    navigateOnce(navigate, target);
    setAuthNavigationState({
      executing: false,
      executed: true,
      failed: false,
      targetRoute: target,
      startedAt: null,
    });
    if (result.status === "success") {
      void supabase.auth.getSession().then(({ data }) => {
        markAuthFlowSettled(data.session?.user?.id ?? null);
      });
    }
    if (result.status === "success" && result.routePhase === "onboarding_paywall") {
      clearOnboardingOAuthPending();
      window.setTimeout(() => resetAuthFlow(), 0);
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

let stashedOAuthRetryTimers: number[] = [];
let stashedOAuthRetryScheduled = false;

export function clearStashedOAuthRetryTimers(): void {
  for (const timerId of stashedOAuthRetryTimers) {
    window.clearTimeout(timerId);
  }
  stashedOAuthRetryTimers = [];
  stashedOAuthRetryScheduled = false;
}

export function scheduleStashedOAuthRetry(options: {
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  navigate: NavigateFunction;
}): void {
  if (stashedOAuthRetryScheduled) return;
  if (!peekStashedOAuthCallbackUrl()) return;

  stashedOAuthRetryScheduled = true;
  const delays = [400, 1200, 2800];
  for (const delayMs of delays) {
    const timerId = window.setTimeout(() => {
      if (!peekStashedOAuthCallbackUrl()) return;
      if (isAuthFlowRecentlySettled()) return;
      const { navigation, result } = getAuthFlowSnapshot();
      if (navigation.executed) return;
      if (result.status === "success") return;
      if (isAuthCompletionPending()) return;
      void runStashedOAuthCompletion(options);
    }, delayMs);
    stashedOAuthRetryTimers.push(timerId);
  }

  const lastDelay = delays[delays.length - 1] ?? 2800;
  window.setTimeout(() => {
    stashedOAuthRetryScheduled = false;
    stashedOAuthRetryTimers = [];
  }, lastDelay + 500);
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
