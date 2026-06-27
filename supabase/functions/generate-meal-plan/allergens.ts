import { ALLERGY_ID_ALIASES } from "./constants.ts";
import { getMealNorm, termMatches, termMatchesWordBoundary } from "./normalize.ts";
import type { AllergenRule, MealLike, MealNorm } from "./types.ts";

/** If trigger phrase appears without real allergen evidence → drop false classification. */
type AllergenFalsePositive = {
  allergenId: string;
  triggerPhrases: readonly string[];
};

export const ALLERGEN_FALSE_POSITIVES: readonly AllergenFalsePositive[] = [
  { allergenId: "eggs", triggerPhrases: ["eggplant", "aubergine", "auberginen", "melanzane"] },
  { allergenId: "nuts", triggerPhrases: ["kokosnuss", "kokos", "coconut"] },
  { allergenId: "treeNuts", triggerPhrases: ["kokosnuss", "kokos", "coconut"] },
  { allergenId: "lactose", triggerPhrases: ["laktosefrei", "lactose-free", "milchfrei", "dairy-free"] },
  { allergenId: "gluten", triggerPhrases: ["glutenfrei", "gluten-free"] },
];

/** Plant-based „scramble“ — not real eggs (avoids „Tofu Rührei“ false positive). */
const TOFU_SCRAMBLE_MARKERS = [
  "tofu scramble",
  "tofu-scramble",
  "tofu rührei",
  "tofu brouille",
  "tofu-rührei",
] as const;

/** Dishes with „milch“ in the name but real dairy — do not strip via plant-milk guard. */
export const DAIRY_DISH_MARKERS = [
  "milchreis",
  "milchsuppe",
  "milch suppe",
  "rice pudding",
  "bread pudding",
] as const;

/** Plant milks — never imply dairy milk/lactose unless separate dairy evidence exists. */
export const PLANT_MILK_PHRASES = [
  "pflanzenmilch",
  "hafermilch",
  "sojamilch",
  "reismilch",
  "kokosmilch",
  "cashewmilch",
  "oat milk",
  "soy milk",
  "almond milk",
  "rice milk",
  "plant milk",
  "lait vegetal",
  "lait d avoine",
] as const;

/** Dairy indicators excluding bare "milch" (handled via plant-milk guard). */
export const DAIRY_EVIDENCE_TERMS = [
  "käse",
  "joghurt",
  "quark",
  "sahne",
  "butter",
  "mozzarella",
  "parmesan",
  "frischkäse",
  "emmental",
  "cheddar",
  "ricotta",
  "schmand",
  "lactose",
  "cheese",
  "yogurt",
  "cream",
  "whey",
  "molke",
  "casein",
  "kasein",
  "ghee",
  "buttermilk",
  "buttermilch",
  "rahm",
  "mascarpone",
  "gruyere",
  "gouda",
] as const;

