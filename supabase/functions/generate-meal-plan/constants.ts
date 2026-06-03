import type { Lang } from "./types.ts";

/** Supabase secret: `OPENAI_API_KEY` (legacy `OPEN_AI_KEY` logged once if used). */
export function getOpenAIKey(): string | undefined {
  const primary = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (primary) return primary;
  const legacy = Deno.env.get("OPEN_AI_KEY")?.trim();
  if (legacy) console.warn("[MEAL-PLAN] Use OPENAI_API_KEY; OPEN_AI_KEY is deprecated");
  return legacy || undefined;
}

export const LANG: Record<Lang, { days: string[]; meal: string; lang: string }> = {
  de: {
    days: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    meal: "Mahlzeit",
    lang: "Deutsch",
  },
  en: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    meal: "Meal",
    lang: "English",
  },
  fr: {
    days: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
    meal: "Repas",
    lang: "French",
  },
};

export const SLOT_WEIGHTS: Record<number, number[]> = {
  3: [0.28, 0.44, 0.28],
  4: [0.24, 0.38, 0.14, 0.24],
  5: [0.22, 0.32, 0.12, 0.26, 0.08],
};

export const ALLERGEN_TAG_IDS = [
  "gluten",
  "lactose",
  "milk",
  "nuts",
  "treeNuts",
  "peanuts",
  "soy",
  "eggs",
  "fish",
  "shellfish",
  "none",
] as const;

export const ALLERGY_ID_ALIASES: Record<string, string> = {
  wheat: "gluten",
  "tree-nuts": "treeNuts",
  egg: "eggs",
};

export const KCAL_MACRO_TOLERANCE = 50;
export const RECONCILE_RATIO_MIN = 0.85;
export const RECONCILE_RATIO_MAX = 1.15;
export const MACRO_CAPS = { protein: 350, carbs: 600, fat: 250 };

/** Default: gpt-4o (override via Edge secret OPENAI_MEAL_PLAN_MODEL). */
export function getOpenAIMealPlanModel(): string {
  return Deno.env.get("OPENAI_MEAL_PLAN_MODEL")?.trim() || "gpt-4o";
}

/** Max output tokens — lower keeps responses fast enough for Edge Function limits. */
export const OPENAI_PLAN_MAX_TOKENS = 5000;
export const OPENAI_MAX_INGREDIENTS_PER_MEAL = 6;
