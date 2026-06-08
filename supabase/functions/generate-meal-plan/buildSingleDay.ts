import { getOpenAIKey } from "./constants.ts";
import { generateFallbackDraft } from "./drafts.ts";
import { finishSingleDay } from "./meals.ts";
import { fetchAISingleDay } from "./openai.ts";
import { auditPlan } from "./validation.ts";
import type { DayPlan, PlanInput } from "./types.ts";

export type BuildSingleDayResult = {
  day: DayPlan;
  usedAi: boolean;
};

export async function buildSingleDay(
  input: PlanInput,
  dayIndex: number,
  dayName: string,
): Promise<BuildSingleDayResult> {
  const banned = new Set(input.banned.map((n) => n.toLowerCase().trim()).filter(Boolean));
  let usedAi = false;
  let rawDay: DayPlan | null = null;

  if (getOpenAIKey()) {
    try {
      const draft = await fetchAISingleDay(input, dayName, dayIndex);
      rawDay = draft[0] ?? null;
      if (rawDay) {
        const violations = auditPlan([rawDay], input.safetyCtx);
        const allergyFree = violations.every((v) => v.allergy.length === 0);
        if (!allergyFree) {
          console.warn("[MEAL-PLAN] Single-day AI plan has allergy flags — using anyway");
        }
        usedAi = true;
      }
    } catch (e) {
      console.warn("[MEAL-PLAN] Single-day OpenAI failed:", e instanceof Error ? e.message : e);
    }
  }

  if (!rawDay) {
    const full = generateFallbackDraft(input, banned);
    rawDay = full[dayIndex] ?? full[0] ?? null;
    usedAi = false;
  }

  if (!rawDay) {
    throw new Error("Could not build single day plan");
  }

  const day = finishSingleDay(rawDay, input.targets, input.mealsPerDay, input.lang, dayIndex);
  return { day, usedAi };
}
