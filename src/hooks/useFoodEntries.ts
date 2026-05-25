import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getStoredLanguage, getTranslations } from '@/contexts/LanguageContext';
import { getLocalDateISO, getLocalDateString } from '@/lib/localDate';
import { notifyFrigyStorageUpdated } from '@/lib/frigyStorageSync';
import { getPublicErrorMessage } from '@/lib/publicErrorMessage';

export interface FoodEntry {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion?: string;
  meal_type?: string;
  date: string;
  created_at: string;
  image_url?: string;
}

export const useFoodEntries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayTotals, setTodayTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [today, setToday] = useState(() => getLocalDateISO());

  const notifyFoodEntriesChanged = useCallback(() => {
    if (typeof window === 'undefined' || !user) return;
    window.dispatchEvent(new CustomEvent('foodEntryAdded', {
      detail: { timestamp: Date.now(), userId: user.id }
    }));
  }, [user]);

  const syncTodayFoodCache = useCallback((nextEntries: FoodEntry[], date: string) => {
    if (typeof window === 'undefined') return;
    if (date !== getLocalDateISO()) return;

    localStorage.setItem('todayFood', JSON.stringify({
      date: getLocalDateString(),
      entries: nextEntries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        calories: Number(entry.calories) || 0,
        protein: Number(entry.protein) || 0,
        carbs: Number(entry.carbs) || 0,
        fat: Number(entry.fat) || 0,
        portion: entry.portion,
        meal_type: entry.meal_type,
        image_url: entry.image_url,
        created_at: entry.created_at,
        time: new Date(entry.created_at).toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
    }));
    notifyFrigyStorageUpdated();
  }, []);

  useEffect(() => {
    const refreshToday = () => {
      const next = getLocalDateISO();
      setToday((prev) => (prev === next ? prev : next));
    };
    refreshToday();
    const interval = setInterval(refreshToday, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshToday();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const updateDailyMacros = useCallback(async (totals: typeof todayTotals, date = today) => {
    if (!user) return;

    try {
      const macroData = {
        user_id: user.id,
        date,
        calories: Math.max(0, Math.round(totals.calories)),
        protein: Math.max(0, Math.round(totals.protein)),
        carbs: Math.max(0, Math.round(totals.carbs)),
        fat: Math.max(0, Math.round(totals.fat)),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('daily_macros')
        .upsert([macroData], {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.warn('[DAILY-MACROS] Error updating:', error?.message || error);
      }
    } catch (error: unknown) {
      console.warn('[DAILY-MACROS] Unexpected error:', error);
    }
  }, [user, today]);

  const loadEntries = useCallback(async (date?: string) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const targetDate = date || today;
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', targetDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []).map(entry => ({
        ...entry,
        protein: Number(entry.protein),
        carbs: Number(entry.carbs),
        fat: Number(entry.fat)
      }));

      setEntries(typedData);

      const totals = typedData.reduce((acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      setTodayTotals(totals);
      syncTodayFoodCache(typedData, targetDate);

      try {
        await updateDailyMacros(totals, targetDate);
      } catch (macroError) {
        console.warn('[FOOD-ENTRIES] Failed to sync daily macros during load:', macroError);
      }
    } catch (error) {
      console.error('Error loading food entries:', error);
      const lang = getStoredLanguage();
      const tr = getTranslations(lang);
      toast({
        title: tr.error || 'Fehler',
        description: tr.toastFoodLoadFailed || 'Deine Mahlzeitseinträge konnten nicht geladen werden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, today, updateDailyMacros, syncTodayFoodCache]);

  const addEntry = async (entry: Omit<FoodEntry, 'id' | 'user_id' | 'created_at' | 'date'>) => {
    if (!user) {
      toast({
        title: getTranslations(getStoredLanguage()).toastPleaseLogin,
        variant: 'destructive',
      });
      return null;
    }

    const entryDate = getLocalDateISO();

    try {
      const caloriesValue = Number(entry.calories) || 0;
      const proteinValue = Number(entry.protein) || 0;
      const carbsValue = Number(entry.carbs) || 0;
      const fatValue = Number(entry.fat) || 0;

      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          user_id: user.id,
          name: entry.name,
          calories: caloriesValue,
          protein: proteinValue,
          carbs: carbsValue,
          fat: fatValue,
          portion: entry.portion,
          meal_type: entry.meal_type,
          image_url: entry.image_url,
          date: entryDate
        })
        .select()
        .single();

      if (error) throw error;

      const typedEntry = {
        ...data,
        protein: Number(data.protein),
        carbs: Number(data.carbs),
        fat: Number(data.fat)
      };

      if (entryDate === today) {
        let nextEntries: FoodEntry[] = [];
        setEntries(prev => {
          nextEntries = [typedEntry, ...prev];
          return nextEntries;
        });
        syncTodayFoodCache(nextEntries, entryDate);
        setTodayTotals(prev => {
          const newTotals = {
            calories: prev.calories + typedEntry.calories,
            protein: prev.protein + typedEntry.protein,
            carbs: prev.carbs + typedEntry.carbs,
            fat: prev.fat + typedEntry.fat
          };
          void updateDailyMacros(newTotals, entryDate);
          return newTotals;
        });
      } else {
        await loadEntries(entryDate);
      }

      notifyFoodEntriesChanged();

      return typedEntry;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error adding food entry:', errorMessage);
      toast({
        title: 'Fehler beim Speichern',
        description: getPublicErrorMessage(errorMessage, 'Das Essen konnte gerade nicht gespeichert werden. Bitte versuche es erneut.'),
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateEntry = async (id: string, updates: Partial<Omit<FoodEntry, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('food_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadEntries();
      notifyFoodEntriesChanged();
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Update fehlgeschlagen';
      toast({
        title: 'Fehler beim Aktualisieren',
        description: getPublicErrorMessage(msg, 'Der Eintrag konnte gerade nicht aktualisiert werden. Bitte versuche es erneut.'),
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return false;

    try {
      const entry = entries.find(e => e.id === id);

      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      let nextEntries: FoodEntry[] = [];
      setEntries(prev => {
        nextEntries = prev.filter(e => e.id !== id);
        return nextEntries;
      });
      syncTodayFoodCache(nextEntries, today);

      if (entry) {
        setTodayTotals(prev => {
          const newTotals = {
            calories: Math.max(0, prev.calories - entry.calories),
            protein: Math.max(0, prev.protein - entry.protein),
            carbs: Math.max(0, prev.carbs - entry.carbs),
            fat: Math.max(0, prev.fat - entry.fat)
          };
          void updateDailyMacros(newTotals);
          return newTotals;
        });
      }

      notifyFoodEntriesChanged();
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Löschen fehlgeschlagen';
      toast({
        title: 'Fehler beim Löschen',
        description: getPublicErrorMessage(msg, 'Der Eintrag konnte gerade nicht gelöscht werden. Bitte versuche es erneut.'),
        variant: 'destructive'
      });
      return false;
    }
  };

  const clearToday = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('date', today);

      if (error) throw error;

      setEntries([]);
      const emptyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      setTodayTotals(emptyTotals);
      syncTodayFoodCache([], today);
      await updateDailyMacros(emptyTotals);

      notifyFoodEntriesChanged();
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Löschen fehlgeschlagen';
      toast({
        title: 'Fehler beim Löschen',
        description: getPublicErrorMessage(msg, 'Die Einträge konnten gerade nicht gelöscht werden. Bitte versuche es erneut.'),
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      loadEntries();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, loadEntries]);

  useEffect(() => {
    const handleFoodEntryAdded = () => {
      loadEntries();
    };

    window.addEventListener('foodEntryAdded', handleFoodEntryAdded);
    return () => window.removeEventListener('foodEntryAdded', handleFoodEntryAdded);
  }, [loadEntries]);

  return {
    entries,
    loading,
    todayTotals,
    today,
    addEntry,
    updateEntry,
    deleteEntry,
    clearToday,
    refreshEntries: loadEntries
  };
};
