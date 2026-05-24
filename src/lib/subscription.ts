export interface SubscriptionStatusLike {
  subscribed?: boolean;
  subscription_end?: string | null;
}

export function isSubscriptionActive(status: SubscriptionStatusLike | null | undefined): boolean {
  if (!status?.subscribed) return false;
  if (status.subscription_end) {
    return new Date(status.subscription_end) > new Date();
  }
  return true;
}
