import { Capacitor } from "@capacitor/core";
import type { PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { usesStoreBilling } from "@/lib/billingPlatform";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { supabase } from "@/integrations/supabase/client";

const ANDROID_PACKAGE = "com.frigyapp.app";

const ENTITLEMENT_ID = import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID?.trim() || "premium";

function getApiKey(): string | null {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    return import.meta.env.VITE_REVENUECAT_API_KEY_IOS?.trim() || null;
  }
  if (platform === "android") {
    return import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID?.trim() || null;
  }
  return null;
}

export function isStoreBillingConfigured(): boolean {
  return usesStoreBilling() && Boolean(getApiKey());
}

let configurePromise: Promise<void> | null = null;

export async function configureStoreBilling(appUserId: string): Promise<void> {
  if (!usesStoreBilling()) return;
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[StoreBilling] Missing VITE_REVENUECAT_API_KEY_IOS / ANDROID");
    return;
  }

  if (!configurePromise) {
    configurePromise = (async () => {
      const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
      if (import.meta.env.DEV) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      }
      await Purchases.configure({
        apiKey,
        appUserID: appUserId,
      });
    })();
  }

  await configurePromise;
}

export async function syncStoreSubscriptionToServer(accessToken: string): Promise<void> {
  const { error } = await supabase.functions.invoke("sync-store-subscription", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (error) {
    console.warn("[StoreBilling] sync-store-subscription failed:", error);
  }
}

function pickPackage(
  offerings: Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.getOfferings>>,
  plan: PaywallBillingPlan,
) {
  const current = offerings.current;
  if (!current) return null;
  if (plan === "yearly") {
    return current.annual ?? current.availablePackages.find((p) => /annual|year/i.test(p.identifier)) ?? null;
  }
  return current.monthly ?? current.availablePackages.find((p) => /month/i.test(p.identifier)) ?? null;
}

export type StorePlanPrice = {
  priceString: string;
  pricePerMonthString?: string | null;
  hasIntroOffer: boolean;
};

export type StoreOfferingPrices = {
  monthly: StorePlanPrice | null;
  yearly: StorePlanPrice | null;
};

function mapPackagePrice(
  pkg: ReturnType<typeof pickPackage>,
): StorePlanPrice | null {
  if (!pkg?.product) return null;
  const product = pkg.product as {
    priceString: string;
    pricePerMonthString?: string | null;
    introPrice?: unknown | null;
  };
  return {
    priceString: product.priceString,
    pricePerMonthString: product.pricePerMonthString ?? null,
    hasIntroOffer: Boolean(product.introPrice),
  };
}

/** Live App Store / Play prices from RevenueCat offerings (not hardcoded). */
export async function fetchStoreOfferingPrices(): Promise<StoreOfferingPrices | null> {
  if (!isStoreBillingConfigured()) return null;

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const offerings = await Purchases.getOfferings();
    return {
      monthly: mapPackagePrice(pickPackage(offerings, "monthly")),
      yearly: mapPackagePrice(pickPackage(offerings, "yearly")),
    };
  } catch (e) {
    console.warn("[StoreBilling] fetchStoreOfferingPrices failed:", e);
    return null;
  }
}

export type StorePurchaseResult =
  | { ok: true }
  | { ok: false; cancelled?: boolean; message?: string };

export async function purchaseStorePlan(
  plan: PaywallBillingPlan,
  accessToken: string,
): Promise<StorePurchaseResult> {
  if (!isStoreBillingConfigured()) {
    return {
      ok: false,
      message: "App Store / Play Abo ist noch nicht konfiguriert (RevenueCat API Keys fehlen).",
    };
  }

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const offerings = await Purchases.getOfferings();
    const pkg = pickPackage(offerings, plan);
    if (!pkg) {
      return { ok: false, message: "Kein Abo-Paket in RevenueCat gefunden (Offering monthly/yearly)." };
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!active) {
      return { ok: false, message: "Kauf abgeschlossen, aber Premium-Entitlement fehlt." };
    }

    await syncStoreSubscriptionToServer(accessToken);
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; userCancelled?: boolean };
    if (err?.userCancelled || err?.code === "1" || /cancel/i.test(String(err?.message || ""))) {
      return { ok: false, cancelled: true };
    }
    return { ok: false, message: err?.message || "Store-Kauf fehlgeschlagen." };
  }
}

/** Opens App Store / Play Store subscription management (required for store-billed users). */
export async function openStoreSubscriptionManagement(): Promise<void> {
  const platform = Capacitor.getPlatform();
  const url =
    platform === "ios"
      ? "https://apps.apple.com/account/subscriptions"
      : `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}`;
  await openExternalUrl(url);
}

export async function restoreStorePurchases(accessToken: string): Promise<StorePurchaseResult> {
  if (!isStoreBillingConfigured()) {
    return { ok: false, message: "Store-Wiederherstellung nicht verfügbar." };
  }

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.restorePurchases();
    const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!active) {
      return { ok: false, message: "Kein aktives Abo gefunden." };
    }
    await syncStoreSubscriptionToServer(accessToken);
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Wiederherstellung fehlgeschlagen.";
    return { ok: false, message };
  }
}
