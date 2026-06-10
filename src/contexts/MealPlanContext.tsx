import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { usePremiumGate } from './PremiumGateContext';
import { toast } from '@/hooks/use-toast';
import { removeMealPlanShoppingSource, setMealPlanShoppingSource } from '@/lib/mealPlanSource';
import { FRIGY_STORAGE_UPDATED, WEEKLY_PLAN_AI_GENERATED_KEY, notifyFrigyStorageUpdated } from '@/lib/frigyStorageSync';
import {
  harmonizeDailyTargets,
  normalizeMealPlanMacros,
  type DailyMacroTargets,
} from '@/lib/mealPlanMacros';
import { isSubscriptionActive } from '@/lib/subscription';
import { usesStoreBilling } from '@/lib/billingPlatform';
import { syncStoreSubscriptionToServer } from '@/lib/storeBilling';
import { syncStoreSubscriptionIfNeeded } from '@/lib/subscriptionRefresh';
import { resolveMealPlanGenerationTargets } from '@/lib/mealPlanGenerationTargets';
import { readMealPlanPreferences } from '@/lib/mealPlanPreferences';
import { hasMealPlanContent, resolveTodayMealPlanDayIndex } from '@/lib/food-ai/weeklyPlanWidgetData';
import { getEdgeFunctionErrorMessage } from '@/lib/edgeFunctionError';
import {
  buildConstraintPrompt,
  findMealSafetyViolations,
  readUserMealPlanProfile,
  type UserMealPlanProfile,
} from '@/lib/mealAllergySafety';
import { SHOPPING_CHECKED_NAMES_KEY } from '@/lib/shoppingSync';
import { buildGapShoppingList, readFridgeIngredientsFromStorage } from '@/lib/shoppingGap';
import { normalizeShoppingListItems } from '@/lib/shoppingListItems';
import { MealPlanGeneratingOverlay } from '@/components/MealPlanGeneratingOverlay';
import { getPublicErrorMessage } from '@/lib/publicErrorMessage';
import { getStoredLanguage, getTranslations, type Language } from './LanguageContext';
import { getLocalWeekStartISO } from '@/lib/localDate';
import {
  FRIGY_LANGUAGE_CHANGED_EVENT,
  getMealPlanStoredLanguage,
  setMealPlanStoredLanguage,
  type LanguageChangedDetail,
} from '@/lib/mealPlanLanguage';
import { translateMealPlanContent } from '@/lib/translateMealPlan';
import { setMealPlanGenerationActive } from '@/lib/mealPlanGenerationLock';

type GenerationStage =
  | 'preparing'
  | 'requesting'
  | 'waiting_ai'
  | 'processing'
  | 'saving'
  | 'finalizing';

function getMealPlanUiCopy() {
  const lang = getStoredLanguage();
  if (lang === 'fr') {
    return {
      premiumRequired: 'Premium requis',
      premiumRequiredDesc: 'Les plans hebdomadaires sont disponibles uniquement avec Premium.',
      generatedTitle: '✅ Plan hebdomadaire cree !',
      generatedDescWithFridge: (calories: number) => `Plan avec ${calories} kcal par jour`,
      generatedDescWithoutFridge:
        'Scanne maintenant ton frigo pour que Frigy verifie ce que tu as deja et ce qui doit aller sur la liste de courses.',
      connectionErrorTitle: 'Erreur de connexion',
      connectionErrorDesc:
        'La creation du plan hebdomadaire est momentanement indisponible. Reessaie dans un instant.',
      caloriesErrorTitle: 'Objectif calorique non atteint',
      caloriesErrorDesc:
        'Le plan genere ne respecte pas ton objectif calorique. Reessaie ou verifie tes reglages.',
      targetAdjustedTitle: 'Objectifs ajustes',
      targetAdjustedMacrosPrimary: (kcal: number) =>
        `Tes macros ont ete priorisees. Le plan vise ${kcal} kcal/jour (calcule a partir des proteines, glucides et lipides).`,
      targetAdjustedDesc: 'Les objectifs nutritionnels ont ete legerement ajustes pour le plan.',
      genericErrorTitle: 'Erreur',
      genericErrorDesc: 'Le plan hebdomadaire n a pas pu etre genere. Reessaie.',
    };
  }
  if (lang === 'en') {
    return {
      premiumRequired: 'Premium required',
      premiumRequiredDesc: 'Weekly meal plans are only available with Premium.',
      generatedTitle: '✅ Meal plan generated!',
      generatedDescWithFridge: (calories: number) => `Plan with ${calories} kcal per day`,
      generatedDescWithoutFridge:
        'Now scan your fridge so Frigy can check what you already have and what should go on the shopping list.',
      connectionErrorTitle: 'Connection error',
      connectionErrorDesc:
        'Meal plan generation is currently unavailable. Please try again shortly.',
      caloriesErrorTitle: 'Calorie target not reached',
      caloriesErrorDesc:
        'The generated plan does not meet your calorie target. Please try again or review your settings.',
      targetAdjustedTitle: 'Targets adjusted',
      targetAdjustedMacrosPrimary: (kcal: number) =>
        `Your macros were prioritized. The plan targets ${kcal} kcal/day (derived from protein, carbs, and fat).`,
      targetAdjustedDesc: 'Nutrition targets were slightly adjusted for this plan.',
      genericErrorTitle: 'Error',
      genericErrorDesc: 'The meal plan could not be generated. Please try again.',
    };
  }
  return {
    premiumRequired: 'Premium erforderlich',
    premiumRequiredDesc: 'Wochenpläne sind nur mit Premium verfügbar.',
    generatedTitle: '✅ Wochenplan generiert!',
    generatedDescWithFridge: (calories: number) => `Plan mit ${calories} kcal pro Tag`,
    generatedDescWithoutFridge:
      'Scanne jetzt deinen Kühlschrank, damit Frigy prüft, was du hast und was auf die Einkaufsliste muss.',
    connectionErrorTitle: 'Verbindungsfehler',
    connectionErrorDesc:
      'Die Wochenplan-Erstellung ist gerade nicht erreichbar. Bitte versuche es gleich erneut.',
    caloriesErrorTitle: 'Kalorienziel nicht erreicht',
    caloriesErrorDesc:
      'Der generierte Plan erfüllt Ihr Kalorienziel nicht. Bitte versuchen Sie es erneut oder überprüfen Sie Ihre Einstellungen.',
    targetAdjustedTitle: 'Ziele angepasst',
    targetAdjustedMacrosPrimary: (kcal: number) =>
      `Deine Makros wurden priorisiert. Der Plan zielt auf ${kcal} kcal/Tag (berechnet aus Protein, Kohlenhydraten und Fett).`,
    targetAdjustedDesc: 'Die Ernährungsziele wurden für diesen Plan leicht angepasst.',
    genericErrorTitle: 'Fehler',
    genericErrorDesc: 'Wochenplan konnte nicht generiert werden. Bitte versuche es erneut.',
  };
}

