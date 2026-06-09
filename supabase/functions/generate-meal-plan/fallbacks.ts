import { LANG } from "./constants.ts";
import { enrichPoolsForMealPlanPrefs, getDietPools } from "./dietPools.ts";
import { buildMealFromDishTitle, dishFingerprintFromTitle } from "./mealBlueprints.ts";
import { mealSlot } from "./meals.ts";
import type { MealPlanPrefsInput } from "./mealPlanPrefs.ts";
import { seededShuffle } from "./shuffle.ts";
import { createSafetyContext, filterPool } from "./validation.ts";
import type { Lang, MacroTargets, MealPlan } from "./types.ts";

/** Ultra-minimal plan — only whole vegetables/fruit; last-resort when pools fail. */
export function guaranteedSafeMinimalPlan(params: {
  mealsPerDay: number;
  lang: Lang;
}): MealPlan {
  const L = LANG[params.lang];
  const weekTemplates: Record<Lang, Array<{ b: string; m: string; s: string }>> = {
    de: [
      { b: "Haferflocken mit Beeren", m: "Hähnchen mit Reis", s: "Apfel mit Nüssen" },
      { b: "Joghurt mit Banane", m: "Linsensuppe mit Brot", s: "Quark mit Beeren" },
      { b: "Rührei mit Brot", m: "Nudeln mit Tomatensoße", s: "Obst mit Joghurt" },
      { b: "Müsli mit Apfel", m: "Thunfisch Salat", s: "Käse mit Gurke" },
      { b: "Avocado Toast", m: "Putenpfanne mit Gemüse", s: "Brot mit Aufstrich" },
      { b: "Porridge", m: "Gemüsepfanne mit Kartoffeln", s: "Milchreis" },
      { b: "Obstsalat", m: "Reis mit Gemüse", s: "Gemüse Sticks" },
    ],
    en: [
      { b: "Oatmeal berries", m: "Chicken and rice", s: "Apple nuts" },
      { b: "Yogurt banana", m: "Lentil soup bread", s: "Cottage cheese berries" },
      { b: "Scrambled eggs toast", m: "Pasta tomato", s: "Fruit yogurt" },
      { b: "Granola apple", m: "Tuna salad", s: "Cheese cucumber" },
      { b: "Avocado toast", m: "Turkey veggie pan", s: "Bread spread" },
      { b: "Porridge", m: "Vegetable potato pan", s: "Rice pudding" },
      { b: "Fruit salad", m: "Rice vegetables", s: "Veggie sticks" },
    ],
    fr: [
      { b: "Porridge baies", m: "Poulet riz", s: "Pomme noix" },
      { b: "Yaourt banane", m: "Soupe lentilles pain", s: "Fromage blanc fruits" },
      { b: "Oeufs brouilles toast", m: "Pates tomate", s: "Fruits yaourt" },
      { b: "Muesli pomme", m: "Salade thon", s: "Fromage concombre" },
      { b: "Toast avocat", m: "Dinde legumes", s: "Pain tartine" },
      { b: "Porridge", m: "Poelee legumes pommes", s: "Riz au lait" },
      { b: "Salade de fruits", m: "Riz legumes", s: "Legumes crus" },
    ],
  };
  const templates = weekTemplates[params.lang];
  const ctx = createSafetyContext([], [], "");

  return Array.from({ length: 7 }, (_, di) => {
    const t = templates[di % templates.length]!;
    return {
      day: L.days[di],
      meals: Array.from({ length: params.mealsPerDay }, (_, si) => {
        const slot = mealSlot(si, params.mealsPerDay);
        const title = slot === "b" ? t.b : slot === "m" ? t.m : t.s;
        return buildMealFromDishTitle(title, slot, params.lang, ctx);
      }),
    };
  });
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
  mealPlanPrefs?: MealPlanPrefsInput;
}): MealPlan {
  const L = LANG[params.lang];
  const ctx = createSafetyContext(params.allergies, params.prefs, params.other);

  const basePools = enrichPoolsForMealPlanPrefs(
    getDietPools(params.lang, params.prefs),
    params.lang,
    params.mealPlanPrefs,
  );
  const pools = {
    b: filterPool(basePools.b, ctx, params.lang, "b"),
    m: filterPool(basePools.m, ctx, params.lang, "m"),
    s: filterPool(basePools.s, ctx, params.lang, "s"),
  };

  const cuisineKey = params.mealPlanPrefs?.cuisines?.join("-") ?? "";
  const timeKey = params.mealPlanPrefs?.maxPrepTime ?? "";
  const shuffleKey = [params.varietySeed, cuisineKey, timeKey, String(Date.now())].filter(Boolean).join("|");
  const safePools = {
    b: seededShuffle(pools.b, `${shuffleKey}-b-${params.isRegeneration ? "r" : "n"}`),
    m: seededShuffle(pools.m, `${shuffleKey}-m-${params.isRegeneration ? "r" : "n"}`),
    s: seededShuffle(pools.s, `${shuffleKey}-s-${params.isRegeneration ? "r" : "n"}`),
  };

  const used = new Set(params.banned);
  const usedFp = new Set(params.bannedFingerprints ?? []);
  const poolIndex = { b: 0, m: 0, s: 0 };
  let synthCounter = 0;

  const pickUniqueTitle = (titlePool: string[], slot: "b" | "m" | "s", _dayTag: string): string => {
    const list = titlePool.length ? titlePool : safePools[slot];
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
    const slotPool = safePools[slot];
    const base = slotPool.length ? slotPool[(synthCounter - 1) % slotPool.length]! : (slot === "m" ? "Gemüsepfanne" : slot === "b" ? "Haferflocken mit Beeren" : "Obst Mix");
    const label = base;
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
