import { calculateMacros } from "@/components/onboarding/utils";
import type { UserData } from "@/components/onboarding/types";

export type DailyMacroTargets = {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
};

function normalizeMacroTargets(raw: Partial<DailyMacroTargets> | null | undefined): DailyMacroTargets | null {
  if (!raw) return null;
  const dailyCalories = Number(raw.dailyCalories) || 0;
  if (dailyCalories <= 0) return null;
  return {
    dailyCalories,
    dailyProtein: Number(raw.dailyProtein) || 150,
    dailyCarbs: Number(raw.dailyCarbs) || 200,
    dailyFat: Number(raw.dailyFat) || 65,
  };
}

/** Synchronous read from userProfile localStorage. */
export function readStoredTrackerTargets(): DailyMacroTargets | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("userProfile");
    if (!raw) return null;
    return normalizeMacroTargets(JSON.parse(raw) as Partial<DailyMacroTargets>);
  } catch {
    return null;
  }
}

/** Macros from in-progress or completed onboarding (before userProfile sync). */
export function readOnboardingMacroTargets(): DailyMacroTargets | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("onboardingUserData");
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<UserData>;
    const fromFields = normalizeMacroTargets(data);
    if (fromFields) return fromFields;
    if (data.weight && data.height && data.age) {
      return normalizeMacroTargets(calculateMacros(data as UserData));
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Dashboard targets: while tracker settings load, prefer onboarding/local (no 0-flash).
 * After load, DB/hook values win so profile edits and multi-device sync stay correct.
 */
export type ResolveDashboardMacroTargetsOptions = {
  preferLocal?: boolean;
};

export function resolveDashboardMacroTargets(
  remote: Partial<DailyMacroTargets> | null | undefined,
  options?: ResolveDashboardMacroTargetsOptions,
): DailyMacroTargets | null {
  const fromRemote = normalizeMacroTargets(remote);
  const local = readStoredTrackerTargets() ?? readOnboardingMacroTargets();

  if (options?.preferLocal && local) {
    return local;
  }

  if (fromRemote) return fromRemote;
  if (local) return local;
  return null;
}

/** Prefer local macro fields when merging DB + localStorage tracker settings. */
export function mergeMacroTargetsFromLocal<T extends Partial<DailyMacroTargets>>(
  base: T,
  local: Partial<DailyMacroTargets> | null | undefined,
): T {
  const normalized = normalizeMacroTargets(local);
  if (!normalized) return base;
  return {
    ...base,
    dailyCalories: normalized.dailyCalories,
    dailyProtein: normalized.dailyProtein,
    dailyCarbs: normalized.dailyCarbs,
    dailyFat: normalized.dailyFat,
  };
}
