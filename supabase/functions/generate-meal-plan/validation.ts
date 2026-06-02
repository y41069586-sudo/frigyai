import {
  activeUserAllergyIds,
  classifyPresentAllergens,
  mealAllergenTags,
} from "./allergens.ts";
import { detectDietViolations } from "./diets.ts";
import { mealContainsPork } from "./porkBan.ts";
import { getMealNorm, termMatches } from "./normalize.ts";
import type { Lang, MealLike, MealPlan, MealSafetyReasons, SafetyContext, SafetyViolation } from "./types.ts";

function customAllergyTerms(other: string): string[] {
  return other
    .toLowerCase()
    .split(/[,;/\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);
}

export function createSafetyContext(allergies: string[], prefs: string[], other: string): SafetyContext {
  return {
    allergies,
    prefs,
    other,
    userAllergieIds: activeUserAllergyIds(allergies),
    customTerms: customAllergyTerms(other),
  };
}

export function evaluateMeal(meal: MealLike, ctx: SafetyContext): MealSafetyReasons {
  const norm = getMealNorm(meal);
  const present = classifyPresentAllergens(norm, mealAllergenTags(meal));
  const hit: string[] = [];
  for (const userId of ctx.userAllergieIds) {
    if (present.has(userId)) hit.push(userId);
  }
  for (const term of ctx.customTerms) {
    if (termMatches(norm, term)) hit.push(`other:${term}`);
  }
  const diet = detectDietViolations(norm, present, ctx.prefs);
  if (mealContainsPork(meal)) diet.push("no-pork");

  return {
    allergy: [...new Set(hit)],
    diet: [...new Set(diet)],
  };
}

export function isMealSafe(meal: MealLike, ctx: SafetyContext): boolean {
  const r = evaluateMeal(meal, ctx);
  return r.allergy.length === 0 && r.diet.length === 0;
}

/** Single-pass plan audit (replaces repeated validatePlan loops). */
export function auditPlan(plan: MealPlan, ctx: SafetyContext): SafetyViolation[] {
  const out: SafetyViolation[] = [];
  for (const day of plan) {
    for (const meal of day.meals || []) {
      const reasons = evaluateMeal(meal, ctx);
      if (reasons.allergy.length || reasons.diet.length) {
        out.push({
          day: String(day.day || ""),
          mealName: String(meal.name || ""),
          allergy: reasons.allergy,
          diet: reasons.diet,
        });
      }
    }
  }
  return out;
}

export function violationWeight(v: SafetyViolation): number {
  return v.allergy.length * 3 + v.diet.length;
}

export function shouldAbortAiRetries(violations: SafetyViolation[]): boolean {
  if (!violations.length) return false;
  const totalWeight = violations.reduce((sum, v) => sum + violationWeight(v), 0);
  const allergyMeals = violations.filter((v) => v.allergy.length > 0).length;
  const allergyHits = violations.reduce((sum, v) => sum + v.allergy.length, 0);
  // Weight-based only — 25 minor diet flags ≠ 25 allergy failures.
  return totalWeight > 48 || allergyMeals > 14 || allergyHits > 22;
}

export function violationsToStrings(violations: SafetyViolation[]): string[] {
  return violations.map((v) => {
    const parts = [...v.allergy.map((a) => `allergy:${a}`), ...v.diet.map((d) => `diet:${d}`)];
    return `${v.day}: ${v.mealName} (${parts.join(", ")})`;
  });
}

export function nameUnsafe(name: string, ctx: SafetyContext): boolean {
  return !isMealSafe({ name, ingredients: [] }, ctx);
}

export const SAFE_POOL_DEFAULTS: Record<Lang, { b: string[]; m: string[]; s: string[] }> = {
  de: {
    b: ["Haferflocken Beeren", "Obstsalat", "Chia Pudding"],
    m: ["Linsen Curry", "Gemüsepfanne", "Reis Gemüse Bowl"],
    s: ["Obst Mix", "Hummus Gemüse", "Gemüse Sticks"],
  },
  en: {
    b: ["Oatmeal berries", "Fruit salad", "Chia pudding"],
    m: ["Lentil curry", "Veggie stir fry", "Rice veggie bowl"],
    s: ["Fruit mix", "Hummus veggies", "Veggie sticks"],
  },
  fr: {
    b: ["Porridge baies", "Salade fruits", "Chia pudding"],
    m: ["Curry lentilles", "Legumes saute", "Riz legumes"],
    s: ["Fruits", "Hummus legumes", "Legumes crus"],
  },
};

export function filterPool(
  pool: string[],
  ctx: SafetyContext,
  lang: Lang,
  slot: "b" | "m" | "s",
): string[] {
  const ok = pool.filter((n) => !nameUnsafe(n, ctx));
  if (ok.length) return ok;
  const defaults = SAFE_POOL_DEFAULTS[lang][slot].filter((n) => !nameUnsafe(n, ctx));
  return defaults.length ? defaults : SAFE_POOL_DEFAULTS[lang][slot];
}
