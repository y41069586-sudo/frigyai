import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { mergeMacroTargetsFromLocal, readOnboardingMacroTargets, readStoredTrackerTargets } from '@/lib/trackerTargets';
import { notifyTrackerSettingsUpdated } from '@/lib/frigyStorageSync';

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
  dietaryPreferences?: string[];
  healthGoals?: string[];
  allergies?: string[];
  allergiesOther?: string;
}

const LOCAL_STORAGE_KEY = 'userProfile';
const PERSISTED_USER_CACHE_KEY = 'frigy_tracker_settings_cache';

type PersistedTrackerCache = {
  userId: string;
  settings: TrackerSettings;
  updatedAt: number;
};

type TrackerCacheEntry = {
  userId: string;
  settings: TrackerSettings | null;
  isConfigured: boolean;
};

let trackerMemoryCache: TrackerCacheEntry | null = null;
let trackerLoadInflight: Promise<void> | null = null;
let trackerLoadInflightUserId: string | null = null;

/** Call after onboarding saves userProfile so dashboard does not flash stale DB macros. */
export function invalidateTrackerSettingsCache(): void {
  trackerMemoryCache = null;
  trackerLoadInflight = null;
  trackerLoadInflightUserId = null;
}

function readPersistedTrackerCache(userId: string | undefined): TrackerSettings | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(PERSISTED_USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTrackerCache;
    if (parsed.userId !== userId || !parsed.settings?.dailyCalories) return null;
    return parsed.settings;
  } catch {
    return null;
  }
}

