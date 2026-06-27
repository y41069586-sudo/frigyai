import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { getLocalDateISO } from '@/lib/localDate';
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

// Animated number counter
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    startRef.current = null;
    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <>{display}</>;
}

// Thin progress bar
function MacroBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="h-1 w-full bg-gray-200/40 rounded-full overflow-hidden mt-1">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </div>
  );
}

export const WeeklySummary = ({ open, onClose }: WeeklySummaryProps) => {
  const { user, session } = useAuth();
  const { language } = useLanguage();
  const { settings } = useTrackerSettings();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiFetchedRef = useRef(false);

  const copy = language === 'fr'
    ? {
        noData: 'Aucune donnee',
        stable: 'Stable',
        weeklySummary: 'Resume hebdomadaire',
        weightTrend: 'Tendance du poids',
        averagePerDay: 'Moyenne / jour',
        goal: 'Objectif',
        protein: 'Proteines',
        carbs: 'Glucides',
        fat: 'Lipides',
        glassesPerDay: 'verres/jour',
        streakDays: 'jours de serie',
        tips: 'Conseils pour toi',
        understood: 'Compris',
        logMeals: 'Enregistre regulierement tes repas pour de meilleurs apercus !',
        underGoal: '🍽️ Tu es sous ton objectif - veille a avoir assez de nutriments !',
        overGoal: '🎯 Tu es au-dessus de ton objectif calorique - essaie des portions plus controlees.',
        goodCalories: '✅ Ton apport calorique est dans une bonne zone !',
        moreWater: '💧 Bois plus d eau ! Objectif : au moins 8 verres par jour.',
        greatWater: '💧 Super hydratation ! Continue comme ca.',
        progress: '📉 Tu progresses ! Continue.',
        gain: '📈 Bonne prise ! Tu es sur la bonne voie.',
        wowStreak: '🔥 Wow, {days} jours de serie ! Tu es inarretable !',
        keepStreak: '🔥 {days} jours de serie - continue comme ca !',
        buildStreak: '💪 Enregistre chaque jour pour construire ta serie !',
        daysInGoal: 'jours dans le but',
        thisWeek: 'Cette semaine',
        aiAnalysis: 'Analyse IA',
      }
    : language === 'en'
      ? {
          noData: 'No data',
          stable: 'Stable',
          weeklySummary: 'Weekly summary',
          weightTrend: 'Weight trend',
          averagePerDay: 'Average / day',
          goal: 'Goal',
          protein: 'Protein',
          carbs: 'Carbs',
          fat: 'Fat',
          glassesPerDay: 'glasses/day',
          streakDays: 'streak days',
          tips: 'Tips for you',
          understood: 'Got it',
          logMeals: 'Log your meals regularly for better insights!',
          underGoal: '🍽️ You are under your goal - make sure you get enough nutrients!',
          overGoal: '🎯 You are above your calorie goal - try more controlled portions.',
          goodCalories: '✅ Your calorie intake is in a good range!',
          moreWater: '💧 Drink more water! Goal: at least 8 glasses per day.',
          greatWater: '💧 Great water intake! Keep it up.',
          progress: '📉 You are making progress! Keep going.',
          gain: '📈 Good gain! You are on the right track.',
          wowStreak: '🔥 Wow, {days} day streak! You are unstoppable!',
          keepStreak: '🔥 {days} day streak - keep it up!',
          buildStreak: '💪 Log daily to build your streak!',
          daysInGoal: 'days on target',
          thisWeek: 'This week',
          aiAnalysis: 'AI Analysis',
        }
      : {
          noData: 'Keine Daten',
          stable: 'Stabil',
          weeklySummary: 'Wochenuebersicht',
          weightTrend: 'Gewichtstrend',
          averagePerDay: 'Durchschnitt / Tag',
          goal: 'Ziel',
          protein: 'Protein',
          carbs: 'Carbs',
          fat: 'Fett',
          glassesPerDay: 'Glaeser/Tag',
          streakDays: 'Tage Streak',
          tips: 'Tipps fuer dich',
          understood: 'Verstanden',
          logMeals: 'Logge regelmaessig deine Mahlzeiten fuer bessere Einblicke!',
          underGoal: '🍽️ Du isst unter deinem Ziel - achte auf ausreichende Naehrstoffe!',
          overGoal: '🎯 Du liegst ueber deinem Kalorienziel - versuche portionskontrollierter zu essen.',
          goodCalories: '✅ Deine Kalorienaufnahme ist im guten Bereich!',
          moreWater: '💧 Trinke mehr Wasser! Ziel: mindestens 8 Glaeser pro Tag.',
          greatWater: '💧 Super Wasseraufnahme! Weiter so.',
          progress: '📉 Du machst Fortschritte! Bleib dran.',
          gain: '📈 Guter Aufbau! Du bist auf dem richtigen Weg.',
          wowStreak: '🔥 Wow, {days} Tage Streak! Du bist unaufhaltbar!',
          keepStreak: '🔥 {days} Tage Streak - weiter so!',
          buildStreak: '💪 Logge taeglich um deinen Streak aufzubauen!',
          daysInGoal: 'Tage im Ziel',
          thisWeek: 'Diese Woche',
          aiAnalysis: 'KI-Analyse',
        };

  useEffect(() => {
    if (open && user) {
      aiFetchedRef.current = false;
      setAiAnalysis(null);
      loadWeeklyStats();
    }
  }, [open, user]);

  // Fetch AI analysis once stats are loaded and dialog is open
  useEffect(() => {
    if (open && stats && !aiFetchedRef.current && session) {
      aiFetchedRef.current = true;
      fetchAiAnalysis(stats);
    }
  }, [open, stats, session]);

  const fetchAiAnalysis = async (s: WeeklyStats) => {
    if (!session?.access_token) return;
    setAiLoading(true);
    try {
      const targetCal = settings?.dailyCalories ?? 0;
      const targetProt = settings?.dailyProtein ?? 0;
      const prompt = `Gib eine kurze 2-Satz Analyse dieser Woche auf Deutsch: ${s.avgCalories} kcal/Tag (Ziel: ${targetCal}), Protein ${s.avgProtein}g/Tag (Ziel: ${targetProt}g), ${s.daysLogged}/7 Tage geloggt. Sei positiv, motivierend, konkret. Max 60 Wörter.`;
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: [{ role: 'user', content: prompt }], language: 'de' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      const text: string | undefined =
        data?.content ?? data?.message ?? data?.choices?.[0]?.message?.content;
      if (text) setAiAnalysis(text);
    } catch {
      // silently hide on error
      setAiAnalysis(null);
    } finally {
      setAiLoading(false);
    }
  };

  const loadWeeklyStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data: weightData } = await supabase
        .from('weight_entries')
        .select('weight, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString())
        .order('recorded_at', { ascending: true });

      const { data: waterData } = await supabase
        .from('water_intake')
        .select('glasses, date')
        .eq('user_id', user.id)
        .gte('date', getLocalDateISO(startDate))
        .lte('date', getLocalDateISO(endDate));

      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      const foodStats = calculateFoodStats();

      let weightChange = null;
      let startWeight = null;
      let endWeight = null;

      if (weightData && weightData.length >= 2) {
        startWeight = Number(weightData[0].weight);
        endWeight = Number(weightData[weightData.length - 1].weight);
        weightChange = endWeight - startWeight;
      }

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
    if (!stats?.weightChange) return { icon: Minus, color: 'text-muted-foreground', text: copy.noData };
    if (stats.weightChange < -0.1) return { icon: TrendingDown, color: 'text-[#39D47F]', text: `${stats.weightChange.toFixed(1)} kg` };
    if (stats.weightChange > 0.1) return { icon: TrendingUp, color: 'text-red-400', text: `+${stats.weightChange.toFixed(1)} kg` };
    return { icon: Minus, color: 'text-amber-400', text: copy.stable };
  };

  // Heatmap dots: green = logged & ≥70% of calorie target, orange = logged but off, gray = not logged
  const renderHeatmapDots = () => {
    const targetCal = settings?.dailyCalories ?? 0;
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0=Sun
    // Map to Mon=0 … Sun=6
    const todayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

    return (
      <div className="flex items-center justify-between px-1">
        {days.map((day, i) => {
          const isLogged = i < stats!.daysLogged;
          const pct = targetCal > 0 && isLogged ? (stats!.avgCalories / targetCal) * 100 : 0;
          const isGreen = isLogged && pct >= 70 && pct <= 120;
          const isOrange = isLogged && (pct < 70 || pct > 120);
          const isToday = i === todayIndex;

          let bgColor = '#E5E7EB'; // gray
          if (isGreen) bgColor = '#39D47F';
          else if (isOrange) bgColor = '#F59E0B';

          return (
            <motion.div
              key={day}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <div
                className="relative flex items-center justify-center"
                style={{ width: 28, height: 28 }}
              >
                {isToday && (
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: `0 0 0 2px #75FBB2`,
                      borderRadius: '50%',
                    }}
                  />
                )}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: bgColor,
                    transition: 'background-color 0.3s',
                  }}
                />
              </div>
              <span
                className="text-[9px] font-medium"
                style={{
                  color: isToday ? '#75FBB2' : '#6B7280',
                }}
              >
                {day}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const trend = getWeightTrend();
  const TrendIcon = trend.icon;

  // Days on target badge
  const daysOnTarget = stats
    ? Math.min(stats.daysLogged, 7)
    : 0;

  const targetCal = settings?.dailyCalories ?? 0;
  const targetProt = settings?.dailyProtein ?? 0;
  const targetCarbs = settings?.dailyCarbs ?? 0;
  const targetFat = settings?.dailyFat ?? 0;

  const sectionVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const },
    }),
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold" style={{ color: '#1F2937' }}>
            <Calendar className="h-5 w-5" style={{ color: '#75FBB2' }} />
            {copy.thisWeek}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#75FBB2' }} />
          </div>
        ) : stats ? (
          <div className="space-y-4 pb-2">
            {/* 1. Heatmap row */}
            <motion.div
              custom={0}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="p-4" style={{ background: 'linear-gradient(135deg, rgba(117,251,178,0.08) 0%, rgba(57,212,127,0.04) 100%)', border: '1px solid rgba(117,251,178,0.2)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>7-Tage Überblick</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(57,212,127,0.15)', color: '#39D47F' }}
                  >
                    {daysOnTarget}/7 {copy.daysInGoal}
                  </span>
                </div>
                {renderHeatmapDots()}
                <div className="flex items-center gap-3 mt-3 pt-2" style={{ borderTop: '1px solid rgba(117,251,178,0.15)' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#39D47F' }} />
                    <span className="text-[9px]" style={{ color: '#6B7280' }}>Im Ziel</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
                    <span className="text-[9px]" style={{ color: '#6B7280' }}>Abweichung</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }} />
                    <span className="text-[9px]" style={{ color: '#6B7280' }}>Nicht geloggt</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* 2. Stats grid — calories + macros */}
            <motion.div
              custom={1}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="p-4 bg-card/50">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-semibold" style={{ color: '#1F2937' }}>{copy.averagePerDay}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Calories */}
                  <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(117,251,178,0.08)' }}>
                    <p className="text-2xl font-bold" style={{ color: '#39D47F' }}>
                      <AnimatedNumber value={stats.avgCalories} />
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>kcal</p>
                    {targetCal > 0 && (
                      <>
                        <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>
                          {copy.goal}: {targetCal}
                        </p>
                        <MacroBar value={stats.avgCalories} target={targetCal} color="#39D47F" />
                      </>
                    )}
                  </div>

                  {/* Macros */}
                  <div className="space-y-2.5">
                    {/* Protein */}
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-red-400">{copy.protein}</span>
                        <span className="text-xs font-semibold" style={{ color: '#1F2937' }}>
                          <AnimatedNumber value={stats.avgProtein} />g
                          {targetProt > 0 && <span style={{ color: '#6B7280' }} className="font-normal">/{targetProt}</span>}
                        </span>
                      </div>
                      <MacroBar value={stats.avgProtein} target={targetProt || stats.avgProtein} color="#F87171" />
                    </div>
                    {/* Carbs */}
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-amber-400">{copy.carbs}</span>
                        <span className="text-xs font-semibold" style={{ color: '#1F2937' }}>
                          <AnimatedNumber value={stats.avgCarbs} />g
                          {targetCarbs > 0 && <span style={{ color: '#6B7280' }} className="font-normal">/{targetCarbs}</span>}
                        </span>
                      </div>
                      <MacroBar value={stats.avgCarbs} target={targetCarbs || stats.avgCarbs} color="#F59E0B" />
                    </div>
                    {/* Fat */}
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-blue-400">{copy.fat}</span>
                        <span className="text-xs font-semibold" style={{ color: '#1F2937' }}>
                          <AnimatedNumber value={stats.avgFat} />g
                          {targetFat > 0 && <span style={{ color: '#6B7280' }} className="font-normal">/{targetFat}</span>}
                        </span>
                      </div>
                      <MacroBar value={stats.avgFat} target={targetFat || stats.avgFat} color="#60A5FA" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* 3. Water & Streak */}
            <motion.div
              custom={2}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-card/50 text-center">
                  <Droplets className="h-5 w-5 text-cyan-400 mx-auto mb-1.5" />
                  <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                    <AnimatedNumber value={stats.waterAvg} />
                  </p>
                  <p className="text-[10px]" style={{ color: '#6B7280' }}>{copy.glassesPerDay} ⌀</p>
                </Card>
                <Card className="p-4 bg-card/50 text-center">
                  <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1.5" />
                  <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                    <AnimatedNumber value={stats.streakDays} />
                  </p>
                  <p className="text-[10px]" style={{ color: '#6B7280' }}>{copy.streakDays}</p>
                </Card>
              </div>
            </motion.div>

            {/* 4. Weight trend — only shown if data exists */}
            {(stats.weightChange !== null) && (
              <motion.div
                custom={3}
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                <Card className="p-4 bg-card/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-background ${trend.color}`}>
                        <Scale className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#6B7280' }}>{copy.weightTrend}</p>
                        <p className={`text-lg font-bold ${trend.color}`}>{trend.text}</p>
                      </div>
                    </div>
                    <TrendIcon className={`h-7 w-7 ${trend.color}`} />
                  </div>
                  {stats.startWeight && stats.endWeight && (
                    <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                      {stats.startWeight} kg → {stats.endWeight} kg
                    </p>
                  )}
                </Card>
              </motion.div>
            )}

            {/* 5. AI Analysis card */}
            <AnimatePresence>
              {(aiLoading || aiAnalysis) && (
                <motion.div
                  custom={4}
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -8 }}
                >
                  <Card
                    className="p-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(117,251,178,0.12) 0%, rgba(57,212,127,0.06) 100%)',
                      border: '1px solid rgba(57,212,127,0.3)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">✨</span>
                      <span className="text-sm font-semibold" style={{ color: '#39D47F' }}>{copy.aiAnalysis}</span>
                    </div>
                    {aiLoading ? (
                      <div className="space-y-2">
                        <motion.div
                          className="h-3 rounded-full"
                          style={{ background: 'rgba(57,212,127,0.2)', width: '90%' }}
                          animate={{ opacity: [0.4, 0.8, 0.4] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        />
                        <motion.div
                          className="h-3 rounded-full"
                          style={{ background: 'rgba(57,212,127,0.2)', width: '70%' }}
                          animate={{ opacity: [0.4, 0.8, 0.4] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                        />
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: '#1F2937' }}>{aiAnalysis}</p>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close button */}
            <motion.div
              custom={5}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Button onClick={onClose} className="w-full">
                {copy.understood} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: '#6B7280' }}>
            {copy.noData}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
