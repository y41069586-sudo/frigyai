import type { Language } from "@/contexts/LanguageContext";

export const WEEKLY_MEAL_PLAN_LANGUAGE_KEY = "weeklyMealPlanLanguage";

export const FRIGY_LANGUAGE_CHANGED_EVENT = "frigy-language-changed";

export type LanguageChangedDetail = { language: Language };

export function getMealPlanStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(WEEKLY_MEAL_PLAN_LANGUAGE_KEY);
  return raw === "de" || raw === "en" || raw === "fr" ? raw : null;
}

export function setMealPlanStoredLanguage(language: Language): void {
  localStorage.setItem(WEEKLY_MEAL_PLAN_LANGUAGE_KEY, language);
}

export function dispatchLanguageChanged(language: Language): void {
  window.dispatchEvent(
    new CustomEvent<LanguageChangedDetail>(FRIGY_LANGUAGE_CHANGED_EVENT, {
      detail: { language },
    }),
  );
}

/** BCP-47 locale for dates/times based on app language. */
export function getAppLocale(language: Language): string {
  if (language === "fr") return "fr-FR";
  if (language === "en") return "en-US";
  return "de-DE";
}

export function getStoredAppLocale(): string {
  if (typeof window === "undefined") return "en-US";
  const raw = localStorage.getItem("app-language");
  const lang = raw === "de" || raw === "en" || raw === "fr" ? raw : "en";
  return getAppLocale(lang);
}
