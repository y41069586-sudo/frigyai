import { getOpenAIKey } from "./constants.ts";
import { guaranteedSafeMinimalPlan } from "./fallbacks.ts";
import { buildMealFromDishTitle, parseIngredientNamesFromDishTitle } from "./mealBlueprints.ts";
import { generateAIDraft } from "./openai.ts";
import { finishPlan, mealSlot } from "./meals.ts";
import { sanitizePlaceholderMeals } from "./planMealSanitize.ts";
import { ensureDistinctMealsAcrossWeek } from "./variety.ts";
import { auditPlan } from "./validation.ts";
import { generateFallbackDraft } from "./drafts.ts";
import { repairPlan } from "./repairLoop.ts";
import type { BuildPlanDeps, BuildPlanResult, Lang, MealPlan, PlanInput, SafetyContext } from "./types.ts";

export const defaultBuildPlanDeps: BuildPlanDeps = {
  generateAIDraft,
};

const MAX_REPAIR_ROUNDS = 2;

function alignPlanIngredientsToTitles(
  plan: MealPlan,
  lang: Lang,
  ctx: SafetyContext,
  mealsPerDay: number,
): MealPlan {
  return plan.map((day) => ({
    ...day,
    meals: (day.meals || []).map((meal, si) => {
      const titleParts = parseIngredientNamesFromDishTitle(String(meal.name || ""));
      if (titleParts.length < 1) return meal;
      const ingBlob = (meal.ingredients || []).map((i) => String(i.name).toLowerCase()).join(" ");
      const matched = titleParts.filter((t) => ingBlob.includes(t.toLowerCase())).length;
      const need = titleParts.length >= 2 ? 2 : 1;
      if (matched >= need) return meal;
      const slot = mealSlot(si, mealsPerDay);
      return buildMealFromDishTitle(String(meal.name), slot, lang, ctx);
    }),
  }));
}

export async function buildPlan(
  input: PlanInput,
  deps: BuildPlanDeps = defaultBuildPlanDeps,
): Promise<BuildPlanResult> {
  const aiAvailable = Boolean(getOpenAIKey());
  let usedAi = false;
  let repairAttempts = 0;

  const banned = new Set(input.banned.map((n) => n.toLowerCase().trim()).filter(Boolean));

  const draft = await deps.generateAIDraft(input);
  let raw = draft.plan;

  if (raw) {
    usedAi = true;
  } else if (!aiAvailable) {
    console.warn("[MEAL-PLAN] No OPENAI_API_KEY — template plan");
    raw = generateFallbackDraft(input, banned);
  } else {
    console.warn(
      "[MEAL-PLAN] OpenAI failed — safe template plan:",
      draft.failureReason ?? "unknown",
    );
    raw = generateFallbackDraft(input, banned);
    usedAi = false;
  }

  let plan = finishPlan(raw, input.targets, input.mealsPerDay, input.lang) ?? raw;
  let violations = auditPlan(plan, input.safetyCtx);

  while (violations.length > 0 && repairAttempts < MAX_REPAIR_ROUNDS) {
    repairAttempts += 1;
    const repaired = repairPlan(plan, input, repairAttempts, violations);
    plan = finishPlan(repaired.plan, input.targets, input.mealsPerDay, input.lang) ?? repaired.plan;
    violations = repaired.violations.length
      ? repaired.violations
      : auditPlan(plan, input.safetyCtx);
  }

  if (violations.length > 0) {
    console.warn("[MEAL-PLAN] Last resort: minimal safe plan");
    plan = guaranteedSafeMinimalPlan({
      mealsPerDay: input.mealsPerDay,
      lang: input.lang,
    });
    plan = finishPlan(plan, input.targets, input.mealsPerDay, input.lang) ?? plan;
    usedAi = false;
  }

  plan = sanitizePlaceholderMeals(plan, {
    mealsPerDay: input.mealsPerDay,
    lang: input.lang,
    prefs: input.prefs,
    safetyCtx: input.safetyCtx,
    varietySeed: input.varietySeed,
  });
  plan = ensureDistinctMealsAcrossWeek(plan, {
    mealsPerDay: input.mealsPerDay,
    lang: input.lang,
    prefs: input.prefs,
    safetyCtx: input.safetyCtx,
  });
  let finalPlan = finishPlan(plan, input.targets, input.mealsPerDay, input.lang) ?? plan;
  finalPlan = alignPlanIngredientsToTitles(finalPlan, input.lang, input.safetyCtx, input.mealsPerDay);
  finalPlan = finishPlan(finalPlan, input.targets, input.mealsPerDay, input.lang) ?? finalPlan;
  return { plan: finalPlan, usedAi, repairAttempts };
}
