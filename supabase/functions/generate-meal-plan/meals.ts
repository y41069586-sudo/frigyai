import { LANG } from "./constants.ts";
import { normNameKey } from "./normalize.ts";
import { normalizeMealStructure, syncDay, syncPlan } from "./macros.ts";
import type { Lang, MacroTargets, MealPlan } from "./types.ts";

export function mealSlot(si: number, mpd: number): "b" | "m" | "s" {
  if (si === 0) return "b";
  const mains = mpd >= 4 ? [1, 3] : [1];
  return mains.includes(si) ? "m" : "s";
}

export function shapeWeek(plan: MealPlan, mealsPerDay: number, lang: Lang): MealPlan | null {
  if (!Array.isArray(plan) || plan.length < 7) return null;
  const L = LANG[lang];
  return plan.slice(0, 7).map((d, i) => {
    let meals = Array.isArray(d.meals) ? d.meals.slice(0, mealsPerDay).map(normalizeMealStructure) : [];
    while (meals.length < mealsPerDay) {
      meals.push(
        normalizeMealStructure({
          name: `${L.meal} ${meals.length + 1}`,
          type: L.meal,
          protein: 0,
          carbs: 0,
          fat: 0,
          prepTime: 15,
          ingredients: [{ name: "Gemüse", amount: "1 Portion", price: 1 }],
          instructions: [],
          allergenTags: ["none"],
        }),
      );
    }
    return { day: String(d.day || L.days[i]).trim(), meals };
  });
}

export function uniqueNames(plan: MealPlan): MealPlan {
  const seen = new Map<string, number>();
  return plan.map((day) => {
    const meals = (day.meals || []).map((meal) => {
      const base = String(meal.name || "Gericht").trim() || "Gericht";
      const key = normNameKey(base);
      const n = seen.get(key) ?? 0;
      seen.set(key, n + 1);
      if (n === 0) return meal;
      const name = `${base} (${n + 1})`;
      return name === meal.name ? meal : { ...meal, name };
    });
    return { ...day, meals };
  });
}

/** Sync macros for a single day (e.g. balance adjustment). */
export function finishSingleDay(
  day: { day: string; meals: ReturnType<typeof normalizeMealStructure>[] },
  targets: MacroTargets,
  mealsPerDay: number,
  lang: Lang,
  dayIndex: number,
): { day: string; meals: ReturnType<typeof normalizeMealStructure>[] } {
  const L = LANG[lang];
  let meals = Array.isArray(day.meals) ? day.meals.slice(0, mealsPerDay).map(normalizeMealStructure) : [];
  while (meals.length < mealsPerDay) {
    meals.push(
      normalizeMealStructure({
        name: `${L.meal} ${meals.length + 1}`,
        type: L.meal,
        protein: 0,
        carbs: 0,
        fat: 0,
        prepTime: 15,
        ingredients: [{ name: "Gemüse", amount: "1 Portion", price: 1 }],
        instructions: [],
        allergenTags: ["none"],
      }),
    );
  }
  const shaped = { day: String(day.day || L.days[dayIndex] || day.day).trim(), meals };
  return syncDay(shaped, targets, mealsPerDay, dayIndex);
}

/** One macro pipeline for AI, fallback, and sanitized plans. */
export function finishPlan(
  plan: MealPlan,
  targets: MacroTargets,
  mealsPerDay: number,
  lang: Lang,
): MealPlan | null {
  const shaped = shapeWeek(plan, mealsPerDay, lang);
  if (!shaped) return null;
  const synced = syncPlan(shaped, targets, mealsPerDay);
  return uniqueNames(synced);
}
