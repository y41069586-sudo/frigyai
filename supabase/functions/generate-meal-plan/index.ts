// generate-meal-plan — single file for Supabase Dashboard deploy.
// Regenerate: deno run --allow-read --allow-write scripts/inline-index.ts
// Edit auth.ts, macros.ts, … then run the script; paste/deploy only this index.ts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.24.1";
import { zodToJsonSchema } from "https://esm.sh/zod-to-json-schema@3.23.5?target=deno";

/// <reference lib="deno.ns" />

// ----- types.ts -----
export type Lang = "de" | "en" | "fr";

export type MacroTargets = {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
};

export type Ingredient = {
  name: string;
  amount: string;
  price: number;
};

export type Meal = {
  type: string;
  name: string;
  prepTime: number;
  ingredients: Ingredient[];
  instructions: string[];
  allergenTags: string[];
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

export type MealLike = {
  type?: string;
  name?: string;
  prepTime?: number;
  ingredients?: Array<{ name?: string; amount?: string; price?: number }>;
  instructions?: unknown[];
  allergenTags?: unknown[];
  protein?: number;
  carbs?: number;
  fat?: number;
  calories?: number;
};

export type DayPlan = {
  day: string;
  meals: Meal[];
};

export type MealPlan = DayPlan[];

export type MealNorm = {
  blob: string;
  compact: string;
  tokens: string[];
  key: string;
};

export type AllergenRule = {
  ids: readonly string[];
  terms: readonly string[];
  phrases?: readonly string[];
};

export type DietRule = {
  id: string;
  terms: readonly string[];
  phrases?: readonly string[];
  fromAllergens?: readonly string[];
};

export type SafetyContext = {
  allergies: string[];
  prefs: string[];
  other: string;
  userAllergieIds: string[];
  customTerms: string[];
};

export type MealSafetyReasons = {
  allergy: string[];
  diet: string[];
};

export type SafetyViolation = {
  day: string;
  mealName: string;
  allergy: string[];
  diet: string[];
};

export type MacroReconcileWarning = {
  type: "macros_primary" | "kcal_scaled" | "ratio_clamped";
  statedKcal: number;
  impliedKcal: number;
  appliedKcal: number;
  message: string;
};

export type MacroAuthority = "harmonized" | "macros" | "scaled_to_kcal";

export type ReconcileResult = {
  targets: MacroTargets;
  macroAuthority: MacroAuthority;
  warning?: MacroReconcileWarning;
};

export type PlanInput = {
  mealsPerDay: number;
  targets: MacroTargets;
  prefs: string[];
  allergies: string[];
  other: string;
  goals: string[];
  lang: Lang;
  fridge: string[];
  banned: string[];
  constraints: string;
  safetyCtx: SafetyContext;
  /** User tapped regenerate — require all-new dishes (not just titles). */
  isRegeneration?: boolean;
  /** Client seed to shuffle fallback pools. */
  varietySeed?: string;
  /** Prior week meals for dish-level dedup (ingredients + fingerprints). */
  priorDishes?: PriorDishSnapshot[];
};

export type PriorDishSnapshot = {
  name: string;
  mainIngredients: string[];
  contentKey: string;
  fingerprint: string;
};

export type BuildPlanResult = {
  plan: MealPlan;
  usedAi: boolean;
  repairAttempts: number;
};

/** Injectable dependencies for buildPlan (tests / future AI backends). */
export type BuildPlanDeps = {
  generateAIDraft: (input: PlanInput) => Promise<MealPlan | null>;
};

export type ShoppingItem = {
  name: string;
  amount: string;
  price: number;
};

export type ScanMeta = {
  percentIngredientsFromFridge: number;
  estimatedEurosSaved: number;
};

// ----- constants.ts -----
/** Supabase secret: `OPENAI_API_KEY` (legacy `OPEN_AI_KEY` logged once if used). */
export function getOpenAIKey(): string | undefined {
  const primary = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (primary) return primary;
  const legacy = Deno.env.get("OPEN_AI_KEY")?.trim();
  if (legacy) console.warn("[MEAL-PLAN] Use OPENAI_API_KEY; OPEN_AI_KEY is deprecated");
  return legacy || undefined;
}

export const LANG: Record<Lang, { days: string[]; meal: string; lang: string }> = {
  de: {
    days: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    meal: "Mahlzeit",
    lang: "Deutsch",
  },
  en: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    meal: "Meal",
    lang: "English",
  },
  fr: {
    days: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
    meal: "Repas",
    lang: "French",
  },
};

export const SLOT_WEIGHTS: Record<number, number[]> = {
  3: [0.28, 0.44, 0.28],
  4: [0.24, 0.38, 0.14, 0.24],
  5: [0.22, 0.32, 0.12, 0.26, 0.08],
};

export const ALLERGEN_TAG_IDS = [
  "gluten",
  "lactose",
  "milk",
  "nuts",
  "treeNuts",
  "peanuts",
  "soy",
  "eggs",
  "fish",
  "shellfish",
  "none",
] as const;

export const ALLERGY_ID_ALIASES: Record<string, string> = {
  wheat: "gluten",
  "tree-nuts": "treeNuts",
  egg: "eggs",
};

export const KCAL_MACRO_TOLERANCE = 50;
export const RECONCILE_RATIO_MIN = 0.85;
export const RECONCILE_RATIO_MAX = 1.15;
export const MACRO_CAPS = { protein: 350, carbs: 600, fat: 250 };

// ----- http.ts -----
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ----- normalize.ts -----
const mealNormCache = new Map<string, MealNorm>();
const MEAL_NORM_CACHE_MAX = 512;

function mealNormCacheGet(key: string): MealNorm | undefined {
  const hit = mealNormCache.get(key);
  if (hit === undefined) return undefined;
  mealNormCache.delete(key);
  mealNormCache.set(key, hit);
  return hit;
}

function mealNormCacheSet(key: string, norm: MealNorm) {
  if (mealNormCache.has(key)) {
    mealNormCache.delete(key);
  } else if (mealNormCache.size >= MEAL_NORM_CACHE_MAX) {
    const lruKey = mealNormCache.keys().next().value;
    if (lruKey) mealNormCache.delete(lruKey);
  }
  mealNormCache.set(key, norm);
}

function accentFold(input: string): string {
  return input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/** Sorted main ingredient names (accent-folded) — dish identity beyond title. */
export function mealMainIngredients(meal: MealLike): string[] {
  return (Array.isArray(meal?.ingredients) ? meal.ingredients : [])
    .map((i) => accentFold(String(i?.name ?? "")))
    .filter((n) => n.length >= 2)
    .sort();
}

/** Fingerprint for variety checks (ingredients only). */
export function mealDishFingerprint(meal: MealLike): string {
  return mealMainIngredients(meal).join("|");
}

export function mealContentKey(meal: MealLike): string {
  const name = String(meal?.name || "").trim();
  const ings = Array.isArray(meal?.ingredients)
    ? meal.ingredients
      .map((i) => `${String(i?.name || "").trim()}:${String(i?.amount || "").trim()}`)
      .join(",")
    : "";
  const instr = Array.isArray(meal?.instructions)
    ? meal.instructions.map((s) => String(s).trim()).join("|")
    : "";
  const tags = Array.isArray(meal?.allergenTags) ? meal.allergenTags.join(",") : "";
  return `${name}|${ings}|${instr}|${tags}`.toLowerCase();
}

/** Single text pipeline: accent-stripped blob + compact form + token list. */
export function normalizeText(input: string): Omit<MealNorm, "key"> {
  const accent = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const blob = accent.replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
  const compact = blob.replace(/\s+/g, "");
  const tokenSet = new Set<string>();
  for (const piece of blob.split(/[\s,;+()]+/)) {
    const t = piece.trim();
    if (t.length >= 2) tokenSet.add(t);
  }
  for (const piece of accent.split(/[-_/]+/)) {
    const t = piece.trim();
    if (t.length >= 2) tokenSet.add(t);
  }
  return { blob, compact, tokens: [...tokenSet] };
}

export function getMealNorm(meal: MealLike): MealNorm {
  const contentKey = mealContentKey(meal);
  const cached = mealNormCacheGet(contentKey);
  if (cached) return cached;

  const parts = [
    String(meal?.name || ""),
    ...(Array.isArray(meal?.ingredients) ? meal.ingredients.map((i) => String(i?.name || "")) : []),
    ...(Array.isArray(meal?.instructions) ? meal.instructions.map((s) => String(s)) : []),
  ];
  const norm = { ...normalizeText(parts.join(" ")), key: contentKey };
  mealNormCacheSet(contentKey, norm);
  return norm;
}

export function normKey(s: string): string {
  return normalizeText(s).blob;
}

export function normNameKey(s: string): string {
  return normalizeText(s).blob;
}

function isTermBoundaryChar(c: string): boolean {
  return c === " " || c === "," || c === ";" || c === "+" || c === "(" || c === ")" || c === "/" || c === "-";
}

/** String-based word boundary — no RegExp allocation per call. */
export function termMatchesWordBoundary(haystack: string, needle: string): boolean {
  if (!needle || !haystack) return false;
  let from = 0;
  while (from <= haystack.length) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) return false;
    const leftOk = idx === 0 || isTermBoundaryChar(haystack[idx - 1]!);
    const rightIdx = idx + needle.length;
    const rightOk = rightIdx >= haystack.length || isTermBoundaryChar(haystack[rightIdx]!);
    if (leftOk && rightOk) return true;
    from = idx + 1;
  }
  return false;
}

const EGG_TERMS = new Set(["egg", "eggs", "ei", "eier"]);
const FISH_TERMS = new Set(["fish", "fisch"]);
/** Short tokens that still need boundary matching (never skip via length heuristic). */
const SHORT_BOUNDARY_TERMS = new Set([...EGG_TERMS, ...FISH_TERMS, "soy", "soja"]);
const EGGPLANT_MARKERS = ["eggplant", "aubergine", "auberginen"];
const SHELLFISH_MARKERS = ["shellfish", "garnele", "garnelen", "shrimp", "krabbe", "muschel", "scampi"];

