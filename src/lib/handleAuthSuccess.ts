import type { User } from "@supabase/supabase-js";
import { POST_AUTH_PAYWALL_ROUTE } from "@/lib/authOAuth";
import { buildPremiumPricingRoute, hasEverHadPremium } from "@/lib/trialEligibility";
import {
  ensureUserOnboardingRecord,
  getUserOnboardingRecord,
  hasUserOnboardingRecord,
} from "@/lib/userRecord";

export type AuthSuccessDestination = "dashboard" | "onboarding_paywall" | "standalone_paywall";

export type AuthSuccessRoute = {
  destination: AuthSuccessDestination;
  path: string;
  isNewUser: boolean;
};

function resolveStandalonePaywallPath(explicitPath?: string | null): string {
  const path = explicitPath?.trim();
  if (
    path &&
    path.startsWith("/") &&
    (path.includes("paywall") || path.includes("premium-pricing"))
  ) {
    return path;
  }
  return hasEverHadPremium()
    ? buildPremiumPricingRoute({ trialEligible: false })
    : POST_AUTH_PAYWALL_ROUTE;
}

/**
 * Central post-auth routing — RevenueCat premium + DB record.
 *
 * - Active premium (RevenueCat) → dashboard
 * - No premium + new user → paywall
 * - No premium + existing user → standalone paywall
 */
export async function handleAuthSuccess(
  user: User,
  options?: {
    fromOnboarding?: boolean;
    explicitPath?: string | null;
    hasPremium?: boolean;
  },
): Promise<AuthSuccessRoute> {
  if (options?.hasPremium) {
    const record = await getUserOnboardingRecord(user.id);
    if (record?.onboarding_complete) {
      localStorage.setItem("onboardingComplete", "true");
    }
    return { destination: "dashboard", path: "/", isNewUser: false };
  }

  const { isNew } = await ensureUserOnboardingRecord(user);

  if (!isNew) {
    const record = await getUserOnboardingRecord(user.id);
    if (record?.onboarding_complete) {
      localStorage.setItem("onboardingComplete", "true");
    }
    return {
      destination: "standalone_paywall",
      path: resolveStandalonePaywallPath(options?.explicitPath),
      isNewUser: false,
    };
  }

  if (options?.fromOnboarding) {
    return {
      destination: "onboarding_paywall",
      path: "/?onboardingStep=paywall",
      isNewUser: true,
    };
  }

  return {
    destination: "standalone_paywall",
    path: resolveStandalonePaywallPath(options?.explicitPath),
    isNewUser: true,
  };
}

/** Cold-start routing when a session already exists. */
export async function resolveColdStartDestination(
  userId: string,
  options?: { hasPremium?: boolean },
): Promise<AuthSuccessRoute> {
  if (options?.hasPremium) {
    const record = await getUserOnboardingRecord(userId);
    if (record?.onboarding_complete) {
      localStorage.setItem("onboardingComplete", "true");
    }
    return { destination: "dashboard", path: "/", isNewUser: false };
  }

  const hasRecord = await hasUserOnboardingRecord(userId);

  if (hasRecord) {
    return {
      destination: "standalone_paywall",
      path: hasEverHadPremium()
        ? buildPremiumPricingRoute({ trialEligible: false })
        : POST_AUTH_PAYWALL_ROUTE,
      isNewUser: false,
    };
  }

  return {
    destination: "onboarding_paywall",
    path: "/?onboardingStep=paywall",
    isNewUser: true,
  };
}
