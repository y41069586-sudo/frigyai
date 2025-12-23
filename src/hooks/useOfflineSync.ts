import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface PendingAction {
  id: string;
  type: 'ADD_FOOD' | 'UPDATE_FOOD' | 'DELETE_FOOD' | 'ADD_WATER' | 'UPDATE_WEIGHT';
  data: any;
  timestamp: number;
}

interface CachedData {
  mealPlan?: any;
  trackerSettings?: any;
  lastSync: string;
}

const CACHE_KEY = 'fridgie_offline_cache';
const PENDING_KEY = 'fridgie_pending_actions';

export const useOfflineSync = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: '🌐 Wieder online', description: 'Daten werden synchronisiert...' });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({ title: '📴 Offline', description: 'Änderungen werden lokal gespeichert.' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending actions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PENDING_KEY);
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading pending actions:', e);
    }
  }, []);

  // Save pending actions to localStorage
  const savePendingActions = useCallback((actions: PendingAction[]) => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(actions));
      setPendingActions(actions);
    } catch (e) {
      console.error('Error saving pending actions:', e);
    }
  }, []);

  // Add a pending action
  const addPendingAction = useCallback((type: PendingAction['type'], data: any) => {
    const action: PendingAction = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now()
    };
    
    const newActions = [...pendingActions, action];
    savePendingActions(newActions);
    
    return action.id;
  }, [pendingActions, savePendingActions]);

  // Process a single pending action
  const processAction = async (action: PendingAction): Promise<boolean> => {
    if (!user) return false;

    try {
      switch (action.type) {
        case 'ADD_FOOD': {
          const { error } = await supabase
            .from('food_entries')
            .insert({
              user_id: user.id,
              ...action.data
            });
          return !error;
        }
        
        case 'UPDATE_FOOD': {
          const { id, ...updates } = action.data;
          const { error } = await supabase
            .from('food_entries')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id);
          return !error;
        }
        
        case 'DELETE_FOOD': {
          const { error } = await supabase
            .from('food_entries')
            .delete()
            .eq('id', action.data.id)
            .eq('user_id', user.id);
          return !error;
        }
        
        case 'ADD_WATER': {
          const { error } = await supabase
            .from('water_intake')
            .upsert({
              user_id: user.id,
              date: action.data.date,
              glasses: action.data.glasses
            }, {
              onConflict: 'user_id,date'
            });
          return !error;
        }
        
        case 'UPDATE_WEIGHT': {
          const { error } = await supabase
            .from('weight_entries')
            .insert({
              user_id: user.id,
              weight: action.data.weight,
              recorded_at: action.data.recorded_at || new Date().toISOString()
            });
          return !error;
        }
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error processing action:', action.type, error);
      return false;
    }
  };

  // Sync all pending actions
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || !user || pendingActions.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const failedActions: PendingAction[] = [];

    for (const action of pendingActions) {
      const success = await processAction(action);
      if (!success) {
        failedActions.push(action);
      }
    }

    savePendingActions(failedActions);
    setIsSyncing(false);

    if (failedActions.length === 0 && pendingActions.length > 0) {
      toast({ title: '✅ Synchronisiert', description: `${pendingActions.length} Änderungen hochgeladen.` });
    } else if (failedActions.length > 0) {
      toast({ 
        title: '⚠️ Teilweise synchronisiert', 
        description: `${failedActions.length} Änderungen konnten nicht hochgeladen werden.`,
        variant: 'destructive'
      });
    }
  }, [isOnline, user, pendingActions, isSyncing, savePendingActions]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [isOnline, pendingActions.length, syncPendingActions]);

  // Cache data for offline use
  const cacheData = useCallback((data: Partial<CachedData>) => {
    try {
      const existing = getCachedData();
      const updated = {
        ...existing,
        ...data,
        lastSync: new Date().toISOString()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error caching data:', e);
    }
  }, []);

  // Get cached data
  const getCachedData = useCallback((): CachedData | null => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error reading cache:', e);
      return null;
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingActions,
    pendingCount: pendingActions.length,
    addPendingAction,
    syncPendingActions,
    cacheData,
    getCachedData
  };
};
