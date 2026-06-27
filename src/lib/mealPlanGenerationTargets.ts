import { scaleTargetsToStatedCalories, type DailyMacroTargets } from "@/lib/mealPlanMacros";

const DEFAULT_TARGETS: DailyMacroTargets = {
  dailyCalories: 2000,
  dailyProtein: 150,
  dailyCarbs: 200,
  dailyFat: 65,
};

function readProfileFromStorage(): Partial<DailyMacroTargets> | null {
  try {
    const raw = localStorage.getItem("userProfile");
    if (!raw) return null;
    const p = JSON.parse(raw) as Record<string, unknown>;
    const dailyCalories = Number(p.dailyCalories) || 0;
    const dailyProtein = Number(p.dailyProtein) || 0;
    const dailyCarbs = Number(p.dailyCarbs) || 0;
    const dailyFat = Number(p.dailyFat) || 0;
    if (dailyCalories <= 0 && dailyProtein <= 0) return null;
    return {
      dailyCalories: dailyCalories > 0 ? dailyCalories : DEFAULT_TARGETS.dailyCalories,
      dailyProtein: dailyProtein > 0 ? dailyProtein : DEFAULT_TARGETS.dailyProtein,
      dailyCarbs: dailyCarbs > 0 ? dailyCarbs : DEFAULT_TARGETS.dailyCarbs,
      dailyFat: dailyFat > 0 ? dailyFat : DEFAULT_TARGETS.dailyFat,
    };
  } catch {
    return null;
  }
}

/** Ensures valid macro targets before calling generate-meal-plan (tracker DB may be empty). */
export function resolveMealPlanGenerationTargets(input: {
  dailyCalories?: number;
  dailyProtein?: number;
  dailyCarbs?: number;
  dailyFat?: number;
}): DailyMacroTargets {
  const fromStorage = readProfileFromStorage();

  const calories = Number(input.dailyCalories) || fromStorage?.dailyCalories || DEFAULT_TARGETS.dailyCalories;
  const protein = Number(input.dailyProtein) || fromStorage?.dailyProtein ||
    Math.round(calories * 0.3 / 4);
  const carbs = Number(input.dailyCarbs) || fromStorage?.dailyCarbs ||
    Math.round(calories * 0.4 / 4);
  const fat = Number(input.dailyFat) || fromStorage?.dailyFat ||
    Math.round(calories * 0.3 / 9);

  return scaleTargetsToStatedCalories({
    dailyCalories: Math.max(800, calories),
    dailyProtein: Math.max(30, protein),
    dailyCarbs: Math.max(30, carbs),
    dailyFat: Math.max(15, fat),
  });
}
