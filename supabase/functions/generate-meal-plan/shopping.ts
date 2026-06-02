import { normKey } from "./normalize.ts";
import type { MealPlan, ScanMeta, ShoppingItem } from "./types.ts";

export function fridgeHas(name: string, fridge: string[]) {
  const n = normKey(name);
  if (!n) return false;
  return fridge.some((f) => {
    const k = normKey(f);
    if (!k) return false;
    if (n === k) return true;
    if (n.length >= 3 && k.length >= 3 && (n.includes(k) || k.includes(n))) return true;
    return false;
  });
}

export function shoppingList(plan: MealPlan, fridge: string[]): ShoppingItem[] {
  const map = new Map<string, { name: string; amounts: string[]; price: number }>();
  for (const day of plan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name || fridgeHas(ing.name, fridge)) continue;
        const key = normKey(ing.name);
        const ex = map.get(key);
        const amount = String(ing.amount || "—");
        const price = Number(ing.price) || 0;
        if (ex) {
          ex.amounts.push(amount);
          ex.price += price;
        } else map.set(key, { name: ing.name, amounts: [amount], price });
      }
    }
  }
  return Array.from(map.values()).map((v) => ({
    name: v.name,
    amount: [...new Set(v.amounts)].join(" · "),
    price: Math.round(v.price * 100) / 100,
  }));
}

export function scanMeta(plan: MealPlan, fridge: string[], list: ShoppingItem[]): ScanMeta {
  const recipe = new Set<string>();
  let covered = 0;
  for (const day of plan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        const k = normKey(ing.name);
        recipe.add(k);
        if (fridgeHas(ing.name, fridge)) covered++;
      }
    }
  }
  const pct = recipe.size ? Math.round((covered / recipe.size) * 100) : 0;
  const gap = list.reduce((s, i) => s + (i.price || 0), 0);
  return { percentIngredientsFromFridge: pct, estimatedEurosSaved: gap > 0 ? Math.round(gap * 0.3 * 10) / 10 : 0 };
}
