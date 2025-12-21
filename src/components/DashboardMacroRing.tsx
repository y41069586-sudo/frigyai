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
  
  // Calculate calories from each macro
  const proteinCalories = proteinEaten * 4;
  const carbsCalories = carbsEaten * 4;
  const fatCalories = fatEaten * 9;
  
  // Ring calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate each segment as portion of target calories
  const proteinSegment = (proteinCalories / targetCalories) * circumference;
  const carbsSegment = (carbsCalories / targetCalories) * circumference;
  const fatSegment = (fatCalories / targetCalories) * circumference;

  const macros = [
    { label: "Protein", eaten: proteinEaten, target: targetProtein, color: "hsl(217, 91%, 60%)" },
    { label: "Carbs", eaten: carbsEaten, target: targetCarbs, color: "hsl(25, 95%, 53%)" },
    { label: "Fette", eaten: fatEaten, target: targetFat, color: "hsl(142, 71%, 45%)" },
  ];

  return (
    <div className="flex justify-center">
      {/* Large Macro Ring with all data inside */}
      <div className="relative" style={{ width: 220, height: 220 }}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            opacity={0.2}
          />
          
          {/* Protein segment (blue) */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth="8"
            strokeDasharray={`${proteinSegment} ${circumference}`}
            strokeDashoffset={0}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${proteinSegment} ${circumference}` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* Carbs segment (orange) */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(25, 95%, 53%)"
            strokeWidth="8"
            strokeDasharray={`${carbsSegment} ${circumference}`}
            strokeDashoffset={-proteinSegment}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${carbsSegment} ${circumference}` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
          
          {/* Fat segment (green) */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(142, 71%, 45%)"
            strokeWidth="8"
            strokeDasharray={`${fatSegment} ${circumference}`}
            strokeDashoffset={-(proteinSegment + carbsSegment)}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${fatSegment} ${circumference}` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        
        {/* All content inside the circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          {/* Main calories */}
          <motion.div 
            className="text-center mb-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span className="text-3xl font-bold text-foreground">{caloriesEaten.toLocaleString('de-DE')}</span>
            <span className="text-sm text-muted-foreground ml-1">kcal</span>
          </motion.div>
          
          {/* Remaining */}
          <div className="text-xs text-muted-foreground mb-3">
            <span className="text-primary font-semibold">{remainingCalories.toLocaleString('de-DE')}</span> übrig
          </div>
          
          {/* Macro breakdown */}
          <div className="flex gap-3 text-[10px]">
            {macros.map((macro) => (
              <div key={macro.label} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: macro.color }}
                />
                <span className="text-muted-foreground">{macro.eaten}/{macro.target}g</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
