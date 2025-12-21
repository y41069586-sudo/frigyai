import { motion } from "framer-motion";

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
  
  // Arc calculations for semi-circle
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = Math.PI * normalizedRadius; // Half circle
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const macros = [
    { 
      label: "Protein", 
      eaten: proteinEaten, 
      target: targetProtein, 
      color: "from-blue-500 to-blue-400",
      bgColor: "bg-blue-500/20",
      textColor: "text-blue-500"
    },
    { 
      label: "Carbs", 
      eaten: carbsEaten, 
      target: targetCarbs, 
      color: "from-orange-500 to-amber-400",
      bgColor: "bg-orange-500/20",
      textColor: "text-orange-500"
    },
    { 
      label: "Fette", 
      eaten: fatEaten, 
      target: targetFat, 
      color: "from-emerald-500 to-green-400",
      bgColor: "bg-emerald-500/20",
      textColor: "text-emerald-500"
    },
  ];

  return (
    <div className="relative">
      {/* Glow effect background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl blur-xl" />
      
      <div className="relative bg-gradient-to-b from-card/80 to-card rounded-3xl p-6 backdrop-blur-sm border border-border/50">
        {/* Semi-circle gauge */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative" style={{ width: radius * 2, height: radius + 10 }}>
            <svg 
              width={radius * 2} 
              height={radius + 10} 
              className="overflow-visible"
            >
              {/* Glow filter */}
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
                </linearGradient>
              </defs>
              
              {/* Background arc */}
              <path
                d={`M ${strokeWidth/2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth/2} ${radius}`}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={0.3}
              />
              
              {/* Progress arc */}
              <motion.path
                d={`M ${strokeWidth/2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth/2} ${radius}`}
                fill="none"
                stroke="url(#arcGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                filter="url(#glow)"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground tracking-tight">
                    {caloriesEaten.toLocaleString('de-DE')}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">kcal</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    von {targetCalories.toLocaleString('de-DE')}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    {remainingCalories.toLocaleString('de-DE')} übrig
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Macro bars */}
        <div className="space-y-3">
          {macros.map((macro, index) => {
            const macroProgress = Math.min(100, (macro.eaten / macro.target) * 100);
            
            return (
              <motion.div
                key={macro.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${macro.color}`} />
                    <span className="text-sm font-medium text-foreground">{macro.label}</span>
                  </div>
                  <div className="text-sm">
                    <span className={`font-bold ${macro.textColor}`}>{macro.eaten}g</span>
                    <span className="text-muted-foreground"> / {macro.target}g</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${macro.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${macroProgress}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
