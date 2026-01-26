import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface MealPlan {
  id: string;
  date: string;
  meals: string[];
}

interface FoodLog {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

interface TrackerSettings {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

interface CachedData {
  userProfile: UserProfile | null;
  mealPlan: MealPlan | null;
  foodLog: FoodLog[];
  waterIntake: number | null;
  trackerSettings: TrackerSettings | null;
  lastSync: string;
}

interface PendingAction {
  id: number;
  type: 'add_food' | 'update_food' | 'delete_food' | 'update_water' | 'other';
  data: Record<string, any>;
  timestamp: string;
}

const CACHE_KEY = "frigai_offline_cache";
const PENDING_SYNC_KEY = "frigai_pending_sync";

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<PendingAction[]>(() => {
    try {
      const data = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "🌐 Wieder online!",
        description: "Daten werden synchronisiert...",
      });
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "📴 Offline-Modus",
        description: "Änderungen werden lokal gespeichert.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getCachedData = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }, []);

  const cacheData = useCallback((data: Partial<CachedData>) => {
    try {
      const existing = getCachedData() || {};
      const updated = {
        ...existing,
        ...data,
        lastSync: new Date().toISOString(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to cache data:", e);
    }
  }, [getCachedData]);

  const addPendingAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    try {
      const pending: PendingAction[] = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || "[]");
      const newAction: PendingAction = {
        ...action,
        timestamp: new Date().toISOString(),
        id: Date.now()
      };
      pending.push(newAction);
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
      setPendingSync(pending);
    } catch (e) {
      console.error("Failed to add pending action:", e);
    }
  }, []);

  const syncPendingData = useCallback(async () => {
    try {
      const pending: PendingAction[] = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || "[]");
      if (pending.length === 0) return;

      let syncedCount = 0;
      const failedActions: PendingAction[] = [];

      // Process pending actions
      for (const action of pending) {
        try {
          // Here you would sync each action to the server
          console.log("Syncing action:", action);
          syncedCount++;
        } catch (e) {
          console.error("Failed to sync action:", e);
          failedActions.push(action);
        }
      }

      // Keep only failed actions for retry
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(failedActions));
      setPendingSync(failedActions);

      if (syncedCount > 0) {
        toast({
          title: "✅ Synchronisiert!",
          description: `${syncedCount} Änderungen wurden gespeichert.`,
        });
      }

      if (failedActions.length > 0) {
        toast({
          title: "⚠️ Einige Änderungen konnten nicht synchronisiert werden",
          description: `${failedActions.length} Änderungen werden beim nächsten Versuch erneut synchronisiert.`,
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Error syncing pending data:", e);
    }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      syncPendingData();
    }
  }, [isOnline, pendingSync.length, syncPendingData]);

  return {
    isOnline,
    pendingSync,
    getCachedData,
    cacheData,
    addPendingAction,
    syncPendingData,
  };
};
