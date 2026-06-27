import { isGenericPortionAmount, parseIngredientAmount } from "@/lib/ingredientAmounts";

const EUR_PER_KG: Array<{ pattern: RegExp; eurPerKg: number }> = [
  { pattern: /hähnchen|huhn|pute|truthahn|chicken|turkey/, eurPerKg: 11.5 },
  { pattern: /rind|beef|steak/, eurPerKg: 16 },
  { pattern: /schwein|pork|schnitzel/, eurPerKg: 9 },
  { pattern: /hack|gehackt|minced/, eurPerKg: 8.5 },
  { pattern: /lachs|fisch|forelle|salmon|fish|thunfisch|tuna/, eurPerKg: 18 },
  { pattern: /tofu|tempeh/, eurPerKg: 7 },
  { pattern: /ei|egg|eier/, eurPerKg: 3.2 },
  { pattern: /reis|rice|basmati/, eurPerKg: 2.8 },
  { pattern: /nudel|pasta|spaghetti|penne|noodle/, eurPerKg: 1.9 },
  { pattern: /kartoffel|potato|süßkartoffel/, eurPerKg: 1.5 },
  { pattern: /brot|brötchen|toast|bread/, eurPerKg: 4.5 },
  { pattern: /milch|milk/, eurPerKg: 1.2 },
  { pattern: /joghurt|yogurt|quark|skyr/, eurPerKg: 4.5 },
  { pattern: /käse|cheese|mozzarella|feta/, eurPerKg: 12 },
  { pattern: /butter|margarine/, eurPerKg: 8 },
  { pattern: /öl|olivenöl|oil|olive/, eurPerKg: 9 },
  { pattern: /banane|banana|apfel|apple|beere|berry|obst|fruit/, eurPerKg: 3.5 },
  { pattern: /tomate|tomato|gurke|cucumber|paprika|pepper|gemüse|vegetable|salat|lettuce|spinat|spinach|zucchini|möhre|carrot|zwiebel|onion|brokkoli|broccoli/, eurPerKg: 3.2 },
  { pattern: /linsen|lentil|kichererbs|chickpea|bohnen|beans/, eurPerKg: 2.6 },
  { pattern: /hafer|oat|müsli|cereal/, eurPerKg: 2.4 },
  { pattern: /nuss|nut|mandel|almond|erdnuss|peanut/, eurPerKg: 14 },
];

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

function eurPerKgForName(name: string): number {
  const n = name.toLowerCase();
  for (const row of EUR_PER_KG) {
    if (row.pattern.test(n)) return row.eurPerKg;
  }
  return 4;
}

/** Rough German supermarket cost for a line item amount. */
export function estimateIngredientPrice(name: string, amount: string): number {
  const parsed = parseIngredientAmount(amount);
  const perKg = eurPerKgForName(name);

  if (!parsed) return roundCents(perKg * 0.12);

  if (parsed.kind === "mass") {
    return roundCents((parsed.grams / 1000) * perKg);
  }
  if (parsed.kind === "volume") {
    const perL = /milch|milk|sahne|cream|kokosmilch|coconut/.test(name.toLowerCase()) ? 1.4 : 2.2;
    return roundCents((parsed.ml / 1000) * perL);
  }
  if (parsed.kind === "count") {
    if (parsed.unit === "el") return roundCents(parsed.count * 0.08);
    if (parsed.unit === "tl") return roundCents(parsed.count * 0.03);
    if (/ei|egg/.test(name.toLowerCase())) return roundCents(parsed.count * 0.25);
    if (parsed.unit === "stück") return roundCents(parsed.count * 0.35);
    if (parsed.unit === "portion") return roundCents(parsed.count * (perKg * 0.12));
    return roundCents(parsed.count * 0.5);
  }

  return roundCents(perKg * 0.12);
}

/** Use AI/meal price when plausible; otherwise estimate from amount. */
export function resolveIngredientPrice(name: string, amount: string, rawPrice: unknown): number {
  const price = Number(rawPrice);
  if (Number.isFinite(price) && price >= 0.15 && price <= 25) {
    return roundCents(price);
  }
  if (isGenericPortionAmount(amount)) {
    return estimateIngredientPrice(name, amount);
  }
  const estimated = estimateIngredientPrice(name, amount);
  if (!Number.isFinite(price) || price <= 0) return estimated;
  if (price < 0.05 || price > 40) return estimated;
  return roundCents(price);
}

export function defaultAmountForIngredient(name: string, slot: "b" | "m" | "s" = "m"): string {
  const n = name.toLowerCase();
  if (/ei|egg|eier/.test(n)) return slot === "b" ? "2 Stück" : "1 Stück";
  if (/brot|toast|brötchen|bread/.test(n)) return slot === "b" ? "2 Scheiben" : "1 Scheibe";
  if (/hähnchen|pute|tofu|lachs|fisch|hack|fleisch|chicken|salmon|beef|pork|turkey/.test(n)) {
    return slot === "m" ? "150g" : slot === "b" ? "80g" : "120g";
  }
  if (/reis|nudel|pasta|kartoffel|rice|noodle|potato/.test(n)) {
    return slot === "m" ? "150g" : "100g";
  }
  if (/milch|joghurt|quark|skyr|milk|yogurt/.test(n)) return "200ml";
  if (/öl|butter|olivenöl|oil|olive/.test(n)) return "1 EL";
  if (/banane|apfel|tomate|gemüse|salat|spinat|zucchini|möhre|zwiebel|paprika|fruit|vegetable/.test(n)) {
    return slot === "m" ? "150g" : "100g";
  }
  return slot === "m" ? "120g" : "80g";
}
