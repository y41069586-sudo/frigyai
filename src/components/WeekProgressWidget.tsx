import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, Flame, Target, Calendar } from "lucide-react";

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
  const navigate = useNavigate();
  const [weekData, setWeekData] = useState<DayProgress[]>([]);

  useEffect(() => {
    const fetchWeekData = async () => {
      const days: DayProgress[] = [];
      const today = new Date();
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

      // Get meal plan from localStorage
      let mealPlan: DayPlan[] = [];
      const savedPlan = localStorage.getItem('weeklyMealPlan');
      if (savedPlan) {
        try {
          mealPlan = JSON.parse(savedPlan);
        } catch (e) {
          console.error('Failed to parse meal plan');
        }
      }

      // Get last 7 days starting from Monday of this week
      const currentDayOfWeek = today.getDay();
      const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        
        // Find meal plan for this day
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

      // Fetch actual tracked data from DB
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

      // If no tracked data, show planned calories from meal plan
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

    // Periodic refresh instead of real-time subscription (more stable)
    if (user) {
      const intervalId = setInterval(() => {
        console.log('[WEEK-PROGRESS] Refreshing weekly data...');
        fetchWeekData();
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [user, targetCalories]);

  const hasAnyData = weekData.some(d => d.calories > 0 || d.hasMealPlan);
  const maxCalories = Math.max(...weekData.map(d => d.calories), targetCalories);

  // Calculate weekly stats
  const totalTrackedCalories = weekData.reduce((sum, d) => sum + d.calories, 0);
  const daysWithData = weekData.filter(d => d.calories > 0).length;
  const avgCalories = daysWithData > 0 ? Math.round(totalTrackedCalories / daysWithData) : 0;
  const weeklyTarget = targetCalories * 7;
  const weeklyProgress = Math.round((totalTrackedCalories / weeklyTarget) * 100);
  
  // Trend calculation
  const trend = avgCalories > 0 ? ((avgCalories - targetCalories) / targetCalories) * 100 : 0;
  const trendLabel = trend > 5 ? 'über Ziel' : trend < -5 ? 'unter Ziel' : 'im Ziel';
  const TrendIcon = trend > 5 ? TrendingUp : trend < -5 ? TrendingDown : Minus;
  const trendColor = trend > 5 ? 'text-orange-500' : trend < -5 ? 'text-emerald-500' : 'text-primary';

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border/30 cursor-pointer group hover:border-primary/40 transition-all duration-300"
        onClick={() => navigate('/meal-plans?tab=tracker')}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Diese Woche</h2>
            </div>
            <span className="text-xs text-primary font-medium group-hover:underline">
              Details →
            </span>
          </div>
        </div>
        
        {!hasAnyData ? (
          <div className="px-4 pb-4">
            <div className="text-center py-6 bg-muted/10 rounded-xl border border-dashed border-border/40">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-primary/60" />
              </div>
              <p className="text-muted-foreground text-xs mb-1">Noch keine Daten</p>
              <p className="text-primary text-xs font-medium">Starte dein Tracking</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="px-4 pb-3">
              <div className="grid grid-cols-3 gap-2">
                {/* Average */}
                <div className="bg-muted/20 rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span className="text-[10px] text-muted-foreground">Ø Tag</span>
                  </div>
                  <p className="text-base font-bold text-foreground">{avgCalories}</p>
                  <p className="text-[9px] text-muted-foreground">kcal</p>
                </div>
                
                {/* Target */}
                <div className="bg-muted/20 rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Target className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-muted-foreground">Ziel</span>
                  </div>
                  <p className="text-base font-bold text-primary">{targetCalories}</p>
                  <p className="text-[9px] text-muted-foreground">kcal</p>
                </div>
                
                {/* Trend */}
                <div className="bg-muted/20 rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <TrendIcon className={`w-3 h-3 ${trendColor}`} />
                    <span className="text-[10px] text-muted-foreground">Trend</span>
                  </div>
                  <p className={`text-base font-bold ${trendColor}`}>
                    {Math.abs(Math.round(trend))}%
                  </p>
                  <p className="text-[9px] text-muted-foreground">{trendLabel}</p>
                </div>
              </div>
            </div>
            
            {/* Bar Chart */}
            <div className="px-4 pb-4">
              <div className="bg-muted/10 rounded-xl p-3">
                {/* Target line indicator */}
                <div className="relative">
                  <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-primary/30 z-10" />
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 text-[8px] text-primary/60 font-medium">
                    Ziel
                  </div>
                </div>
                
                <div className="flex items-end justify-between gap-1.5 h-20 pt-2">
                  {weekData.map((day, index) => {
                    const heightPercent = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
                    const isComplete = day.calories >= day.target * 0.9;
                    const isOverTarget = day.calories > day.target;
                    const percentOfTarget = day.target > 0 ? Math.round((day.calories / day.target) * 100) : 0;
                    
                    return (
                      <motion.div
                        key={day.date}
                        className="flex flex-col items-center flex-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 * index, duration: 0.3 }}
                      >
                        {/* Bar Container */}
                        <div className="relative w-full h-14 flex items-end justify-center">
                          <motion.div
                            className={`relative w-full max-w-[28px] rounded-lg overflow-hidden ${
                              day.isToday 
                                ? 'ring-2 ring-primary/50 ring-offset-1 ring-offset-card' 
                                : ''
                            }`}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(8, heightPercent)}%` }}
                            transition={{ duration: 0.5, delay: 0.06 * index + 0.2, ease: "easeOut" }}
                          >
                            <div 
                              className={`absolute inset-0 ${
                                day.calories === 0
                                  ? 'bg-muted/30'
                                  : isOverTarget
                                    ? 'bg-gradient-to-t from-orange-500 to-orange-400'
                                    : isComplete 
                                      ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' 
                                      : 'bg-gradient-to-t from-primary/60 to-primary/40'
                              }`}
                            />
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          </motion.div>
                          
                          {/* Percentage badge on hover for today */}
                          {day.isToday && day.calories > 0 && (
                            <motion.div 
                              className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.8 }}
                            >
                              {percentOfTarget}%
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Day label */}
                        <div className={`mt-1.5 text-center ${
                          day.isToday ? 'relative' : ''
                        }`}>
                          <span className={`text-[10px] font-semibold block ${
                            day.isToday 
                              ? 'text-primary' 
                              : day.calories > 0 
                                ? 'text-foreground' 
                                : 'text-muted-foreground/60'
                          }`}>
                            {day.dayName}
                          </span>
                          {day.isToday && (
                            <div className="w-1 h-1 rounded-full bg-primary mx-auto mt-0.5" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-border/20">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded bg-gradient-to-t from-emerald-500 to-emerald-400" />
                    <span className="text-[9px] text-muted-foreground">Erreicht</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded bg-gradient-to-t from-orange-500 to-orange-400" />
                    <span className="text-[9px] text-muted-foreground">Über Ziel</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded bg-gradient-to-t from-primary/60 to-primary/40" />
                    <span className="text-[9px] text-muted-foreground">Unter 90%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Weekly Progress Footer */}
            <div className="px-4 pb-4">
              <div className="bg-primary/5 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Wochenfortschritt</span>
                  <span className="text-xs font-semibold text-foreground">
                    {totalTrackedCalories.toLocaleString()} / {weeklyTarget.toLocaleString()} kcal
                  </span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, weeklyProgress)}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {daysWithData} von 7 Tagen getrackt
                  </span>
                  <span className="text-[10px] font-medium text-primary">
                    {weeklyProgress}%
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
