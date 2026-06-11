import { hasMealPlanContent, readWeeklyPlanFromStorage } from "@/lib/food-ai/weeklyPlanWidgetData";

const PENDING_KEY = "frigy_first_week_plan_pending";
const COMPLETED_KEY = "frigy_first_week_plan_completed";

export function markFirstWeekPlanPending(): void {
  try {
    localStorage.setItem(PENDING_KEY, "1");
    localStorage.removeItem(COMPLETED_KEY);
  } catch {
    // ignore
  }
}

export function completeFirstWeekPlanFlow(): void {
  try {
    localStorage.setItem(COMPLETED_KEY, "1");
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

export function isFirstWeekPlanPending(): boolean {
  try {
    return (
      localStorage.getItem(PENDING_KEY) === "1" &&
      localStorage.getItem(COMPLETED_KEY) !== "1"
    );
  } catch {
    return false;
  }
}

export function hasCompletedFirstWeekPlan(): boolean {
  try {
    if (localStorage.getItem(COMPLETED_KEY) === "1") return true;
  } catch {
    // ignore
  }
  return hasMealPlanContent(readWeeklyPlanFromStorage());
}

export function shouldHideBottomNavForFirstPlan(): boolean {
  return isFirstWeekPlanPending();
}

export const FIRST_WEEK_PLAN_ROUTE = "/meal-plans?tab=meals&firstPlan=1";
