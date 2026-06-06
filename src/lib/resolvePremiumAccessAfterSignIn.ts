import { supabase } from "@/integrations/supabase/client";
import { waitForAuthSession } from "@/lib/authErrors";
import { consumeReferralSkipPaywall } from "@/lib/referralCode";
import { syncStoreSubscriptionIfNeeded } from "@/lib/subscriptionRefresh";
import { isSubscriptionActive, type SubscriptionStatusLike } from "@/lib/subscription";

const AUTH_SUBSCRIPTION_CHECK_MS = 4500;

async function checkSubscriptionForAuthRouting(
  checkSubscription: () => Promise<SubscriptionStatusLike | null>,
): Promise<SubscriptionStatusLike | null> {
  try {
    return await Promise.race([
      checkSubscription(),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), AUTH_SUBSCRIPTION_CHECK_MS)),
    ]);
  } catch {
    return null;
  }
}

async function loadSubscriptionFromDbCache(
  userId: string,
): Promise<SubscriptionStatusLike | null> {
  try {
    const { data, error } = await supabase
      .from("subscription_cache")
      .select("subscribed, product_id, subscription_end, is_trial")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    const status: SubscriptionStatusLike = {
      subscribed: data.subscribed,
      product_id: data.product_id,
      subscription_end: data.subscription_end,
    };

    if (!isSubscriptionActive(status)) {
      return { ...status, subscribed: false };
    }

    return status;
  } catch {
    return null;
  }
}

/**
 * After sign-in, subscription state may not be in React context yet.
 * Poll DB cache + check-subscription before routing to paywall.
 */
export async function resolvePremiumAccessAfterSignIn(options: {
  userId?: string | null;
  checkSubscription: () => Promise<SubscriptionStatusLike | null>;
  skipReferralCheck?: boolean;
  /** Caller already has a session (e.g. right after sign-in) — skip long session polling. */
  sessionReady?: boolean;
}): Promise<boolean> {
  if (!options.skipReferralCheck && consumeReferralSkipPaywall()) {
    return true;
  }

  const existingSession = (await supabase.auth.getSession()).data.session;
  if (!existingSession) {
    const waitMs = options.sessionReady ? 1200 : 4500;
    if (!(await waitForAuthSession(waitMs))) {
      return false;
    }
  }

  const session = (await supabase.auth.getSession()).data.session;
  await syncStoreSubscriptionIfNeeded(session?.access_token);

  let userId = options.userId ?? undefined;
  if (!userId) {
    const { data } = await supabase.auth.getSession();
    userId = data.session?.user?.id;
  }

  if (userId) {
    const dbCache = await loadSubscriptionFromDbCache(userId);
    if (isSubscriptionActive(dbCache)) {
      return true;
    }
  }

  const retryDelaysMs = options.sessionReady ? [0, 200, 400] : [0, 300, 500, 800, 1100, 1500];
  for (const delayMs of retryDelaysMs) {
    if (delayMs > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
    const status = await checkSubscriptionForAuthRouting(options.checkSubscription);
    if (isSubscriptionActive(status)) {
      return true;
    }
  }

  return false;
}
