import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, formatTranslation, type Language } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { confettiBurst } from '@/lib/mobileEffects';
import { notifyBadgeUnlocked } from '@/lib/badgeEvents';
import { getLocalDateISO, getLocalYesterdayISO } from '@/lib/localDate';

// Confetti function for badge celebrations
const triggerConfetti = async () => {
  try {
    confettiBurst({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFFFFF', '#E8FFF5', '#66FFAA', '#33FF99', '#16D978'],
    });
  } catch (error) {
    console.log('Confetti not available');
  }
};

export interface Badge {
  id: string;
  badge_type: string;
  badge_name: string;
  earned_at: string;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface BadgeDefinition {
  type: string;
  name: string;
  icon: string;
  description: string;
  requirement: number;
}

export function getBadgeDefinitions(language: Language): BadgeDefinition[] {
  switch (language) {
    case 'en':
      return [
        { type: 'streak_3', name: '3-Day Streak', icon: '🔥', description: 'Active for 3 days in a row', requirement: 3 },
        { type: 'streak_7', name: '7-Day Streak', icon: '⚡', description: 'You made it through a whole week!', requirement: 7 },
        { type: 'streak_14', name: '14-Day Streak', icon: '💪', description: 'Two strong weeks!', requirement: 14 },
        { type: 'streak_30', name: '30-Day Streak', icon: '🏆', description: 'A full month!', requirement: 30 },
        { type: 'water_goal', name: 'Water Goal Reached', icon: '💧', description: 'Hit your daily water goal', requirement: 1 },
        { type: 'water_week', name: 'Hydration Hero', icon: '🌊', description: 'Reached your water goal for 7 days', requirement: 7 },
        { type: 'first_scan', name: 'First Scan', icon: '📸', description: 'Scanned your first meal', requirement: 1 },
        { type: 'meal_logged', name: 'Meal Logged', icon: '🍽️', description: 'Tracked your first meal', requirement: 1 },
        { type: 'weight_tracked', name: 'Weight Tracked', icon: '⚖️', description: 'Logged your first weight entry', requirement: 1 },
        { type: 'calorie_goal_3', name: '3 Days on Target', icon: '🎯', description: 'Stayed within calorie budget for 3 days', requirement: 3 },
        { type: 'calorie_goal_7', name: '7 Days on Target', icon: '💎', description: 'Stayed within calorie budget for 7 days', requirement: 7 },
        { type: 'protein_champion', name: 'Protein Champion', icon: '💪', description: 'Hit protein goal 5 times', requirement: 5 },
        { type: 'scanner_pro', name: 'Scanner Pro', icon: '📱', description: 'Logged 20 meals via scan', requirement: 20 },
        { type: 'weight_loss_1', name: 'First Kilo', icon: '⬇️', description: 'Lost 1 kg', requirement: 1 },
        { type: 'weight_loss_5', name: 'Five Kilos', icon: '🏅', description: 'Lost 5 kg', requirement: 5 },
        { type: 'calorie_week_perfect', name: 'Perfect Week', icon: '✨', description: 'Hit calorie budget 7 days in a row', requirement: 7 },
        { type: 'comeback', name: 'Comeback', icon: '🔄', description: 'Returned after a 5-day break', requirement: 1 },
      ];
    case 'fr':
      return [
        { type: 'streak_3', name: 'Serie de 3 jours', icon: '🔥', description: 'Actif 3 jours de suite', requirement: 3 },
        { type: 'streak_7', name: 'Serie de 7 jours', icon: '⚡', description: 'Une semaine complete tenue !', requirement: 7 },
        { type: 'streak_14', name: 'Serie de 14 jours', icon: '💪', description: 'Deux semaines en force !', requirement: 14 },
        { type: 'streak_30', name: 'Serie de 30 jours', icon: '🏆', description: 'Un mois entier !', requirement: 30 },
        { type: 'water_goal', name: 'Objectif eau atteint', icon: '💧', description: 'Objectif quotidien d eau atteint', requirement: 1 },
        { type: 'water_week', name: 'Hero de l hydratation', icon: '🌊', description: 'Objectif eau atteint 7 jours', requirement: 7 },
        { type: 'first_scan', name: 'Premier scan', icon: '📸', description: 'Premier repas scanne', requirement: 1 },
        { type: 'meal_logged', name: 'Repas enregistre', icon: '🍽️', description: 'Premier repas suivi', requirement: 1 },
        { type: 'weight_tracked', name: 'Poids enregistre', icon: '⚖️', description: 'Premier poids ajoute', requirement: 1 },
        { type: 'calorie_goal_3', name: '3 jours dans l objectif', icon: '🎯', description: 'Budget calorique respecte 3 jours', requirement: 3 },
        { type: 'calorie_goal_7', name: '7 jours dans l objectif', icon: '💎', description: 'Budget calorique respecte 7 jours', requirement: 7 },
        { type: 'protein_champion', name: 'Champion des proteines', icon: '💪', description: 'Objectif proteique atteint 5 fois', requirement: 5 },
        { type: 'scanner_pro', name: 'Pro du scanner', icon: '📱', description: '20 repas enregistres par scan', requirement: 20 },
        { type: 'weight_loss_1', name: 'Premier kilo', icon: '⬇️', description: '1 kg perdu', requirement: 1 },
        { type: 'weight_loss_5', name: 'Cinq kilos', icon: '🏅', description: '5 kg perdus', requirement: 5 },
        { type: 'calorie_week_perfect', name: 'Semaine parfaite', icon: '✨', description: 'Budget calorique atteint 7 jours', requirement: 7 },
        { type: 'comeback', name: 'Retour en force', icon: '🔄', description: 'Retour apres 5 jours d absence', requirement: 1 },
      ];
    case 'de':
    default:
      return [
        { type: 'streak_3', name: '3 Tage Streak', icon: '🔥', description: '3 Tage in Folge aktiv', requirement: 3 },
        { type: 'streak_7', name: '7 Tage Streak', icon: '⚡', description: 'Eine Woche durchgehalten!', requirement: 7 },
        { type: 'streak_14', name: '14 Tage Streak', icon: '💪', description: 'Zwei Wochen stark!', requirement: 14 },
        { type: 'streak_30', name: '30 Tage Streak', icon: '🏆', description: 'Ein ganzer Monat!', requirement: 30 },
        { type: 'water_goal', name: 'Wasserziel erreicht', icon: '💧', description: 'Tagliches Wasserziel geschafft', requirement: 1 },
        { type: 'water_week', name: 'Hydrations-Held', icon: '🌊', description: '7 Tage Wasserziel erreicht', requirement: 7 },
        { type: 'first_scan', name: 'Erster Scan', icon: '📸', description: 'Erstes Essen gescannt', requirement: 1 },
        { type: 'meal_logged', name: 'Mahlzeit geloggt', icon: '🍽️', description: 'Erste Mahlzeit getrackt', requirement: 1 },
        { type: 'weight_tracked', name: 'Gewicht getrackt', icon: '⚖️', description: 'Erstes Gewicht eingetragen', requirement: 1 },
        { type: 'calorie_goal_3', name: '3 Tage im Ziel', icon: '🎯', description: 'Kalorienbudget 3 Tage eingehalten', requirement: 3 },
        { type: 'calorie_goal_7', name: '7 Tage im Ziel', icon: '💎', description: 'Kalorienbudget 7 Tage eingehalten', requirement: 7 },
        { type: 'protein_champion', name: 'Protein-Champion', icon: '💪', description: 'Proteinziel 5 Mal erreicht', requirement: 5 },
        { type: 'scanner_pro', name: 'Scanner-Profi', icon: '📱', description: '20 Mahlzeiten per Scan geloggt', requirement: 20 },
        { type: 'weight_loss_1', name: 'Erstes Kilo', icon: '⬇️', description: '1 kg abgenommen', requirement: 1 },
        { type: 'weight_loss_5', name: 'Fünf Kilo', icon: '🏅', description: '5 kg abgenommen', requirement: 5 },
        { type: 'calorie_week_perfect', name: 'Perfekte Woche', icon: '✨', description: '7 Tage Kalorienbudget getroffen', requirement: 7 },
        { type: 'comeback', name: 'Comeback', icon: '🔄', description: 'Nach 5 Tagen Pause zurückgekommen', requirement: 1 },
      ];
  }
}

export const useGamification = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [streak, setStreak] = useState<Streak>({ current_streak: 0, longest_streak: 0, last_activity_date: null });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const badgeDefinitions = useMemo(() => getBadgeDefinitions(language), [language]);