function findUnsafeMeals(plan: DayPlan[], diet: UserMealPlanProfile): string[] {
  const unsafe: string[] = [];
  for (const day of plan || []) {
    for (const meal of day.meals || []) {
      const violations = findMealSafetyViolations(
        meal,
        diet.allergies,
        diet.dietaryPreferences,
        diet.allergiesOther,
      );
      if (violations.length > 0) {
        unsafe.push(`${day.day}: ${meal.name} (${violations.join(', ')})`);
      }
    }
  }
  return unsafe;
}

function summarizeExistingMeals(plan: DayPlan[] | null): Array<{
  name: string;
  ingredients: Array<{ name: string }>;
}> {
  return (plan ?? [])
    .flatMap((day) => day.meals ?? [])
    .map((meal) => ({
      name: String(meal?.name ?? '').trim(),
      ingredients: (meal.ingredients ?? []).map((i) => ({
        name: String(i?.name ?? '').trim(),
      })).filter((i) => i.name),
    }))
    .filter((m) => m.name)
    .slice(0, 56);
}

function getPassiveGenerationProgress(elapsedSeconds: number, stage: GenerationStage): number {
  switch (stage) {
    case 'preparing':
      return Math.min(7, elapsedSeconds * 2);
    case 'requesting':
      return Math.min(16, 8 + elapsedSeconds);
    case 'waiting_ai':
      if (elapsedSeconds <= 10) return 18 + elapsedSeconds * 2.4;
      if (elapsedSeconds <= 25) return 42 + Math.round((elapsedSeconds - 10) * 1.3);
      if (elapsedSeconds <= 45) return 62 + Math.round((elapsedSeconds - 25) * 0.7);
      return Math.min(84, 76 + Math.round((elapsedSeconds - 45) * 0.12));
    case 'processing':
      return Math.min(90, 86 + elapsedSeconds);
    case 'saving':
      return Math.min(97, 92 + elapsedSeconds * 2);
    case 'finalizing':
      return Math.min(100, 98 + elapsedSeconds);
    default:
      return 0;
  }
}

interface Ingredient {
  name: string;
  amount: string;
  price: number;
}

interface Meal {
  type: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  ingredients: Ingredient[];
  instructions: string[];
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

interface ShoppingListItem {
  name: string;
  amount: string;
  price: number;
}

interface MealPlanContextType {
  isGenerating: boolean;
  isMinimized: boolean;
  elapsedSeconds: number;
  generationProgress: number;
  mealPlan: DayPlan[] | null;
  shoppingList: ShoppingListItem[] | null;
  generationCount: number;
  refreshGenerationCount: () => Promise<void>;
  generateMealPlan: (
    settings: {
      dailyCalories: number;
      dailyProtein: number;
      dailyCarbs: number;
      dailyFat: number;
      mealsPerDay?: number;
    },
    options?: { fridgeIngredients?: string[] },
  ) => Promise<boolean>;
  /** Regenerate only today's day with adjusted calorie/macro targets. */
  regenerateTodayForBalance: (adjustedTargets: DailyMacroTargets) => Promise<boolean>;
  setMinimized: (minimized: boolean) => void;
  clearMealPlan: () => void;
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined);

export const useMealPlanGeneration = () => {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error('useMealPlanGeneration must be used within MealPlanProvider');
  }
  return context;
};

