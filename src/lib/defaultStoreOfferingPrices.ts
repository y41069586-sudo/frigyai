import type { StoreOfferingPrices } from "@/lib/storeBilling";

/** Fixed paywall display prices — checkout still uses live App Store / Play prices. */
export const DEFAULT_STORE_OFFERING_PRICES: StoreOfferingPrices = {
  monthly: {
    priceString: "9,99 €",
    price: 9.99,
    currencyCode: "EUR",
    hasIntroOffer: true,
  },
  yearly: {
    priceString: "36,95 €",
    price: 36.95,
    currencyCode: "EUR",
    hasIntroOffer: false,
  },
  yearlyPromo: {
    priceString: "25,87 €",
    price: 25.87,
    currencyCode: "EUR",
    hasIntroOffer: false,
  },
};
