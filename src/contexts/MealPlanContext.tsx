import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { removeMealPlanShoppingSource, setMealPlanShoppingSource } from '@/lib/mealPlanSource';
import { FRIGY_STORAGE_UPDATED, WEEKLY_PLAN_AI_GENERATED_KEY, notifyFrigyStorageUpdated } from '@/lib/frigyStorageSync';
import { harmonizeDailyTargets, syncMealPlanToTargets } from '@/lib/mealPlanMacros';
import { isSubscriptionActive } from '@/lib/subscription';
import { getEdgeFunctionErrorMessage } from '@/lib/edgeFunctionError';
import {
  buildConstraintPrompt,
  findMealSafetyViolations,
  readUserMealPlanProfile,
  type UserMealPlanProfile,
} from '@/lib/mealAllergySafety';
import { SHOPPING_CHECKED_NAMES_KEY } from '@/lib/shoppingSync';
import { MealPlanGeneratingOverlay } from '@/components/MealPlanGeneratingOverlay';
import { getPublicErrorMessage } from '@/lib/publicErrorMessage';
import { getStoredLanguage, getTranslations } from './LanguageContext';
import { getLocalWeekStartISO } from '@/lib/localDate';

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

function summarizeExistingMealNames(plan: DayPlan[] | null): string[] {
  return (plan ?? [])
    .flatMap((day) => day.meals ?? [])
    .map((meal) => String(meal?.name ?? '').trim())
    .filter(Boolean)
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
  const { session, isPremium, checkSubscription } = useAuth();
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
    // Initialize from localStorage immediately to prevent flash of empty state
    const saved = localStorage.getItem('weeklyShoppingList');
    if (saved) {
      try {
        return JSON.parse(saved);
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

  const getWeekStart = getLocalWeekStartISO;

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
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const activeMealPlanTab = searchParams.get('tab') || 'meals';
    const isMealPlanMainView = location.pathname === '/meal-plans' && activeMealPlanTab === 'meals';

    if (!isMealPlanMainView) {
      leftMealPlansWhileGeneratingRef.current = true;
      setIsMinimized(true);
      return;
    }

    if (leftMealPlansWhileGeneratingRef.current) {
      setIsMinimized(false);
      leftMealPlansWhileGeneratingRef.current = false;
    }
  }, [isGenerating, location.pathname, location.search]);

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
        setMealPlan(dbPlan);
        localStorage.setItem('weeklyMealPlan', JSON.stringify(dbPlan));
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
      const s = localStorage.getItem('weeklyShoppingList');
      if (p) {
        try {
          const parsed = JSON.parse(p);
          if (Array.isArray(parsed) && parsed.length > 0) setMealPlan(parsed);
        } catch {
          /* ignore */
        }
      }
      if (s) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) setShoppingList(parsed);
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
    if (!hasPremium) {
      const status = await checkSubscription();
      hasPremium = isSubscriptionActive(status);
    }
    if (!hasPremium) {
      toast({
        title: ui.premiumRequired,
        description: ui.premiumRequiredDesc,
        variant: 'destructive',
      });
      return false;
    }

    const macroTargets = harmonizeDailyTargets({
      dailyCalories: settings.dailyCalories,
      dailyProtein: settings.dailyProtein,
      dailyCarbs: settings.dailyCarbs,
      dailyFat: settings.dailyFat,
    });
    const isRegeneration = Boolean(localStorage.getItem(WEEKLY_PLAN_AI_GENERATED_KEY));

    setIsGenerating(true);
    setIsMinimized(false);
    setGenerationProgress(0);
    progressTargetRef.current = 0;
    stageElapsedSecondsRef.current = 0;
    setGenerationProgressTarget(0);
    setGenerationStage('preparing');
    setGenerationStageWithFloor('preparing', 6);

    console.log('[MEAL-PLAN-CLIENT] Invoking generate-meal-plan function...');

    try {
      try {
        const diet = readUserMealPlanProfile();
        const constraintPrompt = buildConstraintPrompt(
          diet.allergies,
          diet.dietaryPreferences,
          diet.allergiesOther,
          diet.healthGoals,
          getStoredLanguage(),
        );
        const previousMealNames = summarizeExistingMealNames(mealPlan);

        setGenerationStageWithFloor('requesting', 14);
        const invokePromise = supabase.functions.invoke('generate-meal-plan', {
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
          },
        });
        setGenerationStageWithFloor('waiting_ai', 18);
        const { data, error } = await invokePromise;

        if (error) {
          console.error('[MEAL-PLAN-CLIENT] Edge Function error:', error);
          const errorMessage = await getEdgeFunctionErrorMessage(error, data as { error?: string; message?: string } | null);
          throw new Error(errorMessage);
        }

        console.log('[MEAL-PLAN-CLIENT] Successfully received data:', data ? 'yes' : 'no');
        setGenerationStageWithFloor('processing', 72);

        if (Array.isArray((data as any)?.mealPlan) && (data as any).mealPlan.length > 0) {
          const rawPlan = (data as any).mealPlan;
          const newPlan = syncMealPlanToTargets(rawPlan, macroTargets);
          const newShoppingList = (data as any).shoppingList || [];
          const unsafeMeals = findUnsafeMeals(newPlan, diet);
          updateGenerationProgressTarget(80);

          if (unsafeMeals.length > 0) {
            console.error('[MEAL-PLAN-SAFETY] Unsafe meals returned:', unsafeMeals);
            throw new Error(
              `Der generierte Plan enthält Zutaten, die nicht zu deinen Allergien/Unverträglichkeiten passen: ${unsafeMeals
                .slice(0, 3)
                .join('; ')}. Bitte Plan erneut generieren.`,
            );
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
            return { day: day.day, calories: totalCals, meets_target: totalCals === macroTargets.dailyCalories };
          });
          const avgCalories = dailyCalorieAnalysis.reduce((sum: number, d: any) => sum + d.calories, 0) / dailyCalorieAnalysis.length;
          console.log('[MEAL-PLAN] Daily calorie analysis:', {
            analysis: dailyCalorieAnalysis,
            avgCalories: Math.round(avgCalories),
            avgPercentage: Math.round((avgCalories / macroTargets.dailyCalories) * 100)
          });

          setMealPlan(newPlan);
          setShoppingList(newShoppingList);
          localStorage.removeItem(SHOPPING_CHECKED_NAMES_KEY);
          removeMealPlanShoppingSource();
          localStorage.setItem('weeklyMealPlan', JSON.stringify(newPlan));
          localStorage.setItem('weeklyShoppingList', JSON.stringify(newShoppingList));
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
              ? ui.generatedDescWithFridge(settings.dailyCalories)
              : ui.generatedDescWithoutFridge
          });
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

      if (message.includes('plan_limit_exceeded')) {
        // Refresh count from server just in case
        await refreshGenerationCount();

        toast({
          title: ui.genericErrorTitle,
          description: ui.genericErrorDesc,
          variant: 'destructive',
        });
      } else if (message.includes('Load failed') || message.includes('Failed to fetch')) {
        toast({
          title: ui.connectionErrorTitle,
          description: ui.connectionErrorDesc,
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
      setIsGenerating(false);
      setIsMinimized(false);
    }
  }, [session, refreshGenerationCount, isPremium, checkSubscription, updateGenerationProgressTarget, mealPlan]);

  const setMinimized = useCallback((minimized: boolean) => {
    setIsMinimized(minimized);
  }, []);

  const clearMealPlan = useCallback(async () => {
    setMealPlan(null);
    setShoppingList(null);
    localStorage.removeItem('weeklyMealPlan');
    localStorage.removeItem('weeklyShoppingList');
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
        onMinimize={() => setIsMinimized(true)}
      />
    </MealPlanContext.Provider>
  );
};
