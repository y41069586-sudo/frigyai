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
  
  // Calculate percentages for the ring segments
  const proteinCalories = proteinEaten * 4;
  const carbsCalories = carbsEaten * 4;
  const fatCalories = fatEaten * 9;
  const totalEatenCalories = proteinCalories + carbsCalories + fatCalories;
  
  // Proportions of each macro in eaten calories
  const proteinPercent = totalEatenCalories > 0 ? (proteinCalories / targetCalories) * 100 : 0;
  const carbsPercent = totalEatenCalories > 0 ? (carbsCalories / targetCalories) * 100 : 0;
  const fatPercent = totalEatenCalories > 0 ? (fatCalories / targetCalories) * 100 : 0;
  
  // Ring calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash arrays for each segment
  const proteinDash = (Math.min(proteinPercent, 100) / 100) * circumference;
  const carbsDash = (Math.min(carbsPercent, 100) / 100) * circumference;
  const fatDash = (Math.min(fatPercent, 100) / 100) * circumference;
  
  // Offsets for each segment
  const proteinOffset = 0;
  const carbsOffset = -proteinDash;
  const fatOffset = -(proteinDash + carbsDash);

  const macros = [
    { 
      label: "Protein", 
      eaten: proteinEaten, 
      target: targetProtein, 
      color: "hsl(217, 91%, 60%)", // Blue
      unit: "g"
    },
    { 
      label: "Carbs", 
      eaten: carbsEaten, 
      target: targetCarbs, 
      color: "hsl(25, 95%, 53%)", // Orange
      unit: "g"
    },
    { 
      label: "Fette", 
      eaten: fatEaten, 
      target: targetFat, 
      color: "hsl(142, 71%, 45%)", // Green
      unit: "g"
    },
  ];

  return (
    <div className="flex items-center gap-4">
      {/* Macro Ring */}
      <div className="relative" style={{ width: 110, height: 110 }}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            opacity={0.2}
          />
          
          {/* Fat segment (green) - bottom layer */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(142, 71%, 45%)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${fatDash} ${circumference}`}
            strokeDashoffset={fatOffset}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${fatDash} ${circumference}` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
          
          {/* Carbs segment (orange) */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(25, 95%, 53%)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${carbsDash} ${circumference}`}
            strokeDashoffset={carbsOffset}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${carbsDash} ${circumference}` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
          />
          
          {/* Protein segment (blue) - top layer */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${proteinDash} ${circumference}`}
            strokeDashoffset={proteinOffset}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${proteinDash} ${circumference}` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="text-xl font-bold text-foreground"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {caloriesEaten.toLocaleString('de-DE')}
          </motion.span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">KCAL</span>
        </div>
      </div>
      
      {/* Macro Stats */}
      <div className="flex-1 space-y-2">
        {macros.map((macro, i) => (
          <div key={macro.label} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: macro.color }}
            />
            <span className="text-xs text-muted-foreground w-12">{macro.label}</span>
            <div className="flex-1 text-right">
              <span className="text-sm font-semibold text-foreground">{macro.eaten}</span>
              <span className="text-xs text-muted-foreground">/{macro.target}{macro.unit}</span>
            </div>
          </div>
        ))}
        
        {/* Divider */}
        <div className="border-t border-border/50 pt-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Übrig</span>
            <span className="text-sm font-bold text-primary">{remainingCalories.toLocaleString('de-DE')} kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
