import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getStoredLanguage, getTranslations } from '@/contexts/LanguageContext';
import { getLocalDateISO, getLocalDateString } from '@/lib/localDate';
import { getStoredAppLocale } from '@/lib/mealPlanLanguage';
import { normalizeMealTypeForSave } from '@/lib/mealFocus';
import { notifyFrigyStorageUpdated } from '@/lib/frigyStorageSync';
import { getPublicErrorMessage } from '@/lib/publicErrorMessage';

function getFoodEntryErrorCopy() {
  const lang = getStoredLanguage();
  if (lang === 'fr') {
    return {
      saveTitle: 'Erreur lors de l enregistrement',
      saveFallback: 'Le repas n a pas pu etre enregistre pour le moment. Reessaie.',
      updateTitle: 'Erreur lors de la mise a jour',
      updateFallback: 'L entree n a pas pu etre mise a jour pour le moment. Reessaie.',
      deleteTitle: 'Erreur lors de la suppression',
      deleteFallback: 'L entree n a pas pu etre supprimee pour le moment. Reessaie.',
      clearFallback: 'Les entrees n ont pas pu etre supprimees pour le moment. Reessaie.',
    };
  }
  if (lang === 'en') {
    return {
      saveTitle: 'Error while saving',
      saveFallback: 'The meal could not be saved right now. Please try again.',
      updateTitle: 'Error while updating',
      updateFallback: 'The entry could not be updated right now. Please try again.',
      deleteTitle: 'Error while deleting',
      deleteFallback: 'The entry could not be deleted right now. Please try again.',
      clearFallback: 'The entries could not be deleted right now. Please try again.',
    };
  }
  return {
    saveTitle: 'Fehler beim Speichern',
    saveFallback: 'Das Essen konnte gerade nicht gespeichert werden. Bitte versuche es erneut.',
    updateTitle: 'Fehler beim Aktualisieren',
    updateFallback: 'Der Eintrag konnte gerade nicht aktualisiert werden. Bitte versuche es erneut.',
    deleteTitle: 'Fehler beim Löschen',
    deleteFallback: 'Der Eintrag konnte gerade nicht gelöscht werden. Bitte versuche es erneut.',
    clearFallback: 'Die Einträge konnten gerade nicht gelöscht werden. Bitte versuche es erneut.',
  };
}

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

type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const EMPTY_TOTALS: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

type CachedTodayFoodEntry = {
  id?: string;
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portion?: string;
  meal_type?: string;
  image_url?: string;
  created_at?: string;
};

/** Patch a single cached food row so dashboard totals update before DB reload. */
export function patchTodayFoodCacheEntry(
  entryId: string,
  patch: Partial<Pick<FoodEntry, 'name' | 'calories' | 'protein' | 'carbs' | 'fat'>>,
): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('todayFood');
    if (!saved) return;
    const data = JSON.parse(saved) as { date?: string; entries?: CachedTodayFoodEntry[] };
    if (data.date !== getLocalDateString() || !Array.isArray(data.entries)) return;

    data.entries = data.entries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            ...patch,
            calories: patch.calories ?? entry.calories,
            protein: patch.protein ?? entry.protein,
            carbs: patch.carbs ?? entry.carbs,
            fat: patch.fat ?? entry.fat,
            name: patch.name ?? entry.name,
          }
        : entry,
    );
    localStorage.setItem('todayFood', JSON.stringify(data));
    notifyFrigyStorageUpdated();
  } catch {
    /* ignore */
  }
}

/** Hydrate dashboard from localStorage so cold start does not flash 0 kcal. */
export function readTodayFoodCache(): { entries: FoodEntry[]; todayTotals: MacroTotals; hasCache: boolean } {
  try {
    const saved = localStorage.getItem('todayFood');
    if (!saved) return { entries: [], todayTotals: EMPTY_TOTALS, hasCache: false };

    const data = JSON.parse(saved);
    if (data.date !== getLocalDateString() || !Array.isArray(data.entries)) {
      return { entries: [], todayTotals: EMPTY_TOTALS, hasCache: false };
    }

    const today = getLocalDateISO();
    const entries: FoodEntry[] = data.entries.map((entry: CachedTodayFoodEntry, index: number) => ({
      id: entry.id || `cache-${index}`,
      user_id: '',
      name: entry.name || '',
      calories: Number(entry.calories) || 0,
      protein: Number(entry.protein) || 0,
      carbs: Number(entry.carbs) || 0,
      fat: Number(entry.fat) || 0,
      portion: entry.portion,
      meal_type: entry.meal_type,
      date: today,
      created_at: entry.created_at || new Date().toISOString(),
      image_url: entry.image_url,
    }));

    const todayTotals = entries.reduce<MacroTotals>(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { ...EMPTY_TOTALS },
    );

    return { entries, todayTotals, hasCache: entries.length > 0 || todayTotals.calories > 0 };
  } catch {
    return { entries: [], todayTotals: EMPTY_TOTALS, hasCache: false };
  }
}

const initialFoodState = readTodayFoodCache();

function shouldSkipFoodEntriesLoad(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("onboardingComplete") !== "true";
}

export const useFoodEntries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>(initialFoodState.entries);
  const [loading, setLoading] = useState(!initialFoodState.hasCache);
  const [todayTotals, setTodayTotals] = useState(initialFoodState.todayTotals);
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
        time: new Date(entry.created_at).toLocaleTimeString(getStoredAppLocale(), {
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

    if (shouldSkipFoodEntriesLoad()) {
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
      if (!shouldSkipFoodEntriesLoad()) {
        const lang = getStoredLanguage();
        const tr = getTranslations(lang);
        toast({
          title: tr.error || 'Fehler',
          description: tr.toastFoodLoadFailed || 'Deine Mahlzeitseinträge konnten nicht geladen werden',
          variant: 'destructive'
        });
      }
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
          meal_type: normalizeMealTypeForSave(entry.meal_type),
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
      const copy = getFoodEntryErrorCopy();
      console.error('Error adding food entry:', errorMessage);
      toast({
        title: copy.saveTitle,
        description: getPublicErrorMessage(errorMessage, copy.saveFallback),
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
      const copy = getFoodEntryErrorCopy();
      toast({
        title: copy.updateTitle,
        description: getPublicErrorMessage(msg, copy.updateFallback),
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
      const copy = getFoodEntryErrorCopy();
      toast({
        title: copy.deleteTitle,
        description: getPublicErrorMessage(msg, copy.deleteFallback),
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
      const copy = getFoodEntryErrorCopy();
      toast({
        title: copy.deleteTitle,
        description: getPublicErrorMessage(msg, copy.clearFallback),
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

  const loadEntriesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleFoodEntryAdded = () => {
      if (loadEntriesDebounceRef.current) {
        clearTimeout(loadEntriesDebounceRef.current);
      }
      loadEntriesDebounceRef.current = setTimeout(() => {
        loadEntriesDebounceRef.current = null;
        void loadEntries();
      }, 450);
    };

    window.addEventListener('foodEntryAdded', handleFoodEntryAdded);
    return () => {
      window.removeEventListener('foodEntryAdded', handleFoodEntryAdded);
      if (loadEntriesDebounceRef.current) {
        clearTimeout(loadEntriesDebounceRef.current);
      }
    };
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
