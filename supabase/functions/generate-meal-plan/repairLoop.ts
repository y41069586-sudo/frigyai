import { guaranteedSafeMinimalPlan } from "./fallbacks.ts";
import { auditPlan } from "./validation.ts";
import { generateFallbackDraft } from "./drafts.ts";
import { sanitizeUnsafeMeals } from "./sanitize.ts";
import type { MealPlan, PlanInput, SafetyViolation } from "./types.ts";

export function repairPlan(
  draft: MealPlan,
  input: PlanInput,
  attempt: number,
  priorViolations: SafetyViolation[],
): { plan: MealPlan; violations: SafetyViolation[] } {
  let plan = draft;
  let violations = priorViolations.length ? priorViolations : auditPlan(plan, input.safetyCtx);

  if (violations.length) {
    console.warn(`[MEAL-PLAN] Sanitizing unsafe meals (attempt ${attempt})`);
    sanitizeUnsafeMeals(plan, input.safetyCtx, input.lang);
    violations = auditPlan(plan, input.safetyCtx);
  }

  if (violations.length && attempt >= 2) {
    console.warn(`[MEAL-PLAN] Fallback draft (attempt ${attempt})`);
    plan = generateFallbackDraft(input, new Set());
    sanitizeUnsafeMeals(plan, input.safetyCtx, input.lang);
    violations = auditPlan(plan, input.safetyCtx);
  }

  if (violations.length && attempt >= 3) {
    console.warn(`[MEAL-PLAN] Strict vegan fallback (attempt ${attempt})`);
    const strictPrefs = [...new Set([...input.prefs.filter((p) => p !== "pescatarian"), "vegan"])];
    plan = generateFallbackDraft(input, new Set(), strictPrefs);
    sanitizeUnsafeMeals(plan, input.safetyCtx, input.lang);
    violations = auditPlan(plan, input.safetyCtx);
  }

  if (violations.length && attempt > 3) {
    console.warn("[MEAL-PLAN] Hard escape: guaranteedSafeMinimalPlan");
    plan = guaranteedSafeMinimalPlan({ mealsPerDay: input.mealsPerDay, lang: input.lang });
    violations = auditPlan(plan, input.safetyCtx);
  }
  return { plan, violations };
}
