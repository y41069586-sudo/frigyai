import type { Lang } from "./types.ts";
import { resolveDietKey } from "./dietPools.ts";

const CUISINE: Record<Lang, Record<string, string>> = {
  de: {
    balanced:
      "ERNÄHRUNGSFORM: Ausgewogen. Normale Hausmannskost & Alltagsgerichte (Reis mit Hackfleisch, Nudeln mit Soße, Schnitzel mit Kartoffeln, Hähnchen mit Reis, Eintopf, Salat, Omelett).",
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
    balanced: "DIET: Balanced. Normal international everyday food (pasta, rice, chicken, fish, salad, eggs).",
    vegan: "DIET: VEGAN (mandatory). NO meat, fish, eggs, dairy, honey. Plant-only proteins and ingredients.",
    vegetarian: "DIET: VEGETARIAN (mandatory). NO meat or fish. Eggs and dairy allowed.",
    keto: "DIET: KETO (mandatory). NO pasta, bread, rice, potatoes, cereal, sugar. High fat, moderate protein, very low carb.",
    "low-carb": "DIET: LOW-CARB. Small portions of grains; focus protein + vegetables.",
    paleo: "DIET: PALEO. NO grains, legumes, or dairy. Meat, fish, eggs, vegetables, nuts.",
  },
  fr: {
    balanced: "RÉGIME: Équilibré. Cuisine internationale du quotidien (pâtes, riz, poulet, poisson, salade).",
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
  const total = 7 * mealsPerDay;
  if (lang === "de") {
    return [
      `NEUER Wochenplan (${mealsPerDay} Mahlzeiten/Tag, ${total} Mahlzeiten gesamt).`,
      "Normale Hausmannskost — wie im Supermarkt/Rezeptbuch: Reis Hackfleisch, Nudeln Bolognese, Kartoffelsuppe. Keine exotischen oder Restaurant-Gerichte.",
      "JEDE Mahlzeit an JEDEM Tag ein anderer Gerichtname — nicht dieselben Gerichte die ganze Woche wiederholen.",
      "Makros pro Mahlzeit realistisch unterschiedlich (leichter Snack weniger kcal, große Hauptmahlzeit mehr) — nicht jede Mahlzeit gleich groß.",
    ].join(" ");
  }
  if (lang === "fr") {
    return [
      `NOUVEAU plan (${mealsPerDay} repas/jour, ${total} repas).`,
      "Cuisine internationale simple du quotidien.",
      "Chaque repas de chaque jour = plat différent.",
      "Calories par repas variables et réalistes (collation légère, repas principal plus copieux).",
    ].join(" ");
  }
  return [
    `NEW weekly plan (${mealsPerDay} meals/day, ${total} meals total).`,
    "Normal international everyday meals — varied but approachable.",
    "Every meal on every day = different dish name.",
    "Macros per meal should vary naturally (light snack smaller, main meal larger) — not every meal the same size.",
  ].join(" ");
}

export function buildEverydayDishExample(lang: Lang): string {
  if (lang === "de") return "Reis mit Hackfleisch";
  if (lang === "fr") return "Riz bœuf haché";
  return "Chicken and rice";
}

export function buildCalorieAwareDishBlock(
  dailyCalories: number,
  mealsPerDay: number,
  lang: Lang,
): string {
  const perMeal = Math.round(dailyCalories / Math.max(mealsPerDay, 1));
  if (lang === "de") {
    if (dailyCalories <= 1400) {
      return [
        `KALORIEN-BUDGET: Nur ${dailyCalories} kcal/Tag (~${perMeal} kcal/Mahlzeit).`,
        "Wähle LEICHTE Gerichte: Suppe, Salat, Joghurt, Obst, Omelett, Gemüsepfanne.",
        "VERBOTEN bei diesem Budget: Wrap, Burger, Schnitzel, Pizza, Pasta große Portion, Leberkäse-Semmel.",
        "Jedes Gericht muss zum Budget passen — nicht denselben Wrap mit unrealistisch wenigen kcal.",
      ].join(" ");
    }
    if (dailyCalories <= 1800) {
      return [
        `KALORIEN-BUDGET: ${dailyCalories} kcal/Tag (~${perMeal} kcal/Mahlzeit).`,
        "Hauptmahlzeiten moderat (Salat, Reis mit Gemüse, Omelett, leichte Pfanne).",
        "Keine doppelten schweren Gerichte (max. 1× Wrap/Burger/Schnitzel pro Woche).",
      ].join(" ");
    }
    return [
      `KALORIEN-BUDGET: ${dailyCalories} kcal/Tag.`,
      "Hauptmahlzeiten dürfen kräftiger sein (450–750 kcal), Snacks leichter (150–350 kcal).",
      "Gerichtname und Portionsgröße müssen zusammenpassen — keine Fantasie-kcal.",
    ].join(" ");
  }
  return [
    `CALORIE BUDGET: ${dailyCalories} kcal/day (~${perMeal} kcal/meal).`,
    "Pick dishes that realistically fit the budget — no heavy wrap/burger on a 1200 kcal day.",
    "Snack smaller, main meals larger; dish names must match portion realism.",
  ].join(" ");
}

export function buildSimpleFoodStyleBlock(lang: Lang, mealsPerDay: number): string {
  const total = 7 * mealsPerDay;
  if (lang === "de") {
    return [
      "STIL: Normale deutsche & internationale Hausmannskost — einfache Gerichte, die jeder kennt.",
      "BEISPIELE (gut): Reis mit Hackfleisch, Spaghetti Bolognese, Hähnchen mit Kartoffeln, Nudeln mit Tomatensoße, Kartoffelsuppe, Omelett mit Brot, Putenschnitzel mit Salat.",
      "VERMEIDEN: Exotische Küche, Fine Dining, seltene Zutaten (Ente, Lamm, Garnelen als Standard), englische Marketing-Namen (Bowl, Tacos, Tikka, Risotto-Safran) — kurze verständliche Namen auf Deutsch.",
      "KEIN SCHWEIN: Kein Schweinefleisch, Speck, Schinken, Bacon oder andere Schweineprodukte.",
      "NAMEN: Jede Mahlzeit braucht einen echten Gerichtnamen — niemals „Hauptgericht 1“, „Mahlzeit 2“ o. ä.",
      `VARIATION: ${total} verschiedene Gerichtnamen in der Woche.`,
      "MAKROS: Pro Mahlzeit unterschiedliche realistische Größe (Snack ~150–350 kcal, Hauptmahlzeit ~450–750 kcal) — Tagesziel trotzdem exakt einhalten.",
    ].join("\n");
  }
  if (lang === "fr") {
    return [
      "STYLE: Cuisine internationale quotidienne variée.",
      `VARIÉTÉ: ${total} noms de plats différents.`,
      "MACROS: Tailles de repas réalistes et différentes; objectif journalier respecté.",
    ].join("\n");
  }
  return [
    "STYLE: Normal international everyday food (Italian, Asian-inspired, Mediterranean, American — mixed).",
    `VARIETY: ${total} unique dish names across the week.`,
    "MACROS: Realistic different meal sizes (snack ~150–350 kcal, main ~450–750 kcal); daily totals must still match targets.",
  ].join("\n");
}
