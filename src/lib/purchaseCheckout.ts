import type { PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
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
  if (!ctx.accessToken || !ctx.userId) {
    return { ok: false, message: "Bitte zuerst anmelden." };
  }

  await configureStoreBilling(ctx.userId);
  if (!isStoreBillingConfigured()) {
    return {
      ok: false,
      message:
        "In-App-Abos sind noch nicht eingerichtet. Bitte RevenueCat API Keys in .env setzen (siehe docs/STORE_BILLING_SETUP.md).",
    };
  }

  const result = await purchaseStorePlan(plan, ctx.accessToken, ctx.userId);
  if (result.ok) return { ok: true, channel: "store" };
  return { ok: false, cancelled: result.cancelled, message: result.message };
}