function normHasMarker(norm: MealNorm, markers: readonly string[]): boolean {
  return markers.some((m) => norm.tokens.includes(m) || norm.blob.includes(m));
}

export function termMatches(norm: MealNorm, term: string): boolean {
  const t = accentFold(term).replace(/[-_/]+/g, " ");
  if (!t) return false;
  const tCompact = t.replace(/\s+/g, "");
  if (t.includes(" ")) {
    return norm.blob.includes(t) || norm.compact.includes(tCompact);
  }
  if (norm.tokens.includes(t)) return true;
  if (t.length <= 3 && !SHORT_BOUNDARY_TERMS.has(t)) {
    return false;
  }
  if (t.length <= 3) {
    if (EGG_TERMS.has(t) && normHasMarker(norm, EGGPLANT_MARKERS)) return false;
    return termMatchesWordBoundary(norm.blob, t);
  }
  if (EGG_TERMS.has(t) && normHasMarker(norm, EGGPLANT_MARKERS)) return false;
  if (FISH_TERMS.has(t) && normHasMarker(norm, SHELLFISH_MARKERS)) return false;
  if (termMatchesWordBoundary(norm.blob, t)) return true;
  if (t.length >= 5 && norm.compact.includes(tCompact)) return true;
  return false;
}

// ----- allergens.ts -----
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

// ----- diets.ts -----
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

// ----- macros.ts -----
export function macroKcal(p: number, c: number, f: number) {
  return p * 4 + c * 4 + f * 9;
}

/** kcal always = 4P+4C+9F from final gram targets. */
export function harmonizeTargets(t: MacroTargets): MacroTargets {
  return {
    dailyProtein: t.dailyProtein,
    dailyCarbs: t.dailyCarbs,
    dailyFat: t.dailyFat,
    dailyCalories: macroKcal(t.dailyProtein, t.dailyCarbs, t.dailyFat),
  };
}

export function reconcileTargets(raw: MacroTargets): ReconcileResult {
  const protein = Math.max(1, Math.round(raw.dailyProtein || 150));
  const carbs = Math.max(1, Math.round(raw.dailyCarbs || 200));
  const fat = Math.max(1, Math.round(raw.dailyFat || 65));
  const implied = macroKcal(protein, carbs, fat);
  const stated = Math.max(0, Math.round(raw.dailyCalories || 0));

  if (!stated || Math.abs(stated - implied) <= KCAL_MACRO_TOLERANCE) {
    return {
      macroAuthority: "harmonized",
      targets: harmonizeTargets({ dailyProtein: protein, dailyCarbs: carbs, dailyFat: fat, dailyCalories: implied }),
    };
  }

  const rawRatio = stated / implied;
  if (rawRatio < RECONCILE_RATIO_MIN || rawRatio > RECONCILE_RATIO_MAX) {
    const targets = harmonizeTargets({ dailyProtein: protein, dailyCarbs: carbs, dailyFat: fat, dailyCalories: implied });
    console.warn("[MEAL-PLAN] kcal/macro mismatch — macros kept as primary", { stated, implied });
    return {
      macroAuthority: "macros",
      targets,
      warning: {
        type: "macros_primary",
        statedKcal: stated,
        impliedKcal: implied,
        appliedKcal: targets.dailyCalories,
        message: `Angegebene ${stated} kcal wichen zu stark von den Makros ab (${implied} kcal). Plan nutzt Makro-basierte ${targets.dailyCalories} kcal.`,
      },
    };
  }

  const ratio = rawRatio;
  const scaled = harmonizeTargets({
    dailyProtein: Math.min(MACRO_CAPS.protein, Math.max(1, Math.round(protein * ratio))),
    dailyCarbs: Math.min(MACRO_CAPS.carbs, Math.max(1, Math.round(carbs * ratio))),
    dailyFat: Math.min(MACRO_CAPS.fat, Math.max(1, Math.round(fat * ratio))),
    dailyCalories: stated,
  });
  return {
    macroAuthority: "scaled_to_kcal",
    targets: scaled,
    warning: {
      type: "kcal_scaled",
      statedKcal: stated,
      impliedKcal: implied,
      appliedKcal: scaled.dailyCalories,
      message: `Makros proportional an ${stated} kcal angepasst (aus ${implied} kcal Makro-Basis).`,
    },
  };
}

export function sumMeals(meals: Meal[]) {
  return meals.reduce(
    (a, m) => ({
      protein: a.protein + (Number(m.protein) || 0),
      carbs: a.carbs + (Number(m.carbs) || 0),
      fat: a.fat + (Number(m.fat) || 0),
      calories: a.calories + (Number(m.calories) || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 },
  );
}

/** Calories always derived from P/C/F — never trust AI kcal fields. */
export function recalcMeal(m: MealLike): Meal {
  const protein = Math.max(0, Math.round(Number(m.protein) || 0));
  const carbs = Math.max(0, Math.round(Number(m.carbs) || 0));
  const fat = Math.max(0, Math.round(Number(m.fat) || 0));
  return {
    type: String(m.type || "Mahlzeit").trim(),
    name: String(m.name || "Gericht").trim(),
    prepTime: Math.max(5, Math.round(Number(m.prepTime) || 20)),
    ingredients: Array.isArray(m.ingredients)
      ? m.ingredients
          .filter((i) => i?.name)
          .slice(0, 6)
          .map((i) => ({
            name: String(i.name).trim(),
            amount: String(i.amount || "1 Portion").trim(),
            price: Math.max(0, Math.round((Number(i.price) || 0) * 100) / 100),
          }))
      : [],
    instructions: Array.isArray(m.instructions)
      ? m.instructions.map((s) => String(s).trim()).filter(Boolean).slice(0, 8)
      : [],
    allergenTags: Array.isArray(m.allergenTags)
      ? m.allergenTags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
      : [],
    protein,
    carbs,
    fat,
    calories: macroKcal(protein, carbs, fat),
  };
}

/** Structure from AI/fallback. Macros assigned only in syncDay. */
export function normalizeMealStructure(m: MealLike): Meal {
  const ingredients = Array.isArray(m?.ingredients)
    ? m.ingredients
        .filter((i) => i?.name)
        .slice(0, 6)
        .map((i) => ({
          name: String(i.name).trim(),
          amount: String(i.amount || "1 Portion").trim(),
          price: Math.max(0, Math.round((Number(i.price) || 0) * 100) / 100),
        }))
    : [];
  const instructions = Array.isArray(m?.instructions)
    ? m.instructions.map((s) => String(s).trim()).filter(Boolean).slice(0, 8)
    : [];
  return {
    type: String(m?.type || "Mahlzeit").trim(),
    name: String(m?.name || "Gericht").trim(),
    prepTime: Math.max(5, Math.round(Number(m.prepTime) || 20)),
    ingredients,
    instructions,
    allergenTags: Array.isArray(m?.allergenTags)
      ? m.allergenTags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
      : [],
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0,
  };
}

function slotWeights(mealsPerDay: number): number[] {
  const w = SLOT_WEIGHTS[mealsPerDay];
  if (w?.length === mealsPerDay) return w;
  return Array.from({ length: mealsPerDay }, () => 1 / mealsPerDay);
}

/** Largest-remainder: exact integer split of total across weights — O(n). */
export function distributeIntegers(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (total * w) / sumW);
  const base = raw.map((v) => Math.floor(v));
  let remaining = total - base.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...base];
  for (let k = 0; remaining > 0; k++, remaining--) {
    out[order[k % n].i]++;
  }
  return out;
}

export function correctSyncedDayDrift(meals: Meal[], targets: MacroTargets): Meal[] {
  const t = harmonizeTargets(targets);
  let adjusted = meals.map((m) => recalcMeal(m));
  if (!adjusted.length) return adjusted;

  const totals = () => sumMeals(adjusted);
  let sum = totals();
  const dp = t.dailyProtein - sum.protein;
  const dc = t.dailyCarbs - sum.carbs;
  const df = t.dailyFat - sum.fat;
  if (dp !== 0 || dc !== 0 || df !== 0) {
    const lastIdx = adjusted.length - 1;
    const last = adjusted[lastIdx];
    adjusted[lastIdx] = recalcMeal({
      ...last,
      protein: Math.max(0, (Number(last.protein) || 0) + dp),
      carbs: Math.max(0, (Number(last.carbs) || 0) + dc),
      fat: Math.max(0, (Number(last.fat) || 0) + df),
    });
    sum = totals();
  }

  const expectedKcal = macroKcal(t.dailyProtein, t.dailyCarbs, t.dailyFat);
  if (
    sum.protein !== t.dailyProtein ||
    sum.carbs !== t.dailyCarbs ||
    sum.fat !== t.dailyFat ||
    sum.calories !== expectedKcal
  ) {
    console.warn("[MEAL-PLAN] Macro drift after sync correction", { totals: sum, targets: t });
  }
  return adjusted;
}

/**
 * Single macro authority: slot weights → exact integer grams (no iterative loop).
 */
export function syncDay(day: DayPlan, targets: MacroTargets, mealsPerDay: number): DayPlan {
  const t = harmonizeTargets(targets);
  const weights = slotWeights(mealsPerDay);
  let meals = (day.meals || []).map((m) => normalizeMealStructure({ ...m }));
  if (!meals.length) return { ...day, meals };

  const w = weights.slice(0, meals.length);
  const proteins = distributeIntegers(t.dailyProtein, w);
  const carbs = distributeIntegers(t.dailyCarbs, w);
  const fats = distributeIntegers(t.dailyFat, w);

  meals = meals.map((m, i) =>
    recalcMeal({ ...m, protein: proteins[i], carbs: carbs[i], fat: fats[i] }),
  );
  meals = correctSyncedDayDrift(meals, t);
  return { ...day, meals };
}

