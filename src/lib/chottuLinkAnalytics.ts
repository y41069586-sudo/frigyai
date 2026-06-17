import { Capacitor } from "@capacitor/core";
import type { PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { ChottuLinkNative } from "@/lib/chottuLinkNative";
import { getStoredInfluencerRef } from "@/lib/referralAttribution";

function isChottuLinkConfigured(): boolean {
  const apiKey = (import.meta.env.VITE_CHOTTULINK_API_KEY as string | undefined)?.trim();
  const iosTrackingEnabled = (import.meta.env.VITE_ENABLE_CHOTTULINK_IOS_TRACKING as string | undefined) === "1";
  return Boolean(apiKey) && iosTrackingEnabled;
}

/** Link ChottuLink install attribution to the logged-in Supabase user (iOS only for now). */
export async function identifyChottuLinkUser(options: {
  userId: string;
  email?: string | null;
  name?: string | null;
}): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isChottuLinkConfigured()) return;
  if (Capacitor.getPlatform() === "android") return;

  try {
    await ChottuLinkNative.identify({
      id: options.userId,
      email: options.email ?? undefined,
      name: options.name ?? undefined,
    });
  } catch (error) {
    console.warn("[ChottuLink] identify failed:", error);
  }
}

export type StorePurchaseConversionInput = {
  plan: PaywallBillingPlan;
  revenue: number;
  currency?: string;
  productId?: string;
  transactionId?: string;
};

/** Fire ChottuLink conversion for influencer revenue in their dashboard (iOS only for now). */
export async function trackChottuLinkStoreConversion(
  input: StorePurchaseConversionInput,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isChottuLinkConfigured()) return;
  if (Capacitor.getPlatform() === "android") return;
  if (!getStoredInfluencerRef()) return;
  if (!Number.isFinite(input.revenue) || input.revenue <= 0) return;

  try {
    await ChottuLinkNative.trackConversion({
      revenue: input.revenue,
      currency: input.currency ?? "EUR",
      eventName: "conversion",
      productId: input.productId,
      transactionId: input.transactionId,
      metadata: {
        plan: input.plan,
        source: "revenuecat",
      },
    });
    await ChottuLinkNative.trackEvent({
      name: "subscription_purchase",
      data: {
        plan: input.plan,
        revenue: input.revenue,
        currency: input.currency ?? "EUR",
        product_id: input.productId ?? null,
      },
    });
  } catch (error) {
    console.warn("[ChottuLink] trackConversion failed:", error);
  }
}
