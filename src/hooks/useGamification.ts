import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
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
      ];
  }
}

export const useGamification = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
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
        title: language === 'de'
          ? `${badgeDef?.icon} Neues Badge freigeschaltet!`
          : language === 'fr'
            ? `${badgeDef?.icon} Nouveau badge debloque !`
            : `${badgeDef?.icon} New badge unlocked!`,
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

  return {
    streak,
    badges,
    badgeDefinitions,
    loading,
    recordActivity,
    awardBadge,
    checkAndAwardBadge,
    refetch: fetchGamificationData,
  };
};
