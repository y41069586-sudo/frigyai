import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { BarChart3, ChevronRight } from "lucide-react";

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

    // Subscribe to realtime updates for daily_macros
    if (user) {
      const channel = supabase
        .channel('week-progress-macros')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_macros',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('[WEEK-PROGRESS] Macro update received, refreshing...');
            fetchWeekData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, targetCalories]);

  const hasAnyData = weekData.some(d => d.calories > 0 || d.hasMealPlan);
  const maxCalories = Math.max(...weekData.map(d => d.calories), targetCalories);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Diese Woche</h2>
        </div>
        <button 
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
          onClick={() => navigate('/meal-plans?tab=meals')}
        >
          Details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div 
        className="p-4 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/20 cursor-pointer hover:border-primary/30 transition-all"
        onClick={() => navigate('/meal-plans?tab=tracker')}
      >
        {!hasAnyData ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">Noch keine Daten</p>
            <p className="text-primary text-sm font-medium">Tracke deine Mahlzeiten →</p>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-2 h-24">
            {weekData.map((day, index) => {
              const heightPercent = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;
              const isComplete = day.calories >= day.target * 0.8;
              
              return (
                <motion.div
                  key={day.date}
                  className="flex flex-col items-center flex-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index, duration: 0.3 }}
                >
                  {/* Bar */}
                  <div className="relative w-full h-16 flex items-end justify-center mb-2">
                    <motion.div
                      className={`w-full max-w-[28px] rounded-lg ${
                        day.isToday 
                          ? 'bg-gradient-to-t from-primary to-primary/60 shadow-[0_0_12px_hsla(160,100%,50%,0.3)]' 
                          : isComplete 
                            ? 'bg-gradient-to-t from-emerald-500/80 to-emerald-400/60' 
                            : day.calories > 0
                              ? 'bg-gradient-to-t from-primary/30 to-primary/15'
                              : 'bg-muted/20'
                      }`}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(8, heightPercent)}%` }}
                      transition={{ duration: 0.5, delay: 0.08 * index + 0.2, ease: "easeOut" }}
                    />
                  </div>
                  
                  {/* Day label */}
                  <span className={`text-[10px] font-medium ${
                    day.isToday 
                      ? 'text-primary font-semibold' 
                      : 'text-muted-foreground'
                  }`}>
                    {day.dayName}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
