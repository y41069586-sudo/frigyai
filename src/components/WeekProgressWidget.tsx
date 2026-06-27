import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalDateISO } from "@/lib/localDate";
import { Flame, Target, Calendar } from "lucide-react";
import { WeeklySummary } from "@/components/WeeklySummary";

interface DayProgress {
  date: string;
  dayName: string;
  calories: number;
  target: number;
  isToday: boolean;
  hasMealPlan: boolean;
}

interface WeekProgressWidgetProps {
  targetCalories: number;
}

interface Meal {
  type: string;
  name: string;
  calories: number;
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

const DAYS_MAP: Record<string, number> = {
  'Montag': 1, 'Dienstag': 2, 'Mittwoch': 3, 'Donnerstag': 4,
  'Freitag': 5, 'Samstag': 6, 'Sonntag': 0
};

export const WeekProgressWidget = ({ targetCalories }: WeekProgressWidgetProps) => {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<DayProgress[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    const fetchWeekData = async () => {
      const days: DayProgress[] = [];
      const today = new Date();
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

      let mealPlan: DayPlan[] = [];
      const savedPlan = localStorage.getItem('weeklyMealPlan');
      if (savedPlan) {
        try {
          mealPlan = JSON.parse(savedPlan);
        } catch (e) {
          console.error('Failed to parse meal plan');
        }
      }

      const currentDayOfWeek = today.getDay();
      const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + i);
        const dateStr = getLocalDateISO(date);
        const dayOfWeek = date.getDay();

        const dayName = Object.keys(DAYS_MAP).find(d => DAYS_MAP[d] === dayOfWeek);
        const dayPlan = mealPlan.find(d => d.day === dayName);
        const plannedCalories = dayPlan?.meals?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0;

        days.push({
          date: dateStr,
          dayName: dayNames[dayOfWeek],
          calories: 0,
          target: targetCalories,
          isToday: date.toDateString() === today.toDateString(),
          hasMealPlan: plannedCalories > 0,
        });
      }

      if (user) {
        const startDate = days[0].date;
        const endDate = days[6].date;

        const { data } = await supabase
          .from('daily_macros')
          .select('date, calories')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate);

        if (data) {
          data.forEach((entry) => {
            const dayIndex = days.findIndex(d => d.date === entry.date);
            if (dayIndex !== -1) {
              days[dayIndex].calories = entry.calories;
            }
          });
        }
      }

      days.forEach((day, index) => {
        if (day.calories === 0 && day.hasMealPlan) {
          const dayOfWeek = new Date(day.date).getDay();
          const dayName = Object.keys(DAYS_MAP).find(d => DAYS_MAP[d] === dayOfWeek);
          const dayPlan = mealPlan.find(d => d.day === dayName);
          if (dayPlan?.meals) {
            days[index].calories = dayPlan.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
          }
        }
      });

