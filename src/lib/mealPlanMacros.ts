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
  return { ...targets, dailyCalories: implied };
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

function balanceDayMacro(meals: MacroMeal[], macro: "protein" | "carbs" | "fat", target: number) {
  for (let pass = 0; pass < 1200; pass++) {
    const totals = sumMealMacros(meals);
    const current = Number(totals[macro]) || 0;
    const diff = target - current;
    if (diff === 0) break;

    const idx = pass % meals.length;
    const meal = meals[idx];
    const currentValue = Number(meal[macro]) || 0;
    if (diff > 0) {
      meal[macro] = currentValue + 1;
    } else if (currentValue > 0) {
      meal[macro] = currentValue - 1;
    } else {
      continue;
    }
    meals[idx] = recalcMealCalories(meal);
  }
}

function validateSyncedDay(meals: MacroMeal[], targets: DailyMacroTargets) {
  const totals = sumMealMacros(meals);
  const expectedCalories = macroCaloriesFromGrams(
    targets.dailyProtein,
    targets.dailyCarbs,
    targets.dailyFat,
  );

  if (
    totals.protein !== targets.dailyProtein ||
    totals.carbs !== targets.dailyCarbs ||
    totals.fat !== targets.dailyFat ||
    totals.calories !== expectedCalories
  ) {
    throw new Error("Meal plan macros out of sync");
  }

  for (const meal of meals) {
    const expectedMealCalories = macroCaloriesFromGrams(
      Number(meal.protein) || 0,
      Number(meal.carbs) || 0,
      Number(meal.fat) || 0,
    );
    if ((Number(meal.calories) || 0) !== expectedMealCalories) {
      throw new Error("Meal calories do not match macros");
    }
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

  balanceDayMacro(meals, "protein", targets.dailyProtein);
  balanceDayMacro(meals, "carbs", targets.dailyCarbs);
  balanceDayMacro(meals, "fat", targets.dailyFat);
  validateSyncedDay(meals, targets);

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
