import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
}

const LOCAL_STORAGE_KEY = 'userProfile';

export const useTrackerSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TrackerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

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
  });

  // Load settings from database or localStorage
  const loadSettings = useCallback(async () => {
    setLoading(true);
    
    try {
      if (user) {
        // Try to load from database first
        const { data, error } = await supabase
          .from('user_tracker_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data && !error) {
          const dbSettings = parseDbSettings(data);
          
          setSettings(dbSettings);
          setIsConfigured(dbSettings.dailyCalories > 0);
          
          // Also sync to localStorage for offline access
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbSettings));
          
          setLoading(false);
          return;
        }
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings(parsed);
          setIsConfigured(parsed.dailyCalories > 0);
          
          // If user is logged in and has localStorage data but no DB data, migrate it
          if (user && parsed.dailyCalories > 0) {
            await saveToDatabase(parsed);
          }
        } catch {
          setSettings(null);
          setIsConfigured(false);
        }
      } else {
        setSettings(null);
        setIsConfigured(false);
      }
    } catch (error) {
      console.error('Error loading tracker settings:', error);
      // Fallback to localStorage on error
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
    }
    
    setLoading(false);
  }, [user]);

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
    };

    const { error } = await supabase
      .from('user_tracker_settings')
      .upsert(dbData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving tracker settings to database:', error);
    }
  };

  // Save settings
  const saveSettings = useCallback(async (newSettings: TrackerSettings) => {
    setSettings(newSettings);
    setIsConfigured(newSettings.dailyCalories > 0);
    
    // Always save to localStorage for quick access
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
    
    // If user is logged in, also save to database
    if (user) {
      await saveToDatabase(newSettings);
    }
  }, [user]);

  // Reset settings
  const resetSettings = useCallback(async () => {
    setSettings(null);
    setIsConfigured(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    if (user) {
      await supabase
        .from('user_tracker_settings')
        .delete()
        .eq('user_id', user.id);
    }
  }, [user]);

  // Load on mount and when user changes
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Note: Real-time subscriptions disabled due to Supabase binding mismatch issues
  // Data is loaded from DB on mount and can be manually refreshed
  // This approach is stable and doesn't require real-time capabilities

  return {
    settings,
    loading,
    isConfigured,
    saveSettings,
    resetSettings,
    reloadSettings: loadSettings,
  };
};
