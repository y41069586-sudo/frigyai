/** Protein / fat / carbs split for a calorie target (aligned with onboarding calculateMacros). */
export function calculateMacrosForWeightAndCalories(
  dailyCalories: number,
  weightKg: number,
): {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
} {
  const safeWeight = Math.max(40, weightKg || 70);
  const calories = Math.round(Math.max(800, dailyCalories));
  const dailyProtein = Math.round(safeWeight * 2);
  const dailyFat = Math.round(safeWeight * 0.9);
  const proteinCalories = dailyProtein * 4;
  const fatCalories = dailyFat * 9;
  const remainingCalories = calories - proteinCalories - fatCalories;
  const dailyCarbs = Math.max(50, Math.round(remainingCalories / 4));

  return {
    dailyCalories: calories,
    dailyProtein,
    dailyCarbs,
    dailyFat,
  };
}

export function macroGoalsEqual(
  a: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number },
  b: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number },
): boolean {
  return (
    a.dailyCalories === b.dailyCalories &&
    a.dailyProtein === b.dailyProtein &&
    a.dailyCarbs === b.dailyCarbs &&
    a.dailyFat === b.dailyFat
  );
}