export const ALLERGEN_RULES: readonly AllergenRule[] = [
  {
    ids: ["gluten"],
    terms: [
      "brot",
      "brötchen",
      "nudel",
      "nudeln",
      "pasta",
      "spaghetti",
      "paniermehl",
      "couscous",
      "bulgur",
      "lasagne",
      "pizza",
      "gnocchi",
      "weizen",
      "dinkel",
      "rogge",
      "gerste",
      "wrap",
      "mehl",
      "baguette",
      "toast",
      "pizzateig",
      "panko",
      "semmel",
      "bread",
      "wheat",
      "flour",
      "semolina",
      "durum",
      "crouton",
      "croutons",
      "seitan",
      "brösel",
      "breadcrumbs",
      "grieß",
      "spelt",
      "kamut",
      "teriyaki",
      "caesar",
      "tortilla",
      "tempura",
      "udon",
      "ramen",
      "grünkern",
    ],
    phrases: [
      "soy sauce",
      "sojasauce",
      "bechamel",
      "béchamel",
      "roux",
      "mehlsauce",
      "paniermehl panade",
      "tempura batter",
    ],
  },
  {
    ids: ["lactose", "milk"],
    terms: [
      "milch",
      "käse",
      "joghurt",
      "quark",
      "sahne",
      "butter",
      "mozzarella",
      "parmesan",
      "frischkäse",
      "emmental",
      "cheddar",
      "ricotta",
      "schmand",
      "lactose",
      "milk",
      "cheese",
      "yogurt",
      "cream",
      "whey",
      "molke",
    ],
    phrases: ["crème fraîche", "hollandaise", "bechamel", "béchamel", "käsesauce", "cheese sauce", "alfredo"],
  },
  {
    ids: ["nuts", "treeNuts"],
    terms: [
      "mandel",
      "haselnuss",
      "walnuss",
      "cashew",
      "pistaz",
      "paranuss",
      "macadam",
      "pekannuss",
      "nussmus",
      "almond",
      "hazelnut",
      "walnut",
      "pecan",
      "nuss",
      "nüsse",
    ],
  },
  {
    ids: ["peanuts"],
    terms: ["erdnuss", "erdnüsse", "peanut", "peanuts", "erdnussbutter", "erdnussmus"],
    phrases: ["satay sauce", "satay"],
  },
  {
    ids: ["soy"],
    terms: ["soja", "soy", "tofu", "tempeh", "edamame", "sojasauce", "miso"],
  },
  {
    ids: ["eggs"],
    terms: ["ei", "eier", "egg", "eggs", "omelett", "omelette", "rührei", "mayonnaise", "mayo", "carbonara"],
    phrases: ["hollandaise", "carbonara sauce", "caesar dressing", "caesar salat"],
  },
  {
    ids: ["fish"],
    terms: [
      "fisch",
      "lachs",
      "thunfisch",
      "forelle",
      "seelachs",
      "kabeljau",
      "sardine",
      "makrele",
      "fish",
      "salmon",
      "tuna",
      "cod",
    ],
    phrases: ["fish sauce", "fischsauce", "anchovy", "anchovis", "sardellen", "worcestershire"],
  },
  {
    ids: ["shellfish"],
    terms: [
      "garnele",
      "garnelen",
      "shrimp",
      "krabbe",
      "krebs",
      "hummer",
      "muschel",
      "auster",
      "scampi",
      "crab",
      "mussel",
    ],
  },
];

/** Pre-index single-token terms → allergen IDs (built once). */
export const TERM_TO_ALLERGEN_IDS = new Map<string, string[]>();
/** Multi-word terms + rule phrases → allergen IDs (substring match on blob). */
export const PHRASE_TO_ALLERGEN_IDS = new Map<string, string[]>();

function indexAllergenPhrase(phrase: string, ids: readonly string[]) {
  const key = phrase.toLowerCase().trim();
  if (!key) return;
  const existing = PHRASE_TO_ALLERGEN_IDS.get(key) ?? [];
  for (const id of ids) {
    if (!existing.includes(id)) existing.push(id);
  }
  PHRASE_TO_ALLERGEN_IDS.set(key, existing);
}

for (const rule of ALLERGEN_RULES) {
  for (const term of rule.terms) {
    const key = term.toLowerCase();
    if (key.includes(" ")) {
      indexAllergenPhrase(key, rule.ids);
      continue;
    }
    const existing = TERM_TO_ALLERGEN_IDS.get(key) ?? [];
    for (const id of rule.ids) {
      if (!existing.includes(id)) existing.push(id);
    }
    TERM_TO_ALLERGEN_IDS.set(key, existing);
  }
  for (const phrase of rule.phrases ?? []) {
    indexAllergenPhrase(phrase, rule.ids);
  }
}

export const ALLERGEN_RULE_BY_ID = new Map<string, AllergenRule>();
for (const rule of ALLERGEN_RULES) {
  for (const id of rule.ids) {
    ALLERGEN_RULE_BY_ID.set(id, rule);
  }
}

export function normalizeAllergyId(id: string): string {
  return ALLERGY_ID_ALIASES[id] || id;
}

function scrubPlantMilkPhrases(blob: string): string {
  let out = blob;
  for (const phrase of PLANT_MILK_PHRASES) {
    out = out.split(phrase).join(" ");
  }
  return out.replace(/\s+/g, " ").trim();
}

export function hasRealDairyEvidence(norm: MealNorm): boolean {
  if (DAIRY_DISH_MARKERS.some((m) => norm.blob.includes(m) || norm.compact.includes(m.replace(/\s+/g, "")))) {
    return true;
  }
  if (DAIRY_EVIDENCE_TERMS.some((term) => termMatches(norm, term))) return true;
  const withoutPlant = scrubPlantMilkPhrases(norm.blob);
  return (
    termMatchesWordBoundary(withoutPlant, "milch") ||
    termMatchesWordBoundary(withoutPlant, "milk") ||
    norm.tokens.includes("milch") ||
    norm.tokens.includes("milk")
  );
}

