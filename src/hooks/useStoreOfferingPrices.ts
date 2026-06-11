import { useCallback, useEffect, useState } from "react";
import { usesStoreBilling } from "@/lib/billingPlatform";
import {
  configureStoreBilling,
  fetchStoreOfferingPricesWithRetry,
  type StoreOfferingPrices,
} from "@/lib/storeBilling";

/** Loads localized monthly/yearly prices from App Store / Play via RevenueCat. */
export function useStoreOfferingPrices(userId?: string | null) {
  const [prices, setPrices] = useState<StoreOfferingPrices | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!usesStoreBilling() || !userId) {
      setPrices(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        await configureStoreBilling(userId);
        const result = await fetchStoreOfferingPricesWithRetry();
        if (cancelled) return;
        if (result.ok) {
          setPrices(result.prices);
          setError(null);
        } else {
          setPrices(null);
          setError(result.error);
        }
      } catch (e) {
        if (cancelled) return;
        setPrices(null);
        setError(e instanceof Error ? e.message : "Angebote konnten nicht geladen werden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadToken]);

  return { prices, loading, error, reload, retry: reload };
}
