/** Sync Wasser (Gläser/Tassen) und Tagesziel zwischen Dashboard, Wasser-Tab & Co. */

export const WATER_GLASSES_CHANGED = "frigy-water-glasses-changed";
export const WATER_GOAL_CUPS_CHANGED = "frigy-water-goal-cups-changed";

export function dispatchWaterGlassesChanged(glasses: number) {
  window.dispatchEvent(
    new CustomEvent(WATER_GLASSES_CHANGED, { detail: { glasses } }),
  );
}

export function dispatchWaterGoalCupsChanged(cups: number) {
  window.dispatchEvent(
    new CustomEvent(WATER_GOAL_CUPS_CHANGED, { detail: { cups } }),
  );
}

export function readWaterGoalCupsFromStorage(): number {
  const raw = localStorage.getItem("waterDailyGoalCups");
  const n = parseInt(raw || "10", 10);
  if (Number.isNaN(n) || n < 1) return 10;
  return Math.min(20, n);
}

export function goalCupsToMl(cups: number): number {
  return cups * 200;
}
