import type { PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { STRIPE_PAYMENT_LINKS } from "@/components/onboarding/components/OnboardingPaywallStep";

import { STRIPE_APP_DEEP_LINK_SUCCESS } from "@/lib/appDeepLink";

export const STRIPE_CHECKOUT_PENDING_KEY = "frigy_pending_stripe_checkout";
export const STRIPE_SUCCESS_PATH = "/?subscription=success";

/** Stripe „Nach dem Bezahlen“ — native iOS/Android (Deep Link) */
export { STRIPE_APP_DEEP_LINK_SUCCESS };

/** Stripe Payment Links: prefilled_email helps match the Supabase account in check-subscription */
export function buildStripePaymentUrl(plan: PaywallBillingPlan, email?: string | null): string {
  const base = STRIPE_PAYMENT_LINKS[plan];
  if (!email?.trim()) return base;

  try {
    const url = new URL(base);
    url.searchParams.set("prefilled_email", email.trim().toLowerCase());
    return url.toString();
  } catch {
    return `${base}?prefilled_email=${encodeURIComponent(email.trim().toLowerCase())}`;
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
