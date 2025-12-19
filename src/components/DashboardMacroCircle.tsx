import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardMacroCircleProps {
  calories: number;
  targetCalories: number;
  protein: number;
  targetProtein: number;
  carbs: number;
  targetCarbs: number;
  fat: number;
  targetFat: number;
}

export const DashboardMacroCircle = ({
  calories = 0,
  targetCalories = 2000,
  protein = 0,
  targetProtein = 150,
  carbs = 0,
  targetCarbs = 200,
  fat = 0,
  targetFat = 65,
}: DashboardMacroCircleProps) => {
  const { t } = useLanguage();
  
  const caloriePercent = Math.min((calories / targetCalories) * 100, 100);
  const proteinPercent = Math.min((protein / targetProtein) * 100, 100);
  const carbsPercent = Math.min((carbs / targetCarbs) * 100, 100);
  const fatPercent = Math.min((fat / targetFat) * 100, 100);
  
  const remaining = targetCalories - calories;
  const isOverLimit = calories > targetCalories;

  // SVG calculations
  const size = 200;
  const strokeWidth = 12;
  const outerRadius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * outerRadius;
  const calorieOffset = circumference - (caloriePercent / 100) * circumference;

  const macros = [
    { label: 'Protein', value: protein, target: targetProtein, percent: proteinPercent, color: '#f43f5e' },
    { label: 'Carbs', value: carbs, target: targetCarbs, percent: carbsPercent, color: '#f59e0b' },
    { label: 'Fat', value: fat, target: targetFat, percent: fatPercent, color: '#3b82f6' },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Main Circle */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={outerRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
        </svg>
        
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="calorie-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isOverLimit ? '#ef4444' : 'hsl(var(--primary))'} />
              <stop offset="100%" stopColor={isOverLimit ? '#dc2626' : 'hsl(142 76% 36%)'} />
            </linearGradient>
          </defs>
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={outerRadius}
            fill="none"
            stroke="url(#calorie-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: calorieOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={`text-4xl font-bold ${isOverLimit ? 'text-destructive' : 'text-foreground'}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {remaining >= 0 ? remaining : `+${Math.abs(remaining)}`}
          </motion.span>
          <span className="text-sm text-muted-foreground">
            {remaining >= 0 ? 'kcal übrig' : 'kcal drüber'}
          </span>
          <span className="text-xs text-muted-foreground/70 mt-1">
            {calories} / {targetCalories}
          </span>
        </div>
      </div>
      
      {/* Macro Pills */}
      <div className="flex gap-3 mt-6">
        {macros.map((macro, i) => (
          <motion.div
            key={macro.label}
            className="flex flex-col items-center gap-1 px-3 py-2 bg-muted/50 rounded-xl border border-border/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: macro.color }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {macro.label}
              </span>
            </div>
            <span className="text-sm font-bold">
              {macro.value}
              <span className="text-xs font-normal text-muted-foreground">/{macro.target}g</span>
            </span>
            {/* Mini progress bar */}
            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: macro.color }}
                initial={{ width: 0 }}
                animate={{ width: `${macro.percent}%` }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
