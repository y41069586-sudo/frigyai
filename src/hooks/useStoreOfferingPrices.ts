import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  const lastUserIdRef = useRef<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(
    () => usesStoreBilling() && !hasFreshStoreOfferingPrices(),
  );

  useEffect(() => {
    if (!usesStoreBilling()) {
      setLoading(false);
      return;
    }

    const userKey = userId ?? null;
    if (lastUserIdRef.current === userKey) return;
    lastUserIdRef.current = userKey;

    const loadingCap = window.setTimeout(() => {
      setLoading(false);
    }, LOADING_MAX_MS);

    if (hasFreshStoreOfferingPrices()) {
      setLoading(false);
      void prefetchStoreOfferingPrices(userId);
      return () => clearTimeout(loadingCap);
    }

    setLoading(true);
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
