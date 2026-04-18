/** Steuert, ob die Einkaufsliste aus dem Wochenplan gefüllt wird (nur bei Frigy-Generierung). */

import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";

export const MEAL_PLAN_SHOPPING_SOURCE_KEY = "mealPlanShoppingSource";

export type MealPlanShoppingSource = "scan" | "frigy";

export function setMealPlanShoppingSource(source: MealPlanShoppingSource) {
  localStorage.setItem(MEAL_PLAN_SHOPPING_SOURCE_KEY, source);
  notifyFrigyStorageUpdated();
}

export function removeMealPlanShoppingSource() {
  localStorage.removeItem(MEAL_PLAN_SHOPPING_SOURCE_KEY);
  notifyFrigyStorageUpdated();
}

/** null = ältere Daten: Liste wie bisher aus Zutaten im Plan */
export function getMealPlanShoppingSource(): MealPlanShoppingSource | null {
  const v = localStorage.getItem(MEAL_PLAN_SHOPPING_SOURCE_KEY);
  if (v === "scan" || v === "frigy") return v;
  return null;
}
