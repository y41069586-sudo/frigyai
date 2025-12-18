import { motion } from 'framer-motion';

interface MacroRingProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color: 'protein' | 'carbs' | 'fat' | 'calories';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

const colorMap = {
  protein: {
    gradient: 'from-rose-500 to-red-400',
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    stroke: '#f43f5e',
  },
  carbs: {
    gradient: 'from-amber-500 to-yellow-400',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    stroke: '#f59e0b',
  },
  fat: {
    gradient: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    stroke: '#3b82f6',
  },
  calories: {
    gradient: 'from-primary to-green-400',
    bg: 'bg-primary/20',
    text: 'text-primary',
    stroke: 'hsl(var(--primary))',
  },
};

const sizeMap = {
  sm: { ring: 60, stroke: 5, fontSize: 'text-sm', labelSize: 'text-[10px]' },
  md: { ring: 80, stroke: 6, fontSize: 'text-lg', labelSize: 'text-xs' },
  lg: { ring: 100, stroke: 8, fontSize: 'text-xl', labelSize: 'text-sm' },
};

export const MacroRing = ({ 
  value, 
  max, 
  label, 
  unit = 'g', 
  color, 
  size = 'md',
  showPercentage = false 
}: MacroRingProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const isOverLimit = value > max;
  const colors = colorMap[color];
  const sizes = sizeMap[size];
  
  const circumference = 2 * Math.PI * ((sizes.ring - sizes.stroke) / 2);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: sizes.ring, height: sizes.ring }}>
        {/* Background ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${sizes.ring} ${sizes.ring}`}>
          <circle
            cx={sizes.ring / 2}
            cy={sizes.ring / 2}
            r={(sizes.ring - sizes.stroke) / 2}
            fill="none"
            stroke="currentColor"
            strokeWidth={sizes.stroke}
            className="text-muted/20"
          />
        </svg>
        
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${sizes.ring} ${sizes.ring}`}>
          <defs>
            <linearGradient id={`gradient-${color}-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isOverLimit ? '#ef4444' : colors.stroke} />
              <stop offset="100%" stopColor={isOverLimit ? '#dc2626' : colors.stroke} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <motion.circle
            cx={sizes.ring / 2}
            cy={sizes.ring / 2}
            r={(sizes.ring - sizes.stroke) / 2}
            fill="none"
            stroke={`url(#gradient-${color}-${label})`}
            strokeWidth={sizes.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={`font-bold ${sizes.fontSize} ${isOverLimit ? 'text-red-400' : colors.text}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {showPercentage ? `${Math.round(percentage)}%` : value}
          </motion.span>
          {!showPercentage && (
            <span className={`${sizes.labelSize} text-muted-foreground`}>/ {max}{unit}</span>
          )}
        </div>
      </div>
      
      <p className={`mt-2 font-medium ${sizes.labelSize} text-muted-foreground uppercase tracking-wider`}>
        {label}
      </p>
    </div>
  );
};
