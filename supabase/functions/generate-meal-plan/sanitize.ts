import { buildMealFromDishTitle } from "./mealBlueprints.ts";
import { mealSlot } from "./meals.ts";
import { filterPool, isMealSafe, SAFE_POOL_DEFAULTS } from "./validation.ts";
import type { Lang, MealPlan, SafetyContext } from "./types.ts";

/** In-place: fix unsafe meals — keep name when possible; pool names only as last resort. */
export function sanitizeUnsafeMeals(plan: MealPlan, ctx: SafetyContext, lang: Lang): void {
  let poolPick = 0;
  for (const day of plan) {
    const meals = day.meals;
    if (!Array.isArray(meals)) continue;
    for (let si = 0; si < meals.length; si++) {
      const meal = meals[si];
      if (!meal || isMealSafe(meal, ctx)) continue;
      const slot = mealSlot(si, meals.length);

      const fixed = buildMealFromDishTitle(String(meal.name || "Gericht"), slot, lang, ctx);
      if (isMealSafe(fixed, ctx)) {
        meals[si] = fixed;
        continue;
      }

      const pool = filterPool(SAFE_POOL_DEFAULTS[lang][slot], ctx, lang, slot);
      const name = pool[poolPick++ % pool.length] ?? pool[0] ?? "Gemüse Bowl";
      meals[si] = buildMealFromDishTitle(name, slot, lang, ctx);
    }
  }
}
