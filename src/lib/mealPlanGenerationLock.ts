/** True while a weekly meal plan is being generated — blocks auth overlay / redirects. */
let mealPlanGenerationActive = false;

export function setMealPlanGenerationActive(active: boolean): void {
  mealPlanGenerationActive = active;
}

export function isMealPlanGenerationActive(): boolean {
  return mealPlanGenerationActive;
}
