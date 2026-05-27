import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineMode } from "./useOfflineMode";
import { toast } from "@/hooks/use-toast";
import { getLocalDateISO } from "@/lib/localDate";

export const useDataSync = () => {
  const { user, session } = useAuth();
  const { isOnline, cacheData, getCachedData, addPendingAction } = useOfflineMode();

  // Sync user profile to cloud
  const syncUserProfile = useCallback(async () => {
    if (!user || !session || !isOnline) return;

    const localProfile = localStorage.getItem("userProfile");
    if (!localProfile) return;

    try {
      const profile = JSON.parse(localProfile);
      
      // Cache for offline use
      cacheData({ userProfile: profile });
      
      console.log("User profile synced to cache");
    } catch (e) {
      console.error("Failed to sync profile:", e);
    }
  }, [user, session, isOnline, cacheData]);

  // Sync food log
  const syncFoodLog = useCallback(async () => {
    if (!user || !session || !isOnline) return;

    const localLog = localStorage.getItem("foodLog");
    if (!localLog) return;

    try {
      const log = JSON.parse(localLog);
      cacheData({ foodLog: log });
    } catch (e) {
      console.error("Failed to sync food log:", e);
    }
  }, [user, session, isOnline, cacheData]);

  // Load data from cache when offline
  const loadFromCache = useCallback(() => {
    const cached = getCachedData();
    if (!cached) return null;

    return {
      userProfile: cached.userProfile,
      mealPlan: cached.mealPlan,
      foodLog: cached.foodLog,
      waterIntake: cached.waterIntake,
      lastSync: cached.lastSync,
    };
  }, [getCachedData]);

  // Add food entry with offline support
  const addFoodEntry = useCallback(async (entry: any) => {
    // Save locally first
    const localLog = JSON.parse(localStorage.getItem("foodLog") || "[]");
    localLog.push(entry);
    localStorage.setItem("foodLog", JSON.stringify(localLog));

    if (isOnline && user) {
      // Sync immediately if online
      cacheData({ foodLog: localLog });
    } else {
      // Queue for later sync
      addPendingAction({ type: "ADD_FOOD", data: entry });
    }
  }, [isOnline, user, cacheData, addPendingAction]);

  // Add water entry with offline support
  const addWaterEntry = useCallback(async (glasses: number) => {
    const today = getLocalDateISO();
    const localWater = JSON.parse(localStorage.getItem("waterIntake") || "{}");
    localWater[today] = glasses;
    localStorage.setItem("waterIntake", JSON.stringify(localWater));

    if (isOnline && user) {
      cacheData({ waterIntake: localWater });
    } else {
      addPendingAction({ type: "ADD_WATER", data: { date: today, glasses } });
    }
  }, [isOnline, user, cacheData, addPendingAction]);

  // Auto-sync on connection restore
  useEffect(() => {
    if (isOnline && user) {
      syncUserProfile();
      syncFoodLog();
    }
  }, [isOnline, user, syncUserProfile, syncFoodLog]);

  return {
    isOnline,
    syncUserProfile,
    syncFoodLog,
    loadFromCache,
    addFoodEntry,
    addWaterEntry,
  };
};
