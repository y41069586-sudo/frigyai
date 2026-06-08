import { aggregateAmountStrings, isGenericPortionAmount } from "@/lib/ingredientAmounts";
import {
  defaultAmountForIngredient,
  resolveIngredientPrice,
} from "@/lib/ingredientPricing";
import type { ShoppingListEntry } from "@/lib/shoppingListNormalize";
import {
  formatShoppingListAmount,
  isInvalidShoppingItemName,
  parseCombinedIngredientLine,
} from "@/lib/shoppingListNormalize";

function normalizeAmount(raw: string | undefined | null): string {
  const t = String(raw ?? "").trim();
  return t || "—";
}

/** Coerce meal-plan / storage shapes into a clean shopping row; null = drop. */
export function normalizeShoppingEntry(
  raw: unknown,
  _defaultName = "Zutat",
): ShoppingListEntry | null {
  if (typeof raw === "string") {
    const parsed = parseCombinedIngredientLine(raw);
    if (isInvalidShoppingItemName(parsed.name)) return null;
    const amount = isGenericPortionAmount(parsed.amount)
      ? defaultAmountForIngredient(parsed.name)
      : parsed.amount;
    return {
      name: parsed.name,
      amount,
      price: resolveIngredientPrice(parsed.name, amount, null),
    };
  }

  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  let name = String(obj.name ?? "").trim();
  let amount = normalizeAmount(obj.amount as string | undefined);
  const rawPrice = obj.price;

  if (!name && amount !== "—") {
    name = amount;
    amount = "—";
  }

  const combined = parseCombinedIngredientLine(name);
  if (combined.name !== name) {
    name = combined.name;
    amount =
      amount !== "—" && !isGenericPortionAmount(amount)
        ? amount
        : combined.amount;
  }

  if (isInvalidShoppingItemName(name) && !isInvalidShoppingItemName(amount)) {
    return {
      name: amount,
      amount: isGenericPortionAmount(name) ? defaultAmountForIngredient(amount) : name,
      price: resolveIngredientPrice(amount, name, rawPrice),
    };
  }

  if (isInvalidShoppingItemName(name)) {
    return null;
  }

  if (isGenericPortionAmount(amount)) {
    amount = defaultAmountForIngredient(name);
  } else if (amount !== "—" && /^[\d.,]+$/.test(amount.trim())) {
    amount = formatShoppingListAmount(name, amount);
  }

  return {
    name,
    amount,
    price: resolveIngredientPrice(name, amount, rawPrice),
  };
}

export function normalizeShoppingListItems(
  value: unknown,
  defaultName = "Zutat",
): ShoppingListEntry[] {
  if (!Array.isArray(value)) return [];

  const map = new Map<string, { name: string; amounts: string[]; price: number }>();

  for (const item of value) {
    const normalized = normalizeShoppingEntry(item, defaultName);
    if (!normalized) continue;

    const key = normalized.name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.amounts.push(normalized.amount);
      existing.price += normalized.price;
    } else {
      map.set(key, {
        name: normalized.name,
        amounts: [normalized.amount],
        price: normalized.price,
      });
    }
  }

  return Array.from(map.values()).map((v) => ({
    name: v.name,
    amount: formatShoppingListAmount(v.name, aggregateAmountStrings(v.amounts)),
    price: Math.round(v.price * 100) / 100,
  }));
}