  useEffect(() => {
    if (user) {
      fetchGamificationData();
    } else {
      setStreak({ current_streak: 0, longest_streak: 0, last_activity_date: null });
      setBadges([]);
      setLoading(false);
    }
  }, [user]);

  const fetchGamificationData = async () => {
    if (!user) return;
    
    try {
      // Fetch streak
      const { data: streakData, error: streakError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (streakError) throw streakError;

      if (streakData) {
        setStreak({
          current_streak: streakData.current_streak,
          longest_streak: streakData.longest_streak,
          last_activity_date: streakData.last_activity_date,
        });
      }

      // Fetch badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;
      setBadges(badgesData || []);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordActivity = async () => {
    if (!user) return;

    const today = getLocalDateISO();
    
    try {
      const { data: existingStreak, error: fetchError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let newCurrentStreak = 1;
      let newLongestStreak = 1;

      if (existingStreak) {
        const lastDate = existingStreak.last_activity_date;
        
        if (lastDate === today) {
          // Already recorded today
          return;
        }

        const yesterdayStr = getLocalYesterdayISO();

        if (lastDate === yesterdayStr) {
          // Consecutive day
          newCurrentStreak = existingStreak.current_streak + 1;
          newLongestStreak = Math.max(newCurrentStreak, existingStreak.longest_streak);
        } else {
          // Streak broken
          newLongestStreak = existingStreak.longest_streak;
        }

        const { error: updateError } = await supabase
          .from('user_streaks')
          .update({
            current_streak: newCurrentStreak,
            longest_streak: newLongestStreak,
            last_activity_date: today,
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Create new streak record
        const { error: insertError } = await supabase
          .from('user_streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
          });

        if (insertError) throw insertError;
      }

      setStreak({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
      });

      // Check for streak badges
      await checkStreakBadges(newCurrentStreak);
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  };

  const checkStreakBadges = async (currentStreak: number) => {
      const streakBadges = badgeDefinitions.filter(b => b.type.startsWith('streak_'));
    
    for (const badge of streakBadges) {
      if (currentStreak >= badge.requirement && !badges.find(b => b.badge_type === badge.type)) {
        await awardBadge(badge.type, badge.name);
      }
    }
  };

  const awardBadge = async (badgeType: string, badgeName: string) => {
    if (!user) return;
    if (badges.some((badge) => badge.badge_type === badgeType)) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_type: badgeType,
          badge_name: badgeName,
        })
        .select('*')
        .maybeSingle();

      if (error) {
        const duplicate = error.message?.includes('duplicate') || error.code === '23505';
        if (duplicate) {
          await fetchGamificationData();
          return;
        }
        throw error;
      }

      const badgeDef = badgeDefinitions.find(b => b.type === badgeType);
      if (data) {
        setBadges((prev) =>
          prev.some((badge) => badge.badge_type === badgeType) ? prev : [...prev, data],
        );
      }
      if (badgeDef) {
        notifyBadgeUnlocked({
          badgeType,
          badgeName,
          badgeIcon: badgeDef.icon,
        });
      }
      
      // Trigger confetti animation
      triggerConfetti();
      
      toast({
        title: formatTranslation(t.badgeUnlockedToast, { icon: badgeDef?.icon ?? '' }),
        description: badgeName,
      });

      // Refresh badges from the backend for cross-device consistency.
      void fetchGamificationData();
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  const checkAndAwardBadge = async (badgeType: string) => {
    if (!user || badges.find(b => b.badge_type === badgeType)) return;

    const badgeDef = badgeDefinitions.find(b => b.type === badgeType);
    if (badgeDef) {
      await awardBadge(badgeType, badgeDef.name);
    }
  };

  /**
   * Call this whenever a day's calories are logged (e.g. from Index.tsx).
   * If caloriesEaten is within ±15% of targetCalories, the day counts.
   * Increments a localStorage counter and awards calorie_goal_3 / calorie_goal_7
   * (and calorie_week_perfect at 7) when the threshold is reached.
   */
  const checkCalorieGoalBadge = async (caloriesEaten: number, targetCalories: number) => {
    if (!user || targetCalories <= 0) return;

    const ratio = caloriesEaten / targetCalories;
    const isGoalDay = ratio >= 0.85 && ratio <= 1.15;

    if (!isGoalDay) return;

    const raw = localStorage.getItem('frigy_calorie_goal_days');
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;
    localStorage.setItem('frigy_calorie_goal_days', String(next));

    if (next >= 3) {
      const def3 = badgeDefinitions.find(b => b.type === 'calorie_goal_3');
      if (def3 && !badges.find(b => b.badge_type === 'calorie_goal_3')) {
        await awardBadge('calorie_goal_3', def3.name);
      }
    }
    if (next >= 7) {
      const def7 = badgeDefinitions.find(b => b.type === 'calorie_goal_7');
      if (def7 && !badges.find(b => b.badge_type === 'calorie_goal_7')) {
        await awardBadge('calorie_goal_7', def7.name);
      }
      const defPerfect = badgeDefinitions.find(b => b.type === 'calorie_week_perfect');
      if (defPerfect && !badges.find(b => b.badge_type === 'calorie_week_perfect')) {
        await awardBadge('calorie_week_perfect', defPerfect.name);
      }
    }
  };

  /**
   * Call this whenever protein intake is logged for the day.
   * If proteinEaten >= 90% of targetProtein, the day counts.
   * Increments a localStorage counter and awards protein_champion at 5.
   */
  const checkProteinGoalBadge = async (proteinEaten: number, targetProtein: number) => {
    if (!user || targetProtein <= 0) return;

    const isGoalDay = proteinEaten >= targetProtein * 0.9;
    if (!isGoalDay) return;

    const raw = localStorage.getItem('frigy_protein_goal_days');
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;
    localStorage.setItem('frigy_protein_goal_days', String(next));

    if (next >= 5) {
      const def = badgeDefinitions.find(b => b.type === 'protein_champion');
      if (def && !badges.find(b => b.badge_type === 'protein_champion')) {
        await awardBadge('protein_champion', def.name);
      }
    }
  };

  return {
    streak,
    badges,
    badgeDefinitions,
    loading,
    recordActivity,
    awardBadge,
    checkAndAwardBadge,
    checkCalorieGoalBadge,
    checkProteinGoalBadge,
    refetch: fetchGamificationData,
  };
};
