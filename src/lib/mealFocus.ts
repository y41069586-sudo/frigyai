export type MealFocusKey = "breakfast" | "lunch" | "dinner" | "snack";

const KEYS: MealFocusKey[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_FOCUS_PROMPTS_DE: Record<MealFocusKey, string> = {
  breakfast: "Was hast du zum Frühstück gegessen?",
  lunch: "Was hast du zum Mittagessen gegessen?",
  dinner: "Was hast du zum Abendessen gegessen?",
  snack: "Was hast du als Snack gegessen?",
};

export function parseMealFocus(raw: string | null): MealFocusKey | null {
  if (!raw) return null;
  return KEYS.includes(raw as MealFocusKey) ? (raw as MealFocusKey) : null;
}
