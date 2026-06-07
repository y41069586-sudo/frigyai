import type { MealFocusKey } from "@/lib/mealFocus";

export const FRIGY_OVERLAY_OPEN = "frigy-overlay-open";
export const FRIGY_OPEN_LOG_MEAL = "frigy-open-log-meal";
export const FRIGY_EDIT_TRACKER_GOALS = "frigy-edit-tracker-goals";

export function notifyOverlayOpen(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FRIGY_OVERLAY_OPEN, { detail: { open } }));
}

/** Opens add-meal panel without URL navigation (avoids reload / stale cache on repeat taps). */
export function notifyOpenLogMeal(focus: MealFocusKey | null = null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FRIGY_OPEN_LOG_MEAL, { detail: { focus } }));
}

/** Opens macro goal editor without URL navigation (works while already on dashboard). */
export function notifyEditTrackerGoals(focus: "calories" | "protein" | "carbs" | "fat" = "calories") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FRIGY_EDIT_TRACKER_GOALS, { detail: { focus } }));
}