export const MealPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, isPremium, subscriptionStatus, checkSubscription } = useAuth();
  const { ensurePremium } = usePremiumGate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationProgressTarget, setGenerationProgressTarget] = useState(0);
  const [generationStage, setGenerationStage] = useState<GenerationStage>('preparing');
  const [mealPlan, setMealPlan] = useState<DayPlan[] | null>(() => {
    // Initialize from localStorage immediately to prevent flash of empty state
    const saved = localStorage.getItem('weeklyMealPlan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved meal plan');
        return null;
      }
    }
    return null;
  });
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[] | null>(() => {
    const savedPlan = localStorage.getItem('weeklyMealPlan');
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        if (Array.isArray(plan) && plan.length > 0) {
          return buildGapShoppingList(plan, readFridgeIngredientsFromStorage()) as ShoppingListItem[];
        }
      } catch {
        /* fall through */
      }
    }
    const saved = localStorage.getItem('weeklyShoppingList');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = normalizeShoppingListItems(parsed, 'Zutat') as ShoppingListItem[];
        return cleaned.length > 0 ? cleaned : null;
      } catch (e) {
        console.error('Failed to parse saved shopping list');
        return null;
      }
    }
    return null;
  });
  const [generationCount, setGenerationCount] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTargetRef = useRef(0);
  const leftMealPlansWhileGeneratingRef = useRef(false);
  const stageElapsedSecondsRef = useRef(0);
  const translatingPlanRef = useRef(false);

  const getWeekStart = getLocalWeekStartISO;

  const persistMealPlanLocally = useCallback((plan: DayPlan[], _list: ShoppingListItem[], language: Language) => {
    const cleanedList = buildGapShoppingList(plan, readFridgeIngredientsFromStorage()) as ShoppingListItem[];
    setMealPlan(plan);
    setShoppingList(cleanedList);
    localStorage.setItem('weeklyMealPlan', JSON.stringify(plan));
    localStorage.setItem('weeklyShoppingList', JSON.stringify(cleanedList));
    setMealPlanStoredLanguage(language);
    notifyFrigyStorageUpdated();
  }, []);

  const refreshGenerationCount = useCallback(async () => {
    if (!session?.user?.id) return;

    const weekStart = getWeekStart();
    const { data, error } = await supabase
      .from('meal_plan_usage')
      .select('generation_count')
      .eq('user_id', session.user.id)
      .eq('week_start', weekStart)
      .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully

    if (error) {
      console.error('[MEAL-PLAN-USAGE] Error fetching generation count:', error);
      setGenerationCount(0);
      return;
    }

    // data will be null if no row exists, which is fine
    setGenerationCount(data?.generation_count || 0);
    console.log('[MEAL-PLAN-USAGE] Generation count:', data?.generation_count || 0, 'for week:', weekStart);
  }, [session?.user?.id]);

  // Fetch generation count on session change
  useEffect(() => {
    if (session?.user?.id) {
      refreshGenerationCount();
    } else {
      setGenerationCount(0);
    }
  }, [session?.user?.id, refreshGenerationCount]);

  // Timer for elapsed seconds
  useEffect(() => {
    if (isGenerating) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        stageElapsedSecondsRef.current += 1;
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isGenerating]);

  const updateGenerationProgressTarget = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(next)));
    progressTargetRef.current = Math.max(progressTargetRef.current, clamped);
    setGenerationProgressTarget(progressTargetRef.current);
  }, []);

  const setGenerationStageWithFloor = useCallback((stage: GenerationStage, floor?: number) => {
    setGenerationStage(stage);
    stageElapsedSecondsRef.current = 0;
    if (typeof floor === 'number') {
      updateGenerationProgressTarget(floor);
    }
  }, [updateGenerationProgressTarget]);

  useEffect(() => {
    if (!isGenerating) {
      progressTargetRef.current = 0;
      stageElapsedSecondsRef.current = 0;
      setGenerationProgressTarget(0);
      setGenerationProgress(0);
      setGenerationStage('preparing');
      return;
    }

    const passiveTarget = getPassiveGenerationProgress(stageElapsedSecondsRef.current, generationStage);
    updateGenerationProgressTarget(passiveTarget);
  }, [elapsedSeconds, generationStage, isGenerating, updateGenerationProgressTarget]);

  useEffect(() => {
    if (!isGenerating) return;
    if (generationProgress >= generationProgressTarget) return;

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= progressTargetRef.current) return prev;
        const delta = progressTargetRef.current - prev;
        const step = delta >= 16 ? 3 : delta >= 8 ? 2 : 1;
        return Math.min(progressTargetRef.current, prev + step);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [generationProgress, generationProgressTarget, isGenerating]);

  useEffect(() => {
    if (!isGenerating) {
      leftMealPlansWhileGeneratingRef.current = false;
      setIsMinimized(false);
      return;
    }

    // Keep full-screen overlay during generation — never minimize mid-run.
    setIsMinimized(false);
    leftMealPlansWhileGeneratingRef.current = false;
  }, [isGenerating]);

  // Load persisted meal plan from backend on login (and migrate any existing local plan)
  useEffect(() => {
    if (!session?.user?.id) return;

    let cancelled = false;

    const run = async () => {
      // Read current local plan (if any)
      let localPlan: DayPlan[] | null = null;
      const localSaved = localStorage.getItem('weeklyMealPlan');
      if (localSaved) {
        try {
          localPlan = JSON.parse(localSaved) as DayPlan[];
        } catch {
          localPlan = null;
        }
      }

      const { data, error } = await supabase
        .from('weekly_meal_plans')
        .select('plan')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        const errorMsg = error?.message || String(error);
        console.error('Error loading weekly meal plan:', errorMsg);

        // If table doesn't exist, that's expected during initial setup - just log and continue
        if (errorMsg.includes('weekly_meal_plans') || errorMsg.includes('schema cache')) {
          console.warn('Weekly meal plans table not yet created - using local storage only');
          return;
        }
        return;
      }

      // Type-safe extraction of plan from query result
      const dbPlan = (data as Record<string, unknown> | null)?.plan as DayPlan[] | undefined;

      // Prefer DB if available
      if (Array.isArray(dbPlan) && dbPlan.length > 0) {
        const syncedList = buildGapShoppingList(dbPlan, readFridgeIngredientsFromStorage());
        setMealPlan(dbPlan);
        setShoppingList(syncedList);
        localStorage.setItem('weeklyMealPlan', JSON.stringify(dbPlan));
        localStorage.setItem('weeklyShoppingList', JSON.stringify(syncedList));
        if (!getMealPlanStoredLanguage()) {
          setMealPlanStoredLanguage(getStoredLanguage());
        }
        notifyFrigyStorageUpdated();
        return;
      }

      // Otherwise, if user has a local plan from onboarding/previous sessions, persist it once
      if (Array.isArray(localPlan) && localPlan.length > 0) {
        await supabase
          .from('weekly_meal_plans')
          .upsert(
            [
              {
                user_id: session.user.id,
                plan: localPlan as any,
                updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: 'user_id' }
          );
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Sync state when Scan-Seite o.ä. localStorage schreibt (Mock / ohne Context-Update)
  useEffect(() => {
    const load = () => {
      const p = localStorage.getItem('weeklyMealPlan');
      if (p) {
        try {
          const parsed = JSON.parse(p);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMealPlan(parsed);
            const syncedList = buildGapShoppingList(parsed, readFridgeIngredientsFromStorage());
            setShoppingList(syncedList);
            localStorage.setItem('weeklyShoppingList', JSON.stringify(syncedList));
            return;
          }
        } catch {
          /* ignore */
        }
      }
      const s = localStorage.getItem('weeklyShoppingList');
      if (s) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) setShoppingList(normalizeShoppingListItems(parsed, 'Zutat') as ShoppingListItem[]);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener(FRIGY_STORAGE_UPDATED, load);
    return () => window.removeEventListener(FRIGY_STORAGE_UPDATED, load);
  }, []);

  const generateMealPlan = useCallback(async (settings: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
    mealsPerDay?: number;
  }, options?: { fridgeIngredients?: string[] }): Promise<boolean> => {
    const tr = getTranslations(getStoredLanguage());
    const ui = getMealPlanUiCopy();
    if (!session) {
      toast({ title: tr.notLoggedIn, variant: 'destructive' });
      return false;
    }

    let hasPremium = isPremium;
    if (!hasPremium && session.access_token) {
      await syncStoreSubscriptionIfNeeded(session.access_token);
      const status = await checkSubscription();
      hasPremium = isSubscriptionActive(status);
    }
    if (!hasPremium) {
      await ensurePremium();
      return false;
    }

    const macroTargets = resolveMealPlanGenerationTargets(settings);
    const previousMealsForRegen = summarizeExistingMeals(mealPlan);
    const isRegeneration = previousMealsForRegen.length > 0;

    setIsGenerating(true);
    setIsMinimized(false);
    setMealPlanGenerationActive(true);
    setGenerationProgress(0);
    progressTargetRef.current = 0;
    stageElapsedSecondsRef.current = 0;
    setGenerationProgressTarget(0);
    setGenerationStage('preparing');
    setGenerationStageWithFloor('preparing', 6);

    console.log('[MEAL-PLAN-CLIENT] Invoking generate-meal-plan function...');

    try {
      try {
        if (usesStoreBilling() && session.access_token) {
          const skipRcSync = subscriptionStatus?.product_id === "store_admin_grant";
          if (!skipRcSync) {
            try {
              await Promise.race([
                syncStoreSubscriptionToServer(session.access_token),
                new Promise<void>((_, reject) =>
                  setTimeout(() => reject(new Error('store sync timeout')), 5000),
                ),
              ]);
            } catch (syncErr) {
              console.warn('[MEAL-PLAN-CLIENT] store subscription sync skipped:', syncErr);
            }
          }
        }

        const diet = readUserMealPlanProfile();
        const mealPlanPreferences = readMealPlanPreferences();
        const constraintPrompt = buildConstraintPrompt(
          diet.allergies,
          diet.dietaryPreferences,
          diet.allergiesOther,
          diet.healthGoals,
          getStoredLanguage(),
        );
        const previousMealNames = previousMealsForRegen.map((m) => m.name);

        setGenerationStageWithFloor('requesting', 14);
        setGenerationStageWithFloor('waiting_ai', 18);
        const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
          body: {
            preferences: '',
            dailyCalories: macroTargets.dailyCalories,
            dailyProtein: macroTargets.dailyProtein,
            dailyCarbs: macroTargets.dailyCarbs,
            dailyFat: macroTargets.dailyFat,
            mealsPerDay: settings.mealsPerDay || 5,
            allergies: diet.allergies,
            allergiesOther: diet.allergiesOther,
            dietaryPreferences: diet.dietaryPreferences,
            healthGoals: diet.healthGoals,
            constraintPrompt,
            fridgeIngredients: options?.fridgeIngredients ?? [],
            language: getStoredLanguage(),
            isRegeneration,
            varietySeed: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            previousMealNames,
            previousMeals: previousMealsForRegen,
            mealPlanPreferences: {
              cuisines: mealPlanPreferences.cuisines,
              maxPrepTime: mealPlanPreferences.maxPrepTime,
              cookFrequency: mealPlanPreferences.cookFrequency,
              budget: mealPlanPreferences.budget,
              variety: mealPlanPreferences.variety,
            },
          },
        });

        if (error) {
          console.error('[MEAL-PLAN-CLIENT] Edge Function error:', error);
          const errorMessage = await getEdgeFunctionErrorMessage(error, data as { error?: string; message?: string } | null);
          throw new Error(errorMessage);
        }

        const payload = data as { error?: string; message?: string; mealPlan?: unknown } | null;
        if (payload?.error) {
          const serverMsg =
            typeof payload.message === 'string' && payload.message
              ? payload.message
              : String(payload.error);
          throw new Error(serverMsg);
        }

        console.log('[MEAL-PLAN-CLIENT] Successfully received data:', data ? 'yes' : 'no');
        setGenerationStageWithFloor('processing', 72);

        if (Array.isArray(payload?.mealPlan) && payload.mealPlan.length > 0) {
          const rawPlan = payload!.mealPlan as DayPlan[];
          const appliedFromServer = (payload as { appliedTargets?: DailyMacroTargets })?.appliedTargets;
          const effectiveTargets = appliedFromServer
            ? harmonizeDailyTargets({
                dailyCalories: Number(appliedFromServer.dailyCalories) || macroTargets.dailyCalories,
                dailyProtein: Number(appliedFromServer.dailyProtein) || macroTargets.dailyProtein,
                dailyCarbs: Number(appliedFromServer.dailyCarbs) || macroTargets.dailyCarbs,
                dailyFat: Number(appliedFromServer.dailyFat) || macroTargets.dailyFat,
              })
            : macroTargets;
          let newPlan: DayPlan[];
          try {
            newPlan = normalizeMealPlanMacros(rawPlan) as DayPlan[];
          } catch (normalizeErr) {
            console.warn('[MEAL-PLAN-CLIENT] normalizeMealPlanMacros failed, using server plan:', normalizeErr);
            newPlan = rawPlan;
          }
          const newShoppingList = (data as any).shoppingList || [];
          const targetWarning = (data as any)?.targetWarning as
            | { type?: string; message?: string; appliedKcal?: number }
            | undefined;
          const macroAuthority = (data as any)?.macroAuthority as
            | "harmonized"
            | "macros"
            | "scaled_to_kcal"
            | undefined;
          const unsafeMeals = findUnsafeMeals(newPlan, diet);
          updateGenerationProgressTarget(80);

          if (unsafeMeals.length > 0) {
            console.warn('[MEAL-PLAN-SAFETY] Rejected plan with unsafe meals:', unsafeMeals);
            const lang = getStoredLanguage();
            toast({
              title: lang === 'fr' ? 'Plan non enregistré' : lang === 'en' ? 'Plan not saved' : 'Plan nicht gespeichert',
              description:
                lang === 'fr'
                  ? `Certains plats ne correspondent pas à tes restrictions (${unsafeMeals.slice(0, 2).join('; ')}). Génère un nouveau plan.`
                  : lang === 'en'
                    ? `Some meals conflict with your restrictions (${unsafeMeals.slice(0, 2).join('; ')}). Please generate again.`
                    : `Einige Gerichte passen nicht zu deinen Vorgaben (${unsafeMeals.slice(0, 2).join('; ')}). Bitte neu generieren.`,
              variant: 'destructive',
            });
            return false;
          }

          // Debug: Check if ingredients are present
          console.log('[MEAL-PLAN] Generated plan structure:', {
            days: newPlan.length,
            firstDay: newPlan[0]?.day,
            firstMealHasIngredients: !!newPlan[0]?.meals?.[0]?.ingredients,
            firstMealStructure: newPlan[0]?.meals?.[0],
            shoppingListItems: newShoppingList.length
          });

          // Verify calories per day
          const dailyCalorieAnalysis = newPlan.map((day: any) => {
            const totalCals = (day.meals || []).reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0);
            return { day: day.day, calories: totalCals, meets_target: totalCals === effectiveTargets.dailyCalories };
          });
          const avgCalories = dailyCalorieAnalysis.reduce((sum: number, d: any) => sum + d.calories, 0) / dailyCalorieAnalysis.length;
          console.log('[MEAL-PLAN] Daily calorie analysis:', {
            analysis: dailyCalorieAnalysis,
            avgCalories: Math.round(avgCalories),
            avgPercentage: Math.round((avgCalories / effectiveTargets.dailyCalories) * 100),
            targetWarning: targetWarning?.type ?? null,
            macroAuthority: macroAuthority ?? null,
          });

          localStorage.removeItem(SHOPPING_CHECKED_NAMES_KEY);
          removeMealPlanShoppingSource();
          persistMealPlanLocally(newPlan, newShoppingList, getStoredLanguage());
          localStorage.setItem(WEEKLY_PLAN_AI_GENERATED_KEY, '1');
          setMealPlanShoppingSource('frigy');
          setGenerationStageWithFloor('saving', 86);

          const sm = (data as any)?.scanMeta;
          if (sm) {
            localStorage.setItem(
              'fridgeScanStats',
              JSON.stringify({
                percentHave: sm.percentIngredientsFromFridge ?? sm.percentHave ?? 0,
                eurosSaved: sm.estimatedEurosSaved ?? sm.eurosSaved ?? 0,
              }),
            );
          } else if (options?.fridgeIngredients?.length) {
            localStorage.removeItem('fridgeScanStats');
          }

          // Persist for this user so it never auto-regenerates after login
          // If table doesn't exist yet, that's OK - just use localStorage
          try {
            await supabase
              .from('weekly_meal_plans')
              .upsert(
                [
                  {
                    user_id: session.user.id,
                    plan: newPlan as any,
                    updated_at: new Date().toISOString(),
                  },
                ],
                { onConflict: 'user_id' }
              );
          } catch (dbError) {
            const dbErrorMsg = dbError instanceof Error ? dbError.message : String(dbError);
            if (dbErrorMsg.includes('weekly_meal_plans') || dbErrorMsg.includes('schema cache')) {
              console.warn('Weekly meal plans table not available - using localStorage only');
            } else {
              console.error('Failed to persist meal plan:', dbErrorMsg);
            }
          }
          setGenerationStageWithFloor('finalizing', 94);

          // Refresh generation count from server after successful generation
          setGenerationCount((prev) => prev + 1);
          void refreshGenerationCount();

          notifyFrigyStorageUpdated();
          progressTargetRef.current = 100;
          setGenerationProgressTarget(100);
          setGenerationStage('finalizing');
          setGenerationProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 420));

          toast({
            title: ui.generatedTitle,
            description: options?.fridgeIngredients?.length
              ? ui.generatedDescWithFridge(effectiveTargets.dailyCalories)
              : ui.generatedDescWithoutFridge
          });

          if (targetWarning || (macroAuthority && macroAuthority !== "harmonized")) {
            const appliedKcal = targetWarning?.appliedKcal ?? effectiveTargets.dailyCalories;
            toast({
              title: ui.targetAdjustedTitle,
              description:
                targetWarning?.type === "macros_primary" || macroAuthority === "macros"
                  ? targetWarning?.message || ui.targetAdjustedMacrosPrimary(appliedKcal)
                  : targetWarning?.message || ui.targetAdjustedDesc,
            });
          }

          const tab = new URLSearchParams(location.search).get('tab') || 'meals';
          if (location.pathname !== '/meal-plans' || tab !== 'meals') {
            navigate('/meal-plans?tab=meals', { replace: true });
          }

          return true;
        } else {
          throw new Error('Leerer Wochenplan erhalten');
        }
      } catch (innerError) {
        if (innerError instanceof TypeError && innerError.message.includes('Failed to fetch')) {
          throw new Error('Netzwerkverbindung fehlgeschlagen. Bitte überprüfen Sie Ihre Verbindung.');
        }

        throw innerError;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[MEAL-PLAN-CLIENT] Error in generateMealPlan catch block:', message);

      const lowerMsg = message.toLowerCase();
      if (
        message.includes('plan_limit_exceeded') ||
        message.includes('premium_required') ||
        lowerMsg.includes('premium required')
      ) {
        await refreshGenerationCount();
        await ensurePremium();
      } else if (message.includes('OPENAI_API_KEY')) {
        toast({
          title: ui.genericErrorTitle,
          description: ui.connectionErrorDesc,
          variant: 'destructive',
        });
      } else if (message.includes('unauthorized') || message.includes('Anmeldung')) {
        toast({
          title: tr.notLoggedIn,
          description: message,
          variant: 'destructive',
        });
      } else if (message.includes('Load failed') || message.includes('Failed to fetch')) {
        toast({
          title: ui.connectionErrorTitle,
          description: ui.connectionErrorDesc,
          variant: 'destructive',
        });
      } else if (
        message.includes('503') ||
        message.includes('502') ||
        message.includes('504') ||
        message.includes('non-2xx') ||
        message.includes('FunctionsHttpError')
      ) {
        toast({
          title: ui.connectionErrorTitle,
          description: ui.connectionErrorDesc,
          variant: 'destructive',
        });
      } else if (message.includes('meal_plan_generation_failed') || message.includes('config_error')) {
        toast({
          title: ui.genericErrorTitle,
          description: getPublicErrorMessage(message, ui.genericErrorDesc),
          variant: 'destructive',
        });
      } else if (message.includes('calorie') || message.includes('Kalorie')) {
        toast({
          title: ui.caloriesErrorTitle,
          description: ui.caloriesErrorDesc,
          variant: 'destructive',
        });
      } else {
        toast({
          title: ui.genericErrorTitle,
          description: getPublicErrorMessage(message, ui.genericErrorDesc),
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      setMealPlanGenerationActive(false);
      setIsGenerating(false);
      setIsMinimized(false);
    }
  }, [session, refreshGenerationCount, isPremium, subscriptionStatus, checkSubscription, ensurePremium, updateGenerationProgressTarget, mealPlan, persistMealPlanLocally, location.pathname, location.search, navigate]);

  const regenerateTodayForBalance = useCallback(async (adjustedTargets: DailyMacroTargets): Promise<boolean> => {
    const tr = getTranslations(getStoredLanguage());
    if (!session) {
      toast({ title: tr.notLoggedIn, variant: 'destructive' });
      return false;
    }

    let currentPlan = mealPlan;
    if (!currentPlan?.length) {
      try {
        const raw = localStorage.getItem('weeklyMealPlan');
        currentPlan = raw ? (JSON.parse(raw) as DayPlan[]) : null;
      } catch {
        currentPlan = null;
      }
    }

    if (!hasMealPlanContent(currentPlan)) {
      toast({
        title: tr.error || 'Fehler',
        description: tr.onboardingFirstWeeklyPlanDesc,
        variant: 'destructive',
      });
      return false;
    }

    let hasPremium = isPremium;
    if (!hasPremium) {
      const status = await checkSubscription();
      hasPremium = isSubscriptionActive(status);
    }
    if (!hasPremium) {
      await ensurePremium();
      return false;
    }

    const dayIndex = resolveTodayMealPlanDayIndex(currentPlan!);
    const dayName = currentPlan![dayIndex]?.day ?? '';
    const diet = readUserMealPlanProfile();
    const mealPlanPreferences = readMealPlanPreferences();
    const constraintPrompt = buildConstraintPrompt(
      diet.allergies,
      diet.dietaryPreferences,
      diet.allergiesOther,
      diet.healthGoals,
      getStoredLanguage(),
    );
    const todayMeals = currentPlan![dayIndex]?.meals ?? [];
    const previousMealsForRegen = todayMeals.map((m) => ({ name: m.name, ingredients: m.ingredients ?? [] }));
    const previousMealNames = todayMeals.map((m) => m.name);

    const storedProfile = localStorage.getItem('userProfile');
    let mealsPerDay = 5;
    try {
      if (storedProfile) mealsPerDay = JSON.parse(storedProfile).mealsPerDay || 5;
    } catch {
      /* ignore */
    }

    setIsGenerating(true);
    setMealPlanGenerationActive(true);
    setGenerationStage('preparing');
    setGenerationProgress(20);

    try {
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        headers: session.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: {
          preferences: '',
          dailyCalories: adjustedTargets.dailyCalories,
          dailyProtein: adjustedTargets.dailyProtein,
          dailyCarbs: adjustedTargets.dailyCarbs,
          dailyFat: adjustedTargets.dailyFat,
          mealsPerDay,
          allergies: diet.allergies,
          allergiesOther: diet.allergiesOther,
          dietaryPreferences: diet.dietaryPreferences,
          healthGoals: diet.healthGoals,
          constraintPrompt,
          fridgeIngredients: readFridgeIngredientsFromStorage(),
          language: getStoredLanguage(),
          isRegeneration: true,
          varietySeed: `${Date.now()}-balance`,
          previousMealNames,
          previousMeals: previousMealsForRegen,
          singleDayIndex: dayIndex,
          singleDayName: dayName,
          mealPlanPreferences: {
            cuisines: mealPlanPreferences.cuisines,
            maxPrepTime: mealPlanPreferences.maxPrepTime,
            cookFrequency: mealPlanPreferences.cookFrequency,
            budget: mealPlanPreferences.budget,
            variety: mealPlanPreferences.variety,
          },
        },
      });

      if (error) {
        throw new Error(await getEdgeFunctionErrorMessage(error, data as { error?: string; message?: string } | null));
      }

      const payload = data as {
        error?: string;
        message?: string;
        singleDay?: DayPlan;
        dayIndex?: number;
      } | null;

      if (payload?.error || !payload?.singleDay) {
        throw new Error(payload?.message || payload?.error || 'single_day_failed');
      }

      const merged = [...currentPlan!];
      const replaceIndex = typeof payload.dayIndex === 'number' ? payload.dayIndex : dayIndex;
      merged[replaceIndex] = payload.singleDay;

      let normalized: DayPlan[];
      try {
        normalized = normalizeMealPlanMacros(merged) as DayPlan[];
      } catch {
        normalized = merged;
      }

      const syncedList = buildGapShoppingList(normalized, readFridgeIngredientsFromStorage()) as ShoppingListItem[];
      persistMealPlanLocally(normalized, syncedList, getStoredLanguage());
      setGenerationProgress(100);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[MEAL-PLAN] regenerateTodayForBalance failed:', message);
      toast({
        title: tr.error || 'Fehler',
        description: getPublicErrorMessage(message, tr.yesterdayCalorieAdjustFailed),
        variant: 'destructive',
      });
      return false;
    } finally {
      setMealPlanGenerationActive(false);
      setIsGenerating(false);
    }
  }, [session, isPremium, checkSubscription, ensurePremium, mealPlan, persistMealPlanLocally]);

  useEffect(() => {
    const syncPlanLanguage = async (nextLanguage: Language) => {
      const rawPlan = localStorage.getItem('weeklyMealPlan');
      if (!rawPlan || translatingPlanRef.current) return;

      let currentPlan: DayPlan[];
      let currentList: ShoppingListItem[];
      try {
        currentPlan = JSON.parse(rawPlan) as DayPlan[];
        const rawList = localStorage.getItem('weeklyShoppingList');
        currentList = rawList ? (JSON.parse(rawList) as ShoppingListItem[]) : [];
      } catch {
        return;
      }

      if (!currentPlan.length) return;

      const storedLanguage = getMealPlanStoredLanguage();
      if (!storedLanguage) {
        setMealPlanStoredLanguage(nextLanguage);
        return;
      }
      if (storedLanguage === nextLanguage) return;

      translatingPlanRef.current = true;
      try {
        const translated = await translateMealPlanContent(
          currentPlan,
          currentList,
          nextLanguage,
          session?.access_token,
        );
        if (translated) {
          persistMealPlanLocally(translated.mealPlan as DayPlan[], translated.shoppingList as ShoppingListItem[], nextLanguage);
        }
      } finally {
        translatingPlanRef.current = false;
      }
    };

    const onLanguageChanged = (event: Event) => {
      const nextLanguage = (event as CustomEvent<LanguageChangedDetail>).detail?.language;
      if (nextLanguage) void syncPlanLanguage(nextLanguage);
    };

    window.addEventListener(FRIGY_LANGUAGE_CHANGED_EVENT, onLanguageChanged);
    void syncPlanLanguage(getStoredLanguage());

    return () => window.removeEventListener(FRIGY_LANGUAGE_CHANGED_EVENT, onLanguageChanged);
  }, [session?.access_token, persistMealPlanLocally]);

  const setMinimized = useCallback((minimized: boolean) => {
    setIsMinimized(minimized);
  }, []);

  const clearMealPlan = useCallback(async () => {
    setMealPlan(null);
    setShoppingList(null);
    localStorage.removeItem('weeklyMealPlan');
    localStorage.removeItem('weeklyShoppingList');
    localStorage.removeItem('weeklyMealPlanLanguage');
    localStorage.removeItem(SHOPPING_CHECKED_NAMES_KEY);
    removeMealPlanShoppingSource();
    notifyFrigyStorageUpdated();

    // Clear persisted plan for the logged in user from Supabase
    if (session?.user?.id) {
      try {
        await supabase.from('weekly_meal_plans').delete().eq('user_id', session.user.id);
        console.log('[MEAL-PLAN] Cleared meal plan from Supabase');
      } catch (error) {
        console.error('[MEAL-PLAN] Error clearing meal plan from Supabase:', error);
      }
    }
  }, [session?.user?.id]);

  return (
    <MealPlanContext.Provider value={{
      isGenerating,
      isMinimized,
      elapsedSeconds,
      generationProgress,
      mealPlan,
      shoppingList,
      generationCount,
      refreshGenerationCount,
      generateMealPlan,
      regenerateTodayForBalance,
      setMinimized,
      clearMealPlan,
    }}>
      {children}
      <MealPlanGeneratingOverlay
        isGenerating={isGenerating}
        elapsedSeconds={elapsedSeconds}
        progressPercent={generationProgress}
        stageKey={generationStage}
        isMinimized={isMinimized}
        locked={isGenerating}
        stayOnTabMessage={getTranslations(getStoredLanguage()).firstWeeklyPlanStayOnTab}
      />
    </MealPlanContext.Provider>
  );
};
