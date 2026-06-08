/**
 * Einkaufsliste = Lücke: alle Rezeptzutaten minus Kühlschrank (Input).
 * Mengen werden über die Woche summiert (200g + 150g → 350g).
 */

import { canonicalizeIngredientLabel } from "@/lib/ingredientLabels";
import { aggregateAmountStrings, isGenericPortionAmount } from "@/lib/ingredientAmounts";
import {
  defaultAmountForIngredient,
  estimateIngredientPrice,
  resolveIngredientPrice,
} from "@/lib/ingredientPricing";
import {
  formatShoppingListAmount,
  isInvalidShoppingItemName,
  parseCombinedIngredientLine,
} from "@/lib/shoppingListNormalize";

export function normalizeIngredientKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9äöüß\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(name: string): string[] {
  return normalizeIngredientKey(name)
    .split(" ")
    .map((t) =>
      t
        .replace(/(chen|lein)$/i, "")
        .replace(/(en|er|e|n|s)$/i, "")
        .trim(),
    )
    .filter((t) => t.length >= 3);
}

export function ingredientMatchKey(name: string): string {
  return normalizeIngredientKey(canonicalizeIngredientLabel(name));
}

export function readFridgeIngredientsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem("lastFridgeIngredientList");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

/** Prüft ob eine Rezeptzutat durch den Kühlschrank abgedeckt ist */
export function fridgeCoversIngredient(ingredientName: string, fridgeIngredients: string[]): boolean {
  const n = ingredientMatchKey(ingredientName);
  if (!n) return false;

  for (const raw of fridgeIngredients) {
    const f = ingredientMatchKey(raw);
    if (!f) continue;
    if (n === f) return true;
    if (n.length >= 3 && f.length >= 3 && (n.includes(f) || f.includes(n))) return true;

    const ftoks = tokenize(raw);
    const itoks = tokenize(ingredientName);
    for (const t of ftoks) {
      if (t.length >= 3 && (n.includes(t) || itoks.includes(t))) return true;
    }
  }
  return false;
}

/** Plan-Zutaten in „vorhanden“ (im Kühlschrank) vs. „fehlend“ — jeweils exclusiv. */
export function splitIngredientsByFridgeCoverage(
  mealPlan: DayPlanLike[],
  fridgeIngredients: string[],
): { present: string[]; missing: GapListItem[] } {
  const all = buildGapShoppingList(mealPlan, []);
  const missing = buildGapShoppingList(mealPlan, fridgeIngredients);
  const missingKeys = new Set(missing.map((m) => ingredientMatchKey(m.name)));

  const present: string[] = [];
  const seenPresent = new Set<string>();

  for (const item of all) {
    const key = ingredientMatchKey(item.name);
    if (missingKeys.has(key)) continue;
    const label = canonicalizeIngredientLabel(item.name);
    const labelKey = ingredientMatchKey(label);
    if (seenPresent.has(labelKey)) continue;
    seenPresent.add(labelKey);
    present.push(label);
  }

  return { present, missing };
}

export interface GapListItem {
  name: string;
  amount: string;
  price: number;
}

export interface MealLike {
  ingredients?: { name: string; amount?: string; price?: number }[];
}

export interface DayPlanLike {
  meals?: MealLike[];
}

function coercePlanIngredient(raw: unknown): { name: string; amount: string; price: number } | null {
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
  let amount = String(obj.amount ?? "").trim();
  const rawPrice = obj.price;

  if (!name && amount) {
    name = amount;
    amount = "";
  }

  const combined = parseCombinedIngredientLine(name);
  if (combined.name !== name) {
    name = combined.name;
    if (!amount || isGenericPortionAmount(amount)) amount = combined.amount;
  }

  if (isInvalidShoppingItemName(name) && !isInvalidShoppingItemName(amount)) {
    name = amount;
    amount = "";
  }

  if (isInvalidShoppingItemName(name)) return null;

  if (isGenericPortionAmount(amount) || !amount) {
    amount = defaultAmountForIngredient(name);
  } else if (/^[\d.,]+$/.test(amount.trim())) {
    amount = formatShoppingListAmount(name, amount);
  }

  return {
    name,
    amount,
    price: resolveIngredientPrice(name, amount, rawPrice),
  };
}

/** Sammelt alle Zutaten aus dem Plan, zieht Kühlschrank ab, aggregiert Duplikate */
export function buildGapShoppingList(
  mealPlan: DayPlanLike[],
  fridgeIngredients: string[],
): GapListItem[] {
  const map = new Map<string, { name: string; amounts: string[]; price: number }>();

  for (const day of mealPlan) {
    for (const meal of day.meals || []) {
      for (const raw of meal.ingredients || []) {
        const ing = coercePlanIngredient(raw);
        if (!ing) continue;
        if (fridgeCoversIngredient(ing.name, fridgeIngredients)) continue;

        const key = normalizeIngredientKey(ing.name);
        if (!key) continue;

        if (map.has(key)) {
          const ex = map.get(key)!;
          ex.amounts.push(ing.amount);
          ex.price += ing.price;
        } else {
          map.set(key, {
            name: ing.name.trim(),
            amounts: [ing.amount],
            price: ing.price,
          });
        }
      }
    }
  }

  return Array.from(map.values()).map((v) => ({
    name: v.name,
    amount: formatShoppingListAmount(v.name, aggregateAmountStrings(v.amounts)),
    price: Math.round(v.price * 100) / 100,
  }));
}

export { reconcileMealPlanMacros, syncMealPlanToTargets } from "@/lib/mealPlanMacros";

export function computeFridgeScanStats(
  mealPlan: DayPlanLike[],
  fridgeIngredients: string[],
  gapList: GapListItem[],
): { percentHave: number; eurosSaved: number } {
  const uniqueRecipe = new Set<string>();
  const covered = new Set<string>();

  for (const day of mealPlan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        const key = normalizeIngredientKey(ing.name);
        if (!key) continue;
        uniqueRecipe.add(key);
        if (fridgeCoversIngredient(ing.name, fridgeIngredients)) {
          covered.add(key);
        }
      }
    }
  }

  const percentHave =
    uniqueRecipe.size === 0 ? 0 : Math.round((covered.size / uniqueRecipe.size) * 100);

  let saved = 0;
  for (const day of mealPlan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        if (!fridgeCoversIngredient(ing.name, fridgeIngredients)) continue;
        const amount = isGenericPortionAmount(String(ing.amount ?? ""))
          ? defaultAmountForIngredient(ing.name)
          : String(ing.amount ?? defaultAmountForIngredient(ing.name));
        saved += resolveIngredientPrice(ing.name, amount, ing.price);
      }
    }
  }

  const gapTotal = gapList.reduce((s, g) => s + g.price, 0);
  const allTotal = saved + gapTotal;
  const eurosSaved = allTotal > 0 ? Math.round(saved * 10) / 10 : 0;

  return { percentHave, eurosSaved };
}

export { estimateIngredientPrice };
