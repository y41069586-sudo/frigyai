import { getLocalDateISO, getLocalYesterdayISO } from "@/lib/localDate";

const STORAGE_KEY = "frigy_water_goal_streak";

type WaterGoalStreakState = {
  streak: number;
  lastDate: string;
};

function readState(): WaterGoalStreakState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { streak: 0, lastDate: "" };
    const parsed = JSON.parse(raw) as WaterGoalStreakState;
    return {
      streak: Number(parsed.streak) || 0,
      lastDate: String(parsed.lastDate || ""),
    };
  } catch {
    return { streak: 0, lastDate: "" };
  }
}

/** Records that the user hit their water goal today; returns consecutive days (incl. today). */
export function recordWaterGoalDayMet(today = getLocalDateISO()): number {
  const state = readState();
  if (state.lastDate === today) return state.streak;

  const yesterday = getLocalYesterdayISO();
  const nextStreak = state.lastDate === yesterday ? state.streak + 1 : 1;
  const next: WaterGoalStreakState = { streak: nextStreak, lastDate: today };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return nextStreak;
}
