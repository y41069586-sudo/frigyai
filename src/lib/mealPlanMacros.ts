/** Max allowed gap between stated kcal and 4P+4C+9F per meal. */
export const MACRO_KCAL_TOLERANCE = 50;

export type MacroMeal = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  [key: string]: unknown;
};

export type MacroDay = {
  day?: string;
  meals?: MacroMeal[];
  [key: string]: unknown;
};

export type DailyMacroTargets = {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
};

export function macroCaloriesFromGrams(protein: number, carbs: number, fat: number): number {
  return protein * 4 + carbs * 4 + fat * 9;
}

export function sumMealMacros(meals: MacroMeal[]) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (Number(m.calories) || 0),
      protein: acc.protein + (Number(m.protein) || 0),
      carbs: acc.carbs + (Number(m.carbs) || 0),
      fat: acc.fat + (Number(m.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** Align calorie goal with macro grams so all four targets can be hit exactly. */
export function harmonizeDailyTargets(targets: DailyMacroTargets): DailyMacroTargets {
  const implied = macroCaloriesFromGrams(
    targets.dailyProtein,
    targets.dailyCarbs,
    targets.dailyFat,
  );
  const diff = targets.dailyCalories - implied;
  if (Math.abs(diff) <= 2) {
    return { ...targets, dailyCalories: implied };
  }
  const carbAdj = Math.round(diff / 4);
  const dailyCarbs = Math.max(0, targets.dailyCarbs + carbAdj);
  const dailyCalories = macroCaloriesFromGrams(
    targets.dailyProtein,
    dailyCarbs,
    targets.dailyFat,
  );
  return { ...targets, dailyCarbs, dailyCalories };
}

function recalcMealCalories<T extends MacroMeal>(meal: T): T {
  const protein = Math.max(0, Math.round(Number(meal.protein) || 0));
  const carbs = Math.max(0, Math.round(Number(meal.carbs) || 0));
  const fat = Math.max(0, Math.round(Number(meal.fat) || 0));
  const calories = Math.max(50, Math.round(macroCaloriesFromGrams(protein, carbs, fat)));
  return { ...meal, protein, carbs, fat, calories };
}

/** Normalize one meal: macros are source of truth; kcal always derived. */
export function normalizeMealMacros<T extends MacroMeal>(meal: T): T {
  const protein = Math.max(0, Math.round(Number(meal.protein) || 0));
  const carbs = Math.max(0, Math.round(Number(meal.carbs) || 0));
  const fat = Math.max(0, Math.round(Number(meal.fat) || 0));
  const fromMacros = macroCaloriesFromGrams(protein, carbs, fat);
  const stated = Number(meal.calories) || 0;
  if (stated > 0 && Math.abs(stated - fromMacros) > MACRO_KCAL_TOLERANCE) {
    return recalcMealCalories({ ...meal, protein, carbs, fat });
  }
  return recalcMealCalories({ ...meal, protein, carbs, fat });
}

/** Distribute calorie gap across meals via smallest macro steps (4 or 9 kcal). */
function balanceDayCalories(meals: MacroMeal[], targetCalories: number) {
  for (let pass = 0; pass < 400; pass++) {
    const total = sumMealMacros(meals).calories;
    const diff = targetCalories - total;
    if (diff === 0) break;

    const idx = pass % meals.length;
    const m = meals[idx];
    if (diff > 0) {
      if (Math.abs(diff) >= 9) m.fat = (Number(m.fat) || 0) + 1;
      else m.carbs = (Number(m.carbs) || 0) + 1;
    } else {
      if (Math.abs(diff) >= 9 && (Number(m.fat) || 0) > 0) m.fat = (Number(m.fat) || 0) - 1;
      else if ((Number(m.carbs) || 0) > 0) m.carbs = (Number(m.carbs) || 0) - 1;
      else if ((Number(m.protein) || 0) > 0) m.protein = (Number(m.protein) || 0) - 1;
    }
    meals[idx] = recalcMealCalories(m);
  }
}

/**
 * Scale day macros to hit P/C/F/F-kcal targets exactly.
 * Calories per meal always = 4P+4C+9F (real values).
 */
export function syncDayToTargets<T extends MacroDay>(day: T, rawTargets: DailyMacroTargets): T {
  const targets = harmonizeDailyTargets(rawTargets);
  let meals = (day.meals || []).map((m) => normalizeMealMacros(m));
  if (meals.length === 0) return day;

  const initial = sumMealMacros(meals);
  const fp = targets.dailyProtein / (initial.protein || 1);
  const fcb = targets.dailyCarbs / (initial.carbs || 1);
  const ff = targets.dailyFat / (initial.fat || 1);

  meals = meals.map((m) =>
    recalcMealCalories({
      ...m,
      protein: Math.max(0, Math.round((Number(m.protein) || 0) * fp)),
      carbs: Math.max(0, Math.round((Number(m.carbs) || 0) * fcb)),
      fat: Math.max(0, Math.round((Number(m.fat) || 0) * ff)),
    }),
  );

  const lastIdx = meals.length - 1;
  const beforeLast = sumMealMacros(meals.slice(0, lastIdx));
  meals[lastIdx] = recalcMealCalories({
    ...meals[lastIdx],
    protein: Math.max(0, targets.dailyProtein - beforeLast.protein),
    carbs: Math.max(0, targets.dailyCarbs - beforeLast.carbs),
    fat: Math.max(0, targets.dailyFat - beforeLast.fat),
  });

  balanceDayCalories(meals, targets.dailyCalories);

  return { ...day, meals } as T;
}

export function syncMealPlanToTargets<T extends MacroDay>(
  mealPlan: T[],
  targets: DailyMacroTargets,
): T[] {
  return mealPlan.map((day) => syncDayToTargets(day, targets));
}

export function reconcileMealPlanMacros<T extends MacroDay>(
  mealPlan: T[],
  targets: DailyMacroTargets,
): T[] {
  return syncMealPlanToTargets(mealPlan, targets);
}
