import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { removeMealPlanShoppingSource, setMealPlanShoppingSource } from '@/lib/mealPlanSource';
import { FRIGY_STORAGE_UPDATED, WEEKLY_PLAN_AI_GENERATED_KEY, notifyFrigyStorageUpdated } from '@/lib/frigyStorageSync';
import { isSubscriptionActive } from '@/lib/subscription';
import {
  buildGermanConstraintPrompt,
  findMealSafetyViolations,
  readUserMealPlanProfile,
  type UserMealPlanProfile,
} from '@/lib/mealAllergySafety';
import { SHOPPING_CHECKED_NAMES_KEY } from '@/lib/shoppingSync';

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
  const { session, isPremium, checkSubscription } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
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

  // Helper to get start of current week (Monday) in YYYY-MM-DD
  const getWeekStart = (): string => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

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
    if (!session) {
      toast({ title: 'Nicht eingeloggt', variant: 'destructive' });
      return false;
    }

    setIsGenerating(true);
    setIsMinimized(false);

    console.log('[MEAL-PLAN-CLIENT] Clearing old meal plan before generation...');

    // Clear old plan from localStorage and Supabase
    localStorage.removeItem('weeklyMealPlan');
    localStorage.removeItem('weeklyShoppingList');
    localStorage.removeItem(SHOPPING_CHECKED_NAMES_KEY);
    removeMealPlanShoppingSource();
    notifyFrigyStorageUpdated();
    if (session?.user?.id) {
      try {
        await supabase.from('weekly_meal_plans').delete().eq('user_id', session.user.id);
        console.log('[MEAL-PLAN-CLIENT] Cleared old plan from Supabase');
      } catch (error) {
        console.warn('[MEAL-PLAN-CLIENT] Warning: Could not clear old plan:', error);
      }
    }

    console.log('[MEAL-PLAN-CLIENT] Invoking generate-meal-plan function...');

    try {
      try {
        const diet = readUserMealPlanProfile();
        const constraintPrompt = buildGermanConstraintPrompt(
          diet.allergies,
          diet.dietaryPreferences,
          diet.allergiesOther,
          diet.healthGoals,
        );

        const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
          body: {
            preferences: '',
            dailyCalories: settings.dailyCalories,
            dailyProtein: settings.dailyProtein,
            dailyCarbs: settings.dailyCarbs,
            dailyFat: settings.dailyFat,
            mealsPerDay: settings.mealsPerDay || 5,
            allergies: diet.allergies,
            allergiesOther: diet.allergiesOther,
            dietaryPreferences: diet.dietaryPreferences,
            healthGoals: diet.healthGoals,
            constraintPrompt,
            fridgeIngredients: options?.fridgeIngredients ?? [],
          },
        });

        if (error) {
          console.error('[MEAL-PLAN-CLIENT] Edge Function error:', error);

          let errorMessage = 'Wochenplan konnte nicht generiert werden.';

          // Better extraction for Supabase FunctionsHttpError
          if (error instanceof Error) {
            errorMessage = error.message;
          }

          const context = (error as any).context;
          if (context) {
            try {
              // Try to get structured error from response body
              const clonedResponse = context.clone();
              const responseText = await clonedResponse.text();
              console.log('[MEAL-PLAN-CLIENT] Response body:', responseText);

              if (responseText) {
                try {
                  const parsed = JSON.parse(responseText);
                  errorMessage = parsed.error || parsed.message || errorMessage;
                } catch (jsonErr) {
                  // Not JSON, just use text
                  if (responseText.length < 200) errorMessage = responseText;
                }
              }
            } catch (contextErr) {
              console.error('[MEAL-PLAN-CLIENT] Error reading context:', contextErr);
            }
          } else if ((error as any).message) {
            errorMessage = (error as any).message;
          }

          throw new Error(errorMessage);
        }

        console.log('[MEAL-PLAN-CLIENT] Successfully received data:', data ? 'yes' : 'no');

        if (Array.isArray((data as any)?.mealPlan) && (data as any).mealPlan.length > 0) {
          const newPlan = (data as any).mealPlan;
          const newShoppingList = (data as any).shoppingList || [];
          const unsafeMeals = findUnsafeMeals(newPlan, diet);

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
            return { day: day.day, calories: totalCals, meets_target: totalCals >= settings.dailyCalories * 0.85 };
          });
          const avgCalories = dailyCalorieAnalysis.reduce((sum: number, d: any) => sum + d.calories, 0) / dailyCalorieAnalysis.length;
          console.log('[MEAL-PLAN] Daily calorie analysis:', {
            analysis: dailyCalorieAnalysis,
            avgCalories: Math.round(avgCalories),
            avgPercentage: Math.round((avgCalories / settings.dailyCalories) * 100)
          });

          setMealPlan(newPlan);
          setShoppingList(newShoppingList);
          localStorage.setItem('weeklyMealPlan', JSON.stringify(newPlan));
          localStorage.setItem('weeklyShoppingList', JSON.stringify(newShoppingList));
          localStorage.setItem(WEEKLY_PLAN_AI_GENERATED_KEY, '1');
          setMealPlanShoppingSource('frigy');

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

          // Refresh generation count from server after successful generation
          await refreshGenerationCount();

          notifyFrigyStorageUpdated();

          toast({
            title: '✅ Wochenplan generiert!',
            description: options?.fridgeIngredients?.length
              ? `Plan mit ${settings.dailyCalories} kcal pro Tag`
              : 'Scanne jetzt deinen Kühlschrank, damit Frigy prüft, was du hast und was auf die Einkaufsliste muss.'
          });
          return true;
        } else {
          throw new Error('Leerer Wochenplan erhalten');
        }
      } catch (innerError) {
        // Better error handling for network issues
        if (innerError instanceof Error && innerError.message.includes('AbortError')) {
          throw new Error('Anfrage hat zu lange gedauert. Bitte versuchen Sie es später erneut.');
        }

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
          title: "Wochenplan konnte nicht generiert werden",
          description: "Bitte versuche es gleich erneut.",
          variant: 'destructive',
        });
      } else if (message.includes('Load failed') || message.includes('Failed to fetch')) {
        toast({
          title: 'Verbindungsfehler',
          description: 'Die Verbindung zur Edge Function konnte nicht hergestellt werden. Bitte prüfe die SUPABASE_URL in den Einstellungen.',
          variant: 'destructive',
        });
      } else if (message.includes('zu lange')) {
        toast({
          title: 'Zeitüberschreitung',
          description: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es später erneut.',
          variant: 'destructive',
        });
      } else if (message.includes('calorie') || message.includes('Kalorie')) {
        toast({
          title: 'Kalorienziel nicht erreicht',
          description: 'Der generierte Plan erfüllt Ihr Kalorienziel nicht. Bitte versuchen Sie es erneut oder überprüfen Sie Ihre Einstellungen.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Fehler',
          description: message || 'Wochenplan konnte nicht generiert werden.',
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      setIsGenerating(false);
      setIsMinimized(false);
    }
  }, [session, refreshGenerationCount, isPremium, checkSubscription]);

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
      mealPlan,
      shoppingList,
      generationCount,
      refreshGenerationCount,
      generateMealPlan,
      setMinimized,
      clearMealPlan,
    }}>
      {children}
    </MealPlanContext.Provider>
  );
};
