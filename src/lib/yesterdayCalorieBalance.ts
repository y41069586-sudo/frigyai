import { supabase } from '@/integrations/supabase/client';
import { harmonizeDailyTargets, type DailyMacroTargets } from '@/lib/mealPlanMacros';
import { getLocalYesterdayISO } from '@/lib/localDate';

/** Minimum kcal difference vs goal before we suggest adjusting today. */
export const YESTERDAY_BALANCE_MIN_DELTA = 50;

export type YesterdayCalorieBalance = {
  date: string;
  eatenCalories: number;
  targetCalories: number;
  /** Positive = over goal, negative = under goal. */
  delta: number;
};

const PROMPT_DISMISS_PREFIX = 'frigy_yesterday_adjust_prompt_';

export function yesterdayAdjustPromptDismissKey(dateIso: string): string {
  return `${PROMPT_DISMISS_PREFIX}${dateIso}`;
}

export function isYesterdayAdjustPromptDismissed(dateIso: string): boolean {
  try {
    return localStorage.getItem(yesterdayAdjustPromptDismissKey(dateIso)) === '1';
  } catch {
    return false;
  }
}

export function dismissYesterdayAdjustPrompt(dateIso: string): void {
  try {
    localStorage.setItem(yesterdayAdjustPromptDismissKey(dateIso), '1');
  } catch {
    /* ignore */
  }
}

export async function fetchYesterdayCalorieBalance(
  userId: string,
  targetCalories: number,
): Promise<YesterdayCalorieBalance | null> {
  if (!targetCalories || targetCalories <= 0) return null;

  const date = getLocalYesterdayISO();
  const { data, error } = await supabase
    .from('daily_macros')
    .select('calories')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error || !data) return null;

  const eatenCalories = Math.round(Number(data.calories) || 0);
  if (eatenCalories <= 0) return null;

  const delta = eatenCalories - targetCalories;
  if (Math.abs(delta) < YESTERDAY_BALANCE_MIN_DELTA) return null;

  return { date, eatenCalories, targetCalories, delta };
}

/** Compensate yesterday's surplus/deficit in today's plan targets. */
export function computeTodayAdjustedTargets(
  base: DailyMacroTargets,
  yesterdayDelta: number,
): DailyMacroTargets {
  const adjustedCalories = Math.max(800, Math.round(base.dailyCalories - yesterdayDelta));
  if (adjustedCalories === base.dailyCalories) {
    return harmonizeDailyTargets(base);
  }
  const ratio = adjustedCalories / base.dailyCalories;
  return harmonizeDailyTargets({
    dailyCalories: adjustedCalories,
    dailyProtein: Math.round(base.dailyProtein * ratio),
    dailyCarbs: Math.round(base.dailyCarbs * ratio),
    dailyFat: Math.round(base.dailyFat * ratio),
  });
}
