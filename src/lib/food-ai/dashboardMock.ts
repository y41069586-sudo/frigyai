/** Mock data for Health Dashboard widgets (replace with API / context later) */

export type WeekPlanPreviewDay = {
  dayLabel: string;
  meals: string[];
};

export type WeekPlanPreviewData = {
  weekLabel: string;
  days: WeekPlanPreviewDay[];
};

const SHORT_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] as const;
const SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const SHORT_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;

const DAY_FULL_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const DAY_FULL_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;

const ROTATING_MEALS: string[][] = [
  ["Rührei", "Bowl", "Gemüsepfanne"],
  ["Haferbrei", "Bowl", "Lachs"],
  ["Smoothie", "Wrap", "Curry"],
  ["Joghurt", "Salat", "Pasta"],
];

/** Heute links, danach die nächsten drei Kalendertage (Dashboard-Widget). */
export function getWeekPlanPreviewForDashboard(language: "de" | "en" | "fr" = "de"): WeekPlanPreviewData {
  const todayLabel = language === "en" ? "Today" : language === "fr" ? "Aujourd'hui" : "Heute";
  const weekLabel = language === "en" ? "This week" : language === "fr" ? "Cette semaine" : "Diese Woche";
  const shortDays = language === "en" ? SHORT_EN : language === "fr" ? SHORT_FR : SHORT_DE;
  const now = new Date();
  const days: WeekPlanPreviewDay[] = [];
  days.push({
    dayLabel: todayLabel,
    meals: ROTATING_MEALS[now.getDay() % ROTATING_MEALS.length],
  });
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const label = shortDays[d.getDay()];
    days.push({
      dayLabel: label,
      meals: ROTATING_MEALS[(now.getDay() + i) % ROTATING_MEALS.length],
    });
  }
  return {
    weekLabel,
    days,
  };
}

export type ShoppingCategory = "Protein" | "Gemüse" | "Obst" | "Basics" | "Milchprodukte";

export type ShoppingPreviewItem = {
  id: string;
  name: string;
  amount?: string;
  category: ShoppingCategory;
  needed: boolean;
};

export const mockShoppingTop: ShoppingPreviewItem[] = [
  { id: "p1", name: "Hähnchenbrust", category: "Protein", needed: true },
  { id: "v1", name: "Brokkoli", category: "Gemüse", needed: true },
  { id: "b1", name: "Quinoa", category: "Basics", needed: true },
  { id: "v2", name: "Tomaten", category: "Gemüse", needed: true },
  { id: "m1", name: "Griechischer Joghurt", category: "Milchprodukte", needed: true },
  { id: "o1", name: "Äpfel", category: "Obst", needed: true },
];

export function groupShoppingByCategory(items: ShoppingPreviewItem[]) {
  const map = new Map<ShoppingCategory, ShoppingPreviewItem[]>();
  for (const it of items) {
    const arr = map.get(it.category) ?? [];
    arr.push(it);
    map.set(it.category, arr);
  }
  return map;
}

/* ─── Live-Daten aus localStorage (Wochenplan / Einkaufsliste) ─── */

const DE_WEEKDAY_FULL = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
] as const;

type StoredMeal = { name?: string };
type StoredDay = { day?: string; meals?: StoredMeal[] };
type StoredShopping = { name?: string; amount?: string };

function mealTitlesForDay(plan: StoredDay[], weekdayFull: string): string[] {
  const needle = weekdayFull.trim().toLowerCase();
  const d = plan.find((p) => (p.day ?? "").trim().toLowerCase() === needle);
  if (!d?.meals?.length) return [];
  return d.meals.map((m) => (m.name ?? "").trim()).filter(Boolean);
}

