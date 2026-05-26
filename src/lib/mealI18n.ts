import type { Language, Translations } from "@/contexts/LanguageContext";
import type { MealFocusKey } from "@/lib/mealFocus";

type MealTranslationSubset = Pick<
  Translations,
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"
>;

const DAY_LABELS: Record<Language, string[]> = {
  de: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  fr: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
};

const DAY_ALIASES: Record<string, keyof Pick<
  MealTranslationSubset,
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
>> = {
  montag: "monday",
  monday: "monday",
  lundi: "monday",
  dienstag: "tuesday",
  tuesday: "tuesday",
  mardi: "tuesday",
  mittwoch: "wednesday",
  wednesday: "wednesday",
  mercredi: "wednesday",
  donnerstag: "thursday",
  thursday: "thursday",
  jeudi: "thursday",
  freitag: "friday",
  friday: "friday",
  vendredi: "friday",
  samstag: "saturday",
  saturday: "saturday",
  samedi: "saturday",
  sonntag: "sunday",
  sunday: "sunday",
  dimanche: "sunday",
};

const MEAL_TYPE_ALIASES: Array<{
  match: RegExp;
  key: keyof Pick<MealTranslationSubset, "breakfast" | "lunch" | "dinner" | "snack">;
}> = [
  { match: /(frühstück|breakfast|petit[- ]dejeuner|petit-déjeuner)/i, key: "breakfast" },
  { match: /(mittagessen|lunch|dejeuner|déjeuner)/i, key: "lunch" },
  { match: /(abendessen|dinner|souper|diner|dîner)/i, key: "dinner" },
  { match: /(snack|collation)/i, key: "snack" },
];

const MEAL_PROMPTS: Record<Language, Record<MealFocusKey, string>> = {
  de: {
    breakfast: "Was hattest du zum Frühstück?",
    lunch: "Was hattest du zum Mittagessen?",
    dinner: "Was hattest du zum Abendessen?",
    snack: "Was hattest du als Snack?",
  },
  en: {
    breakfast: "What did you have for breakfast?",
    lunch: "What did you have for lunch?",
    dinner: "What did you have for dinner?",
    snack: "What did you have as a snack?",
  },
  fr: {
    breakfast: "Qu as-tu mange au petit-dejeuner ?",
    lunch: "Qu as-tu mange au dejeuner ?",
    dinner: "Qu as-tu mange au diner ?",
    snack: "Qu as-tu mange en collation ?",
  },
};

const GENERIC_MEAL_PROMPT: Record<Language, string> = {
  de: "Was hast du gegessen?",
  en: "What did you eat?",
  fr: "Qu as-tu mange ?",
};

export function getLocalizedMealFocusTitle(
  mealFocus: MealFocusKey,
  t: MealTranslationSubset,
): string {
  if (mealFocus === "breakfast") return t.breakfast;
  if (mealFocus === "lunch") return t.lunch;
  if (mealFocus === "dinner") return t.dinner;
  return t.snack;
}

export function getLocalizedMealFocusPrompt(
  mealFocus: MealFocusKey,
  language: Language,
): string {
  return MEAL_PROMPTS[language][mealFocus];
}

export function getLocalizedGenericMealPrompt(language: Language): string {
  return GENERIC_MEAL_PROMPT[language];
}

export function localizeMealTypeLabel(
  label: string | null | undefined,
  t: MealTranslationSubset,
): string {
  const value = String(label || "").trim();
  if (!value) return t.snack;

  const entry = MEAL_TYPE_ALIASES.find((candidate) => candidate.match.test(value));
  return entry ? t[entry.key] : value;
}

export function localizeWeekdayLabel(
  label: string | null | undefined,
  t: MealTranslationSubset,
  language: Language,
  fallbackIndex?: number,
): string {
  const value = String(label || "").trim();
  const alias = DAY_ALIASES[value.toLowerCase()];
  if (alias) return t[alias];

  if (typeof fallbackIndex === "number" && fallbackIndex >= 0 && fallbackIndex < DAY_LABELS[language].length) {
    return DAY_LABELS[language][fallbackIndex];
  }

  return value || DAY_LABELS[language][0];
}
