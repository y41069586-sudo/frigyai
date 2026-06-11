import { persistOnboardingSignupFromStorage } from "@/components/onboarding/utils";
import { waitForAuthSession } from "@/lib/authErrors";
import { handleAuthSuccess } from "@/lib/handleAuthSuccess";
import { resolvePremiumAccessAfterSignIn } from "@/lib/resolvePremiumAccessAfterSignIn";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionStatusLike } from "@/lib/subscription";

export type PostAuthIntent = "login" | "signup" | "auto";

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

const DEFAULT_SESSION_WAIT_MS = 6000;

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

/**
 * Post-auth routing — RevenueCat premium first, then DB record.
 *
 * - Active premium → dashboard
 * - No premium + new user → paywall
 * - No premium + existing user → standalone paywall
 */
export async function resolvePostAuthDestination(options: {
  userId?: string | null;
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  fromOnboarding?: boolean;
  explicitPath?: string | null;
  skipReferralCheck?: boolean;
  sessionWaitMs?: number;
  authIntent?: PostAuthIntent;
  emailPasswordLogin?: boolean;
}): Promise<PostAuthRoute> {
  void options.authIntent;
  void options.emailPasswordLogin;

  const sessionResult = await ensureAuthSessionForRouting({
    userId: options.userId,
    maxWaitMs: options.sessionWaitMs,
  });

  if (!sessionResult.ok) {
    return { phase: "no_session", path: "/auth", userId: null };
  }

  const session = (await supabase.auth.getSession()).data.session;
  const authUser = session?.user;
  if (!authUser) {
    return { phase: "no_session", path: "/auth", userId: null };
  }

  if (options.fromOnboarding) {
    persistOnboardingSignupFromStorage();
  }

  const hasPremium = await resolvePremiumAccessAfterSignIn({
    userId: authUser.id,
    checkSubscription: options.checkSubscription,
    skipReferralCheck: options.skipReferralCheck,
    sessionReady: true,
  });

  const route = await handleAuthSuccess(authUser, {
    fromOnboarding: options.fromOnboarding,
    explicitPath: options.explicitPath,
    hasPremium,
  });

  return {
    phase: route.destination,
    path: route.path,
    userId: authUser.id,
  };
}
