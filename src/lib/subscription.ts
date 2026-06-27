export interface SubscriptionStatusLike {
  subscribed?: boolean;
  subscription_end?: string | null;
  product_id?: string | null;
}

export function isSubscriptionActive(status: SubscriptionStatusLike | null | undefined): boolean {
  if (!status?.subscribed) return false;
  if (status.subscription_end) {
    return new Date(status.subscription_end) > new Date();
  }
  return true;
}

/**
 * Prefer a still-valid entitlement when a live check returns inactive (RC/webhook lag,
 * missing REVENUECAT_SECRET, or transient API failure).
 */
export function mergeSubscriptionStatus<T extends SubscriptionStatusLike>(
  incoming: T | null | undefined,
  previous: T | null | undefined,
  dbCache: T | null | undefined,
): T | null {
  const active = (status: T | null | undefined): T | null => {
    if (status && isSubscriptionActive(status) && !isPromoPremiumProductId(status.product_id)) {
      return status;
    }
    return null;
  };

  return (
    active(incoming) ??
    active(dbCache) ??
    active(previous) ??
    incoming ??
    previous ??
    dbCache ??
    null
  );
}

/** Legacy server-side promo grants — no longer treated as premium (App Store compliance). */
export function isPromoPremiumProductId(productId: string | null | undefined): boolean {
  if (!productId) return false;
  return productId.startsWith("referral_") || productId === "influencer_promo";
}

export function isOneTimePremiumProductId(productId: string | null | undefined): boolean {
  return productId === "premium_one_time";
}

export function isStoreSubscriptionProductId(productId: string | null | undefined): boolean {
  if (!productId) return false;
  return productId.startsWith("rc_") || productId.startsWith("store_");
}

export function canManageStoreSubscription(status: SubscriptionStatusLike | null | undefined): boolean {
  return isSubscriptionActive(status) && isStoreSubscriptionProductId(status?.product_id);
}
