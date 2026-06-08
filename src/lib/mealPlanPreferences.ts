export type CuisineId =
  | 'international'
  | 'asian'
  | 'north_african'
  | 'south_african'
  | 'european'
  | 'american'
  | 'italian'
  | 'german';

export type MaxPrepTime = '10' | '30' | '60plus';

export type CookFrequency = 'daily' | '4_5' | '3_4' | '1_2';

export type BudgetTier = 'cheap' | 'medium' | 'any';

export type VarietyPref = 'repeat_ok' | 'varied';

export interface MealPlanPreferences {
  cuisines: CuisineId[];
  maxPrepTime: MaxPrepTime;
  cookFrequency: CookFrequency;
  budget: BudgetTier;
  variety: VarietyPref;
  completed: boolean;
}

const STORAGE_KEY = 'frigy_meal_plan_preferences';

export const DEFAULT_MEAL_PLAN_PREFERENCES: MealPlanPreferences = {
  cuisines: ['international', 'european'],
  maxPrepTime: '30',
  cookFrequency: '3_4',
  budget: 'medium',
  variety: 'varied',
  completed: false,
};

export function readMealPlanPreferences(): MealPlanPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MEAL_PLAN_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<MealPlanPreferences>;
    return {
      cuisines: Array.isArray(parsed.cuisines) && parsed.cuisines.length
        ? parsed.cuisines.filter(isCuisineId)
        : DEFAULT_MEAL_PLAN_PREFERENCES.cuisines,
      maxPrepTime: isMaxPrepTime(parsed.maxPrepTime)
        ? parsed.maxPrepTime
        : DEFAULT_MEAL_PLAN_PREFERENCES.maxPrepTime,
      cookFrequency: isCookFrequency(parsed.cookFrequency)
        ? parsed.cookFrequency
        : DEFAULT_MEAL_PLAN_PREFERENCES.cookFrequency,
      budget: isBudgetTier(parsed.budget) ? parsed.budget : DEFAULT_MEAL_PLAN_PREFERENCES.budget,
      variety: isVarietyPref(parsed.variety) ? parsed.variety : DEFAULT_MEAL_PLAN_PREFERENCES.variety,
      completed: parsed.completed === true,
    };
  } catch {
    return { ...DEFAULT_MEAL_PLAN_PREFERENCES };
  }
}

export function saveMealPlanPreferences(prefs: MealPlanPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, completed: true }));
}

export function hasCompletedMealPlanPreferences(): boolean {
  return readMealPlanPreferences().completed;
}

/** First-time wizard: skip if prefs saved or user already has a weekly plan. */
export function shouldShowMealPlanPreferencesWizard(): boolean {
  if (hasCompletedMealPlanPreferences()) return false;
  try {
    const raw = localStorage.getItem('weeklyMealPlan');
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length > 0) return false;
  } catch {
    /* ignore */
  }
  return true;
}

function isCuisineId(value: unknown): value is CuisineId {
  return typeof value === 'string' && CUISINE_IDS.includes(value as CuisineId);
}

function isMaxPrepTime(value: unknown): value is MaxPrepTime {
  return value === '10' || value === '30' || value === '60plus';
}

function isCookFrequency(value: unknown): value is CookFrequency {
  return value === 'daily' || value === '4_5' || value === '3_4' || value === '1_2';
}

function isBudgetTier(value: unknown): value is BudgetTier {
  return value === 'cheap' || value === 'medium' || value === 'any';
}

function isVarietyPref(value: unknown): value is VarietyPref {
  return value === 'repeat_ok' || value === 'varied';
}

export const CUISINE_IDS: CuisineId[] = [
  'international',
  'asian',
  'north_african',
  'south_african',
  'european',
  'american',
  'italian',
  'german',
];
