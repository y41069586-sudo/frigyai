import { motion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";

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
  const remainingCalories = Math.max(0, targetCalories - caloriesEaten);
  const progress = Math.min(100, (caloriesEaten / targetCalories) * 100);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
                <stop offset="0%" stopColor="hsl(160, 100%, 50%)" />
                <stop offset="100%" stopColor="hsl(140, 100%, 40%)" />
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
        <div className="flex-1 space-y-3">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Noch übrig</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {remainingCalories.toLocaleString('de-DE')}
              <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="pt-2 border-t border-border/30"
          >
            <p className="text-xs text-muted-foreground">
              Tagesziel: <span className="font-semibold text-foreground">{targetCalories.toLocaleString('de-DE')} kcal</span>
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
          color="bg-blue-500"
          bgColor="bg-blue-500/15"
          delay={0.4}
        />
        <MacroPill 
          value={carbsEaten} 
          max={targetCarbs} 
          label="Carbs" 
          color="bg-orange-500"
          bgColor="bg-orange-500/15"
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
    </div>
  );
};
