import { motion } from "framer-motion";
import { Flame } from "lucide-react";

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

const MiniRing = ({ 
  value, 
  max, 
  label, 
  color, 
  delay = 0 
}: { 
  value: number; 
  max: number; 
  label: string; 
  color: string; 
  delay?: number;
}) => {
  const progress = Math.min(100, (value / max) * 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div 
      className="flex flex-col items-center cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
    >
      <motion.div 
        className="relative w-[72px] h-[72px]"
        whileTap={{ 
          rotate: [0, -5, 5, -5, 0],
          transition: { duration: 0.4 }
        }}
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/20"
          />
          <motion.circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          whileTap={{ scale: 1.1 }}
        >
          <span className="text-base font-bold text-foreground">{value}</span>
          <span className="text-[8px] text-muted-foreground uppercase">/{max}g</span>
        </motion.div>
      </motion.div>
      <span className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wide">{label}</span>
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
  const remainingCalories = Math.max(0, targetCalories - caloriesEaten);
  const progress = Math.min(100, (caloriesEaten / targetCalories) * 100);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-orange-500/10" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative p-5">
        {/* Main calorie display */}
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-3">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">Heute</span>
          </div>
          
          <div className="flex items-baseline justify-center gap-2">
            <motion.span 
              className="text-5xl font-black text-foreground tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {caloriesEaten.toLocaleString('de-DE')}
            </motion.span>
            <span className="text-lg text-muted-foreground font-medium">kcal</span>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 mx-auto max-w-[200px]">
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-orange-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ boxShadow: '0 0 12px hsl(var(--primary) / 0.5)' }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
              <span>0</span>
              <span className="font-semibold text-primary">{remainingCalories.toLocaleString('de-DE')} übrig</span>
              <span>{targetCalories.toLocaleString('de-DE')}</span>
            </div>
          </div>
        </motion.div>
        
        {/* Macro rings row */}
        <div className="flex justify-center gap-6">
          <MiniRing 
            value={proteinEaten} 
            max={targetProtein} 
            label="Protein" 
            color="#3b82f6"
            delay={0.3}
          />
          <MiniRing 
            value={carbsEaten} 
            max={targetCarbs} 
            label="Carbs" 
            color="#f97316"
            delay={0.4}
          />
          <MiniRing 
            value={fatEaten} 
            max={targetFat} 
            label="Fette" 
            color="#22c55e"
            delay={0.5}
          />
        </div>
      </div>
    </div>
  );
};
