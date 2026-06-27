import type { PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { getStoredLanguage, getTranslations } from "@/contexts/LanguageContext";
import { configureStoreBilling, isStoreBillingConfigured, purchaseStorePlan } from "@/lib/storeBilling";

export type CheckoutContext = {
  userId?: string | null;
  email?: string | null;
  accessToken?: string | null;
  attributionSource?: string;
};

export type CheckoutResult =
  | { ok: true; channel: "store" }
  | { ok: false; cancelled?: boolean; message?: string };

export async function startPremiumCheckout(
  plan: PaywallBillingPlan,
  ctx: CheckoutContext,
): Promise<CheckoutResult> {
  const tr = getTranslations(getStoredLanguage());

  if (!ctx.accessToken || !ctx.userId) {
    return { ok: false, message: tr.toastPleaseLogin };
  }

  await configureStoreBilling(ctx.userId);
  if (!isStoreBillingConfigured()) {
    return {
      ok: false,
      message: tr.billingNotConfigured,
    };
  }

  const result = await purchaseStorePlan(plan, ctx.accessToken);
  if (result.ok) return { ok: true, channel: "store" };
  return { ok: false, cancelled: result.cancelled, message: result.message };
}
