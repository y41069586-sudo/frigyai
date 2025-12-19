import { motion } from 'framer-motion';

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
  const caloriePercent = Math.min((calories / targetCalories) * 100, 100);
  const proteinPercent = Math.min((protein / targetProtein) * 100, 100);
  const carbsPercent = Math.min((carbs / targetCarbs) * 100, 100);
  const fatPercent = Math.min((fat / targetFat) * 100, 100);
  
  const remaining = targetCalories - calories;
  const isOverLimit = calories > targetCalories;

  // SVG calculations - smaller size
  const size = 140;
  const strokeWidth = 10;
  const outerRadius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * outerRadius;
  const calorieOffset = circumference - (caloriePercent / 100) * circumference;

  // Inner rings for macros
  const innerSize = 100;
  const innerStroke = 4;
  const innerRadius = (innerSize - innerStroke) / 2;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const macros = [
    { label: 'P', value: protein, target: targetProtein, percent: proteinPercent, color: '#f43f5e', offset: 0 },
    { label: 'C', value: carbs, target: targetCarbs, percent: carbsPercent, color: '#f59e0b', offset: 120 },
    { label: 'F', value: fat, target: targetFat, percent: fatPercent, color: '#3b82f6', offset: 240 },
  ];

  return (
    <div className="flex items-center gap-6">
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
            <linearGradient id="calorie-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isOverLimit ? '#ef4444' : 'hsl(var(--primary))'} />
              <stop offset="100%" stopColor={isOverLimit ? '#dc2626' : 'hsl(142 76% 46%)'} />
            </linearGradient>
          </defs>
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={outerRadius}
            fill="none"
            stroke="url(#calorie-grad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: calorieOffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={`text-2xl font-bold ${isOverLimit ? 'text-destructive' : 'text-foreground'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {remaining >= 0 ? remaining : `+${Math.abs(remaining)}`}
          </motion.span>
          <span className="text-[10px] text-muted-foreground">kcal übrig</span>
        </div>
      </div>
      
      {/* Macro Stats - Vertical */}
      <div className="flex flex-col gap-2">
        {macros.map((macro, i) => (
          <motion.div
            key={macro.label}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            {/* Mini ring */}
            <div className="relative w-8 h-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/20" />
                <motion.circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke={macro.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 12}
                  initial={{ strokeDashoffset: 2 * Math.PI * 12 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 12) * (1 - macro.percent / 100) }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                />
              </svg>
              <span 
                className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                style={{ color: macro.color }}
              >
                {macro.label}
              </span>
            </div>
            
            {/* Value */}
            <div className="text-xs">
              <span className="font-semibold">{macro.value}</span>
              <span className="text-muted-foreground">/{macro.target}g</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
