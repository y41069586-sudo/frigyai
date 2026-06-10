import { useEffect, useState } from "react";
import { usesStoreBilling } from "@/lib/billingPlatform";
import {
  configureStoreBilling,
  fetchStoreOfferingPrices,
  type StoreOfferingPrices,
} from "@/lib/storeBilling";

const CACHE_KEY = "frigy_store_offering_prices_v1";
const LOADING_MAX_MS = 1_000;
const FETCH_MAX_MS = 5_000;

function readCachedPrices(): StoreOfferingPrices | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { prices?: StoreOfferingPrices; at?: number };
    if (!parsed.prices?.monthly?.priceString || !parsed.prices?.yearly?.priceString) return null;
    if (!parsed.at || Date.now() - parsed.at > 24 * 60 * 60 * 1000) return null;
    return parsed.prices;
  } catch {
    return null;
  }
}

function writeCachedPrices(prices: StoreOfferingPrices): void {
  if (typeof window === "undefined") return;
  if (!prices.monthly?.priceString || !prices.yearly?.priceString) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ prices, at: Date.now() }));
  } catch {
    /* ignore quota */
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Loads localized monthly/yearly prices from App Store / Play via RevenueCat. */
export function useStoreOfferingPrices(userId?: string | null) {
  const [prices, setPrices] = useState<StoreOfferingPrices | null>(() => readCachedPrices());
  const [loading, setLoading] = useState(
    () => usesStoreBilling() && Boolean(userId) && !readCachedPrices(),
  );

  useEffect(() => {
    if (!usesStoreBilling() || !userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const cached = readCachedPrices();
    if (cached) {
      setPrices(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const loadingCap = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, LOADING_MAX_MS);

    void (async () => {
      try {
        await withTimeout(configureStoreBilling(userId), FETCH_MAX_MS);
        const fetched = await withTimeout(fetchStoreOfferingPrices(), FETCH_MAX_MS);
        if (!cancelled && fetched?.monthly?.priceString && fetched?.yearly?.priceString) {
          setPrices(fetched);
          writeCachedPrices(fetched);
        }
      } catch (e) {
        console.warn("[useStoreOfferingPrices]", e);
      } finally {
        if (!cancelled) {
          clearTimeout(loadingCap);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(loadingCap);
    };
  }, [userId]);

  return { prices, loading };
}
