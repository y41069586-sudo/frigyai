import type { Lang } from "./types.ts";

export type MealPlanPrefsInput = {
  cuisines: string[];
  maxPrepTime: "10" | "30" | "60plus";
  cookFrequency: "daily" | "4_5" | "3_4" | "1_2";
  budget: "cheap" | "medium" | "any";
  variety: "repeat_ok" | "varied";
};

const VALID_CUISINES = new Set([
  "international",
  "asian",
  "north_african",
  "south_african",
  "european",
  "american",
  "italian",
  "german",
]);

export function parseMealPlanPrefsFromBody(body: Record<string, unknown>): MealPlanPrefsInput | null {
  const raw = body.mealPlanPreferences;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const cuisines = Array.isArray(o.cuisines)
    ? o.cuisines.map(String).filter((c) => VALID_CUISINES.has(c))
    : [];

  const maxPrepTime = o.maxPrepTime === "10" || o.maxPrepTime === "30" || o.maxPrepTime === "60plus"
    ? o.maxPrepTime
    : "30";

  const cookFrequency =
    o.cookFrequency === "daily" ||
      o.cookFrequency === "4_5" ||
      o.cookFrequency === "3_4" ||
      o.cookFrequency === "1_2"
      ? o.cookFrequency
      : "3_4";

  const budget = o.budget === "cheap" || o.budget === "medium" || o.budget === "any"
    ? o.budget
    : "medium";

  const variety = o.variety === "repeat_ok" || o.variety === "varied" ? o.variety : "varied";

  if (!cuisines.length) return null;

  return { cuisines, maxPrepTime, cookFrequency, budget, variety };
}

const CUISINE_LABELS: Record<Lang, Record<string, string>> = {
  de: {
    international: "International / gemischt",
    asian: "Asiatisch",
    north_african: "Nordafrikanisch",
    south_african: "Südafrikanisch",
    european: "Europäisch",
    american: "Amerikanisch",
    italian: "Italienisch",
    german: "Deutsch",
  },
  en: {
    international: "International / mixed",
    asian: "Asian",
    north_african: "North African",
    south_african: "South African",
    european: "European",
    american: "American",
    italian: "Italian",
    german: "German",
  },
  fr: {
    international: "International / mixte",
    asian: "Asiatique",
    north_african: "Afrique du Nord",
    south_african: "Afrique du Sud",
    european: "Européen",
    american: "Américain",
    italian: "Italien",
    german: "Allemand",
  },
};

function prepTimeLabel(lang: Lang, value: MealPlanPrefsInput["maxPrepTime"]): string {
  if (lang === "de") {
    if (value === "10") return "max. 10 Minuten pro Mahlzeit";
    if (value === "30") return "max. 30 Minuten pro Mahlzeit";
    return "60+ Minuten — auch aufwendigere Gerichte ok";
  }
  if (lang === "fr") {
    if (value === "10") return "max. 10 min par repas";
    if (value === "30") return "max. 30 min par repas";
    return "60+ min — plats plus élaborés ok";
  }
  if (value === "10") return "max 10 minutes per meal";
  if (value === "30") return "max 30 minutes per meal";
  return "60+ minutes — elaborate dishes ok";
}

function cookFrequencyBlock(lang: Lang, value: MealPlanPrefsInput["cookFrequency"]): string {
  if (lang === "de") {
    switch (value) {
      case "daily":
        return "User kocht fast täglich frisch — wenig Meal-Prep, jeden Tag andere frische Gerichte bevorzugt.";
      case "4_5":
        return "User kocht 4–5× pro Woche — an anderen Tagen einfache/Reste-Gerichte, gelegentlich doppelte Portionen.";
      case "3_4":
        return "User kocht 3–4× pro Woche — Meal-Prep sinnvoll: gleiches Gericht an 2 aufeinanderfolgenden Tagen ist OK (z. B. Mo+Di), Reste nutzen.";
      case "1_2":
        return "User kocht nur 1–2× pro Woche — viele schnelle/no-cook Mahlzeiten (Joghurt, Brot, Salat, Aufschnitt), Reste über mehrere Tage.";
    }
  }
  if (lang === "fr") {
    switch (value) {
      case "daily":
        return "Cuisine presque tous les jours — peu de meal prep, plats frais variés.";
      case "4_5":
        return "Cuisine 4–5×/semaine — jours simples/restes, parfois double portion.";
      case "3_4":
        return "Cuisine 3–4×/semaine — meal prep ok: même plat 2 jours consécutifs (ex. lun+mar).";
      case "1_2":
        return "Cuisine 1–2×/semaine — beaucoup de repas rapides/sans cuisson, restes sur plusieurs jours.";
    }
  }
  switch (value) {
    case "daily":
      return "Cooks almost daily — minimal meal prep, prefer fresh varied dishes.";
    case "4_5":
      return "Cooks 4–5×/week — simple/leftover meals other days, occasional double batches.";
    case "3_4":
      return "Cooks 3–4×/week — meal prep OK: same dish on 2 consecutive days (e.g. Mon+Tue).";
    case "1_2":
      return "Cooks 1–2×/week — many quick/no-cook meals, leftovers across days.";
  }
}

