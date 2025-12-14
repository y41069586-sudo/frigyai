import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingDown, TrendingUp, Minus, Calendar, Flame, 
  Droplets, Scale, ChevronRight, Sparkles, X 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WeeklyStats {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  daysLogged: number;
  weightChange: number | null;
  startWeight: number | null;
  endWeight: number | null;
  waterAvg: number;
  streakDays: number;
}

interface WeeklySummaryProps {
  open: boolean;
  onClose: () => void;
}

export const WeeklySummary = ({ open, onClose }: WeeklySummaryProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { settings } = useTrackerSettings();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      loadWeeklyStats();
    }
  }, [open, user]);

  const loadWeeklyStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get dates for the past 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      // Fetch weight entries
      const { data: weightData } = await supabase
        .from('weight_entries')
        .select('weight, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString())
        .order('recorded_at', { ascending: true });

      // Fetch water intake
      const { data: waterData } = await supabase
        .from('water_intake')
        .select('glasses, date')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      // Fetch streaks
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      // Calculate food stats from localStorage (last 7 days)
      const foodStats = calculateFoodStats();

      // Calculate weight change
      let weightChange = null;
      let startWeight = null;
      let endWeight = null;
      
      if (weightData && weightData.length >= 2) {
        startWeight = Number(weightData[0].weight);
        endWeight = Number(weightData[weightData.length - 1].weight);
        weightChange = endWeight - startWeight;
      }

      // Calculate average water
      const waterAvg = waterData && waterData.length > 0
        ? Math.round(waterData.reduce((sum, w) => sum + w.glasses, 0) / waterData.length)
        : 0;

      setStats({
        avgCalories: foodStats.avgCalories,
        avgProtein: foodStats.avgProtein,
        avgCarbs: foodStats.avgCarbs,
        avgFat: foodStats.avgFat,
        daysLogged: foodStats.daysLogged,
        weightChange,
        startWeight,
        endWeight,
        waterAvg,
        streakDays: streakData?.current_streak || 0,
      });
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFoodStats = () => {
    // Get food data from localStorage for the past 7 days
    const savedFood = localStorage.getItem('todayFood');
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let daysLogged = 0;

    if (savedFood) {
      try {
        const data = JSON.parse(savedFood);
        if (data.entries && data.entries.length > 0) {
          daysLogged = 1;
          data.entries.forEach((entry: any) => {
            totalCalories += entry.calories || 0;
            totalProtein += entry.protein || 0;
            totalCarbs += entry.carbs || 0;
            totalFat += entry.fat || 0;
          });
        }
      } catch (e) {
        console.error('Error parsing food data');
      }
    }

    return {
      avgCalories: daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0,
      avgProtein: daysLogged > 0 ? Math.round(totalProtein / daysLogged) : 0,
      avgCarbs: daysLogged > 0 ? Math.round(totalCarbs / daysLogged) : 0,
      avgFat: daysLogged > 0 ? Math.round(totalFat / daysLogged) : 0,
      daysLogged,
    };
  };

  const getWeightTrend = () => {
    if (!stats?.weightChange) return { icon: Minus, color: 'text-muted-foreground', text: 'Keine Daten' };
    if (stats.weightChange < -0.1) return { icon: TrendingDown, color: 'text-green-400', text: `${stats.weightChange.toFixed(1)} kg` };
    if (stats.weightChange > 0.1) return { icon: TrendingUp, color: 'text-red-400', text: `+${stats.weightChange.toFixed(1)} kg` };
    return { icon: Minus, color: 'text-amber-400', text: 'Stabil' };
  };

  const getPersonalizedTips = (): string[] => {
    const tips: string[] = [];
    
    if (!stats || !settings) {
      tips.push('Logge regelmäßig deine Mahlzeiten für bessere Einblicke!');
      return tips;
    }

    // Calorie tips
    if (stats.avgCalories > 0 && settings.dailyCalories > 0) {
      const caloriePercentage = (stats.avgCalories / settings.dailyCalories) * 100;
      if (caloriePercentage < 80) {
        tips.push('🍽️ Du isst unter deinem Ziel - achte auf ausreichende Nährstoffe!');
      } else if (caloriePercentage > 110) {
        tips.push('🎯 Du liegst über deinem Kalorienziel - versuche portionskontrollierter zu essen.');
      } else {
        tips.push('✅ Deine Kalorienaufnahme ist im guten Bereich!');
      }
    }

    // Water tips
    if (stats.waterAvg < 6) {
      tips.push('💧 Trinke mehr Wasser! Ziel: mindestens 8 Gläser pro Tag.');
    } else if (stats.waterAvg >= 8) {
      tips.push('💧 Super Wasseraufnahme! Weiter so.');
    }

    // Weight trend tips
    if (stats.weightChange !== null) {
      if (settings.goalMode === 'lose' && stats.weightChange < 0) {
        tips.push('📉 Du machst Fortschritte! Bleib dran.');
      } else if (settings.goalMode === 'gain' && stats.weightChange > 0) {
        tips.push('📈 Guter Aufbau! Du bist auf dem richtigen Weg.');
      }
    }

    // Streak tips
    if (stats.streakDays >= 7) {
      tips.push(`🔥 Wow, ${stats.streakDays} Tage Streak! Du bist unaufhaltbar!`);
    } else if (stats.streakDays >= 3) {
      tips.push(`🔥 ${stats.streakDays} Tage Streak - weiter so!`);
    } else {
      tips.push('💪 Logge täglich um deinen Streak aufzubauen!');
    }

    return tips;
  };

  const trend = getWeightTrend();
  const TrendIcon = trend.icon;
  const tips = getPersonalizedTips();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Wochenübersicht
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : stats ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Weight Trend */}
            <Card className="p-4 bg-card/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-background ${trend.color}`}>
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gewichtstrend</p>
                    <p className={`text-lg font-bold ${trend.color}`}>{trend.text}</p>
                  </div>
                </div>
                <TrendIcon className={`h-8 w-8 ${trend.color}`} />
              </div>
              {stats.startWeight && stats.endWeight && (
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.startWeight} kg → {stats.endWeight} kg
                </p>
              )}
            </Card>

            {/* Calories & Macros */}
            <Card className="p-4 bg-card/50">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="font-medium">Durchschnitt / Tag</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background/50 text-center">
                  <p className="text-2xl font-bold text-primary">{stats.avgCalories}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                  {settings?.dailyCalories && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ziel: {settings.dailyCalories}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-400">Protein</span>
                    <span>{stats.avgProtein}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-400">Carbs</span>
                    <span>{stats.avgCarbs}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-400">Fett</span>
                    <span>{stats.avgFat}g</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Water & Streak */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-card/50 text-center">
                <Droplets className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.waterAvg}</p>
                <p className="text-xs text-muted-foreground">Gläser/Tag ⌀</p>
              </Card>
              <Card className="p-4 bg-card/50 text-center">
                <Flame className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.streakDays}</p>
                <p className="text-xs text-muted-foreground">Tage Streak</p>
              </Card>
            </div>

            {/* Personalized Tips */}
            <Card className="p-4 bg-primary/10 border-primary/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">Tipps für dich</span>
              </div>
              <div className="space-y-2">
                {tips.map((tip, idx) => (
                  <p key={idx} className="text-sm">{tip}</p>
                ))}
              </div>
            </Card>

            <Button onClick={onClose} className="w-full">
              Verstanden <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Keine Daten verfügbar
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
