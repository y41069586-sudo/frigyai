import { getDietPools } from "./dietPools.ts";
import { buildMealFromDishTitle } from "./mealBlueprints.ts";
import { mealSlot } from "./meals.ts";
import { mealContentKey, mealDishFingerprint, mealMainIngredients, normNameKey } from "./normalize.ts";
import { filterPool } from "./validation.ts";
import type { Lang, MealLike, MealPlan, PlanInput, PriorDishSnapshot, SafetyContext } from "./types.ts";

function titleKey(name: string): string {
  const base = String(name || "").split("·")[0]?.trim() || String(name || "");
  return normNameKey(base) || base.toLowerCase().trim();
}

export function snapshotPriorMeal(meal: MealLike): PriorDishSnapshot {
  const name = String(meal?.name ?? "").trim();
  const mainIngredients = mealMainIngredients(meal);
  return {
    name,
    mainIngredients,
    contentKey: mealContentKey(meal),
    fingerprint: mealDishFingerprint(meal),
  };
}

export function parsePriorMealsFromBody(
  previousMeals: unknown,
  previousMealNames: string[],
): PriorDishSnapshot[] {
  if (Array.isArray(previousMeals)) {
    const out: PriorDishSnapshot[] = [];
    for (const raw of previousMeals) {
      if (!raw || typeof raw !== "object") continue;
      const m = raw as Record<string, unknown>;
      const name = String(m.name ?? "").trim();
      if (!name) continue;
      const ingredients = Array.isArray(m.ingredients)
        ? m.ingredients.map((i) => {
          const row = i as Record<string, unknown>;
          return { name: String(row?.name ?? "").trim() };
        }).filter((i) => i.name)
        : [];
      out.push(snapshotPriorMeal({ name, ingredients }));
    }
    if (out.length) return out.slice(0, 28);
  }
  return previousMealNames.map((name) => snapshotPriorMeal({ name, ingredients: [] }));
}

function ingredientJaccard(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = new Set(a.split("|").filter(Boolean));
  const setB = new Set(b.split("|").filter(Boolean));
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const x of setA) {
    if (setB.has(x)) inter++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union ? inter / union : 0;
}

function dishesTooSimilar(fpA: string, fpB: string): boolean {
  if (!fpA || !fpB) return false;
  if (fpA === fpB) return true;
  const j = ingredientJaccard(fpA, fpB);
  if (j >= 0.65) return true;
  const setA = new Set(fpA.split("|").filter(Boolean));
  let shared = 0;
  for (const x of fpB.split("|").filter(Boolean)) {
    if (setA.has(x)) shared++;
  }
  return shared >= 2 && j >= 0.4;
}

/** Same dish if name, content key, or ≥70% ingredient overlap with any prior meal. */
export function mealMatchesPriorDish(meal: MealLike, prior: PriorDishSnapshot[]): string | null {
  const name = String(meal?.name ?? "").toLowerCase().trim();
  const contentKey = mealContentKey(meal);
  const fingerprint = mealDishFingerprint(meal);

  for (const p of prior) {
    if (name && p.name.toLowerCase().trim() === name) return p.name;
    if (contentKey && p.contentKey && contentKey === p.contentKey) return p.name;
    if (fingerprint && p.fingerprint && fingerprint === p.fingerprint) return p.name;
    if (fingerprint && p.fingerprint && dishesTooSimilar(fingerprint, p.fingerprint)) {
      return p.name;
    }
  }
  return null;
}

export function findRegenerationOverlaps(plan: MealPlan, prior: PriorDishSnapshot[]): string[] {
  const hits: string[] = [];
  for (const day of plan) {
    for (const meal of day.meals ?? []) {
      const match = mealMatchesPriorDish(meal, prior);
      if (match) hits.push(`${meal.name} ≈ ${match}`);
    }
  }
  return hits;
}

/**
 * Fixes AI/template pattern where meal slot 1..N is identical on every weekday.
 * Replaces duplicates with unique titles from diet pools (keeps macros; finishPlan resyncs).
 */
export function ensureDistinctMealsAcrossWeek(
  plan: MealPlan,
  input: Pick<PlanInput, "mealsPerDay" | "lang" | "prefs"> & { safetyCtx: SafetyContext },
): MealPlan {
  const base = getDietPools(input.lang, input.prefs);
  const pools = {
    b: filterPool(base.b, input.safetyCtx, input.lang, "b"),
    m: filterPool(base.m, input.safetyCtx, input.lang, "m"),
    s: filterPool(base.s, input.safetyCtx, input.lang, "s"),
  };
  const cursor = { b: 0, m: 0, s: 0 };

  const pickNew = (slot: "b" | "m" | "s", used: Set<string>): string => {
    const list = pools[slot];
    for (let pass = 0; pass < list.length + 2; pass++) {
      for (let o = 0; o < Math.max(list.length, 1); o++) {
        const title = list.length ? list[(cursor[slot] + o) % list.length]! : "Gemüsepfanne";
        cursor[slot] = (cursor[slot] + o + 1) % Math.max(list.length, 1);
        const key = titleKey(title);
        if (!used.has(key)) {
          used.add(key);
          return title;
        }
      }
    }
    const idx = used.size % Math.max(list.length, 1);
    const fallback = list.length ? list[idx]! : (slot === "m" ? "Gemüsepfanne mit Reis" : slot === "b" ? "Haferflocken mit Beeren" : "Obst mit Joghurt");
    used.add(titleKey(fallback));
    return fallback;
  };

  const out = plan.map((day) => ({
    ...day,
    meals: [...(day.meals ?? [])],
  }));

  for (let si = 0; si < input.mealsPerDay; si++) {
    const slot = mealSlot(si, input.mealsPerDay);
    const usedInSlot = new Set<string>();
    for (let di = 0; di < out.length; di++) {
      const meals = out[di]?.meals;
      if (!meals?.[si]) continue;
      const meal = meals[si]!;
      let key = titleKey(String(meal.name || ""));
      if (usedInSlot.has(key)) {
        const newTitle = pickNew(slot, usedInSlot);
        console.warn(`[MEAL-PLAN] Replaced repeated "${meal.name}" on ${out[di]?.day} slot ${si} → ${newTitle}`);
        meals[si] = buildMealFromDishTitle(newTitle, slot, input.lang, input.safetyCtx);
        key = titleKey(newTitle);
      }
      usedInSlot.add(key);
    }
  }

  return out;
}

export function formatPriorDishesForPrompt(prior: PriorDishSnapshot[], mealsPerDay: number): string {
  if (!prior.length) return "";
  const lines = prior.slice(0, 20).map((p) => {
    const ings = p.mainIngredients.length
      ? p.mainIngredients.slice(0, 6).join(", ")
      : "(see title)";
    return `- ${p.name} [${ings}]`;
  });
  return [
    "OLD WEEK — forbidden (do NOT reuse, reshuffle to other days, or rename):",
    ...lines,
    `Create ${7 * mealsPerDay} completely NEW recipes.`,
    "Do NOT move old meals to different weekdays. Do NOT use the same main ingredients with a new title.",
    "Each meal needs a new cooking style, new primary protein, and mostly new ingredients.",
  ].join("\n");
}
