import { LANG } from "./constants.ts";
import { normalizeMealStructure } from "./macros.ts";
import { mealSlot } from "./meals.ts";
import {
  createSafetyContext,
  filterPool,
  nameUnsafe,
} from "./validation.ts";
import type { Lang, MacroTargets, MealPlan } from "./types.ts";

/** Ultra-minimal plan — only whole vegetables/fruit; last-resort when pools fail. */
export function guaranteedSafeMinimalPlan(params: {
  mealsPerDay: number;
  lang: Lang;
}): MealPlan {
  const L = LANG[params.lang];
  const templates: Record<Lang, { b: string; m: string; s: string; ings: [string, string, string] }> = {
    de: {
      b: "Obstsalat",
      m: "Gemüsepfanne Natur",
      s: "Gemüse Sticks",
      ings: ["Apfel", "Karotte", "Brokkoli"],
    },
    en: {
      b: "Fruit salad",
      m: "Plain veggie pan",
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

  return Array.from({ length: 7 }, (_, di) => ({
    day: L.days[di],
    meals: Array.from({ length: params.mealsPerDay }, (_, si) => {
      const slot = mealSlot(si, params.mealsPerDay);
      const name = slot === "b" ? t.b : slot === "m" ? t.m : t.s;
      return normalizeMealStructure({
        type: LANG[params.lang].meal,
        name,
        prepTime: 10,
        allergenTags: ["none"],
        ingredients: t.ings.map((n, i) => ({
          name: n,
          amount: "1 Portion",
          price: i === 0 ? 1 : 0.8,
        })),
      });
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
}): MealPlan {
  const L = LANG[params.lang];
  const ctx = createSafetyContext(params.allergies, params.prefs, params.other);
  const vegan = params.prefs.includes("vegan");
  const veg = params.prefs.includes("vegetarian") || vegan;
  const lowCarb = params.prefs.includes("keto") || params.prefs.includes("low-carb");
  const pools = {
    de: {
      b: ["Haferflocken Beeren", "Skyr Obst", "Rührei Brot", "Joghurt Banane", "Hüttenkäse Toast", "Avocado Brot", "Müsli Apfel"],
      m: ["Hähnchen Reis Pfanne", "Lachs Kartoffeln", "Puten Gemüse Bowl", "Pasta Tomate", "Rind Pfanne", "Thunfisch Salat", "Linsen Curry"],
      s: ["Apfel Nüsse", "Quark", "Vollkornbrot Aufstrich", "Obst Joghurt", "Hummus Gemüse"],
    },
    en: {
      b: ["Oatmeal berries", "Greek yogurt fruit", "Scrambled eggs toast", "Yogurt banana", "Cottage cheese toast"],
      m: ["Chicken rice pan", "Salmon potatoes", "Turkey veggie bowl", "Pasta tomato", "Beef stir fry", "Tuna salad", "Lentil curry"],
      s: ["Apple nuts", "Cottage cheese", "Sandwich", "Fruit yogurt", "Hummus veggies"],
    },
    fr: {
      b: ["Porridge baies", "Yaourt fruits", "Oeufs pain", "Fromage blanc banane"],
      m: ["Poulet riz", "Saumon pommes", "Dinde legumes", "Pates tomate", "Boeuf saute", "Thon salade", "Curry lentilles"],
      s: ["Pomme noix", "Fromage blanc", "Sandwich", "Fruit yaourt"],
    },
  }[params.lang];

  if (vegan) {
    const v = {
      de: {
        b: ["Haferflocken Beeren", "Tofu Rührei", "Avocado Brot", "Chia Pudding", "Banane Erdnuss", "Obstsalat", "Hummus Brot"],
        m: ["Linsen Curry", "Tofu Reis Pfanne", "Kichererbsen Bowl", "Gemüsepfanne", "Buddha Bowl", "Tempeh Salat", "Bohnen Chili"],
        s: ["Apfel Nüsse", "Hummus Gemüse", "Obst Mix", "Edamame", "Nussriegel"],
      },
      en: {
        b: ["Oatmeal berries", "Tofu scramble", "Avocado toast", "Chia pudding", "Banana peanut", "Fruit salad"],
        m: ["Lentil curry", "Tofu rice pan", "Chickpea bowl", "Veggie stir fry", "Buddha bowl", "Tempeh salad", "Bean chili"],
        s: ["Apple nuts", "Hummus veggies", "Fruit mix", "Edamame"],
      },
      fr: {
        b: ["Porridge baies", "Tofu brouille", "Avocat pain", "Chia pudding", "Salade fruits"],
        m: ["Curry lentilles", "Tofu riz", "Bol pois chiches", "Legumes saute", "Buddha bowl", "Salade tempeh"],
        s: ["Pomme noix", "Hummus legumes", "Fruits", "Edamame"],
      },
    }[params.lang];
    pools.b = v.b;
    pools.m = v.m;
    pools.s = v.s;
  } else if (veg) {
    pools.b = filterPool(pools.b, ctx, params.lang, "b");
    pools.m = filterPool(pools.m, ctx, params.lang, "m");
    pools.s = filterPool(pools.s, ctx, params.lang, "s");
  }

  const safePools = {
    b: filterPool(pools.b, ctx, params.lang, "b"),
    m: filterPool(pools.m, ctx, params.lang, "m"),
    s: filterPool(pools.s, ctx, params.lang, "s"),
  };

  const used = new Set(params.banned);
  const pick = (pool: string[], idx: number, dayTag: string) => {
    for (let o = 0; o < pool.length; o++) {
      const name = pool[(idx + o) % pool.length];
      if (!used.has(name.toLowerCase())) {
        used.add(name.toLowerCase());
        return name;
      }
    }
    const base = pool[idx % pool.length];
    const name = dayTag ? `${base} — ${dayTag}` : `${base} (alt)`;
    used.add(name.toLowerCase());
    return name;
  };

  return Array.from({ length: 7 }, (_, di) => {
    const dayTag = L.days[di];
    const meals = Array.from({ length: params.mealsPerDay }, (_, si) => {
      const slot = mealSlot(si, params.mealsPerDay);
      const pool = slot === "b" ? safePools.b : slot === "m" ? safePools.m : safePools.s;
      const name = pick(pool, di * params.mealsPerDay + si, dayTag);
      const proteinOpts = vegan
        ? ["Tofu", "Linsen", "Kichererbsen"]
        : veg && slot === "m"
          ? ["Linsen", "Kichererbsen", "Eier"]
          : slot === "m"
            ? ["Hähnchen", "Pute", "Fisch"]
            : ["Joghurt", "Skyr", "Eier", "Hüttenkäse"];
      const carbOpts = lowCarb
        ? ["Gemüse", "Salat", "Zucchini"]
        : slot === "b"
          ? ["Haferflocken", "Brot", "Obst"]
          : ["Reis", "Kartoffeln", "Nudeln"];
      const protein = proteinOpts.find((n) => !nameUnsafe(n, ctx)) || proteinOpts[0];
      const carb = carbOpts.find((n) => !nameUnsafe(n, ctx)) || carbOpts[0];
      return normalizeMealStructure({
        type: slot === "b" ? "Frühstück" : slot === "m" ? "Hauptmahlzeit" : "Snack",
        name,
        prepTime: slot === "m" ? 25 : 12,
        ingredients: [
          { name: protein, amount: "1 Portion", price: 2 },
          { name: carb, amount: "1 Portion", price: 1.5 },
          { name: "Gemüse", amount: "1 Portion", price: 1 },
        ],
      });
    });
    return { day: L.days[di], meals };
  });
}
