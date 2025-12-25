import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

interface DayData {
  date: string;
  dayName: string;
  dayShort: string;
  calories: number;
  target: number;
  isToday: boolean;
  percentAchieved: number;
}

interface DashboardWeekDaysProps {
  targetCalories: number;
}

export const DashboardWeekDays = ({ targetCalories }: DashboardWeekDaysProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weekData, setWeekData] = useState<DayData[]>([]);

  useEffect(() => {
    const fetchWeekData = async () => {
      const days: DayData[] = [];
      const today = new Date();
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const fullDayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

      // Get 5 days centered around today (2 before, today, 2 after)
      for (let i = -2; i <= 2; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        
        days.push({
          date: dateStr,
          dayName: fullDayNames[dayOfWeek],
          dayShort: dayNames[dayOfWeek],
          calories: 0,
          target: targetCalories,
          isToday: i === 0,
          percentAchieved: 0,
        });
      }

      // Fetch actual tracked data from DB
      if (user) {
        const startDate = days[0].date;
        const endDate = days[days.length - 1].date;

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
              days[dayIndex].percentAchieved = Math.round((entry.calories / targetCalories) * 100);
            }
          });
        }
      }

      setWeekData(days);
    };

    fetchWeekData();

    // Subscribe to realtime updates
    if (user) {
      const channel = supabase
        .channel('dashboard-week-days')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_macros',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchWeekData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, targetCalories]);

  if (weekData.length === 0) return null;

  const todayData = weekData.find(d => d.isToday);
  const todayPercent = todayData?.percentAchieved || 0;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div 
        className="p-4 bg-card rounded-2xl border border-border/30 cursor-pointer active:scale-[0.99] transition-transform"
        onClick={() => navigate('/meal-plans?tab=tracker')}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-foreground">Makro Tracker</p>
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-semibold">{todayPercent}%</span> erreicht
          </p>
        </div>

        {/* Week Days Row */}
        <div className="flex items-center justify-between gap-1">
          {weekData.map((day, index) => {
            const isComplete = day.percentAchieved >= 90;
            const isOver = day.percentAchieved > 100;
            const distanceFromCenter = Math.abs(index - 2); // 2 is center (today)
            const opacity = day.isToday ? 1 : 1 - (distanceFromCenter * 0.25);
            const scale = day.isToday ? 1 : 0.85 - (distanceFromCenter * 0.05);
            
            return (
              <motion.div
                key={day.date}
                className="flex flex-col items-center"
                style={{ opacity }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity, scale }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
              >
                {/* Day circle */}
                <div 
                  className={`relative flex items-center justify-center transition-all ${
                    day.isToday 
                      ? 'w-14 h-14 rounded-2xl ring-2 ring-primary/50' 
                      : 'w-10 h-10 rounded-xl'
                  } ${
                    day.calories === 0
                      ? 'bg-muted/20'
                      : isOver
                        ? 'bg-orange-500/20'
                        : isComplete
                          ? 'bg-emerald-500/20'
                          : 'bg-primary/15'
                  }`}
                >
                  {isComplete && !day.isToday ? (
                    <Check className={`w-4 h-4 ${isOver ? 'text-orange-500' : 'text-emerald-500'}`} />
                  ) : (
                    <span className={`font-bold ${
                      day.isToday ? 'text-lg text-primary' : 'text-xs text-foreground/70'
                    }`}>
                      {day.isToday ? `${day.percentAchieved}%` : day.dayShort}
                    </span>
                  )}

                  {/* Today indicator dot */}
                  {day.isToday && (
                    <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
                
                {/* Day label */}
                <span className={`mt-1.5 text-[10px] font-medium ${
                  day.isToday 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}>
                  {day.isToday ? 'Heute' : day.dayShort}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
