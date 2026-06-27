/** Normalize dish names for keyword matching (ä → a, etc.). */
export function normalizeDishName(name: string): string {
  return String(name || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

type DishTier = "heavy" | "main" | "light" | "snack" | "default";

const HEAVY_DISH =
  /\b(leberkase|leberkaese|schnitzel|currywurst|bratwurst|burger|cheeseburger|pizza|lasagne|carbonara|bolo|baguette|panini|doner|döner|doener|gyros|burrito|quesadilla)\b/;

const BREAD_DISH =
  /\b(semmel|brotchen|broetchen|sandwich|wrap|bagel|toast|brot mit|belegtes brot|klappbrotdchen)\b/;

const LIGHT_DISH =
  /\b(salat|salad|gemuse|gemüse|suppe|soup|gurke|tomate mozz|beeren|obstsalat)\b/;

const SNACK_DISH =
  /\b(joghurt|yogurt|apfel|banane|obst|müsliriegel|muesliriegel|riegel|kefir|shake|smoothie|nussmix)\b/;

const PROTEIN_LIGHT =
  /\b(hahnchen|hähnchen|haehnchen|chicken|pute|turkey|thunfisch|tuna|lachs|salmon)\b/;

export function dishCalorieTier(name: string, mealType = ""): DishTier {
  const n = normalizeDishName(name);
  const type = normalizeDishName(mealType);
  if (SNACK_DISH.test(n) || type.includes("snack")) return "snack";
  if (HEAVY_DISH.test(n) || BREAD_DISH.test(n)) return "heavy";
  if (LIGHT_DISH.test(n) && !PROTEIN_LIGHT.test(n)) return "light";
  if (/\b(reis|nudel|pasta|spaghetti|kartoffel|pfanne|auflauf|omelett|frikadelle|hack|geschnetzel|fischfilet)\b/.test(n)) {
    return "main";
  }
  return "default";
}

/** Relative share of daily calories this dish should receive. */
export function dishCalorieWeightHint(
  name: string,
  mealType: string,
  slotIndex: number,
  mealsPerDay: number,
): number {
  const tier = dishCalorieTier(name, mealType);
  const isBreakfast = slotIndex === 0;
  const isMainSlot = mealsPerDay >= 4 ? slotIndex === 1 || slotIndex === 3 : slotIndex === 1;

  switch (tier) {
    case "heavy":
      return isMainSlot ? 0.38 : isBreakfast ? 0.3 : 0.28;
    case "main":
      return isMainSlot ? 0.34 : isBreakfast ? 0.26 : 0.22;
    case "light":
      return isMainSlot ? 0.22 : 0.14;
    case "snack":
      return 0.1;
    default:
      if (isMainSlot) return 0.32;
      if (isBreakfast) return 0.24;
      return 0.14;
  }
}

/** Minimum realistic kcal for a dish name — 0 means no floor. */
export function dishMinimumKcal(
  name: string,
  mealType: string,
  dailyCalories: number,
  mealsPerDay: number,
): number {
  const tier = dishCalorieTier(name, mealType);
  const perMealAvg = dailyCalories / Math.max(mealsPerDay, 1);

  switch (tier) {
    case "heavy":
      return Math.max(480, Math.round(perMealAvg * 1.15));
    case "main":
      return Math.max(380, Math.round(perMealAvg * 0.95));
    case "light":
      return 0;
    case "snack":
      return 0;
    default:
      return 0;
  }
}

/** Maximum realistic kcal for light dishes/snacks. */
export function dishMaximumKcal(
  name: string,
  mealType: string,
  dailyCalories: number,
): number {
  const tier = dishCalorieTier(name, mealType);
  if (tier === "snack") return Math.min(320, Math.round(dailyCalories * 0.18));
  if (tier === "light") return Math.min(420, Math.round(dailyCalories * 0.24));
  return Number.POSITIVE_INFINITY;
}

const MAX_MEAL_SHARE_BY_MPD: Record<number, number> = {
  3: 0.48,
  4: 0.42,
  5: 0.36,
  6: 0.32,
};

/** Heavy dishes (wrap, schnitzel, …) cannot fit an unrealistically small daily budget. */
export function dishFitsDailyBudget(
  name: string,
  mealType: string,
  dailyCalories: number,
  mealsPerDay: number,
): boolean {
  const min = dishMinimumKcal(name, mealType, dailyCalories, mealsPerDay);
  const maxShare = MAX_MEAL_SHARE_BY_MPD[mealsPerDay] ?? 0.4;
  return min <= dailyCalories * maxShare + 20;
}

export function mealCaloriesUnrealisticForDish(
  meal: { name?: string; type?: string; calories?: number; protein?: number; carbs?: number; fat?: number },
  dailyCalories: number,
  mealsPerDay: number,
): boolean {
  const kcal =
    typeof meal.calories === "number" && meal.calories > 0
      ? meal.calories
      : (Number(meal.protein) || 0) * 4 + (Number(meal.carbs) || 0) * 4 + (Number(meal.fat) || 0) * 9;
  const min = dishMinimumKcal(String(meal.name || ""), String(meal.type || ""), dailyCalories, mealsPerDay);
  const max = dishMaximumKcal(String(meal.name || ""), String(meal.type || ""), dailyCalories);
  if (min > 0 && kcal < min * 0.9) return true;
  if (Number.isFinite(max) && kcal > max * 1.12) return true;
  if (!dishFitsDailyBudget(String(meal.name || ""), String(meal.type || ""), dailyCalories, mealsPerDay)) {
    return true;
  }
  return false;
}

export function mealsViolateDishRealism(
  meals: Array<{ name?: string; type?: string; calories?: number; protein?: number; carbs?: number; fat?: number }>,
  dailyCalories: number,
  mealsPerDay: number,
): boolean {
  return meals.some((meal) => mealCaloriesUnrealisticForDish(meal, dailyCalories, mealsPerDay));
}

export function aiMacrosUnrealisticForDishes(
  meals: Array<{ name?: string; type?: string; protein?: number; carbs?: number; fat?: number }>,
  dailyCalories: number,
  mealsPerDay: number,
): boolean {
  return meals.some((meal) => {
    const protein = Math.max(0, Number(meal.protein) || 0);
    const carbs = Math.max(0, Number(meal.carbs) || 0);
    const fat = Math.max(0, Number(meal.fat) || 0);
    const kcal = protein * 4 + carbs * 4 + fat * 9;
    const min = dishMinimumKcal(String(meal.name || ""), String(meal.type || ""), dailyCalories, mealsPerDay);
    const max = dishMaximumKcal(String(meal.name || ""), String(meal.type || ""), dailyCalories);
    if (min > 0 && kcal < min * 0.9) return true;
    if (Number.isFinite(max) && kcal > max * 1.15) return true;
    return false;
  });
}
