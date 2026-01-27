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
        console.error('Error loading weekly meal plan:', error);
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

      if (error) {
        throw new Error(error.message || 'Fehler bei der Generierung');
      }

      if (Array.isArray((data as any)?.mealPlan) && (data as any).mealPlan.length > 0) {
        const newPlan = (data as any).mealPlan;
        setMealPlan(newPlan);
        localStorage.setItem('weeklyMealPlan', JSON.stringify(newPlan));

        // Persist for this user so it never auto-regenerates after login
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

        toast({
          title: '✅ Wochenplan generiert!',
          description: `Plan mit ${settings.dailyCalories} kcal pro Tag`
        });
        return true;
      } else {
        throw new Error('Leerer Wochenplan erhalten');
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
      } else {
        toast({
          title: 'Fehler',
          description: message,
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
