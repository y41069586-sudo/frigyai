export type MealFocusKey = "breakfast" | "lunch" | "dinner" | "snack";

const KEYS: MealFocusKey[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_FOCUS_TITLES_DE: Record<MealFocusKey, string> = {
  breakfast: "Frühstück",
  lunch: "Mittagessen",
  dinner: "Abendessen",
  snack: "Snack",
};

export const MEAL_FOCUS_PROMPTS_DE: Record<MealFocusKey, string> = {
  breakfast: "Was hattest du zum Frühstück?",
  lunch: "Was hattest du zum Mittagessen?",
  dinner: "Was hattest du zum Abendessen?",
  snack: "Was hattest du als Snack?",
};

export const MEAL_FOCUS_SEARCH_PLACEHOLDER_DE: Record<MealFocusKey, string> = {
  breakfast: "Was hattest du zum Frühstück?",
  lunch: "Was hattest du zum Mittagessen?",
  dinner: "Was hattest du zum Abendessen?",
  snack: "Was hattest du als Snack?",
};

export function defaultMealFocusFromTime(date = new Date()): MealFocusKey {
  const hour = date.getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

export const MEAL_LOG_GENERIC_PLACEHOLDER_DE = "Was hast du gegessen?";

/** Map stored labels (de/en/fr) or canonical keys to a meal slot. */
export function resolveMealFocusKey(raw: string | null | undefined): MealFocusKey | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (KEYS.includes(value as MealFocusKey)) return value as MealFocusKey;

  const lower = value.toLowerCase();
  if (/(frühstück|fruhstuck|breakfast|petit[- ]?d[eé]jeuner)/.test(lower)) return "breakfast";
  if (/(mittagessen|lunch|d[eé]jeuner|hauptmahlzeit|hauptgericht)/.test(lower)) return "lunch";
  if (/(abendessen|dinner|souper|d[iî]ner)/.test(lower)) return "dinner";
  if (/(snack|collation|imbiss)/.test(lower)) return "snack";
  return null;
}

export function normalizeMealTypeForSave(raw?: string | null): MealFocusKey {
  return resolveMealFocusKey(raw) ?? defaultMealFocusFromTime();
}

export function parseMealFocus(raw: string | null): MealFocusKey | null {
  return resolveMealFocusKey(raw);
}
