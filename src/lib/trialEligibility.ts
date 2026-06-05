/** User already used trial or purchased — no intro offer in paywall UI. */
const EVER_PREMIUM_KEY = "frigy_ever_premium";

export function markEverPremium(): void {
  try {
    localStorage.setItem(EVER_PREMIUM_KEY, "1");
  } catch {
    // ignore
  }
}

export function hasEverHadPremium(): boolean {
  try {
    return localStorage.getItem(EVER_PREMIUM_KEY) === "1";
  } catch {
    return false;
  }
}

/** Paywall route — renew=1 skips trial UI for returning / lapsed subscribers. */
export function buildPremiumPricingRoute(options?: { trialEligible?: boolean }): string {
  if (options?.trialEligible === false || hasEverHadPremium()) {
    return "/premium-pricing?renew=1";
  }
  return "/premium-pricing";
}

export function isRenewPaywallSearch(search: string): boolean {
  return new URLSearchParams(search).get("renew") === "1";
}

/**
 * First-time users may see the 3-day trial paywall.
 * After any subscription/trial/promo on record — monthly shows standard pricing only.
 */
export function resolveTrialEligibleFromLocal(): boolean {
  return !hasEverHadPremium();
}
