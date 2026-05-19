import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TrackerSettings {
  age: number;
  weight: number;
  targetWeight: number;
  goalMode: 'lose' | 'gain';
  weeklyGoal: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  mealsPerDay: number;
}

const LOCAL_STORAGE_KEY = 'userProfile';

export const useTrackerSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TrackerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  // Parse database row to settings
  const parseDbSettings = (data: any): TrackerSettings => ({
    age: data.age || 0,
    weight: data.weight || 0,
    targetWeight: data.target_weight || 0,
    goalMode: (data.goal_mode as 'lose' | 'gain') || 'lose',
    weeklyGoal: data.weekly_goal || 0.5,
    dailyCalories: data.daily_calories || 0,
    dailyProtein: data.daily_protein || 0,
    dailyCarbs: data.daily_carbs || 0,
    dailyFat: data.daily_fat || 0,
    mealsPerDay: data.meals_per_day || 5,
  });

  // Save to database
  const saveToDatabase = async (data: TrackerSettings) => {
    if (!user) return;

    const dbData = {
      user_id: user.id,
      age: data.age,
      weight: data.weight,
      target_weight: data.targetWeight,
      goal_mode: data.goalMode,
      weekly_goal: data.weeklyGoal,
      daily_calories: data.dailyCalories,
      daily_protein: data.dailyProtein,
      daily_carbs: data.dailyCarbs,
      daily_fat: data.dailyFat,
      meals_per_day: data.mealsPerDay,
    };

    const { error } = await supabase
      .from('user_tracker_settings')
      .upsert(dbData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving tracker settings to database:', error.message || JSON.stringify(error));
    }
  };

  const applyLocalStorageFallback = async () => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        setIsConfigured(parsed.dailyCalories > 0);

        if (user && parsed.dailyCalories > 0) {
          await saveToDatabase(parsed);
        }
        return;
      } catch {
        setSettings(null);
        setIsConfigured(false);
        return;
      }
    }
    setSettings(null);
    setIsConfigured(false);
  };

  // Load settings from database or localStorage
  const loadSettings = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedOnceRef.current) {
      setLoading(true);
    }

    try {
      if (user) {
        const { data, error } = await supabase
          .from('user_tracker_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data && !error) {
          const dbSettings = parseDbSettings(data);
          let merged = dbSettings as TrackerSettings & Record<string, unknown>;
          try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
              merged = { ...JSON.parse(stored), ...dbSettings };
            }
            const onboardingRaw = localStorage.getItem('onboardingUserData');
            if (onboardingRaw) {
              const onboarding = JSON.parse(onboardingRaw);
              if (!merged.dietaryPreferences?.length && onboarding.dietaryPreferences?.length) {
                merged.dietaryPreferences = onboarding.dietaryPreferences;
              }
              if (!merged.healthGoals?.length && onboarding.healthGoals?.length) {
                merged.healthGoals = onboarding.healthGoals;
              }
              if (!merged.allergies?.length && onboarding.allergies?.length) {
                merged.allergies = onboarding.allergies;
              }
              if (!merged.allergiesOther && onboarding.allergiesOther) {
                merged.allergiesOther = onboarding.allergiesOther;
              }
            }
          } catch {
            /* keep dbSettings only */
          }
          setSettings(merged);
          setIsConfigured(merged.dailyCalories > 0);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          return;
        }
      }

      await applyLocalStorageFallback();
    } catch (error) {
      console.error('Error loading tracker settings:', error);
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings(parsed);
          setIsConfigured(parsed.dailyCalories > 0);
        } catch {
          setSettings(null);
          setIsConfigured(false);
        }
      }
    } finally {
      hasLoadedOnceRef.current = true;
      setLoading(false);
    }
  }, [user]);

  // Save settings
  const saveSettings = useCallback(async (newSettings: TrackerSettings) => {
    setSettings(newSettings);
    setIsConfigured(newSettings.dailyCalories > 0);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));

    if (user) {
      await saveToDatabase(newSettings);
    }
  }, [user]);

  // Reset settings
  const resetSettings = useCallback(async () => {
    setSettings(null);
    setIsConfigured(false);
    hasLoadedOnceRef.current = false;
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    if (user) {
      await supabase
        .from('user_tracker_settings')
        .delete()
        .eq('user_id', user.id);
    }
  }, [user]);

  useEffect(() => {
    hasLoadedOnceRef.current = false;
    void loadSettings(false);
  }, [loadSettings]);

  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      void loadSettings(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, loadSettings]);

  return {
    settings,
    loading,
    isConfigured,
    saveSettings,
    resetSettings,
    reloadSettings: () => loadSettings(true),
  };
};