function writePersistedTrackerCache(userId: string, settings: TrackerSettings): void {
  if (!settings.dailyCalories) return;
  try {
    const payload: PersistedTrackerCache = {
      userId,
      settings,
      updatedAt: Date.now(),
    };
    localStorage.setItem(PERSISTED_USER_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function clearPersistedTrackerCache(): void {
  try {
    localStorage.removeItem(PERSISTED_USER_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

function readLocalTrackerSettings(): TrackerSettings | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as TrackerSettings;
  } catch {
    return null;
  }
}

function mergeTrackerSettings(
  base: TrackerSettings | null | undefined,
  patch: Partial<TrackerSettings>,
): TrackerSettings {
  const local = readLocalTrackerSettings();
  const seed = base ?? local;
  return {
    age: patch.age ?? seed?.age ?? 0,
    weight: patch.weight ?? seed?.weight ?? 0,
    targetWeight: patch.targetWeight ?? seed?.targetWeight ?? 0,
    goalMode: patch.goalMode ?? seed?.goalMode ?? 'lose',
    weeklyGoal: patch.weeklyGoal ?? seed?.weeklyGoal ?? 0.5,
    dailyCalories: patch.dailyCalories ?? seed?.dailyCalories ?? 0,
    dailyProtein: patch.dailyProtein ?? seed?.dailyProtein ?? 0,
    dailyCarbs: patch.dailyCarbs ?? seed?.dailyCarbs ?? 0,
    dailyFat: patch.dailyFat ?? seed?.dailyFat ?? 0,
    mealsPerDay: patch.mealsPerDay ?? seed?.mealsPerDay ?? 5,
    dietaryPreferences: patch.dietaryPreferences ?? seed?.dietaryPreferences ?? [],
    healthGoals: patch.healthGoals ?? seed?.healthGoals ?? [],
    allergies: patch.allergies ?? seed?.allergies ?? [],
    allergiesOther: patch.allergiesOther ?? seed?.allergiesOther ?? '',
  };
}

function getInitialTrackerState(userId: string | undefined): {
  settings: TrackerSettings | null;
  isConfigured: boolean;
  loading: boolean;
} {
  if (userId && trackerMemoryCache?.userId === userId && trackerMemoryCache.settings) {
    return {
      settings: trackerMemoryCache.settings,
      isConfigured: trackerMemoryCache.isConfigured,
      loading: false,
    };
  }

  if (userId) {
    const persisted = readPersistedTrackerCache(userId);
    if (persisted) {
      return {
        settings: persisted,
        isConfigured: true,
        loading: false,
      };
    }

    const local = readLocalTrackerSettings();
    if (local?.dailyCalories > 0) {
      return {
        settings: local,
        isConfigured: true,
        loading: false,
      };
    }

    return {
      settings: null,
      isConfigured: false,
      loading: true,
    };
  }

  const local = readLocalTrackerSettings();
  if (local?.dailyCalories > 0) {
    return {
      settings: local,
      isConfigured: true,
      loading: false,
    };
  }

  return {
    settings: null,
    isConfigured: false,
    loading: false,
  };
}

function writeTrackerMemoryCache(
  userId: string,
  settings: TrackerSettings | null,
  isConfigured: boolean,
) {
  trackerMemoryCache = { userId, settings, isConfigured };
  if (settings && isConfigured) {
    writePersistedTrackerCache(userId, settings);
  }
}

export const useTrackerSettings = () => {
  const { user } = useAuth();
  const initial = getInitialTrackerState(user?.id);
  const [settings, setSettings] = useState<TrackerSettings | null>(initial.settings);
  const [loading, setLoading] = useState(initial.loading);
  const [isConfigured, setIsConfigured] = useState(initial.isConfigured);
  const hasLoadedOnceRef = useRef(!initial.loading);

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
    dietaryPreferences: Array.isArray(data.dietary_preferences) ? data.dietary_preferences : [],
    healthGoals: Array.isArray(data.health_goals) ? data.health_goals : [],
    allergies: Array.isArray(data.allergies) ? data.allergies : [],
    allergiesOther: typeof data.allergies_other === 'string' ? data.allergies_other : '',
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
      dietary_preferences: data.dietaryPreferences ?? [],
      health_goals: data.healthGoals ?? [],
      allergies: data.allergies ?? [],
      allergies_other: data.allergiesOther ?? '',
    };

    const { error } = await supabase
      .from('user_tracker_settings')
      .upsert(dbData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving tracker settings to database:', error.message || JSON.stringify(error));
    }
  };

  const applyLocalStorageFallback = async () => {
    if (user) {
      const { data: existing } = await supabase
        .from('user_tracker_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing && (existing.daily_calories ?? 0) > 0) {
        const dbSettings = parseDbSettings(existing);
        setSettings(dbSettings);
        setIsConfigured(true);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbSettings));
        writeTrackerMemoryCache(user.id, dbSettings, true);
        return;
      }
    }

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        setIsConfigured(parsed.dailyCalories > 0);
        if (user) {
          writeTrackerMemoryCache(user.id, parsed, parsed.dailyCalories > 0);
        }

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

    const run = async () => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('user_tracker_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data && !error) {
          const dbSettings = parseDbSettings(data);

          // Existing account targets always win over a repeated onboarding run.
          if (dbSettings.dailyCalories > 0) {
            setSettings(dbSettings);
            setIsConfigured(true);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbSettings));
            writeTrackerMemoryCache(user.id, dbSettings, true);
            return;
          }

          let merged = dbSettings as TrackerSettings & Record<string, unknown>;
          try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : null;

            const localMacros =
              readStoredTrackerTargets() ??
              readOnboardingMacroTargets() ??
              (parsed ? mergeMacroTargetsFromLocal({}, parsed) : null);

            if (localMacros) {
              merged = mergeMacroTargetsFromLocal(merged, localMacros);
            }

            if (parsed) {
              merged = {
                ...merged,
                age: merged.age || parsed.age || 0,
                weight: merged.weight || parsed.weight || 0,
                targetWeight: merged.targetWeight || parsed.targetWeight || 0,
                goalMode: merged.goalMode || parsed.goalMode || 'lose',
                weeklyGoal: merged.weeklyGoal || parsed.weeklyGoal || 0.5,
                mealsPerDay: merged.mealsPerDay || parsed.mealsPerDay || 5,
                dietaryPreferences: merged.dietaryPreferences?.length
                  ? merged.dietaryPreferences
                  : parsed.dietaryPreferences,
                healthGoals: merged.healthGoals?.length
                  ? merged.healthGoals
                  : parsed.healthGoals,
                allergies: merged.allergies?.length ? merged.allergies : parsed.allergies,
                allergiesOther: merged.allergiesOther || parsed.allergiesOther || '',
              };
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

          const shouldSyncLocalToDb = merged.dailyCalories > 0;

          setSettings(merged);
          setIsConfigured(merged.dailyCalories > 0);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          writeTrackerMemoryCache(user.id, merged, merged.dailyCalories > 0);
          if (shouldSyncLocalToDb) {
            void saveToDatabase(merged);
          }
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
    };

    if (user && trackerLoadInflight && trackerLoadInflightUserId === user.id) {
      await trackerLoadInflight;
      return;
    }

    if (user) {
      trackerLoadInflightUserId = user.id;
      trackerLoadInflight = run().finally(() => {
        if (trackerLoadInflightUserId === user.id) {
          trackerLoadInflight = null;
          trackerLoadInflightUserId = null;
        }
      });
      await trackerLoadInflight;
      return;
    }

    await run();
  }, [user]);

  // Save settings (merges with existing DB/local values — never wipe diet/allergies on macro edit)
  const saveSettings = useCallback(async (patch: Partial<TrackerSettings> & Pick<TrackerSettings, 'dailyCalories' | 'dailyProtein' | 'dailyCarbs' | 'dailyFat'>) => {
    let merged: TrackerSettings | null = null;
    setSettings((prev) => {
      merged = mergeTrackerSettings(prev, patch);
      setIsConfigured(merged.dailyCalories > 0);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      if (user) {
        writeTrackerMemoryCache(user.id, merged, merged.dailyCalories > 0);
      }
      return merged;
    });

    if (user && merged) {
      await saveToDatabase(merged);
    }
    notifyTrackerSettingsUpdated();
  }, [user]);

  // Reset settings
  const resetSettings = useCallback(async () => {
    setSettings(null);
    setIsConfigured(false);
    hasLoadedOnceRef.current = false;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    clearPersistedTrackerCache();
    if (user) {
      trackerMemoryCache = null;
    }

    if (user) {
      await supabase
        .from('user_tracker_settings')
        .delete()
        .eq('user_id', user.id);
    }
  }, [user]);

  useEffect(() => {
    const hasWarmCache = Boolean(
      user?.id &&
        (trackerMemoryCache?.userId === user.id ||
          readPersistedTrackerCache(user.id) ||
          readLocalTrackerSettings()?.dailyCalories),
    );
    hasLoadedOnceRef.current = hasWarmCache;
    void loadSettings(!hasWarmCache);
  }, [loadSettings, user?.id]);

  useEffect(() => {
    if (!user) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadSettings(true);
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
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
