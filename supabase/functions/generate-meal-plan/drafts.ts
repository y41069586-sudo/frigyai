import { LANG } from "./constants.ts";
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
    mealPlanPrefs: input.mealPlanPrefs,
  });

  return finishPlan(raw, input.targets, input.mealsPerDay, input.lang) ?? raw;
}

/** Keep AI-generated days; fill missing weekdays from cuisine-aware fallback (not full regen). */
export function expandPlanToSevenDays(
  plan: MealPlan,
  input: PlanInput,
  banned: Set<string>,
): MealPlan {
  if (!Array.isArray(plan) || plan.length >= 7) return plan;

  const filler = generateFallbackDraft(input, banned);
  const L = LANG[input.lang];
  const out: MealPlan = [];

  for (let i = 0; i < 7; i++) {
    const existing = plan[i];
    if (existing?.meals?.length) {
      out.push({
        day: String(existing.day || L.days[i]).trim(),
        meals: existing.meals,
      });
    } else {
      out.push(filler[i] ?? filler[filler.length - 1]!);
    }
  }

  return out;
}