export function syncPlan(plan: MealPlan, targets: MacroTargets, mealsPerDay: number): MealPlan {
  return plan.map((d) => syncDay(d, targets, mealsPerDay));
}

// ----- meals.ts -----
export function mealSlot(si: number, mpd: number): "b" | "m" | "s" {
  if (si === 0) return "b";
  const mains = mpd >= 4 ? [1, 3] : [1];
  return mains.includes(si) ? "m" : "s";
}

export function shapeWeek(plan: MealPlan, mealsPerDay: number, lang: Lang): MealPlan | null {
  if (!Array.isArray(plan) || plan.length < 7) return null;
  const L = LANG[lang];
  return plan.slice(0, 7).map((d, i) => {
    let meals = Array.isArray(d.meals) ? d.meals.slice(0, mealsPerDay).map(normalizeMealStructure) : [];
    while (meals.length < mealsPerDay) {
      meals.push(
        normalizeMealStructure({
          name: `${L.meal} ${meals.length + 1}`,
          type: L.meal,
          protein: 0,
          carbs: 0,
          fat: 0,
          prepTime: 15,
          ingredients: [{ name: "Gemüse", amount: "1 Portion", price: 1 }],
          instructions: [],
          allergenTags: ["none"],
        }),
      );
    }
    return { day: String(d.day || L.days[i]).trim(), meals };
  });
}

export function uniqueNames(plan: MealPlan): MealPlan {
  const seen = new Map<string, number>();
  return plan.map((day) => {
    const meals = (day.meals || []).map((meal) => {
      const base = String(meal.name || "Gericht").trim() || "Gericht";
      const key = normNameKey(base);
      const n = seen.get(key) ?? 0;
      seen.set(key, n + 1);
      if (n === 0) return meal;
      const name = `${base} (${n + 1})`;
      return name === meal.name ? meal : { ...meal, name };
    });
    return { ...day, meals };
  });
}

/** One macro pipeline for AI, fallback, and sanitized plans. */
export function finishPlan(
  plan: MealPlan,
  targets: MacroTargets,
  mealsPerDay: number,
  lang: Lang,
): MealPlan | null {
  const shaped = shapeWeek(plan, mealsPerDay, lang);
  if (!shaped) return null;
  const synced = syncPlan(shaped, targets, mealsPerDay);
  return uniqueNames(synced);
}

// ----- validation.ts -----
function customAllergyTerms(other: string): string[] {
  return other
    .toLowerCase()
    .split(/[,;/\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);
}

export function createSafetyContext(allergies: string[], prefs: string[], other: string): SafetyContext {
  return {
    allergies,
    prefs,
    other,
    userAllergieIds: activeUserAllergyIds(allergies),
    customTerms: customAllergyTerms(other),
  };
}

export function evaluateMeal(meal: MealLike, ctx: SafetyContext): MealSafetyReasons {
  const norm = getMealNorm(meal);
  const present = classifyPresentAllergens(norm, mealAllergenTags(meal));
  const hit: string[] = [];
  for (const userId of ctx.userAllergieIds) {
    if (present.has(userId)) hit.push(userId);
  }
  for (const term of ctx.customTerms) {
    if (termMatches(norm, term)) hit.push(`other:${term}`);
  }
  return {
    allergy: [...new Set(hit)],
    diet: detectDietViolations(norm, present, ctx.prefs),
  };
}

export function isMealSafe(meal: MealLike, ctx: SafetyContext): boolean {
  const r = evaluateMeal(meal, ctx);
  return r.allergy.length === 0 && r.diet.length === 0;
}

/** Single-pass plan audit (replaces repeated validatePlan loops). */
export function auditPlan(plan: MealPlan, ctx: SafetyContext): SafetyViolation[] {
  const out: SafetyViolation[] = [];
  for (const day of plan) {
    for (const meal of day.meals || []) {
      const reasons = evaluateMeal(meal, ctx);
      if (reasons.allergy.length || reasons.diet.length) {
        out.push({
          day: String(day.day || ""),
          mealName: String(meal.name || ""),
          allergy: reasons.allergy,
          diet: reasons.diet,
        });
      }
    }
  }
  return out;
}

export function violationWeight(v: SafetyViolation): number {
  return v.allergy.length * 3 + v.diet.length;
}

export function shouldAbortAiRetries(violations: SafetyViolation[]): boolean {
  if (!violations.length) return false;
  const totalWeight = violations.reduce((sum, v) => sum + violationWeight(v), 0);
  const allergyMeals = violations.filter((v) => v.allergy.length > 0).length;
  const allergyHits = violations.reduce((sum, v) => sum + v.allergy.length, 0);
  // Weight-based only — 25 minor diet flags ≠ 25 allergy failures.
  return totalWeight > 48 || allergyMeals > 14 || allergyHits > 22;
}

export function violationsToStrings(violations: SafetyViolation[]): string[] {
  return violations.map((v) => {
    const parts = [...v.allergy.map((a) => `allergy:${a}`), ...v.diet.map((d) => `diet:${d}`)];
    return `${v.day}: ${v.mealName} (${parts.join(", ")})`;
  });
}

export function nameUnsafe(name: string, ctx: SafetyContext): boolean {
  return !isMealSafe({ name, ingredients: [] }, ctx);
}

export const SAFE_POOL_DEFAULTS: Record<Lang, { b: string[]; m: string[]; s: string[] }> = {
  de: {
    b: ["Haferflocken Beeren", "Obstsalat", "Chia Pudding"],
    m: ["Linsen Curry", "Gemüsepfanne", "Reis Gemüse Bowl"],
    s: ["Obst Mix", "Hummus Gemüse", "Gemüse Sticks"],
  },
  en: {
    b: ["Oatmeal berries", "Fruit salad", "Chia pudding"],
    m: ["Lentil curry", "Veggie stir fry", "Rice veggie bowl"],
    s: ["Fruit mix", "Hummus veggies", "Veggie sticks"],
  },
  fr: {
    b: ["Porridge baies", "Salade fruits", "Chia pudding"],
    m: ["Curry lentilles", "Legumes saute", "Riz legumes"],
    s: ["Fruits", "Hummus legumes", "Legumes crus"],
  },
};

export function filterPool(
  pool: string[],
  ctx: SafetyContext,
  lang: Lang,
  slot: "b" | "m" | "s",
): string[] {
  const ok = pool.filter((n) => !nameUnsafe(n, ctx));
  if (ok.length) return ok;
  const defaults = SAFE_POOL_DEFAULTS[lang][slot].filter((n) => !nameUnsafe(n, ctx));
  return defaults.length ? defaults : SAFE_POOL_DEFAULTS[lang][slot];
}

// ----- constraints.ts -----
export function resolveLang(raw: unknown): Lang {
  return raw === "en" || raw === "fr" ? raw : "de";
}

/** Structured constraints — serialized to AI prompt only at the boundary. */
export type ConstraintKind = "allergy" | "allergy_other" | "diet" | "goal" | "freeform";

export type ConstraintItem = {
  kind: ConstraintKind;
  id?: string;
  text: string;
};

export type UserConstraintInput = {
  allergies: string[];
  prefs: string[];
  goals: string[];
  other: string;
  lang: Lang;
};

export function buildConstraintItems(input: UserConstraintInput): ConstraintItem[] {
  const items: ConstraintItem[] = [];
  for (const id of input.allergies.filter((x) => x && x !== "none" && x !== "other")) {
    items.push({ kind: "allergy", id, text: id });
  }
  if (input.other.trim()) {
    items.push({ kind: "allergy_other", text: input.other.trim() });
  }
  for (const id of input.prefs.filter((x) => x && x !== "none")) {
    items.push({ kind: "diet", id, text: id });
  }
  for (const id of input.goals.filter((x) => x && x !== "none")) {
    items.push({ kind: "goal", id, text: id });
  }
  return items;
}

/** Compact AI prompt block from structured constraints. */
export function serializeConstraintsForAi(items: ConstraintItem[], lang: Lang): string {
  if (!items.length) return "";
  const lines: string[] = [];
  const allergies = items.filter((i) => i.kind === "allergy");
  const other = items.filter((i) => i.kind === "allergy_other");
  const diets = items.filter((i) => i.kind === "diet");
  const goals = items.filter((i) => i.kind === "goal");

  if (allergies.length) {
    const header = lang === "de" ? "ALLERGIEN:" : lang === "fr" ? "ALLERGIES:" : "ALLERGIES:";
    lines.push(header, ...allergies.map((a) => `- ${a.text}`));
  }
  for (const o of other) lines.push(`- other: ${o.text}`);
  for (const d of diets) lines.push(`Diet: ${d.text}`);
  for (const g of goals) lines.push(`Goal: ${g.text}`);
  return lines.join("\n");
}

export function buildConstraintPrompt(input: UserConstraintInput): string {
  return serializeConstraintsForAi(buildConstraintItems(input), input.lang);
}

/** @deprecated Use buildConstraintPrompt — kept for direct string callers. */
export function buildConstraints(
  allergies: string[],
  prefs: string[],
  goals: string[],
  other: string,
  lang: Lang,
): string {
  return buildConstraintPrompt({ allergies, prefs, goals, other, lang });
}

// ----- fallbacks.ts -----
function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  if (!seed || out.length < 2) return out;
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Ultra-minimal plan — only whole vegetables/fruit; last-resort when pools fail. */
export function guaranteedSafeMinimalPlan(params: {
  mealsPerDay: number;
  lang: Lang;
}): MealPlan {
  const L = LANG[params.lang];
  const templates: Record<Lang, { b: string; m: string; s: string; ings: [string, string, string] }> = {
    de: {
      b: "Obstsalat",
      m: "Gemüsepfanne",
      s: "Gemüse Sticks",
      ings: ["Apfel", "Karotte", "Brokkoli"],
    },
    en: {
      b: "Fruit salad",
      m: "Vegetable pan",
      s: "Veggie sticks",
      ings: ["Apple", "Carrot", "Broccoli"],
    },
    fr: {
      b: "Salade de fruits",
      m: "Poelee legumes",
      s: "Legumes crus",
      ings: ["Pomme", "Carotte", "Brocoli"],
    },
  };
  const t = templates[params.lang];
  const ctx = createSafetyContext([], [], "");

  return Array.from({ length: 7 }, (_, di) => ({
    day: L.days[di],
    meals: Array.from({ length: params.mealsPerDay }, (_, si) => {
      const slot = mealSlot(si, params.mealsPerDay);
      const title = slot === "b" ? t.b : slot === "m" ? t.m : t.s;
      return buildMealFromDishTitle(title, slot, params.lang, ctx);
    }),
  }));
}

export function fallbackPlan(params: {
  mealsPerDay: number;
  targets: MacroTargets;
  prefs: string[];
  allergies: string[];
  other: string;
  lang: Lang;
  banned: Set<string>;
  bannedFingerprints?: Set<string>;
  varietySeed?: string;
  isRegeneration?: boolean;
}): MealPlan {
  const L = LANG[params.lang];
  const ctx = createSafetyContext(params.allergies, params.prefs, params.other);

  const basePools = getDietPools(params.lang, params.prefs);
  const pools = {
    b: filterPool(basePools.b, ctx, params.lang, "b"),
    m: filterPool(basePools.m, ctx, params.lang, "m"),
    s: filterPool(basePools.s, ctx, params.lang, "s"),
  };

  const shuffleKey = params.varietySeed || String(Date.now());
  const safePools = {
    b: seededShuffle(pools.b, `${shuffleKey}-b-${params.isRegeneration ? "r" : "n"}`),
    m: seededShuffle(pools.m, `${shuffleKey}-m-${params.isRegeneration ? "r" : "n"}`),
    s: seededShuffle(pools.s, `${shuffleKey}-s-${params.isRegeneration ? "r" : "n"}`),
  };

  const used = new Set(params.banned);
  const usedFp = new Set(params.bannedFingerprints ?? []);
  const poolIndex = { b: 0, m: 0, s: 0 };
  let synthCounter = 0;

  const pickUniqueTitle = (pool: string[], slot: "b" | "m" | "s", dayTag: string): string => {
    const list = pool.length ? pool : safePools[slot];
    for (let round = 0; round < list.length + 2; round++) {
      for (let o = 0; o < list.length; o++) {
        const idx = (poolIndex[slot] + o) % list.length;
        const name = list[idx]!;
        poolIndex[slot] = idx + 1;
        const fp = dishFingerprintFromTitle(name, ctx);
        if (used.has(name.toLowerCase()) || (fp && usedFp.has(fp))) continue;
        used.add(name.toLowerCase());
        if (fp) usedFp.add(fp);
        return name;
      }
    }
    synthCounter += 1;
    const label = params.isRegeneration
      ? `${dayTag} ${slot === "b" ? "Frühstück" : slot === "m" ? "Hauptgericht" : "Snack"} ${synthCounter}`
      : `${list[0] ?? "Bowl"} · ${dayTag} ${synthCounter}`;
    used.add(label.toLowerCase());
    return label;
  };

  return Array.from({ length: 7 }, (_, di) => {
    const dayTag = L.days[di];
    const meals = Array.from({ length: params.mealsPerDay }, (_, si) => {
      const slot = mealSlot(si, params.mealsPerDay);
      const pool = slot === "b" ? safePools.b : slot === "m" ? safePools.m : safePools.s;
      const name = pickUniqueTitle(pool, slot, dayTag);
      return buildMealFromDishTitle(name, slot, params.lang, ctx);
    });
    return { day: L.days[di], meals };
  });
}

// ----- openai.ts -----
const aiIngredientSchema = z.object({
  name: z.string().min(1),
  amount: z.string(),
  price: z.number(),
});

const aiMealSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  prepTime: z.number(),
  ingredients: z.array(aiIngredientSchema),
  instructions: z.array(z.string()),
  allergenTags: z.array(z.enum(ALLERGEN_TAG_IDS)),
});

