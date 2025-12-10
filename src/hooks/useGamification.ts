import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Confetti function for badge celebrations
const triggerConfetti = async () => {
  try {
    const confetti = (await import('canvas-confetti')).default;
    
    // Main burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#00FF88', '#00D4FF'],
    });
    
    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });
    }, 150);
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

export const BADGE_DEFINITIONS = [
  { type: 'streak_3', name: '3 Tage Streak', icon: '🔥', description: '3 Tage in Folge aktiv', requirement: 3 },
  { type: 'streak_7', name: '7 Tage Streak', icon: '⚡', description: 'Eine Woche durchgehalten!', requirement: 7 },
  { type: 'streak_14', name: '14 Tage Streak', icon: '💪', description: 'Zwei Wochen stark!', requirement: 14 },
  { type: 'streak_30', name: '30 Tage Streak', icon: '🏆', description: 'Ein ganzer Monat!', requirement: 30 },
  { type: 'water_goal', name: 'Wasserziel erreicht', icon: '💧', description: 'Tägliches Wasserziel geschafft', requirement: 1 },
  { type: 'water_week', name: 'Hydrations-Held', icon: '🌊', description: '7 Tage Wasserziel erreicht', requirement: 7 },
  { type: 'first_scan', name: 'Erster Scan', icon: '📸', description: 'Erstes Essen gescannt', requirement: 1 },
  { type: 'meal_logged', name: 'Mahlzeit geloggt', icon: '🍽️', description: 'Erste Mahlzeit getrackt', requirement: 1 },
  { type: 'weight_tracked', name: 'Gewicht getrackt', icon: '⚖️', description: 'Erstes Gewicht eingetragen', requirement: 1 },
];

export const useGamification = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak>({ current_streak: 0, longest_streak: 0, last_activity_date: null });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

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

    const today = new Date().toISOString().split('T')[0];
    
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

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

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
    const streakBadges = BADGE_DEFINITIONS.filter(b => b.type.startsWith('streak_'));
    
    for (const badge of streakBadges) {
      if (currentStreak >= badge.requirement && !badges.find(b => b.badge_type === badge.type)) {
        await awardBadge(badge.type, badge.name);
      }
    }
  };

  const awardBadge = async (badgeType: string, badgeName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_type: badgeType,
          badge_name: badgeName,
        });

      if (error && !error.message.includes('duplicate')) throw error;

      const badgeDef = BADGE_DEFINITIONS.find(b => b.type === badgeType);
      
      // Trigger confetti animation
      triggerConfetti();
      
      toast({
        title: `${badgeDef?.icon} Neues Badge freigeschaltet!`,
        description: badgeName,
      });

      // Refresh badges
      fetchGamificationData();
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  const checkAndAwardBadge = async (badgeType: string) => {
    if (!user || badges.find(b => b.badge_type === badgeType)) return;

    const badgeDef = BADGE_DEFINITIONS.find(b => b.type === badgeType);
    if (badgeDef) {
      await awardBadge(badgeType, badgeDef.name);
    }
  };

  return {
    streak,
    badges,
    loading,
    recordActivity,
    awardBadge,
    checkAndAwardBadge,
    refetch: fetchGamificationData,
  };
};
