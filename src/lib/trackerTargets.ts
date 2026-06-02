export type DailyMacroTargets = {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
};

/** Synchronous read — avoids 2000 kcal fallback flash before DB settings load. */
export function readStoredTrackerTargets(): DailyMacroTargets | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("userProfile");
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<DailyMacroTargets>;
    const dailyCalories = Number(p.dailyCalories) || 0;
    if (dailyCalories <= 0) return null;
    return {
      dailyCalories,
      dailyProtein: Number(p.dailyProtein) || 150,
      dailyCarbs: Number(p.dailyCarbs) || 200,
      dailyFat: Number(p.dailyFat) || 65,
    };
  } catch {
    return null;
  }
}
