import { LANG } from "./constants.ts";
import { getDietPools } from "./dietPools.ts";
import { buildMealFromDishTitle, dishFingerprintFromTitle } from "./mealBlueprints.ts";
import { mealSlot } from "./meals.ts";
import { seededShuffle } from "./shuffle.ts";
import { createSafetyContext, filterPool } from "./validation.ts";
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
    const pool = safePools[slot];
    const base = pool.length ? pool[(synthCounter - 1) % pool.length]! : (slot === "m" ? "Gemüsepfanne" : slot === "b" ? "Haferflocken mit Beeren" : "Obst Mix");
    const label = params.isRegeneration && pool.length > 1
      ? `${base} (${dayTag})`
      : base;
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
