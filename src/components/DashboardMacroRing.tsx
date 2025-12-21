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
    { label: "P", eaten: proteinEaten, target: targetProtein, color: "hsl(217, 91%, 60%)", angle: -60 },
    { label: "C", eaten: carbsEaten, target: targetCarbs, color: "hsl(25, 95%, 53%)", angle: 60 },
    { label: "F", eaten: fatEaten, target: targetFat, color: "hsl(142, 71%, 45%)", angle: 180 },
  ];

  return (
    <div className="flex justify-center">
      {/* Large Macro Ring */}
      <div className="relative" style={{ width: 240, height: 240 }}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Gray background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            opacity={0.3}
          />
          
          {/* Protein segment (blue) */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth="12"
            strokeLinecap="round"
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
            strokeWidth="12"
            strokeLinecap="round"
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
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${fatSegment} ${circumference}`}
            strokeDashoffset={-(proteinSegment + carbsSegment)}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${fatSegment} ${circumference}` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        
        {/* Macro labels positioned around the ring */}
        {macros.map((macro) => {
          const angleRad = (macro.angle * Math.PI) / 180;
          const labelRadius = 100; // Position on the ring edge
          const x = 120 + labelRadius * Math.cos(angleRad);
          const y = 120 + labelRadius * Math.sin(angleRad);
          
          return (
            <div
              key={macro.label}
              className="absolute flex flex-col items-center"
              style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                style={{ backgroundColor: macro.color }}
              >
                {macro.label}
              </div>
              <span className="text-[10px] text-foreground font-semibold mt-1">
                {macro.eaten}g
              </span>
              <span className="text-[9px] text-muted-foreground">
                /{macro.target}g
              </span>
            </div>
          );
        })}
        
        {/* Center content - just calories */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {caloriesEaten.toLocaleString('de-DE')}
          </motion.span>
          <span className="text-xs text-muted-foreground">kcal gegessen</span>
          <div className="mt-1">
            <span className="text-sm font-semibold text-primary">{remainingCalories.toLocaleString('de-DE')}</span>
            <span className="text-xs text-muted-foreground ml-1">übrig</span>
          </div>
        </div>
      </div>
    </div>
  );
};
