import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Camera, 
  Scale, 
  Target, 
  Dumbbell, 
  Leaf, 
  Check, 
  X,
  Apple,
  Smartphone,
  ShoppingCart,
  Heart,
  Users,
  Sparkles,
  Star
} from "lucide-react";
import frigLogo from "@/assets/frig-logo.png";
import confetti from "canvas-confetti";

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 
  | "hero"
  | "goal"
  | "fridge-intro"
  | "permissions"
  | "weekly-plan"
  | "shopping-preview"
  | "comparison"
  | "tracker-intro"
  | "body-basics"
  | "goal-mode"
  | "target-weight"
  | "speed-select"
  | "planning-setup"
  | "analyzing"
  | "macro-preview"
  | "premium-hint"
  | "community"
  | "done";

interface UserData {
  goal: string | null;
  height: number;
  weight: number;
  age: number;
  goalMode: 'lose' | 'gain';
  targetWeight: number;
  weeklyGoal: number; // kg per week
  activityLevel: string | null;
  macroFocus: string | null;
  cameraPermission: boolean;
  healthSync: string | null;
  // Calculated values
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

// Counter component that animates numbers
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    let start = displayValue;
    const duration = 300;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * eased);
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span>{displayValue}{suffix}</span>;
};

// Animated Fridge Component with enhanced animations
const AnimatedFridge = ({ isOpen, showScan }: { isOpen: boolean; showScan: boolean }) => (
  <motion.div 
    className="relative w-36 h-48"
    animate={{ rotate: showScan ? [0, -2, 2, -1, 1, 0] : 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <motion.div 
      className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden"
      animate={{ boxShadow: showScan ? "0 0 30px rgba(34, 197, 94, 0.4)" : "0 10px 30px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.5 }}
    >
      {/* Fridge handle */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-slate-400 rounded-full" />
      
      {/* Fridge divider line */}
      <div className="absolute left-0 right-0 top-[35%] h-[2px] bg-slate-300" />
      
      {/* Food items inside */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-3 left-2 text-xl"
            >
              🥛
            </motion.div>
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute top-3 right-4 text-xl"
            >
              🍎
            </motion.div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute top-[40%] left-2 text-xl"
            >
              🥕
            </motion.div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute top-[40%] right-4 text-xl"
            >
              🧀
            </motion.div>
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xl"
            >
              🥬
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
    
    {/* Scan lines */}
    {showScan && (
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: "0 0 15px hsl(var(--primary))" }}
        />
      </motion.div>
    )}
  </motion.div>
);

// Enhanced Donut Chart Component with pulsing segments
const MacroDonut = ({ protein, carbs, fat, animate }: { protein: number; carbs: number; fat: number; animate: boolean }) => {
  const total = protein + carbs + fat;
  const proteinPct = (protein / total) * 100;
  const carbsPct = (carbs / total) * 100;
  const fatPct = (fat / total) * 100;
  
  const proteinDash = (proteinPct / 100) * 251.2;
  const carbsDash = (carbsPct / 100) * 251.2;
  const fatDash = (fatPct / 100) * 251.2;
  
  const proteinOffset = 0;
  const carbsOffset = -proteinDash;
  const fatOffset = -(proteinDash + carbsDash);
  
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  return (
    <div className="relative w-52 h-52">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        
        {/* Protein segment (green) - animated clockwise */}
        <motion.circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="hsl(160, 100%, 50%)"
          strokeWidth={activeSegment === "protein" ? "14" : "11"}
          strokeDasharray={animate ? `${proteinDash} 251.2` : "0 251.2"}
          strokeDashoffset={proteinOffset}
          strokeLinecap="round"
          initial={{ strokeDasharray: "0 251.2" }}
          animate={{ 
            strokeDasharray: animate ? `${proteinDash} 251.2` : "0 251.2",
            strokeWidth: activeSegment === "protein" ? 14 : 11
          }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          style={{ filter: activeSegment === "protein" ? "drop-shadow(0 0 8px hsl(160, 100%, 50%))" : "none" }}
          onMouseEnter={() => setActiveSegment("protein")}
          onMouseLeave={() => setActiveSegment(null)}
        />
        
        {/* Carbs segment (blue) */}
        <motion.circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="hsl(220, 90%, 60%)"
          strokeWidth={activeSegment === "carbs" ? "14" : "11"}
          strokeDasharray={animate ? `${carbsDash} 251.2` : "0 251.2"}
          strokeDashoffset={carbsOffset}
          strokeLinecap="round"
          initial={{ strokeDasharray: "0 251.2" }}
          animate={{ 
            strokeDasharray: animate ? `${carbsDash} 251.2` : "0 251.2",
            strokeWidth: activeSegment === "carbs" ? 14 : 11
          }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          style={{ filter: activeSegment === "carbs" ? "drop-shadow(0 0 8px hsl(220, 90%, 60%))" : "none" }}
          onMouseEnter={() => setActiveSegment("carbs")}
          onMouseLeave={() => setActiveSegment(null)}
        />
        
        {/* Fat segment (yellow) */}
        <motion.circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="hsl(45, 100%, 55%)"
          strokeWidth={activeSegment === "fat" ? "14" : "11"}
          strokeDasharray={animate ? `${fatDash} 251.2` : "0 251.2"}
          strokeDashoffset={fatOffset}
          strokeLinecap="round"
          initial={{ strokeDasharray: "0 251.2" }}
          animate={{ 
            strokeDasharray: animate ? `${fatDash} 251.2` : "0 251.2",
            strokeWidth: activeSegment === "fat" ? 14 : 11
          }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          style={{ filter: activeSegment === "fat" ? "drop-shadow(0 0 8px hsl(45, 100%, 55%))" : "none" }}
          onMouseEnter={() => setActiveSegment("fat")}
          onMouseLeave={() => setActiveSegment(null)}
        />
      </svg>
      
      {/* Center text */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: animate ? 1 : 0, scale: animate ? 1 : 0.8 }}
        transition={{ delay: 1.2, type: "spring" }}
      >
        <span className="text-3xl font-bold">1,800</span>
        <span className="text-xs text-muted-foreground/60">kcal/day</span>
      </motion.div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {activeSegment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-card px-3 py-1.5 rounded-lg shadow-lg border border-border text-xs whitespace-nowrap"
          >
            This adjusts automatically.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Animated Speed Selector Components
const AnimatedBicycle = ({ selected }: { selected: boolean }) => (
  <motion.svg viewBox="0 0 80 60" className="w-16 h-12">
    {/* Back wheel */}
    <motion.circle
      cx="18" cy="42" r="12"
      fill="none" stroke="currentColor" strokeWidth="2"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.8, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "18px 42px" }}
    />
    {/* Front wheel */}
    <motion.circle
      cx="62" cy="42" r="12"
      fill="none" stroke="currentColor" strokeWidth="2"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.8, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "62px 42px" }}
    />
    {/* Frame */}
    <path d="M18 42 L35 25 L50 25 L62 42 M35 25 L35 42 L50 42 M50 25 L45 15" 
          stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Handlebars */}
    <path d="M45 15 L42 12 M45 15 L50 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Pedals */}
    <motion.g
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.6, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "35px 42px" }}
    >
      <circle cx="35" cy="42" r="4" fill="currentColor" />
      <line x1="35" y1="38" x2="35" y2="46" stroke="currentColor" strokeWidth="2" />
    </motion.g>
    {/* Rider */}
    <motion.g animate={{ y: selected ? [0, -2, 0] : 0 }} transition={{ duration: 0.4, repeat: selected ? Infinity : 0 }}>
      <circle cx="40" cy="8" r="5" fill="currentColor" /> {/* Head */}
      <path d="M40 13 L40 22 M40 16 L35 25 M40 16 L48 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </motion.g>
  </motion.svg>
);

const AnimatedCar = ({ selected }: { selected: boolean }) => (
  <motion.svg viewBox="0 0 80 50" className="w-16 h-12">
    {/* Car body */}
    <motion.g animate={{ x: selected ? [0, 2, 0] : 0 }} transition={{ duration: 0.3, repeat: selected ? Infinity : 0 }}>
      <path d="M10 35 L10 25 L20 25 L28 15 L55 15 L65 25 L75 25 L75 35 Z" 
            fill="currentColor" opacity="0.9" />
      {/* Windows */}
      <path d="M30 16 L25 24 L40 24 L40 16 Z" fill="hsl(var(--background))" opacity="0.5" />
      <path d="M42 16 L42 24 L58 24 L52 16 Z" fill="hsl(var(--background))" opacity="0.5" />
    </motion.g>
    {/* Back wheel */}
    <motion.circle
      cx="22" cy="38" r="7"
      fill="hsl(var(--background))" stroke="currentColor" strokeWidth="3"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.3, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "22px 38px" }}
    />
    {/* Front wheel */}
    <motion.circle
      cx="60" cy="38" r="7"
      fill="hsl(var(--background))" stroke="currentColor" strokeWidth="3"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.3, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "60px 38px" }}
    />
    {/* Speed lines */}
    {selected && (
      <>
        <motion.line x1="0" y1="22" x2="8" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }} />
        <motion.line x1="0" y1="28" x2="10" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }} />
        <motion.line x1="0" y1="34" x2="6" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }} />
      </>
    )}
  </motion.svg>
);

