import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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
  const navigate = useNavigate();
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Calculate calorie values for each macro
  const proteinCalories = targetProtein * 4;
  const carbsCalories = targetCarbs * 4;
  const fatCalories = targetFat * 9;
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  // Calculate percentages
  const proteinPercent = (proteinCalories / totalMacroCalories) * 100;
  const carbsPercent = (carbsCalories / totalMacroCalories) * 100;
  const fatPercent = (fatCalories / totalMacroCalories) * 100;

  // SVG settings
  const size = 200;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate segment offsets
  const proteinOffset = 0;
  const carbsOffset = (proteinPercent / 100) * circumference;
  const fatOffset = ((proteinPercent + carbsPercent) / 100) * circumference;

  const segments = [
    {
      id: 'protein',
      label: 'Protein',
      calories: proteinCalories,
      grams: targetProtein,
      percent: proteinPercent,
      color: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.4)',
      offset: proteinOffset,
    },
    {
      id: 'carbs',
      label: 'Kohlenhydrate',
      calories: carbsCalories,
      grams: targetCarbs,
      percent: carbsPercent,
      color: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.4)',
      offset: carbsOffset,
    },
    {
      id: 'fat',
      label: 'Fette',
      calories: fatCalories,
      grams: targetFat,
      percent: fatPercent,
      color: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.4)',
      offset: fatOffset,
    },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Interactive Donut Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg className="absolute inset-0" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            opacity={0.2}
          />
        </svg>

        {/* Segment Circles */}
        <svg 
          className="absolute inset-0 -rotate-90" 
          viewBox={`0 0 ${size} ${size}`}
          style={{ filter: hoveredSegment ? 'none' : 'none' }}
        >
          <defs>
            {segments.map((seg) => (
              <filter key={`glow-${seg.id}`} id={`glow-${seg.id}`}>
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}
          </defs>
          
          {segments.map((seg, index) => {
            const segmentLength = (seg.percent / 100) * circumference;
            const dashArray = `${segmentLength - 2} ${circumference - segmentLength + 2}`;
            const isHovered = hoveredSegment === seg.id;
            
            return (
              <motion.circle
                key={seg.id}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={-seg.offset}
                strokeLinecap="butt"
                className="cursor-pointer transition-all duration-200"
                filter={isHovered ? `url(#glow-${seg.id})` : 'none'}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: -seg.offset }}
                transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
                onMouseEnter={() => setHoveredSegment(seg.id)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => navigate('/')}
                style={{
                  opacity: hoveredSegment && hoveredSegment !== seg.id ? 0.5 : 1,
                }}
              />
            );
          })}
        </svg>

        {/* Separating Lines */}
        <svg className="absolute inset-0 -rotate-90 pointer-events-none" viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg, index) => {
            const angle = (seg.offset / circumference) * 360;
            const angleRad = (angle * Math.PI) / 180;
            const innerR = radius - strokeWidth / 2 - 2;
            const outerR = radius + strokeWidth / 2 + 2;
            
            const x1 = center + innerR * Math.cos(angleRad);
            const y1 = center + innerR * Math.sin(angleRad);
            const x2 = center + outerR * Math.cos(angleRad);
            const y2 = center + outerR * Math.sin(angleRad);
            
            return (
              <line
                key={`line-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--background))"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <span className="text-3xl font-bold text-foreground">{targetCalories}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">kcal Ziel</span>
          </motion.div>
        </div>
      </div>

      {/* Macro Legend with Calories */}
      <div className="flex gap-4 justify-center flex-wrap">
        {segments.map((seg, index) => (
          <motion.div
            key={seg.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
              hoveredSegment === seg.id 
                ? 'bg-card shadow-md scale-105' 
                : 'hover:bg-card/50'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            onMouseEnter={() => setHoveredSegment(seg.id)}
            onMouseLeave={() => setHoveredSegment(null)}
            onClick={() => navigate('/')}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: seg.color,
                boxShadow: hoveredSegment === seg.id ? `0 0 10px ${seg.glowColor}` : 'none'
              }}
            />
            <div className="text-left">
              <p className="text-xs font-medium text-foreground">{seg.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {seg.calories} kcal • {seg.grams}g
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="w-full"
      >
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-xl gap-2 text-sm font-medium border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
          onClick={() => navigate('/')}
        >
          Zu meinem MacroTracker-Plan
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
};
