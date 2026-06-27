import { getMealNorm, termMatches } from "./normalize.ts";
import type { Lang, MealLike, MealNorm } from "./types.ts";

/** Weekly plans must never include pork or typical pork products. */
export const PORK_TERMS = [
  "schwein",
  "schweine",
  "schweinefleisch",
  "schweinehack",
  "schweinehackfleisch",
  "schweinesteak",
  "schweinekotelett",
  "schweinebauch",
  "schweinebraten",
  "schweinerippchen",
  "schweinemedaillons",
  "schweine medaillons",
  "schweineschnitzel",
  "schweinshaxe",
  "schweinewurst",
  "pork",
  "bacon",
  "speck",
  "schinken",
  "pancetta",
  "prosciutto",
  "guanciale",
  "ham",
  "pepperoni",
  "salami",
] as const;

export function normContainsPork(norm: MealNorm): boolean {
  return PORK_TERMS.some((term) => termMatches(norm, term));
}

export function mealContainsPork(meal: MealLike): boolean {
  return normContainsPork(getMealNorm(meal));
}

export function buildNoPorkConstraintBlock(lang: Lang): string {
  if (lang === "de") {
    return [
      "KEIN SCHWEIN (Pflicht): Kein Schweinefleisch und keine Schweineprodukte.",
      "Verboten u. a.: Schwein, Schweinehack, Schweinesteak, Speck, Schinken, Bacon, Pancetta, Prosciutto, Pork.",
      "Stattdessen: Rind, Hähnchen, Pute, Fisch — oder vegetarisch/vegan je nach Ernährung.",
    ].join("\n");
  }
  if (lang === "fr") {
    return [
      "PAS DE PORC (obligatoire): aucune viande de porc ni produits du porc (bacon, jambon, lard, prosciutto, etc.).",
      "Utiliser bœuf, poulet, dinde, poisson — ou végétarien selon le régime.",
    ].join("\n");
  }
  return [
    "NO PORK (mandatory): no pork meat or pork products (bacon, ham, prosciutto, pancetta, pork chops, etc.).",
    "Use beef, chicken, turkey, fish — or vegetarian options as appropriate.",
  ].join("\n");
}