const aiDaySchema = z.object({
  day: z.string(),
  meals: z.array(aiMealSchema).min(1),
});

const aiPlanSchema = z.object({
  mealPlan: z.array(aiDaySchema).length(7),
});

type AiDayPlan = z.infer<typeof aiDaySchema>;

/** OpenAI json_schema — generated once from Zod (single source of truth). */
export const OPENAI_MEAL_PLAN_JSON_SCHEMA: Record<string, unknown> = (() => {
  const schema = zodToJsonSchema(aiPlanSchema, {
    name: "MealPlanResponse",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
})();

function extractJsonPayload(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

/** json_schema responses are JSON strings; accept pre-parsed objects as well. */
function coerceOpenAiJsonValue(content: unknown): unknown {
  if (content == null || content === "") throw new Error("Empty OpenAI response");
  if (typeof content === "object") return content;
  if (typeof content !== "string") throw new Error("Unexpected OpenAI content type");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Empty OpenAI response");
  if (trimmed.length > 120_000) throw new Error("OpenAI response too large");

  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      return JSON.parse(extractJsonPayload(trimmed));
    } catch {
      throw new Error("Invalid JSON from OpenAI");
    }
  }
}

export function parseOpenAiMealPlanContent(content: unknown): AiDayPlan[] {
  const raw = coerceOpenAiJsonValue(content);
  const parsed = aiPlanSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Schema validation failed: ${parsed.error.issues[0]?.message ?? "invalid shape"}`);
  }
  return parsed.data.mealPlan;
}

function formatVarietyBlock(
  prior: PriorDishSnapshot[],
  banned: string[],
  isRegeneration: boolean,
  mealsPerDay: number,
): string {
  if (isRegeneration && prior.length) {
    return formatPriorDishesForPrompt(prior, mealsPerDay);
  }
  const names = banned.map((n) => n.trim()).filter(Boolean).slice(0, 40);
  if (!names.length) return "";
  const lines: string[] = [];
  for (let i = 0; i < names.length; i += 8) {
    lines.push(names.slice(i, i + 8).join("; "));
  }
  return [`Avoid repeating these meals:`, ...lines].join("\n");
}

export async function callOpenAI(params: {
  mealsPerDay: number;
  targets: MacroTargets;
  constraints: string;
  lang: Lang;
  banned: string[];
  maxTokens: number;
  mode?: "initial" | "repair";
  repairHints?: string[];
  isRegeneration?: boolean;
  priorDishes?: PriorDishSnapshot[];
  dietBlock?: string;
}): Promise<MealPlan> {
  const L = LANG[params.lang];
  const prior = params.priorDishes ?? [];
  const regen = Boolean(params.isRegeneration && (prior.length || params.banned.length));
  const repairBlock =
    params.mode === "repair" && params.repairHints?.length
      ? `\nFIX:\n${params.repairHints.slice(0, 8).map((h) => `- ${h}`).join("\n")}`
      : "";

  const bannedBlock = formatVarietyBlock(prior, params.banned, regen, params.mealsPerDay);

  const dietBlock = params.dietBlock ?? "";

  const system = [
    `Nutrition coach. JSON only (${L.lang}). 7d: ${L.days.join(",")}. ${params.mealsPerDay} meals/d.`,
    `Fields: type,name,protein,carbs,fat,prepTime,ingredients[{name,amount,price}],instructions[],allergenTags[].`,
    `allergenTags: gluten,lactose,milk,nuts,treeNuts,peanuts,soy,eggs,fish,shellfish|none. instructions:[].`,
    `Server→${params.targets.dailyProtein}P/${params.targets.dailyCarbs}C/${params.targets.dailyFat}F g/d. No smoothies.`,
    dietBlock,
    bannedBlock,
    params.constraints ? `Constraints:\n${params.constraints}` : "",
    repairBlock,
  ].filter(Boolean).join("\n");

  const user = regen
    ? params.mode === "repair"
      ? `Still repeating old dishes. ${buildRegenerationUserPrompt(params.mealsPerDay, params.lang)}`
      : buildRegenerationUserPrompt(params.mealsPerDay, params.lang)
    : params.mode === "repair"
      ? `Regenerate 7-day plan (${params.mealsPerDay}/day). Strict compliance.`
      : `Create 7-day plan (${params.mealsPerDay}/day). Tag allergens per meal. Follow the mandatory diet rules exactly.`;

  const openAiKey = getOpenAIKey();
  if (!openAiKey) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: regen
        ? params.mode === "repair"
          ? 0.45
          : 0.72
        : params.mode === "repair"
          ? 0.15
          : 0.35,
      max_tokens: params.maxTokens,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meal_plan",
          strict: true,
          schema: OPENAI_MEAL_PLAN_JSON_SCHEMA,
        },
      },
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const messageContent = data.choices?.[0]?.message?.content;
  if (messageContent == null || messageContent === "") throw new Error("Empty OpenAI response");
  if (data.choices?.[0]?.finish_reason === "length") throw new Error("Truncated response");

  const raw = parseOpenAiMealPlanContent(messageContent);

  return raw.map((day, i: number) => {
    let meals = Array.isArray(day?.meals) ? day.meals.slice(0, params.mealsPerDay).map(normalizeMealStructure) : [];
    while (meals.length < params.mealsPerDay) {
      meals.push(
        normalizeMealStructure({
          name: `${L.meal} ${meals.length + 1}`,
          type: L.meal,
          protein: 0,
          carbs: 0,
          fat: 0,
          prepTime: 15,
          ingredients: [{ name: "Gemüse", amount: "1 Portion", price: 1 }],
          instructions: [],
          allergenTags: ["none"],
        }),
      );
    }
    return {
      day: String(day?.day || L.days[i] || `Day ${i + 1}`).trim(),
      meals,
    };
  });
}

export async function generateAIDraft(input: PlanInput): Promise<MealPlan | null> {
  if (!getOpenAIKey()) {
    console.warn("[MEAL-PLAN] OPENAI_API_KEY fehlt – Vorlagen-Plan ohne KI");
    return null;
  }

  const attempts: { maxTokens: number; mode: "initial" | "repair" }[] = input.isRegeneration
    ? [
        { maxTokens: 4000, mode: "initial" },
        { maxTokens: 3600, mode: "repair" },
        { maxTokens: 3600, mode: "repair" },
        { maxTokens: 3600, mode: "repair" },
        { maxTokens: 3600, mode: "repair" },
      ]
    : [
        { maxTokens: 3600, mode: "initial" },
        { maxTokens: 3200, mode: "repair" },
        { maxTokens: 3200, mode: "repair" },
      ];

  let repairHints: string[] = [];
  for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex++) {
    const attempt = attempts[attemptIndex]!;
    try {
      const raw = await callOpenAI({
        mealsPerDay: input.mealsPerDay,
        targets: input.targets,
        constraints: input.constraints,
        lang: input.lang,
        banned: input.banned,
        maxTokens: attempt.maxTokens,
        mode: attempt.mode,
        repairHints: attempt.mode === "repair" ? repairHints : undefined,
        isRegeneration: input.isRegeneration,
        priorDishes: input.priorDishes,
        dietBlock: buildDietMandatoryBlock(input.lang, input.prefs),
      });
      const audited = auditPlan(raw, input.safetyCtx);
      const violations = violationsToStrings(audited);

      if (input.isRegeneration && (input.priorDishes?.length || input.banned.length)) {
        const prior = input.priorDishes ?? [];
        const reused = findRegenerationOverlaps(raw, prior);
        if (reused.length) {
          repairHints = [
            `Still same dishes as old week (${reused.length}): ${reused.slice(0, 8).join("; ")}`,
            ...repairHints,
          ];
          console.warn(`[MEAL-PLAN] Regeneration repeated ${reused.length} dish(es)`);
          continue;
        }
      }

      if (!violations.length) return raw;

      const isLast = attemptIndex === attempts.length - 1;
      const allergyFree = audited.every((v) => v.allergy.length === 0);

      if (isLast && allergyFree) {
        console.warn(
          `[MEAL-PLAN] Using AI plan on final attempt (${audited.length} minor diet flags)`,
        );
        return raw;
      }

      if (shouldAbortAiRetries(audited) && !input.isRegeneration) {
        const weight = audited.reduce((s, v) => s + violationWeight(v), 0);
        console.warn(
          `[MEAL-PLAN] ${audited.length} violations (weight ${weight}) — aborting AI retries`,
        );
        return null;
      }

      repairHints = violations.slice(0, 12);
      console.warn(`[MEAL-PLAN] AI plan failed safety (${attempt.mode}), ${violations.length} violations`);
      if (attempt.mode === "repair" && !input.isRegeneration) break;
    } catch (e) {
      console.warn("[MEAL-PLAN] OpenAI attempt failed:", e instanceof Error ? e.message : e);
    }
  }
  return null;
}

// ----- shopping.ts -----
export function fridgeHas(name: string, fridge: string[]) {
  const n = normKey(name);
  return fridge.some((f) => {
    const k = normKey(f);
    return k && (n.includes(k) || k.includes(n));
  });
}

export function shoppingList(plan: MealPlan, fridge: string[]): ShoppingItem[] {
  const map = new Map<string, { name: string; amounts: string[]; price: number }>();
  for (const day of plan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name || fridgeHas(ing.name, fridge)) continue;
        const key = normKey(ing.name);
        const ex = map.get(key);
        const amount = String(ing.amount || "—");
        const price = Number(ing.price) || 0;
        if (ex) {
          ex.amounts.push(amount);
          ex.price += price;
        } else map.set(key, { name: ing.name, amounts: [amount], price });
      }
    }
  }
  return Array.from(map.values()).map((v) => ({
    name: v.name,
    amount: [...new Set(v.amounts)].join(" · "),
    price: Math.round(v.price * 100) / 100,
  }));
}

export function scanMeta(plan: MealPlan, fridge: string[], list: ShoppingItem[]): ScanMeta {
  const recipe = new Set<string>();
  let covered = 0;
  for (const day of plan) {
    for (const meal of day.meals || []) {
      for (const ing of meal.ingredients || []) {
        if (!ing?.name) continue;
        const k = normKey(ing.name);
        recipe.add(k);
        if (fridgeHas(ing.name, fridge)) covered++;
      }
    }
  }
  const pct = recipe.size ? Math.round((covered / recipe.size) * 100) : 0;
  const gap = list.reduce((s, i) => s + (i.price || 0), 0);
  return { percentIngredientsFromFridge: pct, estimatedEurosSaved: gap > 0 ? Math.round(gap * 0.3 * 10) / 10 : 0 };
}

// ----- auth.ts -----
/** Minimal surface used by this function — avoids strict generated DB typings. */
export type SupabaseClient = {
  auth: {
    getUser: (token: string) => Promise<{
      data: { user: { id: string; email?: string | null } | null } | null;
      error: { message?: string } | null;
    }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: { subscribed?: boolean; subscription_end?: string | null } | null;
        }>;
      };
    };
  };
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>;
};

export async function trackMealPlanUsage(supabase: SupabaseClient, userId: string) {
  const ws = weekStart();
  try {
    const { error } = await supabase.rpc("increment_meal_plan_usage", {
      p_user_id: userId,
      p_week_start: ws,
    });
    if (error) console.error("[MEAL-PLAN] usage increment:", error.message);
  } catch (e) {
    console.error("[MEAL-PLAN] usage crash:", e instanceof Error ? e.message : e);
  }
}

export async function isPremium(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
  auth: string,
) {
  const { data } = await supabase.from("subscription_cache").select("subscribed, subscription_end").eq("user_id", userId).maybeSingle();
  if (data?.subscribed && (!data.subscription_end || new Date(data.subscription_end) > new Date())) return true;
  const bypass = (Deno.env.get("PREMIUM_BYPASS_EMAILS") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (email && bypass.includes(email.toLowerCase())) return true;
  try {
    const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/check-subscription`, {
      headers: { Authorization: auth, "Content-Type": "application/json" },
    });
    if (!r.ok) return false;
    const j = await r.json();
    return j?.subscribed === true && (!j.subscription_end || new Date(j.subscription_end) > new Date());
  } catch {
    return false;
  }
}

