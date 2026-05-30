import { generateAIDraft } from "./openai.ts";
import { finishPlan } from "./meals.ts";
import { auditPlan } from "./validation.ts";
import { generateFallbackDraft } from "./drafts.ts";
import { repairPlan } from "./repairLoop.ts";
import type { BuildPlanDeps, BuildPlanResult, PlanInput } from "./types.ts";

export const defaultBuildPlanDeps: BuildPlanDeps = {
  generateAIDraft,
};

const MAX_REPAIR_ROUNDS = 4;

export async function buildPlan(
  input: PlanInput,
  deps: BuildPlanDeps = defaultBuildPlanDeps,
): Promise<BuildPlanResult> {
  let usedAi = false;
  let repairAttempts = 0;

  const banned = new Set(input.banned.map((n) => n.toLowerCase().trim()).filter(Boolean));

  let raw = await deps.generateAIDraft(input);
  if (raw) {
    usedAi = true;
  } else {
    raw = generateFallbackDraft(input, banned);
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

  const finalPlan = finishPlan(plan, input.targets, input.mealsPerDay, input.lang) ?? plan;
  return { plan: finalPlan, usedAi, repairAttempts };
}
