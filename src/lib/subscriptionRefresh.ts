import { usesStoreBilling } from "@/lib/billingPlatform";
import {
  isStoreBillingConfigured,
  refreshStoreCustomerInfo,
  syncStoreSubscriptionToServer,
} from "@/lib/storeBilling";
import { isSubscriptionActive, type SubscriptionStatusLike } from "@/lib/subscription";

/** Sync RevenueCat → Supabase before reading subscription status (native apps). */
export async function syncStoreSubscriptionIfNeeded(accessToken: string | null | undefined): Promise<void> {
  if (!accessToken || !usesStoreBilling() || !isStoreBillingConfigured()) return;

  try {
    await syncStoreSubscriptionToServer(accessToken);
  } catch (error) {
    console.warn("[subscriptionRefresh] sync-store-subscription failed:", error);
  }
}

export const PREMIUM_ACTIVATION_MAX_ATTEMPTS = 20;
export const PREMIUM_ACTIVATION_POLL_MS = 1500;

/** Poll until premium is active or attempts exhausted (after IAP purchase). */
export async function waitForPremiumAfterPurchase(
  checkSubscription: () => Promise<SubscriptionStatusLike | null>,
  accessToken: string | null | undefined,
  maxAttempts = PREMIUM_ACTIVATION_MAX_ATTEMPTS,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await refreshStoreCustomerInfo()) {
      await syncStoreSubscriptionIfNeeded(accessToken);
      const status = await checkSubscription();
      if (isSubscriptionActive(status)) {
        return true;
      }
    }

    await syncStoreSubscriptionIfNeeded(accessToken);
    const status = await checkSubscription();
    if (isSubscriptionActive(status)) {
      return true;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, PREMIUM_ACTIVATION_POLL_MS));
    }
  }
  return false;
}
