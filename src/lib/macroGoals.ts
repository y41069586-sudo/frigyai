const MIN_TRACKER_CALORIES = 800;
const MIN_CARBS_GRAMS = 50;

/** Scale existing macros to a new calorie target while keeping the same P/C/F ratio. */
export function scaleMacrosToCalorieTarget(
  dailyCalories: number,
  current: {
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
  },
): {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
} {
  const calories = Math.round(Math.max(MIN_TRACKER_CALORIES, dailyCalories));
  const implied =
    current.dailyProtein * 4 + current.dailyCarbs * 4 + current.dailyFat * 9;
  if (implied <= 0) {
    return calculateMacrosForWeightAndCalories(calories, 70);
  }

  const ratio = calories / implied;
  let dailyProtein = Math.max(40, Math.round(current.dailyProtein * ratio));
  let dailyCarbs = Math.max(MIN_CARBS_GRAMS, Math.round(current.dailyCarbs * ratio));
  let dailyFat = Math.max(20, Math.round(current.dailyFat * ratio));

  let remaining = calories - dailyProtein * 4 - dailyFat * 9;
  if (remaining < MIN_CARBS_GRAMS * 4) {
    const proteinFatCal = Math.max(0, calories - MIN_CARBS_GRAMS * 4);
    const currentProteinFatCal = dailyProtein * 4 + dailyFat * 9;
    if (currentProteinFatCal > 0) {
      const pfScale = proteinFatCal / currentProteinFatCal;
      dailyProtein = Math.max(40, Math.round(dailyProtein * pfScale));
      dailyFat = Math.max(20, Math.round(dailyFat * pfScale));
      remaining = calories - dailyProtein * 4 - dailyFat * 9;
    }
    dailyCarbs = Math.max(MIN_CARBS_GRAMS, Math.round(remaining / 4));
  } else {
    dailyCarbs = Math.max(MIN_CARBS_GRAMS, Math.round(remaining / 4));
  }

  return { dailyCalories: calories, dailyProtein, dailyCarbs, dailyFat };
}

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
  const calories = Math.round(Math.max(MIN_TRACKER_CALORIES, dailyCalories));

  let dailyProtein = Math.round(safeWeight * 1.6);
  let dailyFat = Math.round(safeWeight * 0.8);
  let remaining = calories - dailyProtein * 4 - dailyFat * 9;

  if (remaining < MIN_CARBS_GRAMS * 4) {
    const proteinFatCal = Math.max(0, calories - MIN_CARBS_GRAMS * 4);
    const currentProteinFatCal = dailyProtein * 4 + dailyFat * 9;
    if (currentProteinFatCal > 0) {
      const scale = proteinFatCal / currentProteinFatCal;
      dailyProtein = Math.max(40, Math.round(dailyProtein * scale));
      dailyFat = Math.max(20, Math.round(dailyFat * scale));
      remaining = calories - dailyProtein * 4 - dailyFat * 9;
    }
  }

  const dailyCarbs = Math.max(MIN_CARBS_GRAMS, Math.round(remaining / 4));

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