/** Local Monday YYYY-MM-DD — matches src/lib/localDate.ts getLocalWeekStartISO */
export function weekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

export function authFailureMessage(err: { message?: string } | null): string {
  const msg = (err?.message ?? "").toLowerCase();
  if (msg.includes("expired") || msg.includes("jwt expired")) {
    return "Session abgelaufen. Bitte erneut anmelden.";
  }
  if (msg.includes("invalid") || msg.includes("malformed")) {
    return "Ungültige Anmeldung. Bitte erneut anmelden.";
  }
  return "Anmeldung erforderlich. Bitte einloggen.";
}

export async function requireAuthUser(
  supabase: SupabaseClient,
  authHeader: string | null,
): Promise<{ user: { id: string; email?: string | null }; auth: string } | Response> {
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "unauthorized", message: "Anmeldung erforderlich. Bitte einloggen." }, 401);
  }
  const auth = authHeader.trim();
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json({ error: "unauthorized", message: "Anmeldung erforderlich. Bitte einloggen." }, 401);
  }

  const { data: authData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr) {
    console.warn("[MEAL-PLAN] auth failed:", authErr.message);
    return json({ error: "unauthorized", message: authFailureMessage(authErr) }, 401);
  }
  if (!authData?.user) {
    return json({ error: "unauthorized", message: "Ungültige Session. Bitte erneut anmelden." }, 401);
  }
  return { user: authData.user, auth };
}

// ----- sanitize.ts -----
/** In-place: fix unsafe meals — keep name when possible; pool names only as last resort. */
export function sanitizeUnsafeMeals(plan: MealPlan, ctx: SafetyContext, lang: Lang): void {
  let poolPick = 0;
  for (const day of plan) {
    const meals = day.meals;
    if (!Array.isArray(meals)) continue;
    for (let si = 0; si < meals.length; si++) {
      const meal = meals[si];
      if (!meal || isMealSafe(meal, ctx)) continue;
      const slot = mealSlot(si, meals.length);

      const fixed = buildMealFromDishTitle(String(meal.name || "Gericht"), slot, lang, ctx);
      if (isMealSafe(fixed, ctx)) {
        meals[si] = fixed;
        continue;
      }

      const pool = filterPool(SAFE_POOL_DEFAULTS[lang][slot], ctx, lang, slot);
      const name = pool[poolPick++ % pool.length] ?? pool[0] ?? "Gemüse Bowl";
      meals[si] = buildMealFromDishTitle(name, slot, lang, ctx);
    }
  }
}

// ----- drafts.ts -----
export function generateFallbackDraft(
  input: PlanInput,
  banned: Set<string>,
  prefsOverride?: string[],
): MealPlan {
  const mergedBanned = new Set<string>([
    ...banned,
    ...input.banned.map((n) => n.toLowerCase().trim()).filter(Boolean),
  ]);

  const raw = fallbackPlan({
    mealsPerDay: input.mealsPerDay,
    targets: input.targets,
    prefs: prefsOverride ?? input.prefs,
    allergies: input.allergies,
    other: input.other,
    lang: input.lang,
    banned: mergedBanned,
    bannedFingerprints: new Set(
      (input.priorDishes ?? []).map((p) => p.fingerprint).filter(Boolean),
    ),
    varietySeed: input.varietySeed,
    isRegeneration: input.isRegeneration,
  });

  return finishPlan(raw, input.targets, input.mealsPerDay, input.lang) ?? raw;
}

