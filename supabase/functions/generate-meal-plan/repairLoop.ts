import { getOpenAIKey } from "./constants.ts";
import { generateFallbackDraft } from "./drafts.ts";
import { guaranteedSafeMinimalPlan } from "./fallbacks.ts";
import { buildMealFromDishTitle } from "./mealBlueprints.ts";
import { mealSlot } from "./meals.ts";
import { auditPlan, isMealSafe } from "./validation.ts";
import type { MealPlan, PlanInput, SafetyViolation } from "./types.ts";

/** Fix unsafe meals in-place (keep AI title). Template pools only when OpenAI key is missing. */
export function repairPlan(
  draft: MealPlan,
  input: PlanInput,
  attempt: number,
  priorViolations: SafetyViolation[],
): { plan: MealPlan; violations: SafetyViolation[] } {
  let plan = draft;
  let violations = priorViolations.length ? priorViolations : auditPlan(plan, input.safetyCtx);

  if (violations.length) {
    console.warn(`[MEAL-PLAN] Fixing unsafe meals in-place (attempt ${attempt})`);
    for (const day of plan) {
      const meals = day.meals;
      if (!Array.isArray(meals)) continue;
      for (let si = 0; si < meals.length; si++) {
        const meal = meals[si];
        if (!meal || isMealSafe(meal, input.safetyCtx)) continue;
        const slot = mealSlot(si, meals.length);
        meals[si] = buildMealFromDishTitle(String(meal.name || "Gericht"), slot, input.lang, input.safetyCtx);
      }
    }
    violations = auditPlan(plan, input.safetyCtx);
  }

  if (violations.length && !getOpenAIKey() && attempt >= 2) {
    console.warn("[MEAL-PLAN] No OpenAI key — template fallback after repair");
    plan = generateFallbackDraft(input, new Set());
    violations = auditPlan(plan, input.safetyCtx);
  }

  if (violations.length && attempt > 4) {
    console.warn("[MEAL-PLAN] Hard escape: guaranteedSafeMinimalPlan");
    plan = guaranteedSafeMinimalPlan({ mealsPerDay: input.mealsPerDay, lang: input.lang });
    violations = auditPlan(plan, input.safetyCtx);
  }

  return { plan, violations };
}
