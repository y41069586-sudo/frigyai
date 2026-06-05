import type { Language } from "@/contexts/LanguageContext";

/** Marketing prices — must match App Store Connect / Play Console. */
export const SUBSCRIPTION_PRICING = {
  monthlyEur: 9.99,
  yearlyEur: 36.95,
  trialDays: 3,
} as const;

const MONTHLY_DISPLAY: Record<Language, string> = {
  de: "€9,99",
  en: "€9.99",
  fr: "9,99 €",
};

const YEARLY_DISPLAY: Record<Language, string> = {
  de: "€36,95",
  en: "€36.95",
  fr: "36,95 €",
};

export function getMarketingMonthlyPrice(language: Language): string {
  return MONTHLY_DISPLAY[language] ?? MONTHLY_DISPLAY.de;
}

export function getMarketingYearlyPrice(language: Language): string {
  return YEARLY_DISPLAY[language] ?? YEARLY_DISPLAY.de;
}

/** Prefer localized store price; fallback to marketing €9,99 / €36,95. */
export function resolveMonthlyDisplayPrice(
  language: Language,
  storePriceString?: string | null,
): string {
  return storePriceString?.trim() || getMarketingMonthlyPrice(language);
}

export function resolveYearlyDisplayPrice(
  language: Language,
  storePriceString?: string | null,
): string {
  return storePriceString?.trim() || getMarketingYearlyPrice(language);
}
