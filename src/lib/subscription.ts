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
