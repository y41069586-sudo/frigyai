import {
  KCAL_MACRO_TOLERANCE,
  MACRO_CAPS,
  RECONCILE_RATIO_MAX,
  RECONCILE_RATIO_MIN,
  SLOT_WEIGHTS,
} from "./constants.ts";
import { sanitizeIngredient } from "./ingredientSanitize.ts";
import {
  aiMacrosUnrealisticForDishes,
  dishCalorieWeightHint,
  dishMaximumKcal,
  dishMinimumKcal,
} from "./mealCalorieHints.ts";
import { sanitizeMealInstructions } from "./planMealSanitize.ts";
import type {
  DayPlan,
  MacroAuthority,
  MacroReconcileWarning,
  MacroTargets,
  Meal,
  MealLike,
  MealPlan,
  ReconcileResult,
} from "./types.ts";


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
          .map((i) => sanitizeIngredient(i || {}))
          .filter((i): i is NonNullable<typeof i> => i !== null)
          .slice(0, 6)
      : [],
    instructions: sanitizeMealInstructions(m.instructions),
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
        .map((i) => sanitizeIngredient(i || {}))
        .filter((i): i is NonNullable<typeof i> => i !== null)
        .slice(0, 6)
    : [];
  const instructions = sanitizeMealInstructions(m?.instructions);
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

function mealSlotForSync(si: number, mpd: number): "b" | "m" | "s" {
  if (si === 0) return "b";
  const mains = mpd >= 4 ? [1, 3] : [1];
  return mains.includes(si) ? "m" : "s";
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

/** Per-meal kcal weights: dish-aware hints, AI ratios only when realistic, else slot + day jitter. */
function mealKcalWeights(
  meals: Meal[],
  mealsPerDay: number,
  dayIndex: number,
  dailyCalories: number,
): number[] {
  const baseSlot = slotWeights(mealsPerDay);
  return meals.map((m, i) => {
    const p = Math.max(0, Number(m.protein) || 0);
    const c = Math.max(0, Number(m.carbs) || 0);
    const f = Math.max(0, Number(m.fat) || 0);
    const aiKcal = macroKcal(p, c, f);
    const minKcal = dishMinimumKcal(m.name, m.type, dailyCalories, mealsPerDay);
    const maxKcal = dishMaximumKcal(m.name, m.type, dailyCalories);
    const aiRealistic = minKcal === 0 || aiKcal >= minKcal * 0.85;
    const aiWithinMax = !Number.isFinite(maxKcal) || aiKcal <= maxKcal * 1.1;
    if (aiKcal >= 80 && aiRealistic && aiWithinMax) return aiKcal;

    const dishHint = dishCalorieWeightHint(m.name, m.type, i, mealsPerDay);
    const slot = mealSlotForSync(i, mealsPerDay);
    const slotHint = slot === "b" ? 0.2 : slot === "m" ? 0.36 : 0.12;
    const base = baseSlot[i] ?? slotHint;
    let weight = Math.max(dishHint * dailyCalories, base * dailyCalories * 0.85);
    if (minKcal > 0) weight = Math.max(weight, minKcal);
    if (Number.isFinite(maxKcal)) weight = Math.min(weight, maxKcal);

    const name = String(m.name || "");
    let h = (dayIndex + 1) * 7919;
    for (let j = 0; j < name.length; j++) h = (Math.imul(h, 31) + name.charCodeAt(j)) >>> 0;
    const jitter = 0.88 + (h % 24) / 100;
    return Math.max(0.05, weight * jitter);
  });
}

function scaleMealsToDailyTargets(meals: Meal[], targets: MacroTargets): Meal[] {
  const t = harmonizeTargets(targets);
  const sum = sumMeals(meals);
  if (sum.protein + sum.carbs + sum.fat <= 0) return meals;

  const scaleP = sum.protein > 0 ? t.dailyProtein / sum.protein : 1;
  const scaleC = sum.carbs > 0 ? t.dailyCarbs / sum.carbs : 1;
  const scaleF = sum.fat > 0 ? t.dailyFat / sum.fat : 1;

  return meals.map((m) =>
    recalcMeal({
      ...m,
      protein: Math.max(0, Math.round((Number(m.protein) || 0) * scaleP)),
      carbs: Math.max(0, Math.round((Number(m.carbs) || 0) * scaleC)),
      fat: Math.max(0, Math.round((Number(m.fat) || 0) * scaleF)),
    }),
  );
}

/**
 * Daily totals exact; per-meal size varies by dish (not the same kcal on every weekday for slot 1..N).
 */
export function syncDay(
  day: DayPlan,
  targets: MacroTargets,
  mealsPerDay: number,
  dayIndex = 0,
): DayPlan {
  const t = harmonizeTargets(targets);
  let meals = (day.meals || []).map((m) => normalizeMealStructure({ ...m }));
  if (!meals.length) return { ...day, meals };

  const sum = sumMeals(meals);
  const aiTotals = sum.protein + sum.carbs + sum.fat;
  const kcalSpread = meals.map((m) => macroKcal(Number(m.protein) || 0, Number(m.carbs) || 0, Number(m.fat) || 0));
  const distinctKcals = new Set(kcalSpread.map((k) => Math.round(k / 40))).size;
  const unrealisticAi = aiMacrosUnrealisticForDishes(meals, t.dailyCalories, mealsPerDay);

  if (aiTotals > 0 && distinctKcals >= Math.min(3, meals.length) && !unrealisticAi) {
    meals = scaleMealsToDailyTargets(meals, t);
  } else {
    const w = mealKcalWeights(meals, mealsPerDay, dayIndex, t.dailyCalories);
    const proteins = distributeIntegers(t.dailyProtein, w);
    const carbs = distributeIntegers(t.dailyCarbs, w);
    const fats = distributeIntegers(t.dailyFat, w);
    meals = meals.map((m, i) =>
      recalcMeal({ ...m, protein: proteins[i]!, carbs: carbs[i]!, fat: fats[i]! }),
    );
  }

  meals = correctSyncedDayDrift(meals, t);
  return { ...day, meals };
}

export function syncPlan(plan: MealPlan, targets: MacroTargets, mealsPerDay: number): MealPlan {
  return plan.map((d, dayIndex) => syncDay(d, targets, mealsPerDay, dayIndex));
}