// ----- repairLoop.ts -----
/** Fix unsafe meals in-place (keep AI title). Template pools only when OpenAI key is missing. */
export function repairPlan(
  draft: MealPlan,
  input: PlanInput,
  attempt: number,
  priorViolations: SafetyViolation[],
): { plan: MealPlan; violations: SafetyViolation[] } {
  let plan = draft;
  let violations = priorViolations.length ? priorViolations : auditPlan(plan, input.safetyCtx);

  if (violations.length) {
    console.warn(`[MEAL-PLAN] Fixing unsafe meals in-place (attempt ${attempt})`);
    for (const day of plan) {
      const meals = day.meals;
      if (!Array.isArray(meals)) continue;
      for (let si = 0; si < meals.length; si++) {
        const meal = meals[si];
        if (!meal || isMealSafe(meal, input.safetyCtx)) continue;
        const slot = mealSlot(si, meals.length);
        meals[si] = buildMealFromDishTitle(String(meal.name || "Gericht"), slot, input.lang, input.safetyCtx);
      }
    }
    violations = auditPlan(plan, input.safetyCtx);
  }

  if (violations.length && !getOpenAIKey() && attempt >= 2) {
    console.warn("[MEAL-PLAN] No OpenAI key — template fallback after repair");
    plan = generateFallbackDraft(input, new Set());
    violations = auditPlan(plan, input.safetyCtx);
  }

  if (violations.length && attempt > 4) {
    console.warn("[MEAL-PLAN] Hard escape: guaranteedSafeMinimalPlan");
    plan = guaranteedSafeMinimalPlan({ mealsPerDay: input.mealsPerDay, lang: input.lang });
    violations = auditPlan(plan, input.safetyCtx);
  }

  return { plan, violations };
}

// ----- buildPlan.ts -----
export const defaultBuildPlanDeps: BuildPlanDeps = {
  generateAIDraft,
};

const MAX_REPAIR_ROUNDS = 4;
const MAX_AI_RETRIES_AFTER_REPAIR = 2;

function alignPlanIngredientsToTitles(
  plan: MealPlan,
  lang: Lang,
  ctx: SafetyContext,
  mealsPerDay: number,
): MealPlan {
  return plan.map((day) => ({
    ...day,
    meals: (day.meals || []).map((meal, si) => {
      const titleParts = parseIngredientNamesFromDishTitle(String(meal.name || ""));
      if (titleParts.length < 1) return meal;
      const ingBlob = (meal.ingredients || []).map((i) => String(i.name).toLowerCase()).join(" ");
      const matched = titleParts.filter((t) => ingBlob.includes(t.toLowerCase())).length;
      const need = titleParts.length >= 2 ? 2 : 1;
      if (matched >= need) return meal;
      const slot = mealSlot(si, mealsPerDay);
      return buildMealFromDishTitle(String(meal.name), slot, lang, ctx);
    }),
  }));
}

export async function buildPlan(
  input: PlanInput,
  deps: BuildPlanDeps = defaultBuildPlanDeps,
): Promise<BuildPlanResult> {
  const aiAvailable = Boolean(getOpenAIKey());
  let usedAi = false;
  let repairAttempts = 0;

  const banned = new Set(input.banned.map((n) => n.toLowerCase().trim()).filter(Boolean));

  let raw = await deps.generateAIDraft(input);
  if (raw) {
    usedAi = true;
  } else if (!aiAvailable) {
    console.warn("[MEAL-PLAN] No OPENAI_API_KEY — using template plan");
    raw = generateFallbackDraft(input, banned);
  } else {
    console.warn("[MEAL-PLAN] OpenAI failed — retrying full generation");
    for (let i = 0; i < MAX_AI_RETRIES_AFTER_REPAIR && !raw; i++) {
      raw = await deps.generateAIDraft({ ...input, isRegeneration: true });
    }
    if (raw) usedAi = true;
  }

  if (!raw) {
    throw new Error(
      aiAvailable
        ? "KI konnte keinen Wochenplan erstellen. Bitte in ein paar Sekunden erneut versuchen."
        : "OPENAI_API_KEY fehlt auf dem Server.",
    );
  }

  let plan = finishPlan(raw, input.targets, input.mealsPerDay, input.lang) ?? raw;
  let violations = auditPlan(plan, input.safetyCtx);

  while (violations.length > 0 && repairAttempts < MAX_REPAIR_ROUNDS) {
    repairAttempts += 1;
    const repaired = repairPlan(plan, input, repairAttempts, violations);
    plan = finishPlan(repaired.plan, input.targets, input.mealsPerDay, input.lang) ?? repaired.plan;
    violations = repaired.violations.length
      ? repaired.violations
      : auditPlan(plan, input.safetyCtx);
  }

  if (violations.length > 0 && aiAvailable) {
    console.warn(`[MEAL-PLAN] ${violations.length} violation(s) — re-asking OpenAI (no template pool)`);
    for (let i = 0; i < MAX_AI_RETRIES_AFTER_REPAIR && violations.length > 0; i++) {
      const aiPlan = await deps.generateAIDraft({ ...input, isRegeneration: true });
      if (!aiPlan) continue;
      usedAi = true;
      plan = finishPlan(aiPlan, input.targets, input.mealsPerDay, input.lang) ?? aiPlan;
      violations = auditPlan(plan, input.safetyCtx);
    }
  }

  if (violations.length > 0 && !aiAvailable) {
    console.warn(`[MEAL-PLAN] ${violations.length} violation(s) — template fallback (no API key)`);
    const strictPrefs = input.prefs.includes("vegan")
      ? [...new Set([...input.prefs.filter((p) => p !== "pescatarian"), "vegan"])]
      : input.prefs;
    plan = generateFallbackDraft(input, banned, strictPrefs);
    plan = finishPlan(plan, input.targets, input.mealsPerDay, input.lang) ?? plan;
    violations = auditPlan(plan, input.safetyCtx);
    usedAi = false;
  }

  if (violations.length > 0) {
    console.warn("[MEAL-PLAN] Last resort: minimal safe plan");
    plan = guaranteedSafeMinimalPlan({
      mealsPerDay: input.mealsPerDay,
      lang: input.lang,
    });
    plan = finishPlan(plan, input.targets, input.mealsPerDay, input.lang) ?? plan;
    violations = auditPlan(plan, input.safetyCtx);
    usedAi = false;
  }

  let finalPlan = finishPlan(plan, input.targets, input.mealsPerDay, input.lang) ?? plan;
  finalPlan = alignPlanIngredientsToTitles(finalPlan, input.lang, input.safetyCtx, input.mealsPerDay);
  finalPlan = finishPlan(finalPlan, input.targets, input.mealsPerDay, input.lang) ?? finalPlan;
  return { plan: finalPlan, usedAi, repairAttempts };
}

// ----- variety.ts -----
export function snapshotPriorMeal(meal: MealLike): PriorDishSnapshot {
  const name = String(meal?.name ?? "").trim();
  const mainIngredients = mealMainIngredients(meal);
  return {
    name,
    mainIngredients,
    contentKey: mealContentKey(meal),
    fingerprint: mealDishFingerprint(meal),
  };
}

export function parsePriorMealsFromBody(
  previousMeals: unknown,
  previousMealNames: string[],
): PriorDishSnapshot[] {
  if (Array.isArray(previousMeals)) {
    const out: PriorDishSnapshot[] = [];
    for (const raw of previousMeals) {
      if (!raw || typeof raw !== "object") continue;
      const m = raw as Record<string, unknown>;
      const name = String(m.name ?? "").trim();
      if (!name) continue;
      const ingredients = Array.isArray(m.ingredients)
        ? m.ingredients.map((i) => {
          const row = i as Record<string, unknown>;
          return { name: String(row?.name ?? "").trim() };
        }).filter((i) => i.name)
        : [];
      out.push(snapshotPriorMeal({ name, ingredients }));
    }
    if (out.length) return out.slice(0, 56);
  }
  return previousMealNames.map((name) => snapshotPriorMeal({ name, ingredients: [] }));
}

function ingredientJaccard(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = new Set(a.split("|").filter(Boolean));
  const setB = new Set(b.split("|").filter(Boolean));
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const x of setA) {
    if (setB.has(x)) inter++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union ? inter / union : 0;
}

function dishesTooSimilar(fpA: string, fpB: string): boolean {
  if (!fpA || !fpB) return false;
  if (fpA === fpB) return true;
  const j = ingredientJaccard(fpA, fpB);
  if (j >= 0.65) return true;
  const setA = new Set(fpA.split("|").filter(Boolean));
  let shared = 0;
  for (const x of fpB.split("|").filter(Boolean)) {
    if (setA.has(x)) shared++;
  }
  return shared >= 2 && j >= 0.4;
}

/** Same dish if name, content key, or ≥70% ingredient overlap with any prior meal. */
export function mealMatchesPriorDish(meal: MealLike, prior: PriorDishSnapshot[]): string | null {
  const name = String(meal?.name ?? "").toLowerCase().trim();
  const contentKey = mealContentKey(meal);
  const fingerprint = mealDishFingerprint(meal);

  for (const p of prior) {
    if (name && p.name.toLowerCase().trim() === name) return p.name;
    if (contentKey && p.contentKey && contentKey === p.contentKey) return p.name;
    if (fingerprint && p.fingerprint && fingerprint === p.fingerprint) return p.name;
    if (fingerprint && p.fingerprint && dishesTooSimilar(fingerprint, p.fingerprint)) {
      return p.name;
    }
  }
  return null;
}

