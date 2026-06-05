import { useEffect, useState } from "react";
import { usesStoreBilling } from "@/lib/billingPlatform";
import {
  configureStoreBilling,
  fetchStoreOfferingPrices,
  type StoreOfferingPrices,
} from "@/lib/storeBilling";

/** Loads localized monthly/yearly prices from App Store / Play via RevenueCat. */
export function useStoreOfferingPrices(userId?: string | null) {
  const [prices, setPrices] = useState<StoreOfferingPrices | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!usesStoreBilling() || !userId) return;

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        await configureStoreBilling(userId);
        const fetched = await fetchStoreOfferingPrices();
        if (!cancelled) setPrices(fetched);
      } catch (e) {
        console.warn("[useStoreOfferingPrices]", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { prices, loading };
}
