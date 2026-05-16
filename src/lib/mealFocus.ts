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

export function parseMealFocus(raw: string | null): MealFocusKey | null {
  if (!raw) return null;
  return KEYS.includes(raw as MealFocusKey) ? (raw as MealFocusKey) : null;
}
