import type { StoreOfferingPrices } from "@/lib/storeBilling";

const CACHE_KEY = "frigy_store_offering_prices_v1";
const ANON_RC_USER_KEY = "frigy_rc_anonymous_user_id";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let memoryPrices: StoreOfferingPrices | null = null;
const listeners = new Set<() => void>();

function notifySubscribers(): void {
  listeners.forEach((listener) => listener());
}

export function resolveRevenueCatUserId(userId?: string | null): string {
  if (userId?.trim()) return userId.trim();
  if (typeof window === "undefined") return "anon_guest";

  let anon = localStorage.getItem(ANON_RC_USER_KEY);
  if (!anon) {
    anon = `anon_${crypto.randomUUID()}`;
    localStorage.setItem(ANON_RC_USER_KEY, anon);
  }
  return anon;
}

export function readCachedStoreOfferingPrices(): StoreOfferingPrices | null {
  if (memoryPrices?.monthly?.priceString && memoryPrices?.yearly?.priceString) {
    return memoryPrices;
  }

  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { prices?: StoreOfferingPrices; at?: number };
    if (!parsed.prices?.monthly?.priceString || !parsed.prices?.yearly?.priceString) return null;
    if (!parsed.at || Date.now() - parsed.at > CACHE_TTL_MS) return null;
    memoryPrices = parsed.prices;
    return parsed.prices;
  } catch {
    return null;
  }
}

export function writeCachedStoreOfferingPrices(prices: StoreOfferingPrices): void {
  if (!prices.monthly?.priceString || !prices.yearly?.priceString) return;

  memoryPrices = prices;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ prices, at: Date.now() }));
    } catch {
      /* ignore quota */
    }
  }
  notifySubscribers();
}

export function getStoreOfferingPricesSnapshot(): StoreOfferingPrices | null {
  return memoryPrices ?? readCachedStoreOfferingPrices();
}

export function subscribeStoreOfferingPrices(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasFreshStoreOfferingPrices(): boolean {
  return Boolean(getStoreOfferingPricesSnapshot());
}
