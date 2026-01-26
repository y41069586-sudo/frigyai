import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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

  const today = new Date().toISOString().split('T')[0];

  // Load entries from database
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
      
      // Calculate totals
      const totals = typedData.reduce((acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      setTodayTotals(totals);

      // Also update daily_macros table for dashboard sync
      await updateDailyMacros(totals);
    } catch (error) {
      console.error('Error loading food entries:', error);
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  // Update daily_macros table
  const updateDailyMacros = async (totals: typeof todayTotals) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('daily_macros')
        .upsert({
          user_id: user.id,
          date: today,
          calories: totals.calories,
          protein: Math.round(totals.protein),
          carbs: Math.round(totals.carbs),
          fat: Math.round(totals.fat),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('Error updating daily macros:', error);
      }
    } catch (error) {
      console.error('Error in updateDailyMacros:', error);
    }
  };

  // Add new entry
  const addEntry = async (entry: Omit<FoodEntry, 'id' | 'user_id' | 'created_at' | 'date'>) => {
    if (!user) {
      toast({ title: 'Bitte einloggen', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          user_id: user.id,
          name: entry.name,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          portion: entry.portion,
          meal_type: entry.meal_type,
          image_url: entry.image_url,
          date: today
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

      // Update local state
      setEntries(prev => [typedEntry, ...prev]);
      
      // Update totals
      const newTotals = {
        calories: todayTotals.calories + typedEntry.calories,
        protein: todayTotals.protein + typedEntry.protein,
        carbs: todayTotals.carbs + typedEntry.carbs,
        fat: todayTotals.fat + typedEntry.fat
      };
      setTodayTotals(newTotals);
      await updateDailyMacros(newTotals);

      return typedEntry;
    } catch (error) {
      console.error('Error adding food entry:', error);
      toast({ title: 'Fehler beim Speichern', variant: 'destructive' });
      return null;
    }
  };

  // Update entry
  const updateEntry = async (id: string, updates: Partial<Omit<FoodEntry, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('food_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload entries to get updated totals
      await loadEntries();
      return true;
    } catch (error) {
      console.error('Error updating food entry:', error);
      toast({ title: 'Fehler beim Aktualisieren', variant: 'destructive' });
      return false;
    }
  };

  // Delete entry
  const deleteEntry = async (id: string) => {
    if (!user) return false;

    try {
      // Find entry to subtract from totals
      const entry = entries.find(e => e.id === id);
      
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setEntries(prev => prev.filter(e => e.id !== id));
      
      // Update totals
      if (entry) {
        const newTotals = {
          calories: Math.max(0, todayTotals.calories - entry.calories),
          protein: Math.max(0, todayTotals.protein - entry.protein),
          carbs: Math.max(0, todayTotals.carbs - entry.carbs),
          fat: Math.max(0, todayTotals.fat - entry.fat)
        };
        setTodayTotals(newTotals);
        await updateDailyMacros(newTotals);
      }

      return true;
    } catch (error) {
      console.error('Error deleting food entry:', error);
      toast({ title: 'Fehler beim Löschen', variant: 'destructive' });
      return false;
    }
  };

  // Clear all entries for today
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
      await updateDailyMacros(emptyTotals);

      return true;
    } catch (error) {
      console.error('Error clearing food entries:', error);
      return false;
    }
  };

  // Load on mount and when user changes
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Periodic refresh instead of real-time subscription (more stable)
  useEffect(() => {
    if (!user) return;

    // Refresh every 30 seconds to catch updates from other devices
    const intervalId = setInterval(() => {
      loadEntries();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, loadEntries]);

  return {
    entries,
    loading,
    todayTotals,
    addEntry,
    updateEntry,
    deleteEntry,
    clearToday,
    refreshEntries: loadEntries
  };
};