function inferShoppingCategory(name: string): ShoppingCategory {
  const n = name.toLowerCase();
  if (
    /hähnchen|huhn|pute|fleisch|wurst|tofu|tempeh|fisch|lachs|thunfisch|ei|eier|rind|schwein|lamm|hack|protein|garnele|linsen|bohnen|kicher/.test(
      n,
    )
  ) {
    return "Protein";
  }
  if (/milch|joghurt|käse|quark|butter|sahne|molkerei|frischkäse|parmesan|mozzarella|feta/.test(n)) {
    return "Milchprodukte";
  }
  if (/apfel|banane|beere|obst|zitrone|orange|birne|traube|avocado|mango|kiwi/.test(n)) {
    return "Obst";
  }
  if (
    /tomat|gurk|paprika|salat|brokkoli|spinat|kartoffel|zwiebel|gemüse|karotte|möhre|zucchini|aubergine|sellerie|kohl|lauch|porree|mangold|radies/.test(
      n,
    )
  ) {
    return "Gemüse";
  }
  return "Basics";
}

function slugId(s: string, i: number): string {
  const slug = s
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `shop-${i}-${slug || "item"}`;
}

/**
 * Liest `weeklyMealPlan` aus localStorage; sonst Demo wie {@link getWeekPlanPreviewForDashboard}.
 */
export function getWeekPlanPreviewFromStorage(language: "de" | "en" | "fr" = "de"): WeekPlanPreviewData {
  let plan: StoredDay[] = [];
  try {
    const raw = localStorage.getItem("weeklyMealPlan");
    if (raw) {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) plan = p as StoredDay[];
    }
  } catch {
    plan = [];
  }

  if (plan.length === 0) {
    const weekLabel = language === "en" ? "This week" : language === "fr" ? "Cette semaine" : "Diese Woche";
    return { weekLabel, days: [] };
  }

  const now = new Date();
  const todayIdx = now.getDay();
  const todayFull =
    language === "en" ? DAY_FULL_EN[todayIdx] : language === "fr" ? DAY_FULL_FR[todayIdx] : DE_WEEKDAY_FULL[todayIdx];
  const todayLabel = language === "en" ? "Today" : language === "fr" ? "Aujourd'hui" : "Heute";
  const noEntryLabel =
    language === "en" ? "No entry in plan" : language === "fr" ? "Aucune entrée dans le plan" : "Kein Eintrag im Plan";
  const weekLabel = language === "en" ? "This week" : language === "fr" ? "Cette semaine" : "Diese Woche";
  const shortDays = language === "en" ? SHORT_EN : language === "fr" ? SHORT_FR : SHORT_DE;

  const days: WeekPlanPreviewDay[] = [];

  const todayMeals = mealTitlesForDay(plan, todayFull);
  days.push({
    dayLabel: todayLabel,
    meals: todayMeals.length > 0 ? todayMeals.slice(0, 4) : [noEntryLabel],
  });

  for (let i = 1; i <= 3; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const idx = d.getDay();
    const full = DE_WEEKDAY_FULL[idx];
    const short = shortDays[idx];
    const titles = mealTitlesForDay(plan, full);
    days.push({
      dayLabel: short,
      meals: titles.length > 0 ? titles.slice(0, 4) : ["—"],
    });
  }

  return {
    weekLabel,
    days,
  };
}

/**
 * Liest `weeklyShoppingList` (Frigy); leer -> keine Vorschau.
 */
export function getShoppingPreviewFromStorage(): ShoppingPreviewItem[] {
  let list: StoredShopping[] = [];
  try {
    const raw = localStorage.getItem("weeklyShoppingList");
    if (raw) {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) list = p as StoredShopping[];
    }
  } catch {
    list = [];
  }

  const normalized = list
    .map((it) => ({
      name: (it.name ?? "").trim(),
      amount: (it.amount ?? "").trim(),
    }))
    .filter((it) => it.name.length > 0);

  if (normalized.length === 0) {
    return [];
  }

  return normalized.slice(0, 12).map((it, i) => ({
    id: slugId(it.name, i),
    name: it.name,
    amount: it.amount || undefined,
    category: inferShoppingCategory(it.name),
    needed: true,
  }));
}
