import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

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

interface MealPlanContextType {
  isGenerating: boolean;
  isMinimized: boolean;
  elapsedSeconds: number;
  mealPlan: DayPlan[] | null;
  generateMealPlan: (settings: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
  }) => Promise<boolean>;
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
  const { session } = useAuth();
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const generateMealPlan = useCallback(async (settings: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
  }): Promise<boolean> => {
    if (!session) {
      toast({ title: 'Nicht eingeloggt', variant: 'destructive' });
      return false;
    }

    setIsGenerating(true);
    setIsMinimized(false);

    try {
      // Add timeout for Edge Function call - increased to 180 seconds for faster generation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 second timeout

      try {
        const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: {
            preferences: '',
            dailyCalories: settings.dailyCalories,
            dailyProtein: settings.dailyProtein,
            dailyCarbs: settings.dailyCarbs,
            dailyFat: settings.dailyFat
          },
        });

        clearTimeout(timeoutId);

        if (error) {
          console.error('Edge Function error:', error);
          throw new Error(error.message || 'Fehler bei der Generierung');
        }

        if (Array.isArray((data as any)?.mealPlan) && (data as any).mealPlan.length > 0) {
          const newPlan = (data as any).mealPlan;
          setMealPlan(newPlan);
          localStorage.setItem('weeklyMealPlan', JSON.stringify(newPlan));

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

          toast({
            title: '✅ Wochenplan generiert!',
            description: `Plan mit ${settings.dailyCalories} kcal pro Tag`
          });
          return true;
        } else {
          throw new Error('Leerer Wochenplan erhalten');
        }
      } catch (innerError) {
        clearTimeout(timeoutId);

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
      console.error('Error generating meal plan:', message);

      if (message.includes('plan_limit_exceeded')) {
        toast({
          title: "Limit erreicht",
          description: "Upgrade auf Premium für unbegrenzte Pläne!",
          variant: 'destructive',
        });
      } else if (message.includes('Netzwerkverbindung') || message.includes('Failed to send')) {
        toast({
          title: 'Verbindungsfehler',
          description: 'Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
          variant: 'destructive',
        });
      } else if (message.includes('zu lange')) {
        toast({
          title: 'Zeitüberschreitung',
          description: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es später erneut.',
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
  }, [session]);

  const setMinimized = useCallback((minimized: boolean) => {
    setIsMinimized(minimized);
  }, []);

  const clearMealPlan = useCallback(() => {
    setMealPlan(null);
    localStorage.removeItem('weeklyMealPlan');

    // Best-effort: also clear persisted plan for the logged in user
    if (session?.user?.id) {
      supabase.from('weekly_meal_plans').delete().eq('user_id', session.user.id);
    }
  }, [session?.user?.id]);

  return (
    <MealPlanContext.Provider value={{
      isGenerating,
      isMinimized,
      elapsedSeconds,
      mealPlan,
      generateMealPlan,
      setMinimized,
      clearMealPlan,
    }}>
      {children}
    </MealPlanContext.Provider>
  );
};
