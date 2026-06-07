import { isGenericPortionAmount, parseIngredientAmount } from "./shoppingAggregate.ts";

const EUR_PER_KG: Array<{ pattern: RegExp; eurPerKg: number }> = [
  { pattern: /hähnchen|huhn|pute|chicken|turkey/, eurPerKg: 11.5 },
  { pattern: /rind|beef|steak/, eurPerKg: 16 },
  { pattern: /schwein|pork|schnitzel/, eurPerKg: 9 },
  { pattern: /hack|gehackt/, eurPerKg: 8.5 },
  { pattern: /lachs|fisch|salmon|fish|thunfisch/, eurPerKg: 18 },
  { pattern: /tofu|tempeh/, eurPerKg: 7 },
  { pattern: /ei|eier|egg/, eurPerKg: 3.2 },
  { pattern: /reis|rice|basmati/, eurPerKg: 2.8 },
  { pattern: /nudel|pasta|spaghetti|penne/, eurPerKg: 1.9 },
  { pattern: /kartoffel|potato/, eurPerKg: 1.5 },
  { pattern: /milch|milk|joghurt|quark/, eurPerKg: 4 },
  { pattern: /käse|cheese|mozzarella|feta/, eurPerKg: 12 },
  { pattern: /gemüse|vegetable|salat|spinat|tomate|zwiebel|paprika|banane|apfel/, eurPerKg: 3.2 },
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

export function estimateIngredientPrice(name: string, amount: string): number {
  const parsed = parseIngredientAmount(amount);
  const perKg = eurPerKgForName(name);
  if (!parsed) return roundCents(perKg * 0.12);
  if (parsed.kind === "mass") return roundCents((parsed.grams / 1000) * perKg);
  if (parsed.kind === "volume") {
    const perL = /milch|sahne|kokosmilch/.test(name.toLowerCase()) ? 1.4 : 2.2;
    return roundCents((parsed.ml / 1000) * perL);
  }
  if (parsed.kind === "count") {
    if (parsed.unit === "el") return roundCents(parsed.count * 0.08);
    if (parsed.unit === "tl") return roundCents(parsed.count * 0.03);
    if (/ei|egg/.test(name.toLowerCase())) return roundCents(parsed.count * 0.25);
    if (parsed.unit === "stück") return roundCents(parsed.count * 0.35);
    return roundCents(parsed.count * (perKg * 0.12));
  }
  return roundCents(perKg * 0.12);
}

export function resolveIngredientPrice(name: string, amount: string, rawPrice: unknown): number {
  const price = Number(rawPrice);
  if (Number.isFinite(price) && price >= 0.15 && price <= 25) return roundCents(price);
  return estimateIngredientPrice(name, amount);
}

export function defaultAmountForIngredient(name: string, slot: "b" | "m" | "s" = "m"): string {
  const n = name.toLowerCase();
  if (/ei|eier|egg/.test(n)) return slot === "b" ? "2 Stück" : "1 Stück";
  if (/brot|toast|brötchen/.test(n)) return slot === "b" ? "2 Scheiben" : "1 Scheibe";
  if (/hähnchen|pute|tofu|lachs|fisch|hack|fleisch|chicken|salmon/.test(n)) {
    return slot === "m" ? "150g" : slot === "b" ? "80g" : "120g";
  }
  if (/reis|nudel|pasta|kartoffel|rice/.test(n)) return slot === "m" ? "150g" : "100g";
  if (/milch|joghurt|quark|milk/.test(n)) return "200ml";
  if (/öl|butter|olivenöl|oil/.test(n)) return "1 EL";
  if (/banane|apfel|tomate|gemüse|salat|spinat|zucchini|möhre|zwiebel|paprika/.test(n)) {
    return slot === "m" ? "150g" : "100g";
  }
  return slot === "m" ? "120g" : "80g";
}

export function normalizeIngredientAmount(name: string, amount: string, slot: "b" | "m" | "s" = "m"): string {
  if (isGenericPortionAmount(amount)) {
    return defaultAmountForIngredient(name, slot);
  }
  return amount.trim() || defaultAmountForIngredient(name, slot);
}
