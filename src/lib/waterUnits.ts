/** Einheitliche Wasser-Portion in der gesamten App (Dashboard, Tracker, DB-Gläser). */
export const ML_PER_WATER_GLASS = 250;

export function glassesToMl(glasses: number): number {
  return Math.max(0, glasses) * ML_PER_WATER_GLASS;
}

export function mlToGlasses(ml: number): number {
  return Math.max(0, Math.round(ml / ML_PER_WATER_GLASS));
}