export function findRegenerationOverlaps(plan: MealPlan, prior: PriorDishSnapshot[]): string[] {
  const hits: string[] = [];
  for (const day of plan) {
    for (const meal of day.meals ?? []) {
      const match = mealMatchesPriorDish(meal, prior);
      if (match) hits.push(`${meal.name} ≈ ${match}`);
    }
  }
  return hits;
}

export function formatPriorDishesForPrompt(prior: PriorDishSnapshot[], mealsPerDay: number): string {
  if (!prior.length) return "";
  const lines = prior.slice(0, 40).map((p) => {
    const ings = p.mainIngredients.length
      ? p.mainIngredients.slice(0, 6).join(", ")
      : "(see title)";
    return `- ${p.name} [${ings}]`;
  });
  return [
    "OLD WEEK — forbidden (do NOT reuse, reshuffle to other days, or rename):",
    ...lines,
    `Create ${7 * mealsPerDay} completely NEW recipes.`,
    "Do NOT move old meals to different weekdays. Do NOT use the same main ingredients with a new title.",
    "Each meal needs a new cooking style, new primary protein, and mostly new ingredients.",
  ].join("\n");
}

// ----- dietPools.ts -----
export type PoolSet = { b: string[]; m: string[]; s: string[] };

const DE: Record<string, PoolSet> = {
  balanced: {
    b: [
      "Haferflocken Beeren", "Skyr Obst", "Rührei Vollkornbrot", "Joghurt Banane", "Hüttenkäse Toast",
      "Avocado Brot", "Müsli Apfel", "Porridge Nüsse", "French Toast", "Quark Honig",
    ],
    m: [
      "Hähnchen Reis Pfanne", "Lachs Kartoffeln", "Puten Gemüse Bowl", "Pasta Tomate Basilikum",
      "Rind Pfanne Asia", "Thunfisch Salat", "Linsen Curry", "Gyros Bowl", "Falafel Teller",
      "Wrap Hähnchen", "Spaghetti Bolognese", "Fish and Chips Ofen", "Chili con Carne", "Risotto Pilze",
    ],
    s: ["Apfel Nüsse", "Quark Beeren", "Vollkornbrot Aufstrich", "Obst Joghurt", "Hummus Gemüse", "Protein Riegel", "Käse Sticks"],
  },
  vegan: {
    b: [
      "Haferflocken Beeren", "Tofu-Scramble", "Avocado Brot", "Chia Pudding", "Banane Erdnuss",
      "Obstsalat", "Hummus Brot", "Porridge Kokos", "Smoothie Bowl", "Vollkorn mit Marmelade",
    ],
    m: [
      "Linsen Curry", "Tofu Reis Pfanne", "Kichererbsen Bowl", "Gemüsepfanne Sesam", "Buddha Bowl",
      "Tempeh Salat", "Bohnen Chili", "Pad Thai Tofu", "Falafel mit Tahini", "Linsensuppe",
      "Veggie Burger Bowl", "Couscous Gemüse", "Thai Gemüse Kokos", "Burrito Bowl vegan", "Ramen Gemüsebrühe",
    ],
    s: ["Apfel Nüsse", "Hummus Gemüse", "Obst Mix", "Edamame", "Nussriegel", "Rice Cakes Avocado", "Energy Balls"],
  },
  vegetarian: {
    b: [
      "Haferflocken Beeren", "Rührei Toast", "Joghurt Granola", "Käse Brötchen", "Pancakes Beeren",
      "Obst Quark", "Müsli Mandel", "Eier Benedict light",
    ],
    m: [
      "Caprese Pasta", "Spinat Ricotta Nudeln", "Gemüse Lasagne", "Kichererbsen Curry", "Falafel Teller",
      "Margherita Pizza Ofen", "Risotto Safran", "Eier Fried Rice", "Halloumi Grill Gemüse", "Linsen Bolognese",
      "Paneer Tikka", "Quiche Gemüse", "Burrito vegetarisch",
    ],
    s: ["Käse Sticks", "Obst Joghurt", "Hummus Karotten", "Nuss Mix", "Smoothie"],
  },
  keto: {
    b: [
      "Rührei Avocado", "Speck Eier", "Käse Omelett", "Griechischer Joghurt Nüsse", "Chia Kokos",
      "Salami Eier", "Smoked Salmon Frühstück",
    ],
    m: [
      "Lachs Brokkoli Butter", "Hähnchen Caesar ohne Croutons", "Rindersteak Blumenkohl", "Puten Zucchini Pfanne",
      "Thunfisch Salat Olive", "Hackfleisch Kohl", "Garnelen Knoblauch", "Ente Gemüse", "Lamm Rosmarin",
      "Schweinefilet Pilze", "Zucchini Lasagne keto", "Cobb Salad",
    ],
    s: ["Käsewürfel", "Nuss Mix", "Gurke Dip", "Oliven", "Pepperoni Snack"],
  },
  "low-carb": {
    b: ["Rührei Spinat", "Skyr Nüsse", "Omelett Gemüse", "Hüttenkäse Beeren", "Avocado Ei"],
    m: [
      "Hähnchen Salat", "Lachs Spargel", "Pute Paprika Pfanne", "Rind Gemüse Wok", "Fisch Zucchini",
      "Garnelen Salat", "Hack Salat Bowl", "Curry ohne Reis", "Steak grüne Bohnen",
    ],
    s: ["Nüsse", "Käse", "Gemüse Sticks", "Hard Boiled Eggs", "Oliven"],
  },
  paleo: {
    b: ["Eier Süßkartoffel", "Obst Nüsse", "Rührei Champignons", "Smoothie ohne Milch"],
    m: [
      "Hähnchen Ofengemüse", "Lachs Spargel", "Rind Stir Fry", "Pute Süßkartoffel", "Hack Zucchini",
      "Ente Rotkohl", "Schweine Medaillons", "Lamm Karotten", "Fisch Kräuter",
    ],
    s: ["Mandeln", "Beeren", "Rind Biltong Style", "Karotten Hummus ohne Kichererbsen"],
  },
};

const EN: Record<string, PoolSet> = {
  balanced: {
    b: ["Oatmeal berries", "Greek yogurt fruit", "Scrambled eggs toast", "Yogurt banana", "Cottage cheese toast", "Avocado toast", "Granola apple"],
    m: ["Chicken rice pan", "Salmon potatoes", "Turkey veggie bowl", "Pasta tomato", "Beef stir fry", "Tuna salad", "Lentil curry", "Chicken wrap", "Beef tacos", "Shrimp pasta", "Pork chops veg", "Lamb stew"],
    s: ["Apple nuts", "Cottage cheese", "Sandwich", "Fruit yogurt", "Hummus veggies", "Cheese cubes"],
  },
  vegan: {
    b: ["Oatmeal berries", "Tofu scramble", "Avocado toast", "Chia pudding", "Banana peanut", "Fruit salad", "Hummus toast"],
    m: ["Lentil curry", "Tofu rice pan", "Chickpea bowl", "Veggie stir fry", "Buddha bowl", "Tempeh salad", "Bean chili", "Vegan pad thai", "Falafel plate", "Lentil soup", "Veggie burger bowl", "Coconut veg curry", "Mexican bean bowl", "Ramen veggie"],
    s: ["Apple nuts", "Hummus veggies", "Fruit mix", "Edamame", "Nut bar"],
  },
  vegetarian: {
    b: ["Oatmeal berries", "Eggs toast", "Yogurt granola", "Cheese croissant", "Pancakes berries"],
    m: ["Caprese pasta", "Spinach ricotta pasta", "Veg lasagna", "Chickpea curry", "Falafel plate", "Margherita pizza", "Risotto", "Egg fried rice", "Halloumi grill", "Paneer tikka"],
    s: ["Cheese sticks", "Fruit yogurt", "Hummus carrots", "Nut mix"],
  },
  keto: {
    b: ["Eggs avocado", "Bacon eggs", "Cheese omelette", "Greek yogurt nuts", "Chia coconut"],
    m: ["Salmon broccoli", "Chicken caesar no croutons", "Steak cauliflower", "Turkey zucchini", "Tuna olive salad", "Beef cabbage", "Shrimp garlic", "Pork tenderloin mushrooms", "Cobb salad", "Zucchini lasagna keto"],
    s: ["Cheese cubes", "Nut mix", "Cucumber dip", "Olives"],
  },
  "low-carb": {
    b: ["Eggs spinach", "Skyr nuts", "Veggie omelette", "Cottage cheese berries"],
    m: ["Chicken salad", "Salmon asparagus", "Turkey pepper pan", "Beef veg wok", "Fish zucchini", "Shrimp salad", "Steak green beans"],
    s: ["Nuts", "Cheese", "Veggie sticks", "Boiled eggs"],
  },
  paleo: {
    b: ["Eggs sweet potato", "Fruit nuts", "Mushroom scramble"],
    m: ["Chicken roast veg", "Salmon asparagus", "Beef stir fry", "Turkey sweet potato", "Pork zucchini", "Duck cabbage", "Fish herbs"],
    s: ["Almonds", "Berries", "Carrot sticks"],
  },
};

