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

/** Normalize one meal: macros are source of truth; kcal must match within tolerance. */
export function normalizeMealMacros<T extends MacroMeal>(meal: T): T {
  const protein = Math.max(0, Math.round(Number(meal.protein) || 0));
  const carbs = Math.max(0, Math.round(Number(meal.carbs) || 0));
  const fat = Math.max(0, Math.round(Number(meal.fat) || 0));
  const fromMacros = macroCaloriesFromGrams(protein, carbs, fat);
  const stated = Number(meal.calories) || 0;
  const calories =
    stated > 0 && Math.abs(stated - fromMacros) <= MACRO_KCAL_TOLERANCE
      ? Math.round(stated)
      : Math.max(50, Math.round(fromMacros));
  return { ...meal, protein, carbs, fat, calories };
}

/**
 * Scale day macros to hit targets exactly. Last meal absorbs rounding;
 * calories always derived from macros so day totals stay consistent.
 */
export function syncDayToTargets<T extends MacroDay>(day: T, targets: DailyMacroTargets): T {
  let meals = (day.meals || []).map((m) => normalizeMealMacros(m));
  if (meals.length === 0) return day;

  const initial = sumMealMacros(meals);
  const fp = targets.dailyProtein / (initial.protein || 1);
  const fcb = targets.dailyCarbs / (initial.carbs || 1);
  const ff = targets.dailyFat / (initial.fat || 1);

  const scaleMeal = (m: MacroMeal) => {
    const protein = Math.max(0, Math.round((Number(m.protein) || 0) * fp));
    const carbs = Math.max(0, Math.round((Number(m.carbs) || 0) * fcb));
    const fat = Math.max(0, Math.round((Number(m.fat) || 0) * ff));
    const calories = Math.max(50, Math.round(macroCaloriesFromGrams(protein, carbs, fat)));
    return { ...m, protein, carbs, fat, calories };
  };

  meals = meals.map(scaleMeal);

  const lastIdx = meals.length - 1;
  const beforeLast = sumMealMacros(meals.slice(0, lastIdx));
  const last = meals[lastIdx];
  meals[lastIdx] = {
    ...last,
    protein: Math.max(0, targets.dailyProtein - beforeLast.protein),
    carbs: Math.max(0, targets.dailyCarbs - beforeLast.carbs),
    fat: Math.max(0, targets.dailyFat - beforeLast.fat),
  };
  meals[lastIdx].calories = Math.max(
    50,
    Math.round(
      macroCaloriesFromGrams(
        meals[lastIdx].protein as number,
        meals[lastIdx].carbs as number,
        meals[lastIdx].fat as number,
      ),
    ),
  );

  const total = sumMealMacros(meals);
  const calDiff = targets.dailyCalories - total.calories;
  if (calDiff !== 0) {
    const fatAdj = Math.round(calDiff / 9);
    meals[lastIdx].fat = Math.max(0, (meals[lastIdx].fat as number) + fatAdj);
    meals[lastIdx].calories = Math.max(
      50,
      Math.round(
        macroCaloriesFromGrams(
          meals[lastIdx].protein as number,
          meals[lastIdx].carbs as number,
          meals[lastIdx].fat as number,
        ),
      ),
    );
  }

  return { ...day, meals } as T;
}

export function syncMealPlanToTargets<T extends MacroDay>(
  mealPlan: T[],
  targets: DailyMacroTargets,
): T[] {
  return mealPlan.map((day) => syncDayToTargets(day, targets));
}

/** @deprecated Use syncMealPlanToTargets — kept for existing imports. */
export function reconcileMealPlanMacros<T extends MacroDay>(
  mealPlan: T[],
  targets: DailyMacroTargets,
): T[] {
  return syncMealPlanToTargets(mealPlan, targets);
}
