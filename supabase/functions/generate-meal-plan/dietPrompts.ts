import type { Lang } from "./types.ts";
import { resolveDietKey } from "./dietPools.ts";

const CUISINE: Record<Lang, Record<string, string>> = {
  de: {
    balanced:
      "ERNÄHRUNGSFORM: Ausgewogen. Erlaubt: Fleisch, Fisch, Eier, Milch, Vollkorn. Abwechslungsreiche Alltagsküche.",
    vegan:
      "ERNÄHRUNGSFORM: VEGAN (Pflicht). KEIN Fleisch, Fisch, Eier, Milch, Honig, Gelatine. Nur pflanzlich: Tofu, Tempeh, Linsen, Kichererbsen, Hülsenfrüchte, Gemüse, Nüsse, Hafer, pflanzliche Milch.",
    vegetarian:
      "ERNÄHRUNGSFORM: VEGETARISCH (Pflicht). KEIN Fleisch, kein Fisch. Erlaubt: Eier, Milchprodukte, Hülsenfrüchte, Gemüse.",
    keto:
      "ERNÄHRUNGSFORM: KETO (Pflicht). Sehr wenig Kohlenhydrate. KEINE Pasta, Brot, Reis, Kartoffeln, Müsli, Zucker. Erlaubt: Fleisch, Fisch, Eier, Käse, Avocado, Gemüse, Nüsse.",
    "low-carb":
      "ERNÄHRUNGSFORM: KOHLENHYDRATARM. Wenig Reis, Pasta, Brot, Kartoffeln. Fokus: Protein + Gemüse + gesunde Fette.",
    paleo:
      "ERNÄHRUNGSFORM: PALEO. KEIN Getreide, KEINE Hülsenfrüchte, KEINE Milchprodukte. Fleisch, Fisch, Eier, Gemüse, Nüsse, Obst.",
  },
  en: {
    balanced: "DIET: Balanced. Meat, fish, eggs, dairy, whole grains allowed.",
    vegan: "DIET: VEGAN (mandatory). NO meat, fish, eggs, dairy, honey. Plant-only proteins and ingredients.",
    vegetarian: "DIET: VEGETARIAN (mandatory). NO meat or fish. Eggs and dairy allowed.",
    keto: "DIET: KETO (mandatory). NO pasta, bread, rice, potatoes, cereal, sugar. High fat, moderate protein, very low carb.",
    "low-carb": "DIET: LOW-CARB. Small portions of grains; focus protein + vegetables.",
    paleo: "DIET: PALEO. NO grains, legumes, or dairy. Meat, fish, eggs, vegetables, nuts.",
  },
  fr: {
    balanced: "RÉGIME: Équilibré. Viande, poisson, œufs, produits laitiers autorisés.",
    vegan: "RÉGIME: VÉGAN (obligatoire). AUCUNE viande, poisson, œufs, lait, miel. Uniquement végétal.",
    vegetarian: "RÉGIME: VÉGÉTARIEN. Pas de viande ni poisson. Œufs et produits laitiers autorisés.",
    keto: "RÉGIME: CÉTO. PAS de pâtes, pain, riz, pommes de terre, sucre.",
    "low-carb": "RÉGIME: FAIBLE EN GLUCIDES. Protéines + légumes.",
    paleo: "RÉGIME: PALÉO. Pas de céréales, légumineuses ni produits laitiers.",
  },
};

const FORBID_CROSS: Record<string, string[]> = {
  vegan: ["chicken", "hähnchen", "beef", "rind", "salmon", "lachs", "fish", "fisch", "egg", "ei", "cheese", "käse", "milk", "milch", "yogurt", "joghurt"],
  keto: ["pasta", "nudel", "bread", "brot", "rice", "reis", "potato", "kartoffel", "müsli", "oatmeal hafer only small"],
  vegetarian: ["chicken", "hähnchen", "beef", "salmon", "lachs", "fish", "fisch", "tuna", "thunfisch"],
};

export function buildDietMandatoryBlock(lang: Lang, prefs: string[]): string {
  const key = resolveDietKey(prefs);
  const line = CUISINE[lang][key] ?? CUISINE[lang].balanced;
  const forbid = FORBID_CROSS[key];
  if (!forbid?.length) return line;
  return `${line}\nVERBOTEN in diesem Plan: ${forbid.slice(0, 12).join(", ")}.`;
}

export function buildRegenerationUserPrompt(mealsPerDay: number, lang: Lang): string {
  const days =
    lang === "en"
      ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      : lang === "fr"
        ? ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
        : ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  const cuisines =
    lang === "de"
      ? ["mediterran", "asiatisch", "mexikanisch", "nahöstlich", "italienisch", "indisch", "deutsch-leicht"]
      : lang === "fr"
        ? ["méditerranéen", "asiatique", "mexicain", "moyen-orient", "italien", "indien", "français léger"]
        : ["Mediterranean", "Asian", "Mexican", "Middle Eastern", "Italian", "Indian", "American"];
  const dayCuisine = days.map((d, i) => `${d}=${cuisines[i]}`).join(", ");
  if (lang === "de") {
    return [
      `NEUER Wochenplan (${mealsPerDay} Mahlzeiten/Tag).`,
      "WICHTIG: Nicht die alten Gerichte auf andere Wochentage verschieben oder umbenennen.",
      "Jede einzelne Mahlzeit = komplett neues Rezept (andere Hauptzutaten, andere Zubereitung, anderer Stil).",
      `Küchen-Rotation pro Tag: ${dayCuisine}.`,
      "Keine Wiederholung derselben Gericht-Idee in der Woche.",
    ].join(" ");
  }
  if (lang === "fr") {
    return [
      `NOUVEAU plan (${mealsPerDay} repas/jour).`,
      "Ne pas déplacer les anciens plats sur d'autres jours.",
      "Chaque repas = nouvelle recette (nouveaux ingrédients principaux).",
      `Cuisines par jour: ${dayCuisine}.`,
    ].join(" ");
  }
  return [
    `NEW weekly plan (${mealsPerDay} meals/day).`,
    "Do NOT shuffle old dishes to different weekdays or rename them.",
    "Every meal = brand-new recipe (different main ingredients and cooking style).",
    `Cuisine rotation: ${dayCuisine}.`,
  ].join(" ");
}
