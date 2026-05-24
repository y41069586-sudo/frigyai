/**
 * Einkaufsliste = Lücke: alle Rezeptzutaten minus Kühlschrank (Input).
 * Namen werden normalisiert und per Teilstring gematcht (DE/EN grob).
 */

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

/** Prüft ob eine Rezeptzutat durch den Kühlschrank abgedeckt ist */
export function fridgeCoversIngredient(ingredientName: string, fridgeIngredients: string[]): boolean {
  const n = normalizeIngredientKey(ingredientName);
  if (!n) return false;

  for (const raw of fridgeIngredients) {
    const f = normalizeIngredientKey(raw);
    if (!f) continue;
    if (n === f) return true;
    if (n.includes(f) || f.includes(n)) return true;

    const ftoks = tokenize(raw);
    const itoks = tokenize(ingredientName);
    for (const t of ftoks) {
      if (t.length >= 3 && (n.includes(t) || itoks.includes(t))) return true;
    }
  }
  return false;
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

/** Sammelt alle Zutaten aus dem Plan, zieht Kühlschrank ab, aggregiert Duplikate */
export function buildGapShoppingList(
  mealPlan: DayPlanLike[],
  fridgeIngredients: string[],
): GapListItem[] {
  const map = new Map<string, { name: string; amounts: string[]; price: number }>();

  for (const day of mealPlan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        if (fridgeCoversIngredient(ing.name, fridgeIngredients)) continue;

        const key = normalizeIngredientKey(ing.name);
        if (!key) continue;

        const price = typeof ing.price === "number" ? ing.price : Number(ing.price) || 0;
        const amount = String(ing.amount || "").trim() || "—";

        if (map.has(key)) {
          const ex = map.get(key)!;
          ex.amounts.push(amount);
          ex.price += price;
        } else {
          map.set(key, {
            name: ing.name.trim(),
            amounts: [amount],
            price,
          });
        }
      }
    }
  }

  return Array.from(map.values()).map((v) => ({
    name: v.name,
    amount: [...new Set(v.amounts)].join(" · "),
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
        const p = typeof ing.price === "number" ? ing.price : Number(ing.price) || 0;
        saved += p;
      }
    }
  }

  const gapTotal = gapList.reduce((s, g) => s + g.price, 0);
  const allTotal = saved + gapTotal;
  const eurosSaved = allTotal > 0 ? Math.round(saved * 10) / 10 : 0;

  return { percentHave, eurosSaved };
}