function stripPlantMilkFalseDairy(present: Set<string>, norm: MealNorm): void {
  if (!present.has("milk") && !present.has("lactose")) return;
  const hasPlantMilk = PLANT_MILK_PHRASES.some((p) =>
    norm.blob.includes(p) || norm.compact.includes(p.replace(/\s+/g, ""))
  );
  if (!hasPlantMilk) return;
  if (hasRealDairyEvidence(norm)) return;
  present.delete("milk");
  present.delete("lactose");
}

function indexPhraseAllergens(present: Set<string>, norm: MealNorm): void {
  for (const [phrase, ids] of PHRASE_TO_ALLERGEN_IDS) {
    const phraseCompact = phrase.replace(/\s+/g, "");
    if (!norm.blob.includes(phrase) && !norm.compact.includes(phraseCompact)) continue;
    for (const id of ids) present.add(id);
  }
}

function isDairyAllergenRule(rule: AllergenRule): boolean {
  return rule.ids.includes("milk") || rule.ids.includes("lactose");
}

/** Dairy rule: bare „milch“/„milk“ only via hasRealDairyEvidence (plant-milk safe). */
function ruleTextEvidence(norm: MealNorm, rule: AllergenRule): boolean {
  if (isDairyAllergenRule(rule)) {
    if (hasRealDairyEvidence(norm)) return true;
    const otherTerms = rule.terms.filter((t) => t !== "milch" && t !== "milk");
    if (otherTerms.some((term) => termMatches(norm, term))) return true;
    return (rule.phrases ?? []).some((phrase) => norm.blob.includes(phrase.toLowerCase()));
  }
  if (rule.terms.some((term) => termMatches(norm, term))) return true;
  return (rule.phrases ?? []).some((phrase) => norm.blob.includes(phrase.toLowerCase()));
}

function applyFalsePositiveFilters(present: Set<string>, norm: MealNorm): void {
  for (const fp of ALLERGEN_FALSE_POSITIVES) {
    if (!present.has(fp.allergenId)) continue;
    const triggered = fp.triggerPhrases.some((p) => norm.blob.includes(p));
    if (!triggered) continue;
    const rule = ALLERGEN_RULE_BY_ID.get(fp.allergenId);
    if (rule && !ruleTextEvidence(norm, rule)) {
      present.delete(fp.allergenId);
    }
  }
}

export function classifyPresentAllergens(norm: MealNorm, aiTags: string[]): Set<string> {
  const present = new Set<string>();

  for (const token of norm.tokens) {
    for (const id of TERM_TO_ALLERGEN_IDS.get(token) ?? []) present.add(id);
  }
  indexPhraseAllergens(present, norm);
  for (const rule of ALLERGEN_RULES) {
    if (ruleTextEvidence(norm, rule)) {
      for (const id of rule.ids) present.add(id);
    }
  }
  for (const raw of aiTags) {
    const id = normalizeAllergyId(raw);
    if (id && id !== "none") present.add(id);
  }
  stripPlantMilkFalseDairy(present, norm);
  applyFalsePositiveFilters(present, norm);
  if (present.has("eggs") && isTofuScrambleDish(norm)) {
    present.delete("eggs");
  }
  return present;
}

function isTofuScrambleDish(norm: MealNorm): boolean {
  if (TOFU_SCRAMBLE_MARKERS.some((m) => norm.blob.includes(m))) return true;
  return norm.tokens.includes("tofu") && norm.blob.includes("rührei");
}

export function activeUserAllergyIds(allergies: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of allergies) {
    if (!raw || raw === "none" || raw === "other") continue;
    const id = normalizeAllergyId(raw);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function mealAllergenTags(meal: MealLike): string[] {
  const raw = meal?.allergenTags;
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => normalizeAllergyId(String(t))).filter((t) => t && t !== "none");
}

/** Convenience: classify from a meal object directly. */
export function mealPresentAllergens(meal: MealLike): Set<string> {
  return classifyPresentAllergens(getMealNorm(meal), mealAllergenTags(meal));
}
