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

function mergeStoreOfferingPrices(
  existing: StoreOfferingPrices | null,
  incoming: StoreOfferingPrices,
): StoreOfferingPrices {
  return {
    monthly: incoming.monthly?.priceString ? incoming.monthly : (existing?.monthly ?? null),
    yearly: incoming.yearly?.priceString ? incoming.yearly : (existing?.yearly ?? null),
    yearlyPromo: incoming.yearlyPromo?.priceString
      ? incoming.yearlyPromo
      : (existing?.yearlyPromo ?? null),
  };
}

export function readCachedStoreOfferingPrices(): StoreOfferingPrices | null {
  if (memoryPrices?.monthly?.priceString && memoryPrices?.yearly?.priceString) {
    return memoryPrices;
  }

  if (typeof window === "undefined") return memoryPrices;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return memoryPrices;
    const parsed = JSON.parse(raw) as { prices?: StoreOfferingPrices; at?: number };
    if (!parsed.at || Date.now() - parsed.at > CACHE_TTL_MS) return memoryPrices;

    const fromStorage = parsed.prices ?? null;
    if (!fromStorage) return memoryPrices;

    memoryPrices = mergeStoreOfferingPrices(memoryPrices, fromStorage);
    if (memoryPrices.monthly?.priceString && memoryPrices.yearly?.priceString) {
      return memoryPrices;
    }
    return memoryPrices.monthly?.priceString || memoryPrices.yearly?.priceString
      ? memoryPrices
      : null;
  } catch {
    return memoryPrices;
  }
}

export function writeCachedStoreOfferingPrices(prices: StoreOfferingPrices): void {
  const merged = mergeStoreOfferingPrices(memoryPrices, prices);
  if (!merged.monthly?.priceString && !merged.yearly?.priceString) return;

  const changed =
    merged.monthly?.priceString !== memoryPrices?.monthly?.priceString ||
    merged.yearly?.priceString !== memoryPrices?.yearly?.priceString ||
    merged.yearlyPromo?.priceString !== memoryPrices?.yearlyPromo?.priceString;

  memoryPrices = merged;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ prices: merged, at: Date.now() }));
    } catch {
      /* ignore quota */
    }
  }
  if (changed) notifySubscribers();
}

export function getStoreOfferingPricesSnapshot(): StoreOfferingPrices | null {
  return memoryPrices ?? readCachedStoreOfferingPrices();
}

export function subscribeStoreOfferingPrices(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasFreshStoreOfferingPrices(): boolean {
  const snapshot = getStoreOfferingPricesSnapshot();
  return Boolean(snapshot?.monthly?.priceString && snapshot?.yearly?.priceString);
}