      setWeekData(days);
    };

    fetchWeekData();

    if (user) {
      const intervalId = setInterval(() => {
        console.log('[WEEK-PROGRESS] Refreshing weekly data...');
        fetchWeekData();
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [user, targetCalories]);

  const hasAnyData = weekData.some(d => d.calories > 0 || d.hasMealPlan);
  const daysWithData = weekData.filter(d => d.calories > 0).length;
  const totalTrackedCalories = weekData.reduce((sum, d) => sum + d.calories, 0);
  const avgCalories = daysWithData > 0 ? Math.round(totalTrackedCalories / daysWithData) : 0;

  // Streak: count consecutive days from today backwards that have calories
  const todayIndex = weekData.findIndex(d => d.isToday);
  let streak = 0;
  if (todayIndex >= 0) {
    for (let i = todayIndex; i >= 0; i--) {
      if (weekData[i].calories > 0) streak++;
      else break;
    }
  }

  // Heatmap dot color
  const getDotColor = (day: DayProgress): string => {
    if (day.calories <= 0) return '#E5E7EB';
    const pct = targetCalories > 0 ? (day.calories / targetCalories) * 100 : 0;
    if (pct >= 70 && pct <= 120) return '#39D47F';
    return '#F59E0B';
  };

  return (
    <>
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div
          className="relative overflow-hidden rounded-2xl cursor-pointer group transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(117,251,178,0.08) 0%, rgba(57,212,127,0.04) 100%)',
            border: '1px solid rgba(117,251,178,0.2)',
          }}
          onClick={() => setSummaryOpen(true)}
        >
          {/* Subtle green glow top-right */}
          <div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(117,251,178,0.15) 0%, transparent 70%)' }}
          />

          {/* Header */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(117,251,178,0.15)' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#75FBB2' }} />
                </div>
                <h2 className="text-sm font-bold" style={{ color: '#1F2937' }}>Diese Woche</h2>
              </div>
              <div className="flex items-center gap-2">
                {streak > 0 && (
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316' }}
                  >
                    <Flame className="w-2.5 h-2.5" />
                    {streak}
                  </div>
                )}
                <span
                  className="text-xs font-medium group-hover:underline"
                  style={{ color: '#75FBB2' }}
                >
                  Details →
                </span>
              </div>
            </div>
          </div>

          {!hasAnyData ? (
            <div className="px-4 pb-4">
              <div
                className="text-center py-6 rounded-xl border border-dashed"
                style={{ background: 'rgba(117,251,178,0.04)', borderColor: 'rgba(117,251,178,0.2)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ background: 'rgba(117,251,178,0.1)' }}
                >
                  <Flame className="w-5 h-5" style={{ color: 'rgba(117,251,178,0.6)' }} />
                </div>
                <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Noch keine Daten</p>
                <p className="text-xs font-medium" style={{ color: '#75FBB2' }}>Starte dein Tracking</p>
              </div>
            </div>
          ) : (
            <>
              {/* Heatmap dots row */}
              <div className="px-4 pb-3">
                <div className="flex items-end justify-between gap-1">
                  {weekData.map((day, index) => {
                    const dotColor = getDotColor(day);
                    const isToday = day.isToday;

                    return (
                      <motion.div
                        key={day.date}
                        className="flex flex-col items-center gap-1 flex-1"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index, duration: 0.3 }}
                      >
                        <div
                          className="relative flex items-center justify-center"
                          style={{ width: 28, height: 28 }}
                        >
                          {isToday && (
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{ boxShadow: '0 0 0 2px #75FBB2', borderRadius: '50%' }}
                            />
                          )}
                          <motion.div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: dotColor,
                            }}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.05 * index + 0.2, duration: 0.3 }}
                          />
                        </div>
                        <span
                          className="text-[9px] font-medium"
                          style={{ color: isToday ? '#75FBB2' : '#6B7280' }}
                        >
                          {day.dayName}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Stats row */}
              <div className="px-4 pb-3">
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className="rounded-xl p-2.5 text-center"
                    style={{ background: 'rgba(117,251,178,0.08)' }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-[10px]" style={{ color: '#6B7280' }}>Ø Tag</span>
                    </div>
                    <p className="text-base font-bold" style={{ color: '#1F2937' }}>{avgCalories}</p>
                    <p className="text-[9px]" style={{ color: '#6B7280' }}>kcal</p>
                  </div>

                  <div
                    className="rounded-xl p-2.5 text-center"
                    style={{ background: 'rgba(117,251,178,0.08)' }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Target className="w-3 h-3" style={{ color: '#75FBB2' }} />
                      <span className="text-[10px]" style={{ color: '#6B7280' }}>Ziel</span>
                    </div>
                    <p className="text-base font-bold" style={{ color: '#75FBB2' }}>{targetCalories}</p>
                    <p className="text-[9px]" style={{ color: '#6B7280' }}>kcal</p>
                  </div>

                  <div
                    className="rounded-xl p-2.5 text-center"
                    style={{ background: 'rgba(117,251,178,0.08)' }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Calendar className="w-3 h-3" style={{ color: '#75FBB2' }} />
                      <span className="text-[10px]" style={{ color: '#6B7280' }}>Tage</span>
                    </div>
                    <p className="text-base font-bold" style={{ color: '#1F2937' }}>{daysWithData}/7</p>
                    <p className="text-[9px]" style={{ color: '#6B7280' }}>geloggt</p>
                  </div>
                </div>
              </div>

              {/* "Diese Woche X/7 Tage" footer bar */}
              <div className="px-4 pb-4">
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(117,251,178,0.06)' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: '#1F2937' }}>
                      Diese Woche: {daysWithData}/7 Tage
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: '#75FBB2' }}>
                      {targetCalories > 0 ? Math.round((totalTrackedCalories / (targetCalories * 7)) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(117,251,178,0.15)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #75FBB2, #39D47F)' }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, targetCalories > 0 ? Math.round((totalTrackedCalories / (targetCalories * 7)) * 100) : 0)}%`
                      }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <WeeklySummary open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </>
  );
};
