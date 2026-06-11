import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usesStoreBilling } from "@/lib/billingPlatform";
import { prefetchStoreOfferingPrices } from "@/lib/storeBilling";
import {
  getStoreOfferingPricesSnapshot,
  hasFreshStoreOfferingPrices,
  readCachedStoreOfferingPrices,
  subscribeStoreOfferingPrices,
} from "@/lib/storeOfferingPricesCache";
import type { StoreOfferingPrices } from "@/lib/storeBilling";

const LOADING_MAX_MS = 20_000;

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
  const [error, setError] = useState(false);

  const loadPrices = useCallback(
    (force = false) => {
      if (!usesStoreBilling()) {
        setLoading(false);
        setError(false);
        return Promise.resolve<StoreOfferingPrices | null>(null);
      }

      setLoading(true);
      setError(false);

      const loadingCap = window.setTimeout(() => {
        setLoading(false);
      }, LOADING_MAX_MS);

      return prefetchStoreOfferingPrices(userId, { force })
        .then((result) => {
          const ready = Boolean(result?.monthly?.priceString && result?.yearly?.priceString);
          setError(!ready);
          return result;
        })
        .catch(() => {
          setError(true);
          return null;
        })
        .finally(() => {
          clearTimeout(loadingCap);
          if (hasFreshStoreOfferingPrices()) {
            setLoading(false);
            setError(false);
          } else {
            setLoading(false);
          }
        });
    },
    [userId],
  );

  const reload = useCallback(() => {
    void loadPrices(true);
  }, [loadPrices]);

  useEffect(() => {
    if (!usesStoreBilling()) {
      setLoading(false);
      setError(false);
      return;
    }

    const userKey = userId ?? null;
    if (lastUserIdRef.current === userKey) return;
    lastUserIdRef.current = userKey;

    if (hasFreshStoreOfferingPrices()) {
      setLoading(false);
      setError(false);
      void prefetchStoreOfferingPrices(userId);
      return;
    }

    void loadPrices(false);
  }, [userId, loadPrices]);

  return {
    prices: prices ?? readCachedStoreOfferingPrices(),
    loading,
    error,
    reload,
  };
}