const AnimatedRocket = ({ selected }: { selected: boolean }) => (
  <motion.svg viewBox="0 0 60 80" className="w-12 h-16">
    <motion.g 
      animate={{ y: selected ? [0, -3, 0] : 0, rotate: selected ? [0, 2, -2, 0] : 0 }} 
      transition={{ duration: 0.5, repeat: selected ? Infinity : 0 }}
    >
      {/* Rocket body */}
      <path d="M30 5 C30 5 45 25 45 45 L45 55 L15 55 L15 45 C15 25 30 5 30 5" 
            fill="currentColor" />
      {/* Window */}
      <circle cx="30" cy="30" r="7" fill="hsl(var(--primary))" opacity="0.5" />
      <circle cx="30" cy="30" r="4" fill="hsl(var(--background))" />
      {/* Fins */}
      <path d="M15 45 L5 60 L15 55 Z" fill="currentColor" opacity="0.8" />
      <path d="M45 45 L55 60 L45 55 Z" fill="currentColor" opacity="0.8" />
    </motion.g>
    {/* Flames */}
    {selected && (
      <motion.g>
        <motion.path d="M22 56 L25 75 L30 65 L35 75 L38 56" 
          fill="hsl(45, 100%, 55%)"
          animate={{ d: ["M22 56 L25 75 L30 65 L35 75 L38 56", "M22 56 L25 70 L30 78 L35 70 L38 56", "M22 56 L25 75 L30 65 L35 75 L38 56"] }}
          transition={{ duration: 0.2, repeat: Infinity }} />
        <motion.path d="M25 56 L28 68 L30 60 L32 68 L35 56" 
          fill="hsl(25, 100%, 55%)"
          animate={{ d: ["M25 56 L28 68 L30 60 L32 68 L35 56", "M25 56 L28 62 L30 70 L32 62 L35 56", "M25 56 L28 68 L30 60 L32 68 L35 56"] }}
          transition={{ duration: 0.15, repeat: Infinity }} />
      </motion.g>
    )}
  </motion.svg>
);

// Macro calculation function using Mifflin-St Jeor BMR formula
const calculateMacros = (userData: UserData) => {
  const { weight, height, age, activityLevel, goalMode, targetWeight, weeklyGoal } = userData;
  
  // Mifflin-St Jeor BMR formula (assuming average between male/female)
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5; // Slight male bias, adjust if needed
  
  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    low: 1.2,
    medium: 1.55,
    high: 1.9
  };
  
  const tdee = bmr * (activityMultipliers[activityLevel || 'medium'] || 1.55);
  
  // Calculate deficit/surplus based on weekly goal
  // 1kg of fat ≈ 7700 calories
  const weeklyCalorieChange = weeklyGoal * 7700;
  const dailyCalorieChange = weeklyCalorieChange / 7;
  
  let dailyCalories: number;
  if (goalMode === 'lose') {
    dailyCalories = tdee - dailyCalorieChange;
  } else {
    dailyCalories = tdee + dailyCalorieChange;
  }
  
  // Apply minimum calorie floors based on age
  const minCalories = age < 25 ? 1500 : age < 40 ? 1400 : 1300;
  dailyCalories = Math.max(dailyCalories, minCalories);
  dailyCalories = Math.round(dailyCalories);
  
  // Calculate macros
  // Protein: 2g per kg body weight
  const dailyProtein = Math.round(weight * 2);
  // Fat: 0.9g per kg body weight
  const dailyFat = Math.round(weight * 0.9);
  // Carbs: remaining calories (protein = 4cal/g, fat = 9cal/g, carbs = 4cal/g)
  const proteinCalories = dailyProtein * 4;
  const fatCalories = dailyFat * 9;
  const remainingCalories = dailyCalories - proteinCalories - fatCalories;
  const dailyCarbs = Math.max(50, Math.round(remainingCalories / 4)); // Minimum 50g carbs
  
  return { dailyCalories, dailyProtein, dailyCarbs, dailyFat };
};

