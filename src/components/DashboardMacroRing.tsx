import { motion } from "framer-motion";
import { Flame, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  icon: Icon,
  color,
  bgColor,
  delay = 0 
}: { 
  value: number; 
  max: number; 
  label: string; 
  icon: any;
  color: string;
  bgColor: string;
  delay?: number;
}) => {
  const progress = Math.min(100, (value / max) * 100);
  const isComplete = progress >= 100;
  const isNear = progress >= 80;

  return (
    <motion.div 
      className="flex-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${bgColor}`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{value}/{max}g</p>
        </div>
      </div>
      <div className={`h-1.5 rounded-full ${bgColor} overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${color} transition-all`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
        />
      </div>
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
  
  const progress = Math.min(100, (caloriesEaten / targetCalories) * 100);
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Determine color based on progress
  let ringGradientId = "progressGradientGreen";
  let ringColor = "hsl(142, 72%, 29%)";
  if (progress > 100) {
    ringGradientId = "progressGradientRed";
    ringColor = "hsl(0, 84%, 60%)";
  } else if (progress > 80) {
    ringGradientId = "progressGradientOrange";
    ringColor = "hsl(38, 92%, 50%)";
  }

  // Fetch week data
  useEffect(() => {
    const fetchWeekData = async () => {
      const days: DayData[] = [];
      const today = new Date();
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

      for (let i = -2; i <= 2; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
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

      const todayIndex = days.findIndex(d => d.isToday);
      if (todayIndex !== -1) {
        days[todayIndex].calories = caloriesEaten;
        days[todayIndex].percentAchieved = Math.round((caloriesEaten / targetCalories) * 100);
      }

      setWeekData(days);
    };

    fetchWeekData();
  }, [user, targetCalories, caloriesEaten]);

  const remainingCalories = Math.max(0, targetCalories - caloriesEaten);
  const todayPercent = Math.round((caloriesEaten / targetCalories) * 100);

  return (
    <div className="space-y-6">
      {/* Main Ring Section */}
      <div className="flex items-center justify-between gap-8">
        {/* Circular Ring */}
        <motion.div 
          className="relative flex-shrink-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 180 180">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              className="text-muted-foreground/10"
            />
            {/* Progress circle */}
            <motion.circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              filter="drop-shadow(0 0 8px currentColor)"
              style={{ opacity: progress > 0 ? 1 : 0.3 }}
            />
            <defs>
              <linearGradient id="progressGradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(142, 72%, 29%)" />
                <stop offset="100%" stopColor="hsl(142, 76%, 36%)" />
              </linearGradient>
              <linearGradient id="progressGradientOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(38, 92%, 50%)" />
                <stop offset="100%" stopColor="hsl(38, 93%, 45%)" />
              </linearGradient>
              <linearGradient id="progressGradientRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(0, 84%, 60%)" />
                <stop offset="100%" stopColor="hsl(0, 89%, 47%)" />
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
              <span className="text-4xl font-black text-foreground tracking-tight">
                {caloriesEaten.toLocaleString('de-DE')}
              </span>
              <span className="block text-xs text-muted-foreground font-semibold tracking-wide">kcal</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 opacity-70">von {targetCalories}</span>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Right side stats */}
        <motion.div
          className="flex-1 space-y-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {/* Progress percent */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
            <p className="text-xs text-muted-foreground font-medium mb-1">Fortschritt</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">{todayPercent}%</span>
              <span className="text-xs text-muted-foreground">erreicht</span>
            </div>
          </div>
          
          {/* Remaining or Over */}
          <div className={`rounded-2xl p-4 border ${
            progress <= 100 
              ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20' 
              : 'bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20'
          }`}>
            <p className="text-xs text-muted-foreground font-medium mb-1">
              {progress > 100 ? 'Über Ziel' : 'Verbleibend'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${progress > 100 ? 'text-orange-600' : 'text-emerald-600'}`}>
                {Math.abs(remainingCalories).toLocaleString('de-DE')}
              </span>
              <span className="text-xs text-muted-foreground">kcal</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Macro Pills - Compact Grid */}
      <div className="grid grid-cols-3 gap-3">
        <MacroPill 
          value={proteinEaten} 
          max={targetProtein} 
          label="Protein" 
          icon={Zap}
          color="bg-blue-500 text-blue-600"
          bgColor="bg-blue-500/10"
          delay={0.4}
        />
        <MacroPill 
          value={carbsEaten} 
          max={targetCarbs} 
          label="Kohlenhydrate" 
          icon={TrendingUp}
          color="bg-orange-500 text-orange-600"
          bgColor="bg-orange-500/10"
          delay={0.5}
        />
        <MacroPill 
          value={fatEaten} 
          max={targetFat} 
          label="Fett" 
          icon={Flame}
          color="bg-rose-500 text-rose-600"
          bgColor="bg-rose-500/10"
          delay={0.6}
        />
      </div>

      {/* Week Progress */}
      {weekData.length > 0 && (
        <motion.div
          className="pt-4 border-t border-border/40"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Wochenübersicht</p>
          <div className="flex items-end justify-between gap-2 h-12">
            {weekData.map((day, index) => {
              const dayProgress = Math.min(100, (day.percentAchieved / 100) * 100);
              const height = Math.max(8, (dayProgress / 100) * 100);
              
              return (
                <motion.div
                  key={day.date}
                  className="flex flex-col items-center flex-1 gap-1.5"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index + 0.7, duration: 0.3 }}
                  title={`${day.dayShort}: ${day.percentAchieved}%`}
                >
                  {/* Bar */}
                  <div className="w-full h-full rounded-t-lg bg-muted/30 overflow-hidden">
                    <motion.div
                      className={`w-full h-full rounded-t-lg ${
                        day.isToday 
                          ? 'bg-gradient-to-t from-primary to-primary/80' 
                          : day.percentAchieved >= 100 
                            ? 'bg-gradient-to-t from-orange-500/60 to-orange-500/40'
                            : day.percentAchieved >= 80
                              ? 'bg-gradient-to-t from-emerald-500/60 to-emerald-500/40'
                              : 'bg-muted/50'
                      }`}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.6, delay: 0.08 * index + 0.8 }}
                    />
                  </div>
                  
                  {/* Label */}
                  <span className={`text-xs font-bold ${day.isToday ? 'text-primary' : 'text-muted-foreground/50'}`}>
                    {day.dayShort}
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
