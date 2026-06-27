import { usesStoreBilling } from "@/lib/billingPlatform";
import { isStoreBillingConfigured, syncStoreSubscriptionToServer } from "@/lib/storeBilling";
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

/** Poll until premium is active or attempts exhausted (after IAP purchase). */
export async function waitForPremiumAfterPurchase(
  checkSubscription: () => Promise<SubscriptionStatusLike | null>,
  accessToken: string | null | undefined,
  maxAttempts = 8,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await syncStoreSubscriptionIfNeeded(accessToken);
    const status = await checkSubscription();
    if (isSubscriptionActive(status)) {
      return true;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
    }
  }
  return false;
}
