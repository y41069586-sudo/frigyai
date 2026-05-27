import { motion } from "framer-motion";
import { Flame, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalDateISO } from "@/lib/localDate";

interface DashboardMacroRingProps {
  caloriesEaten: number;
  targetCalories: number;
  proteinEaten: number;
  targetProtein: number;
  carbsEaten: number;
  targetCarbs: number;
  fatEaten: number;
  targetFat: number;
}

interface DayData {
  date: string;
  dayShort: string;
  calories: number;
  target: number;
  isToday: boolean;
  percentAchieved: number;
}

const MacroPill = ({ 
  value, 
  max, 
  label, 
  color,
  bgColor,
  delay = 0 
}: { 
  value: number; 
  max: number; 
  label: string; 
  color: string;
  bgColor: string;
  delay?: number;
}) => {
  const progress = Math.min(100, (value / max) * 100);

  return (
    <motion.div 
      className="flex-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}g</span>
      </div>
      <div className={`h-2 rounded-full ${bgColor} overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground mt-0.5 block text-right">/{max}g</span>
    </motion.div>
  );
};

export const DashboardMacroRing = ({
  caloriesEaten,
  targetCalories,
  proteinEaten,
  targetProtein,
  carbsEaten,
  targetCarbs,
  fatEaten,
  targetFat,
}: DashboardMacroRingProps) => {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<DayData[]>([]);
  
  const remainingCalories = Math.max(0, targetCalories - caloriesEaten);
  const progress = Math.min(100, (caloriesEaten / targetCalories) * 100);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Fetch week data
  useEffect(() => {
    const fetchWeekData = async () => {
      const days: DayData[] = [];
      const today = new Date();
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

      // Get 5 days centered around today
      for (let i = -2; i <= 2; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = getLocalDateISO(date);
        const dayOfWeek = date.getDay();
        
        days.push({
          date: dateStr,
          dayShort: dayNames[dayOfWeek],
          calories: 0,
          target: targetCalories,
          isToday: i === 0,
          percentAchieved: 0,
        });
      }

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

      // Update today's data with current caloriesEaten
      const todayIndex = days.findIndex(d => d.isToday);
      if (todayIndex !== -1) {
        days[todayIndex].calories = caloriesEaten;
        days[todayIndex].percentAchieved = Math.round((caloriesEaten / targetCalories) * 100);
      }

      setWeekData(days);
    };

    fetchWeekData();
  }, [user, targetCalories, caloriesEaten]);

  const todayPercent = Math.round((caloriesEaten / targetCalories) * 100);

  return (
    <div className="relative">
      {/* Main circular progress with calories */}
      <div className="flex items-center gap-6">
        {/* Circular Progress Ring */}
        <motion.div 
          className="relative flex-shrink-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-muted-foreground/25"
            />
            {/* Progress circle */}
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(142, 71%, 45%)" />
                <stop offset="100%" stopColor="hsl(142, 71%, 35%)" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <span className="text-3xl font-black text-foreground tracking-tight">
                {caloriesEaten.toLocaleString('de-DE')}
              </span>
              <span className="block text-xs text-muted-foreground font-medium">kcal</span>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Right side info */}
        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <p className="text-sm text-muted-foreground mb-1">Tagesziel</p>
            <p className="text-2xl font-bold text-foreground">
              {targetCalories.toLocaleString('de-DE')}
              <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
            </p>
          </motion.div>
        </div>
      </div>
      
      {/* Macro bars */}
      <div className="flex gap-4 mt-5 pt-4 border-t border-border/20">
        <MacroPill 
          value={proteinEaten} 
          max={targetProtein} 
          label="Protein" 
          color="bg-emerald-500"
          bgColor="bg-emerald-500/15"
          delay={0.4}
        />
        <MacroPill 
          value={carbsEaten} 
          max={targetCarbs} 
          label="Carbs" 
          color="bg-emerald-500"
          bgColor="bg-emerald-500/15"
          delay={0.5}
        />
        <MacroPill 
          value={fatEaten} 
          max={targetFat} 
          label="Fett" 
          color="bg-emerald-500"
          bgColor="bg-emerald-500/15"
          delay={0.6}
        />
      </div>

      {/* Week Days Progress - Inline */}
      {weekData.length > 0 && (
        <motion.div
          className="mt-5 pt-4 border-t border-border/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between gap-2">
            {weekData.map((day, index) => {
              const isComplete = day.percentAchieved >= 90;
              const isOver = day.percentAchieved > 100;
              const distanceFromCenter = Math.abs(index - 2);
              const opacity = day.isToday ? 1 : 0.4 - (distanceFromCenter * 0.08);
              
              return (
                <motion.div
                  key={day.date}
                  className="flex flex-col items-center flex-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: day.isToday ? 1 : opacity, scale: 1 }}
                  transition={{ delay: 0.08 * index + 0.7, duration: 0.3 }}
                >
                  {/* Day circle - only for today */}
                  {day.isToday ? (
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {day.percentAchieved}%
                      </span>
                    </div>
                  ) : (
                    <div className="w-9 h-9 flex items-center justify-center">
                      {isComplete ? (
                        <Check className={`w-4 h-4 ${isOver ? 'text-orange-400/60' : 'text-emerald-400/60'}`} />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground/40">
                          {day.dayShort}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Day label */}
                  <span className={`mt-1 text-[9px] font-medium ${
                    day.isToday 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-muted-foreground/30'
                  }`}>
                    {day.isToday ? 'Heute' : day.dayShort}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};
