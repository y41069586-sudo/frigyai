import { enrichPoolsForMealPlanPrefs, getDietPools } from "./dietPools.ts";
import { buildMealFromDishTitle } from "./mealBlueprints.ts";
import {
  dishCalorieTier,
  dishFitsDailyBudget,
  mealCaloriesUnrealisticForDish,
  mealsViolateDishRealism,
} from "./mealCalorieHints.ts";
import type { MealPlanPrefsInput } from "./mealPlanPrefs.ts";
import { mealSlot } from "./meals.ts";
import { normNameKey } from "./normalize.ts";
import { seededShuffle } from "./shuffle.ts";
import { filterPool } from "./validation.ts";
import type { Lang, MealPlan, MacroTargets, SafetyContext } from "./types.ts";

const LIGHT_BREAKFAST_DE = [
  "Haferflocken mit Beeren",
  "Joghurt mit Banane",
  "Obst mit Quark",
  "Vollkornbrot mit Käse",
];
const LIGHT_MAIN_DE = [
  "Gemüsesuppe mit Brot",
  "Salat mit Hähnchen",
  "Reis mit Gemüse",
  "Omelett mit Salat",
  "Linsensuppe",
  "Thunfisch Salat",
];
const LIGHT_SNACK_DE = ["Apfel mit Nüssen", "Quark mit Beeren", "Obst mit Joghurt", "Gemüsesticks"];

function lightAlternatives(slot: "b" | "m" | "s", lang: Lang): string[] {
  if (lang === "de") {
    if (slot === "b") return LIGHT_BREAKFAST_DE;
    if (slot === "m") return LIGHT_MAIN_DE;
    return LIGHT_SNACK_DE;
  }
  if (slot === "b") return ["Oatmeal berries", "Yogurt banana", "Fruit yogurt", "Toast cheese"];
  if (slot === "m") return ["Vegetable soup", "Chicken salad", "Rice vegetables", "Egg salad", "Lentil soup"];
  return ["Apple nuts", "Yogurt berries", "Fruit mix", "Veg sticks"];
}

function pickReplacementTitle(
  slot: "b" | "m" | "s",
  lang: Lang,
  prefs: string[],
  ctx: SafetyContext,
  mealPlanPrefs: MealPlanPrefsInput | undefined,
  seed: string,
  dayIndex: number,
  slotIndex: number,
  used: Set<string>,
  dailyCalories: number,
  mealsPerDay: number,
): string {
  const pools = enrichPoolsForMealPlanPrefs(getDietPools(lang, prefs), lang, mealPlanPrefs);
  const filtered = filterPool(pools[slot], ctx, lang, slot).filter((title) =>
    dishFitsDailyBudget(title, "", dailyCalories, mealsPerDay),
  );
  const candidates = [
    ...seededShuffle(filtered, `${seed}-${slot}-${dayIndex}`),
    ...lightAlternatives(slot, lang),
  ];

  for (let pass = 0; pass < candidates.length + 2; pass++) {
    for (let i = 0; i < candidates.length; i++) {
      const title = candidates[(i + dayIndex + slotIndex + pass) % candidates.length]!;
      const key = normNameKey(title);
      if (!used.has(key) && dishFitsDailyBudget(title, "", dailyCalories, mealsPerDay)) {
        used.add(key);
        return title;
      }
    }
  }

  const fallback = lightAlternatives(slot, lang)[0] ?? "Gemüsepfanne";
  used.add(normNameKey(fallback));
  return fallback;
}

/** Swap dish titles that cannot realistically match their calorie budget (e.g. Wrap at 100 kcal). */
export function swapUnrealisticDishNames(
  plan: MealPlan,
  targets: MacroTargets,
  mealsPerDay: number,
  lang: Lang,
  prefs: string[],
  safetyCtx: SafetyContext,
  varietySeed: string,
  mealPlanPrefs?: MealPlanPrefsInput,
): MealPlan {
  const dailyCalories = Math.max(1, Math.round(targets.dailyCalories || 0));
  const used = new Set<string>();

  return plan.map((day, dayIndex) => ({
    ...day,
    meals: (day.meals ?? []).map((meal, slotIndex) => {
      const slot = mealSlot(slotIndex, mealsPerDay);
      const key = normNameKey(meal.name);
      if (key) used.add(key);

      const unrealistic =
        !dishFitsDailyBudget(meal.name, meal.type, dailyCalories, mealsPerDay) ||
        (meal.calories > 0 && mealCaloriesUnrealisticForDish(meal, dailyCalories, mealsPerDay));

      if (!unrealistic) return meal;

      const tier = dishCalorieTier(meal.name, meal.type);
      if (tier !== "heavy" && tier !== "main" && meal.calories > 0) {
        return meal;
      }

      const replacement = pickReplacementTitle(
        slot,
        lang,
        prefs,
        safetyCtx,
        mealPlanPrefs,
        varietySeed,
        dayIndex,
        slotIndex,
        used,
        dailyCalories,
        mealsPerDay,
      );

      console.warn(
        `[MEAL-PLAN] Unrealistic dish "${meal.name}" (${meal.calories} kcal @ ${dailyCalories} kcal/day) → ${replacement}`,
      );

      const rebuilt = buildMealFromDishTitle(replacement, slot, lang, safetyCtx);
      return {
        ...meal,
        name: replacement,
        type: rebuilt.type,
        ingredients: rebuilt.ingredients,
        instructions: rebuilt.instructions,
        allergenTags: rebuilt.allergenTags,
        prepTime: rebuilt.prepTime,
        protein: 0,
        carbs: 0,
        fat: 0,
        calories: 0,
      };
    }),
  }));
}

export { mealsViolateDishRealism };
