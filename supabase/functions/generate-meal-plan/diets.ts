import { hasRealDairyEvidence } from "./allergens.ts";
import { termMatches } from "./normalize.ts";
import type { DietRule, MealNorm } from "./types.ts";

const VEGAN_MEAT_FISH_TERMS = [
  "hackfleisch",
  "hähnchen",
  "hahnchen",
  "pute",
  "schwein",
  "fleisch",
  "wurst",
  "schnitzel",
  "schinken",
  "steak",
  "speck",
  "salami",
  "bacon",
  "lachs",
  "thunfisch",
  "fisch",
  "forelle",
  "garnelen",
  "meat",
  "chicken",
  "beef",
  "pork",
  "fish",
  "salmon",
  "tuna",
  "shrimp",
] as const;

const KETO_SAFE_PHRASES = [
  "blumenkohl reis",
  "cauliflower rice",
  "konjac",
  "shirataki",
  "gemüse reis",
  "gemuesereis",
] as const;

export const DIET_RULES: readonly DietRule[] = [
  {
    id: "vegan",
    terms: [
      "honig",
      "honey",
      "gelatine",
      "gelatin",
      "schmalz",
      "lard",
      "leberwurst",
      "albumin",
      "casein",
      "kasein",
      "rennet",
      "lab",
      "talg",
      "suet",
      "tallow",
      "speckfett",
    ],
    fromAllergens: ["eggs", "fish", "shellfish", "lactose", "milk"],
  },
  {
    id: "vegetarian",
    terms: [
      "hackfleisch",
      "hähnchen",
      "pute",
      "schwein",
      "fleisch",
      "wurst",
      "schnitzel",
      "schinken",
      "steak",
      "speck",
      "salami",
      "bacon",
      "currywurst",
      "bratwurst",
      "frikadell",
      "meat",
      "chicken",
      "beef",
      "pork",
      "lachs",
      "thunfisch",
      "fisch",
      "fish",
      "salmon",
      "tuna",
      "forelle",
      "garnelen",
      "shrimp",
    ],
  },
  {
    id: "pescatarian",
    terms: [
      "hackfleisch",
      "hähnchen",
      "pute",
      "schwein",
      "wurst",
      "schnitzel",
      "schinken",
      "steak",
      "speck",
      "salami",
      "bacon",
      "currywurst",
      "bratwurst",
      "frikadell",
      "meat",
      "chicken",
      "beef",
      "pork",
    ],
  },
  {
    id: "low-carb",
    terms: [
      "nudeln",
      "nudel",
      "pasta",
      "spaghetti",
      "brot",
      "brötchen",
      "reis",
      "hafer",
      "müsli",
      "kartoffel",
      "pommes",
      "honig",
      "baguette",
      "toast",
      "lasagne",
      "bulgur",
      "couscous",
      "gnocchi",
      "pizza",
      "bread",
      "rice",
      "potato",
      "oat",
    ],
  },
  {
    id: "paleo",
    terms: [
      "nudel",
      "pasta",
      "spaghetti",
      "brot",
      "brötchen",
      "reis",
      "hafer",
      "müsli",
      "bohnen",
      "linsen",
      "kichererbsen",
      "milch",
      "käse",
      "joghurt",
      "quark",
      "sahne",
      "paniermehl",
      "baguette",
    ],
  },
];

export const DIET_RULE_BY_ID = new Map(DIET_RULES.map((r) => [r.id, r]));

export function scrubKetoSafeBlob(blob: string): string {
  let out = blob;
  for (const phrase of KETO_SAFE_PHRASES) {
    out = out.replaceAll(phrase, " ");
  }
  return out;
}

export function dietRuleMatches(
  rule: DietRule,
  norm: MealNorm,
  present: Set<string>,
  blobOverride?: string,
): boolean {
  const blob = blobOverride ?? norm.blob;
  const normView = blobOverride ? { ...norm, blob } : norm;
  if (rule.fromAllergens?.some((id) => present.has(id))) return true;
  if (rule.terms.some((term) => termMatches(normView, term))) return true;
  return (rule.phrases ?? []).some((phrase) => blob.includes(phrase.toLowerCase()));
}

function veganDirectViolation(norm: MealNorm): boolean {
  if (VEGAN_MEAT_FISH_TERMS.some((term) => termMatches(norm, term))) return true;
  if (hasRealDairyEvidence(norm)) return true;
  return false;
}

export function detectDietViolations(norm: MealNorm, present: Set<string>, prefs: string[]): string[] {
  const hit: string[] = [];
  const lowCarbBlob = scrubKetoSafeBlob(norm.blob);

  if (prefs.includes("vegan")) {
    const rule = DIET_RULE_BY_ID.get("vegan");
    if (rule && dietRuleMatches(rule, norm, present)) hit.push("vegan");
    if (!hit.includes("vegan") && veganDirectViolation(norm)) hit.push("vegan");
  }
  if (prefs.includes("vegetarian") && !prefs.includes("vegan")) {
    const rule = DIET_RULE_BY_ID.get("vegetarian");
    if (rule && dietRuleMatches(rule, norm, present)) hit.push("vegetarian");
  }
  if (prefs.includes("pescatarian")) {
    const rule = DIET_RULE_BY_ID.get("pescatarian");
    if (rule && dietRuleMatches(rule, norm, present)) hit.push("pescatarian");
  }
  if (prefs.includes("keto") || prefs.includes("low-carb")) {
    const rule = DIET_RULE_BY_ID.get("low-carb");
    if (rule && dietRuleMatches(rule, norm, present, lowCarbBlob)) hit.push("low-carb");
  }
  if (prefs.includes("paleo")) {
    const rule = DIET_RULE_BY_ID.get("paleo");
    if (rule && dietRuleMatches(rule, norm, present)) hit.push("paleo");
  }
  return [...new Set(hit)];
}
