import type { PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { syncAffiliateAttributionToServer } from "@/lib/affiliateSync";
import { usesStoreBilling, usesWebStripeBilling } from "@/lib/billingPlatform";
import { openExternalUrl } from "@/lib/openExternalUrl";
import {
  buildStripePaymentUrl,
  markStripeCheckoutPending,
} from "@/lib/stripePaymentLinks";
import { configureStoreBilling, isStoreBillingConfigured, purchaseStorePlan } from "@/lib/storeBilling";

export type CheckoutContext = {
  userId?: string | null;
  email?: string | null;
  accessToken?: string | null;
  attributionSource?: string;
};

export type CheckoutResult =
  | { ok: true; channel: "store" | "stripe" }
  | { ok: false; cancelled?: boolean; message?: string };

export async function startPremiumCheckout(
  plan: PaywallBillingPlan,
  ctx: CheckoutContext,
): Promise<CheckoutResult> {
  if (usesStoreBilling()) {
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
    const result = await purchaseStorePlan(plan, ctx.accessToken);
    if (result.ok) return { ok: true, channel: "store" };
    return { ok: false, cancelled: result.cancelled, message: result.message };
  }

  if (usesWebStripeBilling()) {
    localStorage.setItem("selectedPlan", plan);
    markStripeCheckoutPending();
    if (ctx.accessToken) {
      await syncAffiliateAttributionToServer(ctx.accessToken, {
        source: ctx.attributionSource ?? "checkout",
      });
    }
    await openExternalUrl(
      buildStripePaymentUrl(plan, ctx.email ?? undefined, { userId: ctx.userId ?? undefined }),
    );
    return { ok: true, channel: "stripe" };
  }

  return { ok: false, message: "Checkout auf dieser Plattform nicht verfügbar." };
}
