import { usesStoreBilling } from "@/lib/billingPlatform";
import { DEFAULT_STORE_OFFERING_PRICES } from "@/lib/defaultStoreOfferingPrices";
import type { StoreOfferingPrices } from "@/lib/storeBilling";

/** Fixed standard paywall prices (no live RevenueCat refresh). */
export function useStoreOfferingPrices(_userId?: string | null) {
  const prices: StoreOfferingPrices | null = usesStoreBilling() ? DEFAULT_STORE_OFFERING_PRICES : null;

  return {
    prices,
    loading: false,
    error: false,
    reload: () => {},
  };
}
