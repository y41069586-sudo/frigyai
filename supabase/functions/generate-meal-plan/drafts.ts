import { fallbackPlan } from "./fallbacks.ts";
import { finishPlan } from "./meals.ts";
import type { MealPlan, PlanInput } from "./types.ts";

export function generateFallbackDraft(
  input: PlanInput,
  banned: Set<string>,
  prefsOverride?: string[],
): MealPlan {
  const mergedBanned = new Set<string>([
    ...banned,
    ...input.banned.map((n) => n.toLowerCase().trim()).filter(Boolean),
  ]);

  const raw = fallbackPlan({
    mealsPerDay: input.mealsPerDay,
    targets: input.targets,
    prefs: prefsOverride ?? input.prefs,
    allergies: input.allergies,
    other: input.other,
    lang: input.lang,
    banned: mergedBanned,
    bannedFingerprints: new Set(
      (input.priorDishes ?? []).map((p) => p.fingerprint).filter(Boolean),
    ),
    varietySeed: input.varietySeed,
    isRegeneration: input.isRegeneration,
  });

  return finishPlan(raw, input.targets, input.mealsPerDay, input.lang) ?? raw;
}
