import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

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
            // Show planned calories as a lighter indicator
            days[index].calories = dayPlan.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
          }
        }
      });

      setWeekData(days);
    };

    fetchWeekData();
  }, [user, targetCalories]);

  const hasAnyData = weekData.some(d => d.calories > 0 || d.hasMealPlan);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">Diese Woche</h2>
        <button 
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          onClick={() => navigate('/meal-plans?tab=meals')}
        >
          Wochenplan <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div 
        className="p-4 bg-card rounded-2xl border border-border/30 cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => navigate('/meal-plans?tab=tracker')}
      >
        {!hasAnyData ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-2">Noch keine Daten diese Woche</p>
            <p className="text-primary text-sm font-medium">Tracke deine Mahlzeiten →</p>
          </div>
        ) : (
          <div className="flex justify-between gap-1">
            {weekData.map((day, index) => {
              const progress = Math.min(100, (day.calories / day.target) * 100);
              const isComplete = progress >= 80;
              
              return (
                <motion.div
                  key={day.date}
                  className="flex flex-col items-center flex-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                >
                  <span className={`text-[10px] font-medium mb-2 ${day.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {day.dayName}
                  </span>
                  
                  {/* Progress bar */}
                  <div className="relative w-full h-16 bg-muted/20 rounded-lg overflow-hidden">
                    <motion.div
                      className={`absolute bottom-0 left-0 right-0 rounded-lg ${
                        day.isToday 
                          ? 'bg-gradient-to-t from-primary to-primary/60' 
                          : isComplete 
                            ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' 
                            : day.hasMealPlan && day.calories > 0
                              ? 'bg-gradient-to-t from-primary/40 to-primary/20'
                              : 'bg-gradient-to-t from-muted-foreground/30 to-muted-foreground/10'
                      }`}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(5, progress)}%` }}
                      transition={{ duration: 0.5, delay: 0.1 * index + 0.3, ease: "easeOut" }}
                    />
                    
                    {/* Checkmark for complete days */}
                    {isComplete && !day.isToday && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + 0.1 * index, duration: 0.3 }}
                      >
                        <span className="text-white text-xs">✓</span>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Calories */}
                  <span className={`text-[9px] mt-1.5 font-medium ${day.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {day.calories > 0 ? day.calories : '-'}
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
