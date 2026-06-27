import { mealAllergenTags } from "./allergens.ts";
import {
  defaultAmountForIngredient,
  normalizeIngredientAmount,
  resolveIngredientPrice,
} from "./ingredientDefaults.ts";
import { isInvalidIngredientToken } from "./ingredientSanitize.ts";
import { normalizeMealStructure } from "./macros.ts";
import { mealDishFingerprint } from "./normalize.ts";
import { nameUnsafe } from "./validation.ts";
import type { Ingredient, Lang, Meal, SafetyContext } from "./types.ts";

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
    if (isInvalidIngredientToken(part)) continue;
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
  slot: "b" | "m" | "s" = "m",
): Ingredient[] {
  const names = parseIngredientNamesFromDishTitle(title).filter((n) => !nameUnsafe(n, ctx));
  const safe = names.length ? names : parseIngredientNamesFromDishTitle(title).slice(0, 1);
  const list = safe.length ? safe : ["Gemüse"];

  return list.map((name) => {
    const amount = defaultAmountForIngredient(name, slot);
    return {
      name,
      amount,
      price: resolveIngredientPrice(name, amount, null),
    };
  });
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
  const ingredients = ingredientsFromDishTitle(name, ctx, slot);
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
