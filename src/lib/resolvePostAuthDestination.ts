import { persistOnboardingSignupFromStorage } from "@/components/onboarding/utils";
import { waitForAuthSession } from "@/lib/authErrors";
import { POST_AUTH_PAYWALL_ROUTE } from "@/lib/authOAuth";
import { isReturningAppUser } from "@/lib/isReturningAppUser";
import { buildPremiumPricingRoute, hasEverHadPremium } from "@/lib/trialEligibility";
import { resolvePremiumAccessAfterSignIn } from "@/lib/resolvePremiumAccessAfterSignIn";
import type { SubscriptionStatusLike } from "@/lib/subscription";
import { supabase } from "@/integrations/supabase/client";

export type PostAuthIntent = "login" | "signup" | "auto";

/** Single routing outcome after auth — one decision, one destination. */
export type PostAuthPhase =
  | "no_session"
  | "dashboard"
  | "onboarding_paywall"
  | "standalone_paywall";

export type PostAuthRoute = {
  phase: PostAuthPhase;
  path: string;
  userId: string | null;
};

const DEFAULT_SESSION_WAIT_MS = 4500;

/**
 * Block until Supabase session exists (storage + listener), or timeout.
 * Must pass before premium check or navigation.
 */
export async function ensureAuthSessionForRouting(options?: {
  userId?: string | null;
  maxWaitMs?: number;
}): Promise<{ ok: true; userId: string } | { ok: false }> {
  const maxWaitMs = options?.maxWaitMs ?? DEFAULT_SESSION_WAIT_MS;

  let session = (await supabase.auth.getSession()).data.session;
  if (!session?.user) {
    if (!(await waitForAuthSession(maxWaitMs))) {
      return { ok: false };
    }
    session = (await supabase.auth.getSession()).data.session;
  }

  const userId = options?.userId ?? session?.user?.id ?? null;
  if (!session?.user || !userId) {
    return { ok: false };
  }

  return { ok: true, userId };
}

function resolvePaywallPath(explicitPath?: string | null): string {
  const path = explicitPath?.trim();
  if (
    path &&
    path.startsWith("/") &&
    (path.includes("paywall") || path.includes("premium-pricing"))
  ) {
    return path;
  }
  return POST_AUTH_PAYWALL_ROUTE;
}

/**
 * Deterministic post-auth routing:
 * session → premium (complete) → exactly one destination.
 */
export async function resolvePostAuthDestination(options: {
  userId?: string | null;
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  fromOnboarding?: boolean;
  explicitPath?: string | null;
  skipReferralCheck?: boolean;
  sessionWaitMs?: number;
  /** login = existing account flow; signup = new account; auto = OAuth without onboarding flag */
  authIntent?: PostAuthIntent;
}): Promise<PostAuthRoute> {
  const sessionResult = await ensureAuthSessionForRouting({
    userId: options.userId,
    maxWaitMs: options.sessionWaitMs,
  });

  if (!sessionResult.ok) {
    return { phase: "no_session", path: "/auth", userId: null };
  }

  const userId = sessionResult.userId;

  if (options.fromOnboarding) {
    persistOnboardingSignupFromStorage();
  }

  const authIntent = options.authIntent ?? "auto";

  if (await isReturningAppUser(userId)) {
    return { phase: "dashboard", path: "/", userId };
  }

  const hasPremium = await resolvePremiumAccessAfterSignIn({
    userId,
    checkSubscription: options.checkSubscription,
    sessionReady: true,
    skipReferralCheck: options.skipReferralCheck,
  });

  if (hasPremium) {
    return { phase: "dashboard", path: "/", userId };
  }

  if (authIntent === "login") {
    return {
      phase: "onboarding_paywall",
      path: "/?onboardingStep=save-progress",
      userId,
    };
  }

  if (options.fromOnboarding || authIntent === "signup") {
    return {
      phase: "onboarding_paywall",
      path: "/?onboardingStep=paywall",
      userId,
    };
  }

  return {
    phase: "standalone_paywall",
    path: hasEverHadPremium()
      ? buildPremiumPricingRoute({ trialEligible: false })
      : resolvePaywallPath(options.explicitPath),
    userId,
  };
}
