import type { MealFocusKey } from "@/lib/mealFocus";

export const FRIGY_OVERLAY_OPEN = "frigy-overlay-open";
export const FRIGY_OPEN_LOG_MEAL = "frigy-open-log-meal";

export function notifyOverlayOpen(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FRIGY_OVERLAY_OPEN, { detail: { open } }));
}

/** Opens add-meal panel without URL navigation (avoids reload / stale cache on repeat taps). */
export function notifyOpenLogMeal(focus: MealFocusKey | null = null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FRIGY_OPEN_LOG_MEAL, { detail: { focus } }));
}
