import { mealContentKey, mealDishFingerprint, mealMainIngredients } from "./normalize.ts";
import type { MealLike, MealPlan } from "./types.ts";
import type { PriorDishSnapshot } from "./types.ts";

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
    if (out.length) return out.slice(0, 56);
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

export function formatPriorDishesForPrompt(prior: PriorDishSnapshot[], mealsPerDay: number): string {
  if (!prior.length) return "";
  const lines = prior.slice(0, 40).map((p) => {
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