// Analysis Progress Counter
const AnalysisProgress = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Easing - slower at start and end
        const increment = prev < 30 ? 2 : prev < 70 ? 3 : prev < 90 ? 2 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 40);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.span
      key={progress}
      initial={{ scale: 1 }}
      animate={{ scale: progress % 10 === 0 ? [1, 1.1, 1] : 1 }}
      transition={{ duration: 0.2 }}
    >
      {progress}%
    </motion.span>
  );
};

// Analysis Step with checkmark animation
const AnalysisStep = ({ text, delay }: { text: string; delay: number }) => {
  const [status, setStatus] = useState<'waiting' | 'loading' | 'done'>('waiting');
  
  useEffect(() => {
    const loadTimer = setTimeout(() => setStatus('loading'), delay);
    const doneTimer = setTimeout(() => setStatus('done'), delay + 600);
    
    return () => {
      clearTimeout(loadTimer);
      clearTimeout(doneTimer);
    };
  }, [delay]);
  
  return (
    <motion.div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
        status === 'done' 
          ? 'bg-primary/10 border border-primary/30' 
          : status === 'loading'
            ? 'bg-muted/50 border border-border'
            : 'bg-transparent border border-transparent'
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay / 1000 }}
    >
      {/* Status indicator */}
      <div className="w-6 h-6 flex items-center justify-center">
        {status === 'waiting' && (
          <motion.div 
            className="w-2 h-2 rounded-full bg-muted-foreground/30"
          />
        )}
        {status === 'loading' && (
          <motion.div
            className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
          />
        )}
        {status === 'done' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}
      </div>
      
      {/* Text */}
      <span className={`text-sm transition-colors ${
        status === 'done' ? 'text-primary font-medium' : 'text-muted-foreground/60'
      }`}>
        {text}
      </span>
      
      {/* Done checkmark text */}
      {status === 'done' && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-auto text-xs text-primary"
        >
          ✓
        </motion.span>
      )}
    </motion.div>
  );
};

// Line Chart that draws instead of fades
const ComparisonLineChart = ({ animate }: { animate: boolean }) => {
  const withoutData = [50, 55, 45, 60, 40, 55, 48];
  const withData = [50, 52, 55, 58, 63, 68, 75];

  return (
    <div className="relative w-full h-48 bg-card rounded-2xl p-4 border border-border overflow-hidden">
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
      
      <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="0" y1={i * 25} x2="200" y2={i * 25} stroke="hsl(var(--border))" strokeWidth="0.3" strokeDasharray="4 4" />
        ))}
        
        {/* Without Frigy - jagged gray line (draws, stops early) */}
        <motion.path
          d={`M ${withoutData.map((v, i) => `${i * 28 + 10},${100 - v}`).join(' L ')}`}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: animate ? 0.7 : 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        />
        
        {/* With Frigy - smooth rising line with glow (draws all the way) */}
        <motion.path
          d={`M ${withData.map((v, i) => `${i * 28 + 10},${100 - v}`).join(' L ')}`}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#lineGlow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: animate ? 1 : 0 }}
          transition={{ duration: 1.8, delay: 0.6, ease: "easeOut" }}
        />
        
        {/* End dot for "With Frigy" */}
        <motion.circle
          cx={6 * 28 + 10}
          cy={100 - withData[6]}
          r="5"
          fill="hsl(var(--primary))"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: animate ? 1 : 0, opacity: animate ? 1 : 0 }}
          transition={{ duration: 0.3, delay: 2 }}
          filter="url(#lineGlow)"
        />
        
        {/* Glow filter */}
        <defs>
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Legend at bottom */}
      <div className="absolute bottom-3 left-4 right-4 flex justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-muted-foreground rounded" />
          <span className="text-muted-foreground/60">Without Frigy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-primary rounded" style={{ boxShadow: "0 0 8px hsl(var(--primary))" }} />
          <span className="text-primary font-medium">With Frigy</span>
        </div>
      </div>
    </div>
  );
};

