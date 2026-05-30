import { normalizeMealStructure } from "../macros.ts";
import { mealSlot } from "../meals.ts";
import {
  filterPool,
  isMealSafe,
  SAFE_POOL_DEFAULTS,
} from "../validation.ts";
import type { Lang, Meal, MealPlan, SafetyContext } from "../types.ts";

function slotTypeLabel(lang: Lang, slot: "b" | "m" | "s"): string {
  if (lang === "en") {
    return slot === "b" ? "Breakfast" : slot === "m" ? "Main meal" : "Snack";
  }
  if (lang === "fr") {
    return slot === "b" ? "Petit-dejeuner" : slot === "m" ? "Repas principal" : "Collation";
  }
  return slot === "b" ? "Frühstück" : slot === "m" ? "Hauptmahlzeit" : "Snack";
}

function safeReplacementMeal(
  ctx: SafetyContext,
  lang: Lang,
  slot: "b" | "m" | "s",
  pickIndex: number,
): Meal {
  const pool = filterPool(SAFE_POOL_DEFAULTS[lang][slot], ctx, lang, slot);
  const name = pool[pickIndex % pool.length] ?? pool[0] ?? "Gemüse Bowl";
  return normalizeMealStructure({
    type: slotTypeLabel(lang, slot),
    name,
    prepTime: slot === "m" ? 22 : 12,
    ingredients: [
      {
        name: lang === "de" ? "Gemüse" : lang === "fr" ? "Legumes" : "Vegetables",
        amount: "1 Portion",
        price: 1,
      },
      {
        name: lang === "de" ? "Olivenöl" : lang === "fr" ? "Huile d olive" : "Olive oil",
        amount: "1 EL",
        price: 0.5,
      },
    ],
    instructions: [],
    allergenTags: ["none"],
  });
}

/** In-place: swap meals that fail allergy/diet checks with safe pool picks. */
export function sanitizeUnsafeMeals(plan: MealPlan, ctx: SafetyContext, lang: Lang): void {
  let pick = 0;
  for (const day of plan) {
    const meals = day.meals;
    if (!Array.isArray(meals)) continue;
    for (let si = 0; si < meals.length; si++) {
      const meal = meals[si];
      if (!meal || isMealSafe(meal, ctx)) continue;
      const slot = mealSlot(si, meals.length);
      meals[si] = safeReplacementMeal(ctx, lang, slot, pick++);
    }
  }
}
