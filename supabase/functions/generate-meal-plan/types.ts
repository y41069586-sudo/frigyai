export type Lang = "de" | "en" | "fr";

export type MacroTargets = {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
};

export type Ingredient = {
  name: string;
  amount: string;
  price: number;
};

export type Meal = {
  type: string;
  name: string;
  prepTime: number;
  ingredients: Ingredient[];
  instructions: string[];
  allergenTags: string[];
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

export type MealLike = {
  type?: string;
  name?: string;
  prepTime?: number;
  ingredients?: Array<{ name?: string; amount?: string; price?: number }>;
  instructions?: unknown[];
  allergenTags?: unknown[];
  protein?: number;
  carbs?: number;
  fat?: number;
  calories?: number;
};

export type DayPlan = {
  day: string;
  meals: Meal[];
};

export type MealPlan = DayPlan[];

export type MealNorm = {
  blob: string;
  compact: string;
  tokens: string[];
  key: string;
};

export type AllergenRule = {
  ids: readonly string[];
  terms: readonly string[];
  phrases?: readonly string[];
};

export type DietRule = {
  id: string;
  terms: readonly string[];
  phrases?: readonly string[];
  fromAllergens?: readonly string[];
};

export type SafetyContext = {
  allergies: string[];
  prefs: string[];
  other: string;
  userAllergieIds: string[];
  customTerms: string[];
};

export type MealSafetyReasons = {
  allergy: string[];
  diet: string[];
};

export type SafetyViolation = {
  day: string;
  mealName: string;
  allergy: string[];
  diet: string[];
};

export type MacroReconcileWarning = {
  type: "macros_primary" | "kcal_scaled" | "ratio_clamped";
  statedKcal: number;
  impliedKcal: number;
  appliedKcal: number;
  message: string;
};

export type MacroAuthority = "harmonized" | "macros" | "scaled_to_kcal";

export type ReconcileResult = {
  targets: MacroTargets;
  macroAuthority: MacroAuthority;
  warning?: MacroReconcileWarning;
};

export type PlanInput = {
  mealsPerDay: number;
  targets: MacroTargets;
  prefs: string[];
  allergies: string[];
  other: string;
  goals: string[];
  lang: Lang;
  fridge: string[];
  banned: string[];
  constraints: string;
  safetyCtx: SafetyContext;
  /** User tapped regenerate — require all-new dishes (not just titles). */
  isRegeneration?: boolean;
  /** Client seed to shuffle fallback pools. */
  varietySeed?: string;
  /** Prior week meals for dish-level dedup (ingredients + fingerprints). */
  priorDishes?: PriorDishSnapshot[];
};

export type PriorDishSnapshot = {
  name: string;
  mainIngredients: string[];
  contentKey: string;
  fingerprint: string;
};

export type BuildPlanResult = {
  plan: MealPlan;
  usedAi: boolean;
  repairAttempts: number;
};

/** Result of a single OpenAI generation pass (or full retry loop). */
export type AiDraftResult = {
  plan: MealPlan | null;
  /** Why the last attempt failed — surfaced to the client when plan is null. */
  failureReason?: string;
};

/** Injectable dependencies for buildPlan (tests / future AI backends). */
export type BuildPlanDeps = {
  generateAIDraft: (input: PlanInput) => Promise<AiDraftResult>;
};

export type ShoppingItem = {
  name: string;
  amount: string;
  price: number;
};

export type ScanMeta = {
  percentIngredientsFromFridge: number;
  estimatedEurosSaved: number;
};