// Progress Dots Component
const ProgressDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-1.5 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i === current 
            ? "w-6 bg-primary" 
            : i < current 
              ? "w-1.5 bg-primary/40" 
              : "w-1.5 bg-muted"
        }`}
        animate={{ scale: i === current ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.3 }}
      />
    ))}
  </div>
);

// Card wrapper for consistent card-based animation
const StepCard = ({ children, step }: { children: React.ReactNode; step: string }) => (
  <motion.div
    key={step}
    initial={{ opacity: 0, y: 60, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
    transition={{ type: "spring", damping: 25, stiffness: 200 }}
    className="w-full"
  >
    {children}
  </motion.div>
);

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("hero");
  const [userData, setUserData] = useState<UserData>({
    goal: null,
    height: 170,
    weight: 70,
    age: 25,
    goalMode: 'lose',
    targetWeight: 65,
    weeklyGoal: 0.5,
    activityLevel: null,
    macroFocus: "balanced",
    cameraPermission: false,
    healthSync: null,
    dailyCalories: 0,
    dailyProtein: 0,
    dailyCarbs: 0,
    dailyFat: 0,
  });
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [fridgeScan, setFridgeScan] = useState(false);
  const [macroAnimate, setMacroAnimate] = useState(false);
  const [chartAnimate, setChartAnimate] = useState(false);

  const [trackerIntroAnimate, setTrackerIntroAnimate] = useState(false);

  const steps: OnboardingStep[] = [
    "hero",
    "goal",
    "fridge-intro",
    "permissions",
    "weekly-plan",
    "shopping-preview",
    "comparison",
    "tracker-intro",
    "body-basics",
    "goal-mode",
    "target-weight",
    "speed-select",
    "planning-setup",
    "analyzing",
    "macro-preview",
    "premium-hint",
    "community",
    "done"
  ];

  const currentIndex = steps.indexOf(currentStep);

  // Trigger animations when entering certain steps
  useEffect(() => {
    if (currentStep === "fridge-intro") {
      setTimeout(() => setFridgeOpen(true), 300);
      setTimeout(() => setFridgeScan(true), 800);
    }
    if (currentStep === "tracker-intro") {
      setTimeout(() => setTrackerIntroAnimate(true), 300);
    }
    if (currentStep === "macro-preview") {
      setTimeout(() => setMacroAnimate(true), 300);
    }
    if (currentStep === "comparison") {
      setTimeout(() => setChartAnimate(true), 400);
    }
    if (currentStep === "analyzing") {
      // Auto-advance after analysis animation completes
      setTimeout(() => {
        setCurrentStep("macro-preview");
      }, 4500);
    }
    if (currentStep === "done") {
      // Trigger confetti
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["hsl(142, 76%, 36%)", "hsl(142, 69%, 58%)", "hsl(43, 96%, 56%)"]
        });
      }, 400);
    }
  }, [currentStep]);

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      handleComplete();
    }
  };

  const goBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleComplete = () => {
    // Save onboarding data
    localStorage.setItem('onboardingUserData', JSON.stringify(userData));
    localStorage.setItem('onboardingComplete', 'true');
    
    // Also save as tracker settings (userProfile) for MacroTracker
    const trackerSettings = {
      age: userData.age,
      weight: userData.weight,
      targetWeight: userData.targetWeight,
      goalMode: userData.goalMode,
      weeklyGoal: userData.weeklyGoal,
      dailyCalories: userData.dailyCalories,
      dailyProtein: userData.dailyProtein,
      dailyCarbs: userData.dailyCarbs,
      dailyFat: userData.dailyFat,
    };
    localStorage.setItem('userProfile', JSON.stringify(trackerSettings));
    
    onComplete();
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "goal":
        return userData.goal !== null;
      case "planning-setup":
        return userData.activityLevel !== null;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "hero":
        return (
          <StepCard step="hero">
            <div className="flex flex-col items-center text-center px-6">
              <motion.img
                src={frigLogo}
                alt="Frigy"
                className="w-20 h-20 rounded-[22%] mb-6 shadow-lg"
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", damping: 15 }}
              />
              
              <motion.h1
                className="text-3xl font-bold mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Eat smarter. Not harder.
              </motion.h1>
              
              <motion.p
                className="text-muted-foreground/60 text-sm mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Fridge-based meal planning that fits your macros.
              </motion.p>
              
              {/* Comparison cards */}
              <div className="flex gap-3 w-full max-w-sm mb-4">
                {/* Without Frigy */}
                <motion.div
                  className="flex-1 p-4 rounded-2xl bg-muted/30 border border-border"
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <X className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-xs font-medium text-muted-foreground/60">Without Frigy</span>
                  </div>
                  <ul className="space-y-2 text-left text-xs text-muted-foreground/60">
                    <li>• Random meals</li>
                    <li>• Missed macros</li>
                    <li>• Food waste</li>
                  </ul>
                </motion.div>
                
                {/* With Frigy */}
                <motion.div
                  className="flex-1 p-4 rounded-2xl bg-primary/10 border-2 border-primary/30"
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.02, borderColor: "hsl(var(--primary))" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">With Frigy</span>
                  </div>
                  <ul className="space-y-2 text-left text-xs">
                    <li className="flex items-center gap-1">
                      <span className="text-primary">✓</span> Meals from your fridge
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="text-primary">✓</span> Macro-matched plans
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="text-primary">✓</span> Smart shopping list
                    </li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </StepCard>
        );

      case "goal":
        const goalOptions = [
          { id: "lose", label: "Lose weight", emoji: "🔥" },
          { id: "maintain", label: "Maintain weight", emoji: "⚖️" },
          { id: "gain", label: "Gain muscle", emoji: "💪" },
          { id: "healthier", label: "Eat healthier", emoji: "🥗" },
        ];
        return (
          <StepCard step="goal">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <h1 className="text-2xl font-bold mb-1">What's your goal?</h1>
              <p className="text-muted-foreground/60 text-xs mb-6">Select one to personalize your experience</p>
              
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {goalOptions.map((option, i) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setUserData({ ...userData, goal: option.id })}
                    className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                      userData.goal === option.id
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <motion.span 
                      className="text-3xl"
                      animate={{ 
                        scale: userData.goal === option.id ? [1, 1.2, 1] : 1,
                        rotate: userData.goal === option.id ? [0, 10, -10, 0] : 0
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      {option.emoji}
                    </motion.span>
                    <span className="text-sm font-medium">{option.label}</span>
                    {userData.goal === option.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </StepCard>
        );

      case "body-basics":
        return (
          <StepCard step="body-basics">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-4xl mb-4"
              >
                📏
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Your body stats</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Slide to set your values</p>
              
              <div className="w-full max-w-sm space-y-6">
                {/* Height - Interactive Card */}
                <motion.div 
                  className="p-4 rounded-2xl bg-card border-2 border-border"
                  whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📐</span>
                      <span className="text-sm font-medium">Height</span>
                    </div>
                    <motion.div 
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold"
                      key={userData.height}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.2 }}
                    >
                      <AnimatedCounter value={userData.height} suffix=" cm" />
                    </motion.div>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="220"
                    value={userData.height}
                    onChange={(e) => setUserData({ ...userData, height: parseInt(e.target.value) })}
                    className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </motion.div>
                
                {/* Weight - Interactive Card */}
                <motion.div 
                  className="p-4 rounded-2xl bg-card border-2 border-border"
                  whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚖️</span>
                      <span className="text-sm font-medium">Weight</span>
                    </div>
                    <motion.div 
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold"
                      key={userData.weight}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.2 }}
                    >
                      <AnimatedCounter value={userData.weight} suffix=" kg" />
                    </motion.div>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={userData.weight}
                    onChange={(e) => setUserData({ ...userData, weight: parseInt(e.target.value) })}
                    className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </motion.div>
                
                {/* Age - Interactive Card */}
                <motion.div 
                  className="p-4 rounded-2xl bg-card border-2 border-border"
                  whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎂</span>
                      <span className="text-sm font-medium">Age</span>
                    </div>
                    <motion.div 
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold"
                      key={userData.age}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.2 }}
                    >
                      <AnimatedCounter value={userData.age} suffix=" yrs" />
                    </motion.div>
                  </div>
                  <input
                    type="range"
                    min="13"
                    max="80"
                    value={userData.age}
                    onChange={(e) => setUserData({ ...userData, age: parseInt(e.target.value) })}
                    className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </motion.div>
              </div>
              
              <motion.div
                className="flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-primary/5 border border-primary/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-sm">🔒</span>
                <span className="text-xs text-muted-foreground/60">100% private - stays on your device</span>
              </motion.div>
            </div>
          </StepCard>
        );

      case "planning-setup":
        const activityLevels = [
          { id: "low", label: "Chill", emoji: "🧘", desc: "Desk job, light walks" },
          { id: "medium", label: "Active", emoji: "🚴", desc: "Regular workouts" },
          { id: "high", label: "Beast", emoji: "🔥", desc: "Intense training" },
        ];
        const macroOptions = [
          { id: "balanced", label: "Balanced", emoji: "⚖️", color: "from-blue-500/20 to-green-500/20" },
          { id: "high-protein", label: "High Protein", emoji: "💪", color: "from-red-500/20 to-orange-500/20" },
          { id: "low-carb", label: "Low Carb", emoji: "🥑", color: "from-green-500/20 to-emerald-500/20" },
          { id: "custom", label: "Custom", emoji: "✨", color: "from-purple-500/20 to-pink-500/20" },
        ];
        return (
          <StepCard step="planning-setup">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-4xl mb-4"
              >
                🏃
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">How active are you?</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Pick your vibe</p>
              
              {/* Activity Level - Fun cards */}
              <div className="w-full max-w-sm grid grid-cols-3 gap-2 mb-8">
                {activityLevels.map((level, i) => (
                  <motion.button
                    key={level.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ y: -4 }}
                    onClick={() => setUserData({ ...userData, activityLevel: level.id })}
                    className={`relative p-4 rounded-2xl border-2 transition-all ${
                      userData.activityLevel === level.id
                        ? "border-primary bg-primary/10 shadow-xl shadow-primary/30"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <motion.span 
                      className="text-3xl block mb-2"
                      animate={{ 
                        scale: userData.activityLevel === level.id ? [1, 1.3, 1] : 1,
                        rotate: userData.activityLevel === level.id ? [0, -10, 10, 0] : 0
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      {level.emoji}
                    </motion.span>
                    <span className="text-sm font-bold block">{level.label}</span>
                    <span className="text-[9px] text-muted-foreground/40 block mt-1">{level.desc}</span>
                    
                    {userData.activityLevel === level.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Macro Focus - Colorful cards */}
              <motion.div 
                className="w-full max-w-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-xs font-semibold block text-center mb-3 text-muted-foreground/60">Choose your macro style</span>
                <div className="grid grid-cols-2 gap-2">
                  {macroOptions.map((option, i) => (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setUserData({ ...userData, macroFocus: option.id })}
                      className={`relative flex items-center gap-2 p-3 rounded-xl border-2 transition-all overflow-hidden ${
                        userData.macroFocus === option.id
                          ? "border-primary shadow-lg"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${option.color} ${userData.macroFocus === option.id ? "opacity-100" : "opacity-0"} transition-opacity`} />
                      <span className="text-xl relative z-10">{option.emoji}</span>
                      <span className="text-sm font-medium relative z-10">{option.label}</span>
                      {userData.macroFocus === option.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-2 h-2 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          </StepCard>
        );

      case "goal-mode":
        return (
          <StepCard step="goal-mode">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-5xl mb-4"
              >
                🎯
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">What's your goal?</h1>
              <p className="text-muted-foreground/40 text-xs mb-8">This affects your daily calorie target</p>
              
              <div className="w-full max-w-sm grid grid-cols-2 gap-4">
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setUserData({ ...userData, goalMode: 'lose', targetWeight: Math.max(40, userData.weight - 5) })}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    userData.goalMode === 'lose'
                      ? "border-primary bg-primary/10 shadow-xl shadow-primary/30"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <motion.span 
                    className="text-5xl block mb-3"
                    animate={{ 
                      scale: userData.goalMode === 'lose' ? [1, 1.2, 1] : 1,
                      y: userData.goalMode === 'lose' ? [0, -5, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    📉
                  </motion.span>
                  <span className="text-lg font-bold block">Abnehmen</span>
                  <span className="text-xs text-muted-foreground/40">Kaloriendefizit</span>
                  
                  {userData.goalMode === 'lose' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.button>
                
                <motion.button
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setUserData({ ...userData, goalMode: 'gain', targetWeight: userData.weight + 5 })}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    userData.goalMode === 'gain'
                      ? "border-primary bg-primary/10 shadow-xl shadow-primary/30"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <motion.span 
                    className="text-5xl block mb-3"
                    animate={{ 
                      scale: userData.goalMode === 'gain' ? [1, 1.2, 1] : 1,
                      y: userData.goalMode === 'gain' ? [0, -5, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    📈
                  </motion.span>
                  <span className="text-lg font-bold block">Zunehmen</span>
                  <span className="text-xs text-muted-foreground/40">Kalorienüberschuss</span>
                  
                  {userData.goalMode === 'gain' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.button>
              </div>
            </div>
          </StepCard>
        );

      case "target-weight":
        const minTarget = userData.goalMode === 'lose' ? Math.max(40, userData.weight - 10) : userData.weight;
        const maxTarget = userData.goalMode === 'lose' ? userData.weight - 1 : userData.weight + 20;
        const weightDiff = Math.abs(userData.targetWeight - userData.weight);
        
        return (
          <StepCard step="target-weight">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className="text-5xl mb-4"
              >
                ⚖️
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Dein Zielgewicht</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">
                {userData.goalMode === 'lose' ? 'Wie viel möchtest du verlieren?' : 'Wie viel möchtest du zunehmen?'}
              </p>
              
              <div className="w-full max-w-sm space-y-6">
                {/* Current vs Target visualization */}
                <motion.div 
                  className="relative h-32 flex items-end justify-center gap-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Current weight bar */}
                  <div className="flex flex-col items-center">
                    <motion.div 
                      className="w-16 bg-muted rounded-t-xl"
                      initial={{ height: 0 }}
                      animate={{ height: 80 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    />
                    <span className="text-xs text-muted-foreground/60 mt-2">Aktuell</span>
                    <span className="text-lg font-bold">{userData.weight}kg</span>
                  </div>
                  
                  {/* Arrow */}
                  <motion.div 
                    className="flex items-center gap-1 mb-12"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span className="text-2xl">{userData.goalMode === 'lose' ? '→' : '→'}</span>
                  </motion.div>
                  
                  {/* Target weight bar */}
                  <div className="flex flex-col items-center">
                    <motion.div 
                      className={`w-16 rounded-t-xl ${userData.goalMode === 'lose' ? 'bg-primary' : 'bg-primary'}`}
                      initial={{ height: 0 }}
                      animate={{ height: userData.goalMode === 'lose' ? 80 - weightDiff * 4 : 80 + weightDiff * 2 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      style={{ minHeight: 30, maxHeight: 100 }}
                    />
                    <span className="text-xs text-primary mt-2">Ziel</span>
                    <motion.span 
                      className="text-lg font-bold text-primary"
                      key={userData.targetWeight}
                      animate={{ scale: [1, 1.1, 1] }}
                    >
                      {userData.targetWeight}kg
                    </motion.span>
                  </div>
                </motion.div>
                
                {/* Slider */}
                <motion.div 
                  className="p-4 rounded-2xl bg-card border-2 border-border"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">
                      {userData.goalMode === 'lose' ? 'Gewichtsverlust' : 'Gewichtszunahme'}
                    </span>
                    <motion.div 
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold"
                      key={weightDiff}
                      animate={{ scale: [1, 1.1, 1] }}
                    >
                      {userData.goalMode === 'lose' ? '-' : '+'}{weightDiff}kg
                    </motion.div>
                  </div>
                  <input
                    type="range"
                    min={minTarget}
                    max={maxTarget}
                    value={userData.targetWeight}
                    onChange={(e) => setUserData({ ...userData, targetWeight: parseInt(e.target.value) })}
                    className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-1">
                    <span>{minTarget}kg</span>
                    <span>{maxTarget}kg</span>
                  </div>
                </motion.div>
                
                <motion.p
                  className="text-xs text-muted-foreground/40 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  💡 Max. 10kg {userData.goalMode === 'lose' ? 'Verlust' : 'Zunahme'} für nachhaltige Ergebnisse
                </motion.p>
              </div>
            </div>
          </StepCard>
        );

      case "speed-select":
        const speedOptions = [
          { id: 0.3, label: "Langsam", desc: "Entspannt & nachhaltig", Component: AnimatedBicycle },
          { id: 0.8, label: "Normal", desc: "Gute Balance", Component: AnimatedCar },
          { id: 1.4, label: "Schnell", desc: "Intensiv & fokussiert", Component: AnimatedRocket },
        ];
        
        return (
          <StepCard step="speed-select">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-5xl mb-4"
              >
                ⚡
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Dein Tempo</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">
                Wie schnell möchtest du {userData.goalMode === 'lose' ? 'abnehmen' : 'zunehmen'}?
              </p>
              
              <div className="w-full max-w-sm space-y-3">
                {speedOptions.map((option, i) => (
                  <motion.button
                    key={option.id}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ x: 5 }}
                    onClick={() => setUserData({ ...userData, weeklyGoal: option.id })}
                    className={`relative w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      userData.weeklyGoal === option.id
                        ? "border-primary bg-primary/10 shadow-xl shadow-primary/30"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-20 h-16 flex items-center justify-center rounded-xl transition-colors ${
                      userData.weeklyGoal === option.id ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      <option.Component selected={userData.weeklyGoal === option.id} />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <span className="font-bold block">{option.label}</span>
                      <span className="text-xs text-muted-foreground/60">{option.desc}</span>
                      <motion.span 
                        className="text-xs text-primary font-semibold block mt-1"
                        animate={{ opacity: userData.weeklyGoal === option.id ? 1 : 0.5 }}
                      >
                        ~{option.id}kg / Woche
                      </motion.span>
                    </div>
                    
                    {userData.weeklyGoal === option.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
              
              <motion.p
                className="text-xs text-muted-foreground/40 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                ⚠️ Schnelleres Tempo = mehr Disziplin erforderlich
              </motion.p>
            </div>
          </StepCard>
        );

      case "analyzing":
        const analysisSteps = [
          { id: 1, text: "Ziele werden analysiert", delay: 0 },
          { id: 2, text: "Körperdaten verarbeiten", delay: 800 },
          { id: 3, text: "Zielgewicht berechnen", delay: 1600 },
          { id: 4, text: "Optimale Makros ermitteln", delay: 2400 },
          { id: 5, text: "Plan wird erstellt", delay: 3200 },
        ];
        
        return (
          <StepCard step="analyzing">
            <div className="flex flex-col items-center text-center px-6 w-full">
              {/* Animated brain/calculation icon */}
              <motion.div
                className="relative w-28 h-28 mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
              >
                {/* Outer rotating ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                {/* Inner pulsing ring */}
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-primary/40"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                {/* Spinning dots */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  {[0, 72, 144, 216, 288].map((deg, i) => (
                    <motion.div
                      key={deg}
                      className="absolute w-3 h-3 rounded-full bg-primary"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${deg}deg) translateY(-48px) translateX(-6px)`,
                      }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </motion.div>
                {/* Center icon */}
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className="text-4xl">🧠</span>
                </motion.div>
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Analysiere dein Profil...
              </motion.h1>
              
              {/* Progress percentage */}
              <motion.div
                className="text-5xl font-bold text-primary mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <AnalysisProgress />
              </motion.div>
              
              {/* Analysis steps with checkmarks */}
              <div className="w-full max-w-sm space-y-3">
                {analysisSteps.map((step) => (
                  <AnalysisStep key={step.id} text={step.text} delay={step.delay} />
                ))}
              </div>
            </div>
          </StepCard>
        );

      case "macro-preview":
        // Calculate macros when entering this step
        const calculatedMacros = calculateMacros(userData);
        const proteinPct = Math.round((calculatedMacros.dailyProtein * 4 / calculatedMacros.dailyCalories) * 100);
        const carbsPct = Math.round((calculatedMacros.dailyCarbs * 4 / calculatedMacros.dailyCalories) * 100);
        const fatPct = Math.round((calculatedMacros.dailyFat * 9 / calculatedMacros.dailyCalories) * 100);
        
        // Update userData with calculated values when rendering
        if (userData.dailyCalories !== calculatedMacros.dailyCalories) {
          setTimeout(() => {
            setUserData(prev => ({
              ...prev,
              ...calculatedMacros
            }));
          }, 0);
        }
        
        return (
          <StepCard step="macro-preview">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className="text-5xl mb-4"
              >
                🎉
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Deine persönlichen Makros</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Berechnet basierend auf deinem Profil</p>
              
              {/* Calorie target highlight */}
              <motion.div 
                className="w-full max-w-sm p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 mb-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-sm text-primary/60 block mb-1">Tägliches Kalorienziel</span>
                <motion.span 
                  className="text-5xl font-bold text-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  {calculatedMacros.dailyCalories}
                </motion.span>
                <span className="text-lg text-primary/60 ml-1">kcal</span>
                
                <div className="flex justify-center gap-1 mt-3">
                  <span className="text-xs text-muted-foreground/60">
                    {userData.goalMode === 'lose' ? 'Defizit' : 'Überschuss'} für ~{userData.weeklyGoal}kg/Woche
                  </span>
                </div>
              </motion.div>
              
              {/* Macro breakdown */}
              <div className="w-full max-w-sm grid grid-cols-3 gap-3 mb-6">
                <motion.div 
                  className="p-4 rounded-xl bg-card border border-border"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ background: 'hsl(160, 100%, 50%)' }} />
                  <span className="text-2xl font-bold block">{calculatedMacros.dailyProtein}g</span>
                  <span className="text-xs text-muted-foreground/60">Protein</span>
                  <span className="text-[10px] text-primary block">{proteinPct}%</span>
                </motion.div>
                
                <motion.div 
                  className="p-4 rounded-xl bg-card border border-border"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ background: 'hsl(220, 90%, 60%)' }} />
                  <span className="text-2xl font-bold block">{calculatedMacros.dailyCarbs}g</span>
                  <span className="text-xs text-muted-foreground/60">Carbs</span>
                  <span className="text-[10px] text-primary block">{carbsPct}%</span>
                </motion.div>
                
                <motion.div 
                  className="p-4 rounded-xl bg-card border border-border"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ background: 'hsl(45, 100%, 55%)' }} />
                  <span className="text-2xl font-bold block">{calculatedMacros.dailyFat}g</span>
                  <span className="text-xs text-muted-foreground/60">Fett</span>
                  <span className="text-[10px] text-primary block">{fatPct}%</span>
                </motion.div>
              </div>
              
              {/* Calculation explanation */}
              <motion.div
                className="w-full max-w-sm p-3 rounded-xl bg-muted/30 border border-border text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <span className="text-xs font-semibold block mb-2">📊 So wurde es berechnet:</span>
                <ul className="text-[10px] text-muted-foreground/60 space-y-1">
                  <li>• BMR (Grundumsatz) basierend auf {userData.weight}kg, {userData.height}cm, {userData.age} Jahre</li>
                  <li>• Aktivitätslevel: {userData.activityLevel === 'high' ? 'Hoch' : userData.activityLevel === 'medium' ? 'Mittel' : 'Niedrig'}</li>
                  <li>• {userData.goalMode === 'lose' ? 'Defizit' : 'Überschuss'}: ~{Math.round(userData.weeklyGoal * 1100)} kcal/Tag für {userData.weeklyGoal}kg/Woche</li>
                  <li>• Protein: 2g pro kg Körpergewicht</li>
                </ul>
              </motion.div>
            </div>
          </StepCard>
        );

      case "fridge-intro":
        return (
          <StepCard step="fridge-intro">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <h1 className="text-2xl font-bold mb-1">Let your fridge decide.</h1>
              <p className="text-muted-foreground/60 text-xs mb-8">
                We build meals from what you already have.
              </p>
              
              <AnimatedFridge isOpen={fridgeOpen} showScan={fridgeScan} />
              
              <motion.p
                className="text-xs text-muted-foreground/40 mt-6 mb-4 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                "I'll handle the planning. You just eat."
              </motion.p>
              
              <motion.p
                className="text-[10px] text-muted-foreground/30 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                Optional. Your plan works without this.
              </motion.p>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button onClick={goNext} className="w-full h-12 rounded-xl">
                  <Camera className="w-5 h-5 mr-2" />
                  Scan fridge now
                </Button>
                <Button onClick={goNext} variant="ghost" className="w-full h-10 text-muted-foreground/60 text-sm">
                  Skip for now
                </Button>
              </div>
            </div>
          </StepCard>
        );

      case "permissions":
        return (
          <StepCard step="permissions">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Camera className="w-8 h-8 text-primary" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Enable camera</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">
                Required for scanning your fridge
              </p>
              
              <div className="w-full max-w-sm space-y-3">
                {/* Camera permission */}
                <motion.div 
                  className="flex items-center justify-between p-4 rounded-2xl border-2 border-border bg-card"
                  whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium block text-sm">Camera access</span>
                      <span className="text-[10px] text-muted-foreground/40">For fridge scanning</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setUserData({ ...userData, cameraPermission: !userData.cameraPermission })}
                    className={`w-12 h-7 rounded-full transition-all ${
                      userData.cameraPermission ? "bg-primary shadow-lg shadow-primary/30" : "bg-muted"
                    }`}
                  >
                    <motion.div
                      className="w-5 h-5 bg-card rounded-full shadow-sm"
                      animate={{ x: userData.cameraPermission ? 22 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </motion.div>
                
                {/* Optional health sync */}
                <div className="pt-4">
                  <p className="text-[10px] text-muted-foreground/40 mb-3">Optional: Sync your health data</p>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setUserData({ ...userData, healthSync: userData.healthSync === "apple" ? null : "apple" })}
                      className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        userData.healthSync === "apple" ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-border bg-card"
                      }`}
                    >
                      <Apple className="w-5 h-5 text-red-500" />
                      <span className="text-sm">Apple Health</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setUserData({ ...userData, healthSync: userData.healthSync === "google" ? null : "google" })}
                      className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        userData.healthSync === "google" ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-border bg-card"
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Google Fit</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </StepCard>
        );

      case "weekly-plan":
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return (
          <StepCard step="weekly-plan">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <h1 className="text-2xl font-bold mb-1">Your week, built on macros</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">
                We adapt meals — macros stay fixed.
              </p>
              
              <div className="w-full max-w-sm space-y-2 overflow-hidden">
                {days.map((day, i) => (
                  <motion.div
                    key={day}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <span className="w-10 text-sm font-semibold text-primary">{day}</span>
                    {/* Macro bars - visually dominant */}
                    <div className="flex-1 flex gap-1">
                      <motion.div 
                        className="h-3 bg-[hsl(160,100%,50%)] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${25 + Math.random() * 10}%` }}
                        transition={{ delay: i * 0.08 + 0.3 }}
                      />
                      <motion.div 
                        className="h-3 bg-[hsl(220,90%,60%)] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${35 + Math.random() * 10}%` }}
                        transition={{ delay: i * 0.08 + 0.4 }}
                      />
                      <motion.div 
                        className="h-3 bg-[hsl(45,100%,55%)] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${20 + Math.random() * 10}%` }}
                        transition={{ delay: i * 0.08 + 0.5 }}
                      />
                    </div>
                    <div className="flex gap-0.5 text-[10px] opacity-50">
                      <span>🍳</span>
                      <span>🥗</span>
                      <span>🍝</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <Button onClick={goNext} className="w-full max-w-xs h-12 rounded-xl mt-6">
                <Sparkles className="w-5 h-5 mr-2" />
                Generate my plan
              </Button>
            </div>
          </StepCard>
        );

      case "shopping-preview":
        const shoppingItems = [
          { name: "Chicken breast", have: true },
          { name: "Broccoli", have: true },
          { name: "Rice", have: true },
          { name: "Eggs", have: false },
          { name: "Olive oil", have: false },
          { name: "Yogurt", have: false },
        ];
        return (
          <StepCard step="shopping-preview">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <h1 className="text-2xl font-bold mb-1">Only buy what's missing</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">
                Smart shopping list based on your fridge
              </p>
              
              <div className="w-full max-w-sm bg-card rounded-2xl border border-border p-4">
                {shoppingItems.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className={`flex items-center gap-3 py-2.5 ${i < shoppingItems.length - 1 ? 'border-b border-border/50' : ''}`}
                  >
                    <motion.div 
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        item.have ? 'bg-primary/20' : 'bg-muted'
                      }`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {item.have ? (
                        <Check className="w-3 h-3 text-primary" />
                      ) : (
                        <ShoppingCart className="w-3 h-3 text-muted-foreground/60" />
                      )}
                    </motion.div>
                    <span className={`text-sm ${item.have ? 'text-muted-foreground/40 line-through' : 'font-medium'}`}>
                      {item.name}
                    </span>
                    {item.have && (
                      <span className="ml-auto text-[10px] text-primary/60">In fridge</span>
                    )}
                  </motion.div>
                ))}
              </div>
              
              <motion.p
                className="text-xs text-muted-foreground/40 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                No overbuying. No waste.
              </motion.p>
            </div>
          </StepCard>
        );

      case "comparison":
        return (
          <StepCard step="comparison">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <h1 className="text-2xl font-bold mb-1">Planning without vs with Frigy</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">
                Your progress over time
              </p>
              
              <div className="w-full max-w-sm">
                <ComparisonLineChart animate={chartAnimate} />
              </div>
              
              <motion.p
                className="text-sm text-muted-foreground/60 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: chartAnimate ? 1 : 0 }}
                transition={{ delay: 2.2 }}
              >
                Less thinking. Better results.
              </motion.p>
            </div>
          </StepCard>
        );

      case "tracker-intro":
        return (
          <StepCard step="tracker-intro">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
              >
                <motion.span
                  className="text-5xl"
                  animate={{ 
                    scale: trackerIntroAnimate ? [1, 1.2, 1] : 1,
                    rotate: trackerIntroAnimate ? [0, 10, -10, 0] : 0
                  }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  🎯
                </motion.span>
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Time to personalize!
              </motion.h1>
              
              <motion.p 
                className="text-muted-foreground/60 text-sm mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                3 quick steps to unlock your perfect macros
              </motion.p>
              
              {/* Progress indicators */}
              <div className="flex gap-4 mb-8">
                {[
                  { emoji: "📏", label: "Body", done: false },
                  { emoji: "🏃", label: "Activity", done: false },
                  { emoji: "📊", label: "Macros", done: false },
                ].map((step, i) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <motion.div 
                      className="w-14 h-14 rounded-2xl bg-card border-2 border-border flex items-center justify-center"
                      whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary))" }}
                    >
                      <span className="text-2xl">{step.emoji}</span>
                    </motion.div>
                    <span className="text-[10px] text-muted-foreground/40">{step.label}</span>
                  </motion.div>
                ))}
              </div>
              
              <motion.p
                className="text-xs text-muted-foreground/40 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Takes less than 30 seconds ⚡
              </motion.p>
            </div>
          </StepCard>
        );

      case "premium-hint":
        return (
          <StepCard step="premium-hint">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <h1 className="text-2xl font-bold mb-1">Want full control?</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Compare plans</p>
              
              <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-6">
                {/* Free */}
                <motion.div 
                  className="p-4 rounded-2xl bg-muted/20 border border-border"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-sm font-semibold block mb-3 text-muted-foreground/60">Free</span>
                  <ul className="space-y-2 text-left text-xs text-muted-foreground/40">
                    <li>• 1 scan/week</li>
                    <li>• 1 plan/week</li>
                    <li>• Read-only list</li>
                  </ul>
                </motion.div>
                
                {/* Premium */}
                <motion.div 
                  className="p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 relative overflow-hidden"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ borderColor: "hsl(var(--primary) / 0.4)" }}
                >
                  {/* Premium badge */}
                  <motion.div
                    className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] px-2 py-0.5 rounded-bl-lg rounded-tr-xl font-medium flex items-center gap-0.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <Star className="w-2.5 h-2.5" fill="currentColor" />
                    Popular
                  </motion.div>
                  
                  <span className="text-sm font-semibold block mb-3 text-primary">Premium</span>
                  <ul className="space-y-2 text-left text-xs">
                    <li className="flex items-center gap-1 text-foreground/80"><Check className="w-3 h-3 text-primary" /> Unlimited scans</li>
                    <li className="flex items-center gap-1 text-foreground/80"><Check className="w-3 h-3 text-primary" /> Unlimited plans</li>
                    <li className="flex items-center gap-1 text-foreground/80"><Check className="w-3 h-3 text-primary" /> Smart shopping</li>
                  </ul>
                  
                  <p className="text-[9px] text-primary/60 mt-3">Available with Premium</p>
                </motion.div>
              </div>
              
              <Button onClick={goNext} variant="outline" className="w-full max-w-xs h-12 rounded-xl">
                Continue with Free
              </Button>
            </div>
          </StepCard>
        );

      case "community":
        const recipes = [
          { user: "Lisa M.", name: "Avocado Toast 🥑", likes: 234 },
          { user: "Tom K.", name: "Protein Bowl 💪", likes: 189 },
          { user: "Sarah", name: "Green Smoothie 🥬", likes: 156 },
        ];
        return (
          <StepCard step="community">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <h1 className="text-2xl font-bold mb-1">Cook with others</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">
                Discover recipes from the community
              </p>
              
              <div className="w-full max-w-sm space-y-3">
                {recipes.map((recipe, i) => (
                  <motion.div
                    key={recipe.name}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.12 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-medium block">{recipe.name}</span>
                      <span className="text-[10px] text-muted-foreground/40">by {recipe.user}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground/60">
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">{recipe.likes}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <Button onClick={goNext} variant="outline" className="w-full max-w-xs h-12 rounded-xl mt-6">
                Explore later
              </Button>
            </div>
          </StepCard>
        );

      case "done":
        return (
          <StepCard step="done">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
              >
                <motion.span
                  className="text-5xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ✨
                </motion.span>
              </motion.div>
              
              <motion.h1 
                className="text-3xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Your system is ready.
              </motion.h1>
              
              <motion.p 
                className="text-muted-foreground/40 text-sm mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Macros. Structure. Less thinking.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button onClick={handleComplete} className="w-full max-w-xs h-12 rounded-xl">
                  Go to dashboard
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </motion.div>
            </div>
          </StepCard>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background safe-area-inset"
    >
      {/* Header - hide back button during analyzing */}
      <div className={`flex items-center justify-between p-4 ${currentStep === 'analyzing' ? 'opacity-0 pointer-events-none' : ''}`}>
        {currentIndex > 0 ? (
          <motion.button
            onClick={goBack}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180 text-muted-foreground" />
          </motion.button>
        ) : (
          <div className="w-10" />
        )}
        
        {/* Progress dots */}
        <ProgressDots current={currentIndex} total={steps.length} />

        {/* Skip button */}
        {["permissions", "community"].includes(currentStep) ? (
          <button
            onClick={goNext}
            className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            Skip
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} className="w-full max-w-md">
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      {!["fridge-intro", "weekly-plan", "premium-hint", "community", "done", "analyzing"].includes(currentStep) && (
        <motion.div 
          className="p-6 pb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={goNext}
            disabled={!canProceed()}
            className={`w-full h-12 rounded-xl transition-all ${!canProceed() ? "opacity-50" : "shadow-lg shadow-primary/20"}`}
          >
            {currentStep === "hero" ? "Get started" : 
             currentStep === "tracker-intro" ? "Let's go! 🚀" : 
             currentStep === "macro-preview" ? "Perfekt! 🎯" :
             currentStep === "speed-select" ? "Weiter" :
             "Continue"}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
