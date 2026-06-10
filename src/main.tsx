import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "./App.tsx";
import "./index.css";
import { usesStoreBilling } from "@/lib/billingPlatform";
import { clearOAuthPending, clearStaleOAuthPendingIfIdle, getOAuthPending } from "@/lib/oauthPending";
import { readCachedStoreOfferingPrices } from "@/lib/storeOfferingPricesCache";
import { isStoreBillingConfigured, prefetchStoreOfferingPrices } from "@/lib/storeBilling";

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return import.meta.env.DEV;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

/** Drop stale SW + Cache Storage on localhost (dev + preview) — old SW can hijack OAuth. */
async function clearDevClientCaches(): Promise<void> {
  if (!import.meta.env.DEV && !isLocalDevHost()) return;
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // non-fatal
  }
}

function clearStaleDevAuthFlags(): void {
  if (!import.meta.env.DEV || typeof window === "undefined") return;
  const host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return;
  const hasOAuthParams =
    window.location.search.includes("code=") || window.location.hash.includes("access_token=");
  if (!hasOAuthParams && getOAuthPending()) {
    clearOAuthPending();
  }
}

// Never block first paint on SW/cache cleanup — a hung unregister caused blank white screens.
void clearDevClientCaches();
clearStaleDevAuthFlags();
clearStaleOAuthPendingIfIdle();

// Warm paywall price cache from localStorage, then prefetch RevenueCat in background (native).
readCachedStoreOfferingPrices();
if (usesStoreBilling() && isStoreBillingConfigured()) {
  void prefetchStoreOfferingPrices(null);
}

createRoot(document.getElementById("root")!).render(
  <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
    <App />
  </MotionConfig>,
);