function budgetBlock(lang: Lang, value: MealPlanPrefsInput["budget"]): string {
  if (lang === "de") {
    if (value === "cheap") return "Budget: günstig — Discounter-Zutaten, saisonales Gemüse, wenig teures Fleisch/Fisch.";
    if (value === "medium") return "Budget: mittel — ausgewogene Preise, gelegentlich Qualitätsprodukte.";
    return "Budget: egal — Preis keine Einschränkung.";
  }
  if (lang === "fr") {
    if (value === "cheap") return "Budget: économique — ingrédients discount, légumes de saison.";
    if (value === "medium") return "Budget: moyen — prix équilibrés.";
    return "Budget: sans limite.";
  }
  if (value === "cheap") return "Budget: cheap — discount ingredients, seasonal veg, less expensive meat/fish.";
  if (value === "medium") return "Budget: medium — balanced prices.";
  return "Budget: no limit.";
}

function varietyBlock(lang: Lang, value: MealPlanPrefsInput["variety"]): string {
  if (lang === "de") {
    if (value === "varied") {
      return "Abwechslung: MAXIMAL — jede Woche neue Gerichte, keine Wiederholung gleicher Hauptgerichte, unterschiedliche Proteine und Stile.";
    }
    return "Abwechslung: Wiederholungen OK — Meal-Prep und Lieblingsgerichte 2–3× in der Woche erlaubt.";
  }
  if (lang === "fr") {
    if (value === "varied") {
      return "Variété: MAXIMALE — nouveaux plats chaque semaine, pas de répétition des plats principaux.";
    }
    return "Variété: répétitions OK — meal prep et favoris 2–3×/semaine autorisés.";
  }
  if (value === "varied") {
    return "Variety: MAXIMUM — new dishes weekly, no repeating main dishes, different proteins/styles.";
  }
  return "Variety: repeats OK — meal prep and favorites 2–3×/week allowed.";
}

export function buildMealPlanPrefsPromptBlock(prefs: MealPlanPrefsInput, lang: Lang): string {
  const labels = CUISINE_LABELS[lang];
  const cuisineList = prefs.cuisines.map((c) => labels[c] ?? c).join(", ");

  const disclaimer = lang === "de"
    ? "Hinweis: Frigy kann nicht garantieren, dass jede Mahlzeit zu 100 % einer Küche entspricht — mische realistisch, aber orientiere dich stark an den gewählten Stilen."
    : lang === "fr"
      ? "Note : Frigy ne garantit pas que chaque repas corresponde à 100 % à une cuisine — mélange réaliste, mais suis fortement les styles choisis."
      : "Note: Frigy cannot guarantee every meal matches a cuisine 100% — mix realistically but strongly follow chosen styles.";

  return [
    "USER MEAL PLAN PREFERENCES (MUST follow while hitting daily macro targets):",
    `Preferred cuisines/styles (mix across the week, not all meals from one region): ${cuisineList}.`,
    disclaimer,
    prepTimeLabel(lang, prefs.maxPrepTime),
    `Set prepTime field per meal ≤ ${prefs.maxPrepTime === "60plus" ? "90" : prefs.maxPrepTime} minutes unless cookFrequency allows batch cooking.`,
    cookFrequencyBlock(lang, prefs.cookFrequency),
    budgetBlock(lang, prefs.budget),
    varietyBlock(lang, prefs.variety),
    "Still hit exact daily calorie/macro targets. Respect allergies and diet constraints above all.",
  ].join("\n");
}
