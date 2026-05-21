import type { PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { STRIPE_PAYMENT_LINKS } from "@/components/onboarding/components/OnboardingPaywallStep";

import { STRIPE_APP_DEEP_LINK_SUCCESS } from "@/lib/appDeepLink";
import { getStoredInfluencerRef } from "@/lib/referralAttribution";

export const STRIPE_CHECKOUT_PENDING_KEY = "frigy_pending_stripe_checkout";
export const STRIPE_SUCCESS_PATH = "/?subscription=success";

/** Stripe „Nach dem Bezahlen“ — native iOS/Android (Deep Link) */
export { STRIPE_APP_DEEP_LINK_SUCCESS };

/** ChottuLink influencer destination — see docs/CHOTTULINK_SETUP.md */
export {
  CHOTTU_LINK_DESTINATION_URL,
  CHOTTU_LINK_WEB_DESTINATION_URL,
  DEEP_LINK_EXAMPLE,
} from "@/lib/chottuLinkConfig";

export type StripeCheckoutContext = {
  userId?: string | null;
  /** Override stored influencer ref */
  affiliateSlug?: string | null;
};

/**
 * Stripe Payment Links + attribution:
 * - prefilled_email → match Supabase user in webhook
 * - client_reference_id → frigy_{userId}_{slug} for Stripe metadata attribution
 */
export function buildStripePaymentUrl(
  plan: PaywallBillingPlan,
  email?: string | null,
  ctx?: StripeCheckoutContext,
): string {
  const base = STRIPE_PAYMENT_LINKS[plan];

  try {
    const url = new URL(base);
    if (email?.trim()) {
      url.searchParams.set("prefilled_email", email.trim().toLowerCase());
    }

    const slug = (ctx?.affiliateSlug ?? getStoredInfluencerRef())?.trim().toLowerCase();
    const userId = ctx?.userId?.trim();
    if (userId && slug && slug.length >= 3) {
      url.searchParams.set("client_reference_id", `frigy_${userId}_${slug}`);
    }

    return url.toString();
  } catch {
    let out = base;
    if (email?.trim()) {
      out += `${base.includes("?") ? "&" : "?"}prefilled_email=${encodeURIComponent(email.trim().toLowerCase())}`;
    }
    const slug = (ctx?.affiliateSlug ?? getStoredInfluencerRef())?.trim().toLowerCase();
    const userId = ctx?.userId?.trim();
    if (userId && slug && slug.length >= 3) {
      const sep = out.includes("?") ? "&" : "?";
      out += `${sep}client_reference_id=${encodeURIComponent(`frigy_${userId}_${slug}`)}`;
    }
    return out;
  }
}

export function markStripeCheckoutPending(): void {
  localStorage.setItem(STRIPE_CHECKOUT_PENDING_KEY, String(Date.now()));
}

export function consumeStripeCheckoutPending(): boolean {
  const raw = localStorage.getItem(STRIPE_CHECKOUT_PENDING_KEY);
  if (!raw) return false;
  localStorage.removeItem(STRIPE_CHECKOUT_PENDING_KEY);
  return true;
}
