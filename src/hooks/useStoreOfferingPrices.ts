import { useEffect, useState, useSyncExternalStore } from "react";
import { usesStoreBilling } from "@/lib/billingPlatform";
import { prefetchStoreOfferingPrices } from "@/lib/storeBilling";
import {
  getStoreOfferingPricesSnapshot,
  hasFreshStoreOfferingPrices,
  readCachedStoreOfferingPrices,
  subscribeStoreOfferingPrices,
} from "@/lib/storeOfferingPricesCache";
import type { StoreOfferingPrices } from "@/lib/storeBilling";

const LOADING_MAX_MS = 800;

function getSnapshot(): StoreOfferingPrices | null {
  return getStoreOfferingPricesSnapshot();
}

/** Loads localized monthly/yearly prices from App Store / Play via RevenueCat. */
export function useStoreOfferingPrices(userId?: string | null) {
  const prices = useSyncExternalStore(subscribeStoreOfferingPrices, getSnapshot, getSnapshot);
  const [loading, setLoading] = useState(
    () => usesStoreBilling() && !hasFreshStoreOfferingPrices(),
  );

  useEffect(() => {
    if (!usesStoreBilling()) {
      setLoading(false);
      return;
    }

    if (hasFreshStoreOfferingPrices()) {
      setLoading(false);
    } else {
      setLoading(true);
    }

    const loadingCap = window.setTimeout(() => {
      setLoading(false);
    }, LOADING_MAX_MS);

    void prefetchStoreOfferingPrices(userId).finally(() => {
      clearTimeout(loadingCap);
      setLoading(false);
    });

    return () => {
      clearTimeout(loadingCap);
    };
  }, [userId]);

  return {
    prices: prices ?? readCachedStoreOfferingPrices(),
    loading,
  };
}
