import { getOpenAIKey } from "./constants.ts";
import { guaranteedSafeMinimalPlan } from "./fallbacks.ts";
import { buildMealFromDishTitle, parseIngredientNamesFromDishTitle } from "./mealBlueprints.ts";
import { generateAIDraft } from "./openai.ts";
import { finishPlan, mealSlot } from "./meals.ts";
import { auditPlan } from "./validation.ts";
import { generateFallbackDraft } from "./drafts.ts";
import { repairPlan } from "./repairLoop.ts";
import type { BuildPlanDeps, BuildPlanResult, Lang, MealPlan, PlanInput, SafetyContext } from "./types.ts";

export const defaultBuildPlanDeps: BuildPlanDeps = {
  generateAIDraft,
};

const MAX_REPAIR_ROUNDS = 4;
const MAX_AI_RETRIES_AFTER_REPAIR = 2;

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

  let raw = await deps.generateAIDraft(input);
  if (raw) {
    usedAi = true;
  } else if (!aiAvailable) {
    console.warn("[MEAL-PLAN] No OPENAI_API_KEY — using template plan");
    raw = generateFallbackDraft(input, banned);
  } else {
    console.warn("[MEAL-PLAN] OpenAI failed — retrying full generation");
    for (let i = 0; i < MAX_AI_RETRIES_AFTER_REPAIR && !raw; i++) {
      raw = await deps.generateAIDraft({ ...input, isRegeneration: true });
    }
    if (raw) usedAi = true;
  }

  if (!raw) {
    throw new Error(
      aiAvailable
        ? "KI konnte keinen Wochenplan erstellen. Bitte in ein paar Sekunden erneut versuchen."
        : "OPENAI_API_KEY fehlt auf dem Server.",
    );
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

  if (violations.length > 0 && aiAvailable) {
    console.warn(`[MEAL-PLAN] ${violations.length} violation(s) — re-asking OpenAI (no template pool)`);
    for (let i = 0; i < MAX_AI_RETRIES_AFTER_REPAIR && violations.length > 0; i++) {
      const aiPlan = await deps.generateAIDraft({ ...input, isRegeneration: true });
      if (!aiPlan) continue;
      usedAi = true;
      plan = finishPlan(aiPlan, input.targets, input.mealsPerDay, input.lang) ?? aiPlan;
      violations = auditPlan(plan, input.safetyCtx);
    }
  }

  if (violations.length > 0 && !aiAvailable) {
    console.warn(`[MEAL-PLAN] ${violations.length} violation(s) — template fallback (no API key)`);
    const strictPrefs = input.prefs.includes("vegan")
      ? [...new Set([...input.prefs.filter((p) => p !== "pescatarian"), "vegan"])]
      : input.prefs;
    plan = generateFallbackDraft(input, banned, strictPrefs);
    plan = finishPlan(plan, input.targets, input.mealsPerDay, input.lang) ?? plan;
    violations = auditPlan(plan, input.safetyCtx);
    usedAi = false;
  }

  if (violations.length > 0) {
    console.warn("[MEAL-PLAN] Last resort: minimal safe plan");
    plan = guaranteedSafeMinimalPlan({
      mealsPerDay: input.mealsPerDay,
      lang: input.lang,
    });
    plan = finishPlan(plan, input.targets, input.mealsPerDay, input.lang) ?? plan;
    violations = auditPlan(plan, input.safetyCtx);
    usedAi = false;
  }

  let finalPlan = finishPlan(plan, input.targets, input.mealsPerDay, input.lang) ?? plan;
  finalPlan = alignPlanIngredientsToTitles(finalPlan, input.lang, input.safetyCtx, input.mealsPerDay);
  finalPlan = finishPlan(finalPlan, input.targets, input.mealsPerDay, input.lang) ?? finalPlan;
  return { plan: finalPlan, usedAi, repairAttempts };
}
