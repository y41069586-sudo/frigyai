import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DayProgress {
  date: string;
  dayName: string;
  calories: number;
  target: number;
  isToday: boolean;
}

interface WeekProgressWidgetProps {
  targetCalories: number;
}

export const WeekProgressWidget = ({ targetCalories }: WeekProgressWidgetProps) => {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<DayProgress[]>([]);

  useEffect(() => {
    const fetchWeekData = async () => {
      const days: DayProgress[] = [];
      const today = new Date();
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        days.push({
          date: dateStr,
          dayName: dayNames[date.getDay()],
          calories: 0,
          target: targetCalories,
          isToday: i === 0,
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

      setWeekData(days);
    };

    fetchWeekData();
  }, [user, targetCalories]);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">Diese Woche</h2>
      </div>
      
      <div className="p-4 bg-card rounded-2xl border border-border/30">
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
      </div>
    </motion.div>
  );
};
