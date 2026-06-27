/** Daten & Logik für das Dashboard-Wochenplan-Widget */

export type StoredMeal = {
  type?: string;
  name?: string;
  calories?: number;
  prepTime?: number;
};

export type StoredDayPlan = {
  day?: string;
  meals?: StoredMeal[];
};

export type WeekDayStatus = {
  short: string;
  isToday: boolean;
  isPast: boolean;
  hasMeals: boolean;
};

export type NextMealInfo = {
  meal: StoredMeal;
  slotLabel: string;
  timeLabel: string;
};

const DE_WEEKDAY_FULL = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
] as const;

export const WEEKDAY_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

/** Montag = 0 … Sonntag = 6 */
export function getCurrentDayIndex(): number {
  const today = new Date().getDay();
  return today === 0 ? 6 : today - 1;
}

/** Index im gespeicherten Wochenplan für den heutigen Wochentag. */
export function resolveTodayMealPlanDayIndex(plan: StoredDayPlan[]): number {
  if (!plan.length) return getCurrentDayIndex();

  const todayFull = DE_WEEKDAY_FULL[new Date().getDay()].toLowerCase();
  const byName = plan.findIndex((d) => (d.day ?? "").trim().toLowerCase() === todayFull);
  if (byName >= 0) return byName;

  const fallback = getCurrentDayIndex();
  return fallback < plan.length ? fallback : 0;
}

export function mealPlansUrlForToday(plan?: StoredDayPlan[]): string {
  const resolved = plan ?? readWeeklyPlanFromStorage();
  const day = resolveTodayMealPlanDayIndex(resolved);
  return `/meal-plans?tab=meals&day=${day}`;
}

export function readWeeklyPlanFromStorage(): StoredDayPlan[] {
  try {
    const raw = localStorage.getItem("weeklyMealPlan");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredDayPlan[]) : [];
  } catch {
    return [];
  }
}

export function countPlannedMeals(plan: StoredDayPlan[]): number {
  return plan.reduce((sum, day) => sum + (day.meals?.length ?? 0), 0);
}

/** True when at least one day has a named meal — empty shells in localStorage don't count. */
export function hasMealPlanContent(plan: StoredDayPlan[] | null | undefined): boolean {
  if (!Array.isArray(plan) || plan.length === 0) return false;
  return plan.some((day) =>
    (day.meals ?? []).some((meal) => {
      const name = String(meal?.name ?? "").trim();
      return name.length > 0 && name !== "—" && name !== "-";
    }),
  );
}

export function countDaysWithMeals(plan: StoredDayPlan[]): number {
  return plan.filter((d) => (d.meals?.length ?? 0) > 0).length;
}

function mealSlotTime(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("früh") || t.includes("breakfast") || t.includes("petit")) return "08:00";
  if (t.includes("mittag") || t.includes("lunch") || t.includes("déjeuner")) return "12:30";
  if (t.includes("snack") || t.includes("collation")) return "15:30";
  if (t.includes("abend") || t.includes("dinner") || t.includes("dîner") || t.includes("soir"))
    return "19:00";
  return "12:00";
}

export function getNextMeal(meals: StoredMeal[]): NextMealInfo | null {
  if (!meals?.length) return null;

  const hour = new Date().getHours();
  let pick: StoredMeal | undefined;

  if (hour < 10) {
    pick =
      meals.find((m) => (m.type ?? "").toLowerCase().includes("früh")) ||
      meals.find((m) => (m.type ?? "").toLowerCase().includes("breakfast")) ||
      meals[0];
  } else if (hour < 14) {
    pick =
      meals.find((m) => (m.type ?? "").toLowerCase().includes("mittag")) ||
      meals.find((m) => (m.type ?? "").toLowerCase().includes("lunch")) ||
      (meals[1] ?? meals[0]);
  } else if (hour < 18) {
    pick =
      meals.find((m) => (m.type ?? "").toLowerCase().includes("snack")) ||
      (meals[2] ?? meals[meals.length - 1]);
  } else {
    pick =
      meals.find((m) => (m.type ?? "").toLowerCase().includes("abend")) ||
      meals.find((m) => (m.type ?? "").toLowerCase().includes("dinner")) ||
      meals[meals.length - 1];
  }

  if (!pick) return null;
  const slotLabel = (pick.type ?? "Mahlzeit").trim();
  return {
    meal: pick,
    slotLabel,
    timeLabel: mealSlotTime(slotLabel),
  };
}

export function getTodayPlan(plan: StoredDayPlan[]): StoredDayPlan | null {
  const idx = getCurrentDayIndex();
  if (plan[idx]?.meals?.length) return plan[idx];

  const todayFull = DE_WEEKDAY_FULL[new Date().getDay()].toLowerCase();
  return (
    plan.find((d) => (d.day ?? "").trim().toLowerCase() === todayFull) ?? plan[idx] ?? null
  );
}

export function buildWeekDayStatuses(plan: StoredDayPlan[]): WeekDayStatus[] {
  const todayIdx = getCurrentDayIndex();
  return WEEKDAY_SHORT.map((short, index) => ({
    short,
    isToday: index === todayIdx,
    isPast: index < todayIdx,
    hasMeals: (plan[index]?.meals?.length ?? 0) > 0,
  }));
}

export function getTodayWeekdayFull(language: "de" | "en" | "fr"): string {
  const idx = new Date().getDay();
  if (language === "en") {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][idx];
  }
  if (language === "fr") {
    return ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][idx];
  }
  return DE_WEEKDAY_FULL[idx];
}

export function weekProgressPercent(plan: StoredDayPlan[]): number {
  const withMeals = countDaysWithMeals(plan);
  if (withMeals === 0) return 0;
  return Math.round((withMeals / 7) * 100);
}

/** Demo-Vorschau: Heute + die nächsten 3 Tage aus dem Dashboard-Mock */
export function buildWeekDayStatusesFromPreview(
  days: { dayLabel: string; meals: string[] }[],
): WeekDayStatus[] {
  const todayIdx = getCurrentDayIndex();
  const heute = days.find((d) => d.dayLabel === "Heute");

  return WEEKDAY_SHORT.map((short, index) => {
    let hasMeals = false;
    if (index === todayIdx) {
      hasMeals =
        (heute?.meals?.length ?? 0) > 0 &&
        heute.meals[0] !== "Kein Eintrag im Plan" &&
        heute.meals[0] !== "—";
    } else {
      const offset = index - todayIdx;
      if (offset > 0 && offset <= 3) {
        const day = days[offset];
        hasMeals = (day?.meals?.length ?? 0) > 0 && day.meals[0] !== "—";
      }
    }
    return {
      short,
      isToday: index === todayIdx,
      isPast: index < todayIdx,
      hasMeals,
    };
  });
}