const FR: Record<string, PoolSet> = {
  balanced: {
    b: ["Porridge baies", "Yaourt fruits", "Oeufs pain", "Fromage blanc banane", "Avocat pain"],
    m: ["Poulet riz", "Saumon pommes", "Dinde legumes", "Pates tomate", "Boeuf saute", "Thon salade", "Curry lentilles", "Wrap poulet"],
    s: ["Pomme noix", "Fromage blanc", "Sandwich", "Fruit yaourt"],
  },
  vegan: {
    b: ["Porridge baies", "Tofu brouille", "Avocat pain", "Chia pudding", "Salade fruits", "Hummus pain"],
    m: ["Curry lentilles", "Tofu riz", "Bol pois chiches", "Legumes saute", "Buddha bowl", "Salade tempeh", "Chili haricots", "Pad thai tofu", "Falafel", "Soupe lentilles", "Bowl burrito vegan"],
    s: ["Pomme noix", "Hummus legumes", "Fruits", "Edamame"],
  },
  vegetarian: {
    b: ["Porridge baies", "Oeufs pain", "Yaourt granola", "Fromage brioche"],
    m: ["Pates caprese", "Lasagne legumes", "Curry pois chiches", "Falafel", "Pizza margherita", "Risotto", "Riz oeuf"],
    s: ["Fromage", "Fruit yaourt", "Hummus"],
  },
  keto: {
    b: ["Oeufs avocat", "Bacon oeufs", "Omelette fromage"],
    m: ["Saumon brocoli", "Poulet salade", "Steak chou-fleur", "Dinde courgette", "Thon olives", "Porc champignons"],
    s: ["Fromage", "Noix", "Olives"],
  },
  "low-carb": {
    b: ["Oeufs epinards", "Skyr noix", "Omelette legumes"],
    m: ["Salade poulet", "Saumon asperges", "Boeuf legumes", "Poisson courgette"],
    s: ["Noix", "Fromage", "Legumes crus"],
  },
  paleo: {
    b: ["Oeufs patate douce", "Fruits noix"],
    m: ["Poulet legumes rotis", "Saumon asperges", "Boeuf saute", "Porc courgette"],
    s: ["Amandes", "Baies"],
  },
};

const BY_LANG: Record<Lang, Record<string, PoolSet>> = { de: DE, en: EN, fr: FR };

export function resolveDietKey(prefs: string[]): string {
  const p = prefs.filter((x) => x && x !== "none" && x !== "balanced");
  if (p.includes("vegan")) return "vegan";
  if (p.includes("keto")) return "keto";
  if (p.includes("low-carb")) return "low-carb";
  if (p.includes("paleo")) return "paleo";
  if (p.includes("vegetarian")) return "vegetarian";
  return "balanced";
}

export function getDietPools(lang: Lang, prefs: string[]): PoolSet {
  const diet = resolveDietKey(prefs);
  const pools = BY_LANG[lang][diet] ?? BY_LANG[lang].balanced;
  return pools;
}

// ----- dietPrompts.ts -----
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

// ----- mealBlueprints.ts -----
/** Cooking-style tokens — not standalone shopping ingredients. */
const NOISE_TOKENS = new Set([
  "pfanne",
  "pan",
  "fry",
  "bowl",
  "wok",
  "ofen",
  "oven",
  "natur",
  "nature",
  "style",
  "light",
  "sticks",
  "mix",
  "veggie",
  "veggies",
  "vegetable",
  "vegetables",
  "gemuse",
  "gemüse",
  "saute",
  "sauté",
  "sautee",
  "baked",
  "grill",
  "asian",
  "asia",
  "mediterranean",
  "italian",
  "indian",
  "mexican",
  "classic",
  "homemade",
  "fresh",
  "plain",
  "simple",
  "stir",
  "baked",
  "roast",
  "filet",
  "medaillons",
]);

const MULTI_WORD_HEADS: readonly string[] = [
  "haferflocken",
  "greek yogurt",
  "cottage cheese",
  "fromage blanc",
  "peanut butter",
  "sweet potato",
  "süßkartoffel",
  "olive oil",
  "olivenöl",
  "rice cakes",
  "fish and chips",
  "chicken rice",
  "tofu scramble",
  "tofu-scramble",
  "chia pudding",
  "fruit salad",
  "obstsalat",
  "energy balls",
  "nut bar",
];

function fold(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function capitalizeWord(w: string): string {
  const t = w.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Pull ingredient-like tokens from a dish title (e.g. "Joghurt Banane" → Joghurt, Banane). */
export function parseIngredientNamesFromDishTitle(title: string): string[] {
  let blob = title.trim();
  if (!blob) return ["Gemüse"];

  blob = blob
    .replace(/\s+mit\s+/gi, " ")
    .replace(/\s+und\s+/gi, " ")
    .replace(/\s+with\s+/gi, " ")
    .replace(/\s+and\s+/gi, " ")
    .replace(/[–—]/g, " ");

  const foldedBlob = fold(blob);
  const picked: string[] = [];

  for (const phrase of MULTI_WORD_HEADS) {
    if (foldedBlob.includes(phrase)) {
      const start = foldedBlob.indexOf(phrase);
      picked.push(blob.slice(start, start + phrase.length).trim());
    }
  }

  const parts = blob
    .split(/[\s,&+\-/]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 2);

  for (const part of parts) {
    const f = fold(part);
    if (NOISE_TOKENS.has(f)) continue;
    if (picked.some((p) => fold(p) === f)) continue;
    picked.push(part);
  }

  if (!picked.length) {
    return [capitalizeWord(blob.split(/\s+/)[0] || "Gemüse")];
  }

  return picked.slice(0, 5).map(capitalizeWord);
}

export function ingredientsFromDishTitle(
  title: string,
  ctx: SafetyContext,
): Ingredient[] {
  const names = parseIngredientNamesFromDishTitle(title).filter((n) => !nameUnsafe(n, ctx));
  const safe = names.length ? names : parseIngredientNamesFromDishTitle(title).slice(0, 1);
  const list = safe.length ? safe : ["Gemüse"];

  return list.map((name, i) => ({
    name,
    amount: i === 0 ? "1 Portion" : "1 Portion",
    price: i === 0 ? 2 : Math.round((1.2 + i * 0.1) * 100) / 100,
  }));
}

export function slotTypeLabel(lang: Lang, slot: "b" | "m" | "s"): string {
  if (lang === "en") {
    return slot === "b" ? "Breakfast" : slot === "m" ? "Main meal" : "Snack";
  }
  if (lang === "fr") {
    return slot === "b" ? "Petit-déjeuner" : slot === "m" ? "Repas principal" : "Collation";
  }
  return slot === "b" ? "Frühstück" : slot === "m" ? "Hauptmahlzeit" : "Snack";
}

export function buildMealFromDishTitle(
  name: string,
  slot: "b" | "m" | "s",
  lang: Lang,
  ctx: SafetyContext,
): Meal {
  const ingredients = ingredientsFromDishTitle(name, ctx);
  const tags = mealAllergenTags({ name, ingredients, allergenTags: [] });
  return normalizeMealStructure({
    type: slotTypeLabel(lang, slot),
    name: name.trim(),
    prepTime: slot === "m" ? 25 : 12,
    ingredients,
    instructions: [],
    allergenTags: tags.length ? tags : ["none"],
  });
}

export function dishFingerprintFromTitle(title: string, ctx: SafetyContext): string {
  const meal = buildMealFromDishTitle(title, "m", "de", ctx);
  return mealDishFingerprint(meal);
}

// ===== HTTP handler =====
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl) {
      return json({ error: "config_error", message: "Missing SUPABASE_URL" }, 500);
    }
    if (!serviceRoleKey) {
      return json({ error: "config_error", message: "Missing SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    }) as unknown as SupabaseClient;

    const authResult = await requireAuthUser(supabase, req.headers.get("Authorization"));
    if (authResult instanceof Response) return authResult;
    const { user: authUser, auth } = authResult;
    const userId = authUser.id;

    if (!(await isPremium(supabase, userId, authUser.email ?? null, auth))) {
      return json({ error: "premium_required", message: "Premium required." }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json", message: "Body is not valid JSON" }, 400);
    }

    const mealsPerDay = Math.min(6, Math.max(3, Number(body.mealsPerDay) || 5));
    const { targets, warning: targetWarning, macroAuthority } = reconcileTargets({
      dailyCalories: Number(body.dailyCalories) || 2000,
      dailyProtein: Number(body.dailyProtein) || 150,
      dailyCarbs: Number(body.dailyCarbs) || 200,
      dailyFat: Number(body.dailyFat) || 65,
    });
    const allergies = Array.isArray(body.allergies) ? body.allergies.map(String) : [];
    const prefs = Array.isArray(body.dietaryPreferences) ? body.dietaryPreferences.map(String) : [];
    const goals = Array.isArray(body.healthGoals) ? body.healthGoals.map(String) : [];
    const other = typeof body.allergiesOther === "string" ? body.allergiesOther.trim() : "";
    const lang = resolveLang(body.language);
    const fridge = Array.isArray(body.fridgeIngredients) ? body.fridgeIngredients.map(String).filter(Boolean) : [];
    const banned = Array.isArray(body.previousMealNames) ? body.previousMealNames.map(String).filter(Boolean) : [];
    const priorDishes = parsePriorMealsFromBody(body.previousMeals, banned);
    const isRegeneration = body.isRegeneration === true || body.isRegeneration === "true";
    const varietySeed = typeof body.varietySeed === "string" ? body.varietySeed.trim() : "";
    const constraints = [
      buildConstraints(allergies, prefs, goals, other, lang),
      typeof body.constraintPrompt === "string" ? body.constraintPrompt.trim() : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const { plan, usedAi, repairAttempts } = await buildPlan({
      mealsPerDay,
      targets,
      prefs,
      allergies,
      other,
      goals,
      lang,
      fridge,
      banned,
      constraints,
      safetyCtx: createSafetyContext(allergies, prefs, other),
      isRegeneration: isRegeneration || priorDishes.length > 0,
      varietySeed,
      priorDishes,
    });

    const list = shoppingList(plan, fridge);
    const meta = scanMeta(plan, fridge, list);

    await trackMealPlanUsage(supabase, userId);

    return json({
      mealPlan: plan,
      shoppingList: list,
      scanMeta: meta,
      generatedWithAi: usedAi,
      appliedTargets: targets,
      macroAuthority,
      ...(targetWarning ? { targetWarning } : {}),
      ...(repairAttempts > 0 ? { repairAttempts } : {}),
    }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[MEAL-PLAN]", message);
    return json({ error: "meal_plan_generation_failed", message }, 500);
  }
});
