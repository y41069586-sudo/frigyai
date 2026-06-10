import type { Language } from "@/contexts/LanguageContext";
import type { StorePlanPrice } from "@/lib/storeBilling";

export type ExclusiveYearlyOffer = {
  originalPriceString: string;
  discountedPriceString: string;
  discountPercent: number;
};

/** Gift offer: regular yearly vs promo yearly — both prices from RevenueCat. */
export function buildExclusiveYearlyOffer(
  regularYearly: StorePlanPrice | null | undefined,
  promoYearly: StorePlanPrice | null | undefined,
): ExclusiveYearlyOffer | null {
  const originalPriceString = regularYearly?.priceString?.trim();
  const discountedPriceString = promoYearly?.priceString?.trim();
  if (!originalPriceString || !discountedPriceString) return null;

  const regularPrice = regularYearly?.price;
  const promoPrice = promoYearly?.price;

  let discountPercent = 0;
  if (
    typeof regularPrice === "number" &&
    typeof promoPrice === "number" &&
    regularPrice > 0 &&
    promoPrice < regularPrice
  ) {
    discountPercent = Math.round((1 - promoPrice / regularPrice) * 100);
  }

  return {
    originalPriceString,
    discountedPriceString,
    discountPercent: Math.max(discountPercent, 1),
  };
}

/** Localized trial hint for premium upsell — price must come from RevenueCat. */
export function formatPremiumTrialHint(
  language: Language,
  monthlyPriceString: string | null | undefined,
): string {
  const price = monthlyPriceString?.trim();
  if (!price) {
    const withoutPrice: Record<Language, string> = {
      de: "3 Tage kostenlos testen",
      en: "3-day free trial",
      fr: "3 jours d'essai gratuit",
    };
    return withoutPrice[language];
  }

  const withPrice: Record<Language, string> = {
    de: `3 Tage kostenlos testen · danach ${price}`,
    en: `3-day free trial · then ${price}`,
    fr: `3 jours d'essai gratuit · puis ${price}`,
  };
  return withPrice[language];
}
