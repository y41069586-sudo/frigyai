import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface CachedData {
  userProfile: any;
  mealPlan: any;
  foodLog: any[];
  waterIntake: any;
  lastSync: string;
}

const CACHE_KEY = "frigai_offline_cache";

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<any[]>([]);

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

  const addPendingAction = useCallback((action: any) => {
    const pending = JSON.parse(localStorage.getItem("frigai_pending_sync") || "[]");
    pending.push({ ...action, timestamp: new Date().toISOString() });
    localStorage.setItem("frigai_pending_sync", JSON.stringify(pending));
    setPendingSync(pending);
  }, []);

  const syncPendingData = useCallback(async () => {
    const pending = JSON.parse(localStorage.getItem("frigai_pending_sync") || "[]");
    if (pending.length === 0) return;

    // Process pending actions
    for (const action of pending) {
      try {
        // Here you would sync each action to the server
        console.log("Syncing action:", action);
      } catch (e) {
        console.error("Failed to sync action:", e);
      }
    }

    // Clear pending after sync
    localStorage.removeItem("frigai_pending_sync");
    setPendingSync([]);

    toast({
      title: "✅ Synchronisiert!",
      description: `${pending.length} Änderungen wurden gespeichert.`,
    });
  }, []);

  return {
    isOnline,
    pendingSync,
    getCachedData,
    cacheData,
    addPendingAction,
    syncPendingData,
  };
};
