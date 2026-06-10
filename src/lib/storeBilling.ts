import { Capacitor } from "@capacitor/core";
import type { PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { usesStoreBilling } from "@/lib/billingPlatform";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { supabase } from "@/integrations/supabase/client";

const ANDROID_PACKAGE = "com.frigy.app";

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

type OfferingsResult = Awaited<
  ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.getOfferings>
>;

const OFFERINGS_CONFIG_HINT =
  "App Store Connect: Abos mit exakt gleicher Product ID wie in RevenueCat, Status „Bereit zur Übermittlung“, Subscription-Gruppe lokalisiert, Paid Applications Agreement unterzeichnet. Sandbox auf echtem Gerät testen.";

function pickPackage(offerings: OfferingsResult, plan: PaywallBillingPlan) {
  const current = offerings.current;
  if (!current) return null;
  if (plan === "yearly") {
    return current.annual ?? current.availablePackages.find((p) => /annual|year/i.test(p.identifier)) ?? null;
  }
  return current.monthly ?? current.availablePackages.find((p) => /month/i.test(p.identifier)) ?? null;
}

/** User-facing hint when RevenueCat offerings exist but StoreKit products are missing. */
export function diagnoseOfferingsIssue(offerings: OfferingsResult): string | null {
  const current = offerings.current;
  if (!current) {
    return `Kein aktuelles Offering in RevenueCat. Offering „default“ als Current setzen und monthly/yearly Packages zuweisen. ${OFFERINGS_CONFIG_HINT}`;
  }

  const packagesWithoutProduct = current.availablePackages.filter((p) => !p.product);
  if (packagesWithoutProduct.length > 0) {
    const ids = packagesWithoutProduct.map((p) => p.identifier).join(", ");
    return `App Store konnte Abo-Produkte nicht laden (${ids}). ${OFFERINGS_CONFIG_HINT}`;
  }

  return null;
}

function formatStoreBillingError(message: string): string {
  if (
    /configuration/i.test(message) &&
    (/could not be fetched|couldn't be fetched|none of the products/i.test(message) ||
      /offerings empty/i.test(message))
  ) {
    return `Abo-Konfiguration unvollständig. ${OFFERINGS_CONFIG_HINT}`;
  }
  return message;
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
    const issue = diagnoseOfferingsIssue(offerings);
    if (issue) {
      console.warn("[StoreBilling] offerings issue:", issue);
    }
    return {
      monthly: mapPackagePrice(pickPackage(offerings, "monthly")),
      yearly: mapPackagePrice(pickPackage(offerings, "yearly")),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn("[StoreBilling] fetchStoreOfferingPrices failed:", formatStoreBillingError(message), e);
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
    const offeringsIssue = diagnoseOfferingsIssue(offerings);
    if (offeringsIssue) {
      return { ok: false, message: offeringsIssue };
    }

    const pkg = pickPackage(offerings, plan);
    if (!pkg) {
      return {
        ok: false,
        message:
          "Kein Abo-Paket in RevenueCat gefunden. Offering „default“ als Current setzen mit $rc_monthly und $rc_annual.",
      };
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
    const raw = err?.message || "Store-Kauf fehlgeschlagen.";
    return { ok: false, message: formatStoreBillingError(raw) };
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
