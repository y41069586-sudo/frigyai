import { normalizeIngredientAmount, resolveIngredientPrice } from "./ingredientDefaults.ts";

const UNIT_ONLY =
  /^(g|kg|mg|ml|l|cl|dl|el|tl|stück|st\.?|portion|port\.?|kcal|cal|min|mins?|minuten|std\.?|x)$/i;

const AMOUNT_ONLY =
  /^[\d.,]+\s*(g|kg|mg|ml|l|cl|dl|kcal|cal|%|°c|°f|x)?$/i;

const COMBINED_LINE =
  /^([\d.,]+\s*(?:g|kg|mg|ml|l|cl|dl|EL|TL|Stück|St\.?|Portion|Port\.?|x)?)\s+(.+)$/i;

export function isInvalidIngredientName(name: string): boolean {
  const t = name.trim();
  if (!t) return true;
  if (/^[\d.,]+$/.test(t)) return true;
  if (AMOUNT_ONLY.test(t)) return true;
  if (UNIT_ONLY.test(t)) return true;
  if (t.length <= 2 && /^[\d.,]/.test(t)) return true;
  return false;
}

export function isInvalidIngredientToken(part: string): boolean {
  return isInvalidIngredientName(part);
}

function parseCombinedLine(raw: string): { name: string; amount: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(COMBINED_LINE);
  if (match) {
    return { amount: match[1].trim(), name: match[2].trim() };
  }
  return { name: trimmed, amount: "1 Portion" };
}

export function sanitizeIngredient(raw: {
  name?: string;
  amount?: string;
  price?: number;
}, slot: "b" | "m" | "s" = "m"): { name: string; amount: string; price: number } | null {
  let name = String(raw.name ?? "").trim();
  let amount = String(raw.amount ?? "").trim();
  if (!name && amount) {
    name = amount;
    amount = "";
  }

  const combined = parseCombinedLine(name);
  if (combined.name !== name) {
    name = combined.name;
    if (!amount || isInvalidIngredientName(amount)) {
      amount = combined.amount;
    }
  }

  if (isInvalidIngredientName(name) && !isInvalidIngredientName(amount)) {
    name = amount;
    amount = "";
  }

  if (isInvalidIngredientName(name)) return null;

  amount = normalizeIngredientAmount(name, amount || "—", slot);
  const price = resolveIngredientPrice(name, amount, raw.price);

  return { name, amount, price };
}
