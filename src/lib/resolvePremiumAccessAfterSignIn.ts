import { supabase } from "@/integrations/supabase/client";
import { waitForAuthSession } from "@/lib/authErrors";
import { consumeReferralSkipPaywall } from "@/lib/referralCode";
import { isSubscriptionActive, type SubscriptionStatusLike } from "@/lib/subscription";

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
}): Promise<boolean> {
  if (!options.skipReferralCheck && consumeReferralSkipPaywall()) {
    return true;
  }

  if (!(await waitForAuthSession(4500))) {
    return false;
  }

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

  const retryDelaysMs = [0, 300, 500, 800, 1100, 1500];
  for (const delayMs of retryDelaysMs) {
    if (delayMs > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
    const status = await options.checkSubscription();
    if (isSubscriptionActive(status)) {
      return true;
    }
  }

  return false;
}
