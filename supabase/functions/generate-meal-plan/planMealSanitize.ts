import { enrichPoolsForMealPlanPrefs, getDietPools } from "./dietPools.ts";
import type { MealPlanPrefsInput } from "./mealPlanPrefs.ts";
import { buildMealFromDishTitle } from "./mealBlueprints.ts";
import { mealSlot } from "./meals.ts";
import { normNameKey } from "./normalize.ts";
import { seededShuffle } from "./shuffle.ts";
import { filterPool } from "./validation.ts";
import type { Lang, Meal, MealPlan, PlanInput, SafetyContext } from "./types.ts";

const BAD_INSTRUCTION =
  /kein\s+essen|nicht\s+essen|no\s+food|no\s+eating|no\s+meal|without\s+eating|pas\s+de\s+manger|nicht\s+essbar|do\s+not\s+eat/i;

const DAY_IN_NAME =
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i;

const SLOT_LABEL =
  /^(frühstück|hauptgericht|snack|breakfast|lunch|dinner|vorspeise|beilage|meal|mahlzeit|gericht|repas)\s*#?\d+$/i;

/** AI / padding junk like "Friday meal 3", "Mahlzeit 2", "Hauptgericht 1". */
export function isPlaceholderMealName(name: string): boolean {
  const n = String(name || "").trim();
  if (!n || n.length < 4) return true;
  const lower = n.toLowerCase();
  if (SLOT_LABEL.test(lower)) return true;
  if (/\b(frühstück|hauptgericht|snack|breakfast|lunch|dinner|meal|mahlzeit|gericht|repas)\s*#?\d+\b/i.test(lower)) {
    return true;
  }
  if (DAY_IN_NAME.test(lower) && /\b(meal|mahlzeit|repas|frühstück|hauptgericht|snack|breakfast|lunch|dinner|gericht)\b/i.test(lower)) {
    return true;
  }
  if (/^gericht\s*\d+$/i.test(lower)) return true;
  return false;
}

export function sanitizeMealInstructions(instructions: unknown): string[] {
  if (!Array.isArray(instructions)) return [];
  return instructions
    .map((s) => String(s).trim())
    .filter((s) => s.length > 2 && !BAD_INSTRUCTION.test(s))
    .slice(0, 8);
}

class PoolPicker {
  private lang: Lang;
  private pools: { b: string[]; m: string[]; s: string[] };
  private cursor = { b: 0, m: 0, s: 0 };
  private used = new Set<string>();

  constructor(
    lang: Lang,
    prefs: string[],
    ctx: SafetyContext,
    seed: string,
    mealPlanPrefs?: MealPlanPrefsInput,
  ) {
    this.lang = lang;
    const base = enrichPoolsForMealPlanPrefs(getDietPools(lang, prefs), lang, mealPlanPrefs);
    const key = seed || String(Date.now());
    this.pools = {
      b: seededShuffle(filterPool(base.b, ctx, lang, "b"), `${key}-b`),
      m: seededShuffle(filterPool(base.m, ctx, lang, "m"), `${key}-m`),
      s: seededShuffle(filterPool(base.s, ctx, lang, "s"), `${key}-s`),
    };
  }

  pick(slot: "b" | "m" | "s", dayIndex: number, slotIndex: number): string {
    const list = this.pools[slot];
    for (let pass = 0; pass < list.length + 2; pass++) {
      for (let o = 0; o < Math.max(list.length, 1); o++) {
        const idx = list.length ? (this.cursor[slot] + o + dayIndex + slotIndex) % list.length : 0;
        const title = list[idx] ?? "Gemüsepfanne";
        this.cursor[slot] = (idx + 1) % Math.max(list.length, 1);
        const key = normNameKey(title);
        if (!this.used.has(key)) {
          this.used.add(key);
          return title;
        }
      }
    }
    const fallback = slot === "b"
      ? (this.lang === "de" ? "Haferflocken mit Beeren" : "Oatmeal berries")
      : slot === "m"
        ? (this.lang === "de" ? "Reis mit Hackfleisch" : "Chicken and rice")
        : (this.lang === "de" ? "Obst mit Joghurt" : "Fruit yogurt");
    this.used.add(normNameKey(fallback));
    return fallback;
  }
}

export function sanitizePlaceholderMeals(
  plan: MealPlan,
  input: Pick<PlanInput, "mealsPerDay" | "lang" | "prefs" | "varietySeed" | "mealPlanPrefs"> & {
    safetyCtx: SafetyContext;
  },
): MealPlan {
  const picker = new PoolPicker(
    input.lang,
    input.prefs,
    input.safetyCtx,
    input.varietySeed ?? "",
    input.mealPlanPrefs,
  );

  return plan.map((day, dayIndex) => ({
    ...day,
    meals: (day.meals ?? []).map((meal, slotIndex) => {
      const slot = mealSlot(slotIndex, input.mealsPerDay);
      let name = String(meal.name || "").trim();
      const instructions = sanitizeMealInstructions(meal.instructions);

      if (isPlaceholderMealName(name)) {
        const replacement = picker.pick(slot, dayIndex, slotIndex);
        console.warn(`[MEAL-PLAN] Replaced placeholder "${name}" → ${replacement}`);
        name = replacement;
      }

      const rebuilt = buildMealFromDishTitle(name, slot, input.lang, input.safetyCtx);
      const hasMacros = (Number(meal.protein) || 0) + (Number(meal.carbs) || 0) + (Number(meal.fat) || 0) > 0;

      const out: Meal = {
        ...rebuilt,
        type: rebuilt.type,
        name: rebuilt.name,
        instructions,
        allergenTags:
          Array.isArray(meal.allergenTags) && meal.allergenTags.length
            ? meal.allergenTags.map(String)
            : rebuilt.allergenTags,
      };

      if (hasMacros) {
        out.protein = Number(meal.protein) || 0;
        out.carbs = Number(meal.carbs) || 0;
        out.fat = Number(meal.fat) || 0;
        out.calories = Number(meal.calories) || rebuilt.calories;
      }

      return out;
    }),
  }));
}
