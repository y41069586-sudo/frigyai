import type { MealLike, MealNorm } from "./types.ts";

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
