import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles
} from "lucide-react";
import frigLogo from "@/assets/frig-logo.png";

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 
  | "hero"
  | "goal"
  | "body-basics"
  | "planning-setup"
  | "macro-visual"
  | "fridge-intro"
  | "permissions"
  | "weekly-plan"
  | "shopping-preview"
  | "comparison"
  | "premium-hint"
  | "community"
  | "done";

interface UserData {
  goal: string | null;
  height: number;
  weight: number;
  age: number;
  activityLevel: string | null;
  macroFocus: string | null;
  cameraPermission: boolean;
  healthSync: string | null;
}

// Animated Fridge Component
const AnimatedFridge = ({ isOpen }: { isOpen: boolean }) => (
  <div className="relative w-32 h-44">
    <motion.div 
      className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden"
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
    {isOpen && (
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    )}
  </div>
);

// Donut Chart Component for Macros
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

  return (
    <div className="relative w-48 h-48">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
        
        {/* Protein segment (green) */}
        <motion.circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="hsl(160, 100%, 50%)"
          strokeWidth="12"
          strokeDasharray={animate ? `${proteinDash} 251.2` : "0 251.2"}
          strokeDashoffset={proteinOffset}
          initial={{ strokeDasharray: "0 251.2" }}
          animate={{ strokeDasharray: animate ? `${proteinDash} 251.2` : "0 251.2" }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        
        {/* Carbs segment (blue) */}
        <motion.circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="hsl(220, 90%, 60%)"
          strokeWidth="12"
          strokeDasharray={animate ? `${carbsDash} 251.2` : "0 251.2"}
          strokeDashoffset={carbsOffset}
          initial={{ strokeDasharray: "0 251.2" }}
          animate={{ strokeDasharray: animate ? `${carbsDash} 251.2` : "0 251.2" }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        
        {/* Fat segment (yellow) */}
        <motion.circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="hsl(45, 100%, 55%)"
          strokeWidth="12"
          strokeDasharray={animate ? `${fatDash} 251.2` : "0 251.2"}
          strokeDashoffset={fatOffset}
          initial={{ strokeDasharray: "0 251.2" }}
          animate={{ strokeDasharray: animate ? `${fatDash} 251.2` : "0 251.2" }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />
      </svg>
      
      {/* Center text */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: animate ? 1 : 0, scale: animate ? 1 : 0.8 }}
        transition={{ delay: 1.2 }}
      >
        <span className="text-2xl font-bold">1,800</span>
        <span className="text-xs text-muted-foreground">kcal/day</span>
      </motion.div>
    </div>
  );
};

// Line Chart for Comparison
const ComparisonLineChart = ({ animate }: { animate: boolean }) => {
  const withoutData = [50, 55, 45, 60, 40, 55, 48, 62, 42, 58];
  const withData = [50, 52, 54, 56, 59, 62, 66, 70, 75, 80];

  return (
    <div className="relative w-full h-40 bg-card rounded-2xl p-4 border border-border">
      <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" y1={i * 20 + 10} x2="200" y2={i * 20 + 10} stroke="hsl(var(--border))" strokeWidth="0.5" />
        ))}
        
        {/* Without Frigy - jagged gray line */}
        <motion.path
          d={`M ${withoutData.map((v, i) => `${i * 22},${80 - v}`).join(' L ')}`}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: animate ? 1 : 0 }}
          transition={{ duration: 1.5, delay: 0.2 }}
        />
        
        {/* With Frigy - smooth green line with glow */}
        <motion.path
          d={`M ${withData.map((v, i) => `${i * 22},${80 - v}`).join(' L ')}`}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: animate ? 1 : 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        
        {/* Glow filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-4 right-4 flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-muted-foreground rounded" />
          <span className="text-muted-foreground">Without Frigy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-primary rounded" />
          <span className="text-primary font-medium">With Frigy</span>
        </div>
      </div>
    </div>
  );
};

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("hero");
  const [userData, setUserData] = useState<UserData>({
    goal: null,
    height: 170,
    weight: 70,
    age: 25,
    activityLevel: null,
    macroFocus: "balanced",
    cameraPermission: false,
    healthSync: null,
  });
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [macroAnimate, setMacroAnimate] = useState(false);
  const [chartAnimate, setChartAnimate] = useState(false);

  const steps: OnboardingStep[] = [
    "hero",
    "goal",
    "body-basics",
    "planning-setup",
    "macro-visual",
    "fridge-intro",
    "permissions",
    "weekly-plan",
    "shopping-preview",
    "comparison",
    "premium-hint",
    "community",
    "done"
  ];

  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  // Trigger animations when entering certain steps
  useEffect(() => {
    if (currentStep === "fridge-intro") {
      setTimeout(() => setFridgeOpen(true), 500);
    }
    if (currentStep === "macro-visual") {
      setTimeout(() => setMacroAnimate(true), 300);
    }
    if (currentStep === "comparison") {
      setTimeout(() => setChartAnimate(true), 300);
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
    localStorage.setItem('onboardingUserData', JSON.stringify(userData));
    localStorage.setItem('onboardingComplete', 'true');
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6"
          >
            <motion.img
              src={frigLogo}
              alt="Frigy"
              className="w-20 h-20 rounded-[22%] mb-6"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
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
              className="text-muted-foreground mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Fridge-based meal planning that fits your macros.
            </motion.p>
            
            {/* Comparison cards */}
            <div className="flex gap-3 w-full max-w-sm mb-6">
              {/* Without Frigy */}
              <motion.div
                className="flex-1 p-4 rounded-2xl bg-muted/50 border border-border"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <X className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Without Frigy</span>
                </div>
                <ul className="space-y-2 text-left text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-xs">•</span> Random meals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-xs">•</span> Missed macros
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-xs">•</span> Food waste
                  </li>
                </ul>
              </motion.div>
              
              {/* With Frigy */}
              <motion.div
                className="flex-1 p-4 rounded-2xl bg-primary/10 border-2 border-primary/30"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">With Frigy</span>
                </div>
                <ul className="space-y-2 text-left text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary text-xs">✓</span> Meals from your fridge
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary text-xs">✓</span> Macro-matched plans
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary text-xs">✓</span> Smart shopping list
                  </li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        );

      case "goal":
        const goalOptions = [
          { id: "lose", label: "Lose weight", icon: <Scale className="w-6 h-6" />, emoji: "🔥" },
          { id: "maintain", label: "Maintain weight", icon: <Target className="w-6 h-6" />, emoji: "⚖️" },
          { id: "gain", label: "Gain muscle", icon: <Dumbbell className="w-6 h-6" />, emoji: "💪" },
          { id: "healthier", label: "Eat healthier", icon: <Leaf className="w-6 h-6" />, emoji: "🥗" },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">What's your goal?</h1>
            <p className="text-muted-foreground text-sm mb-6">Select one to personalize your experience</p>
            
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {goalOptions.map((option, i) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserData({ ...userData, goal: option.id })}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                    userData.goal === option.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                  {userData.goal === option.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2"
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case "body-basics":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Just the basics</h1>
            <p className="text-muted-foreground text-sm mb-8">Used only to calculate your macros</p>
            
            <div className="w-full max-w-sm space-y-6">
              {/* Height */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Height</span>
                  <span className="text-lg font-bold text-primary">{userData.height} cm</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="220"
                  value={userData.height}
                  onChange={(e) => setUserData({ ...userData, height: parseInt(e.target.value) })}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              
              {/* Weight */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Weight</span>
                  <span className="text-lg font-bold text-primary">{userData.weight} kg</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="150"
                  value={userData.weight}
                  onChange={(e) => setUserData({ ...userData, weight: parseInt(e.target.value) })}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              
              {/* Age */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Age</span>
                  <span className="text-lg font-bold text-primary">{userData.age} years</span>
                </div>
                <input
                  type="range"
                  min="13"
                  max="80"
                  value={userData.age}
                  onChange={(e) => setUserData({ ...userData, age: parseInt(e.target.value) })}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
            
            <motion.p
              className="text-xs text-muted-foreground mt-6 flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span>🔒</span> Your data stays private
            </motion.p>
          </motion.div>
        );

      case "planning-setup":
        const activityLevels = [
          { id: "low", label: "Low", desc: "Desk job, little exercise", emoji: "🪑" },
          { id: "medium", label: "Medium", desc: "Exercise 2-3x/week", emoji: "🚶" },
          { id: "high", label: "High", desc: "Daily exercise", emoji: "🏃" },
        ];
        const macroOptions = [
          { id: "balanced", label: "Balanced", emoji: "⚖️" },
          { id: "high-protein", label: "High protein", emoji: "💪" },
          { id: "low-carb", label: "Low carb", emoji: "🥑" },
          { id: "custom", label: "Custom", emoji: "⚙️" },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">How should we plan?</h1>
            <p className="text-muted-foreground text-sm mb-6">Set your activity and macro preference</p>
            
            {/* Activity Level */}
            <div className="w-full max-w-sm mb-6">
              <span className="text-sm font-medium block text-left mb-3">Activity Level</span>
              <div className="flex gap-2">
                {activityLevels.map((level) => (
                  <motion.button
                    key={level.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserData({ ...userData, activityLevel: level.id })}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      userData.activityLevel === level.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{level.emoji}</span>
                    <span className="text-xs font-medium">{level.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Macro Focus */}
            <div className="w-full max-w-sm">
              <span className="text-sm font-medium block text-left mb-3">Macro Focus</span>
              <div className="grid grid-cols-2 gap-2">
                {macroOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserData({ ...userData, macroFocus: option.id })}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      userData.macroFocus === option.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case "macro-visual":
        // Calculate macros based on preference
        const getMacros = () => {
          switch (userData.macroFocus) {
            case "high-protein": return { protein: 40, carbs: 30, fat: 30 };
            case "low-carb": return { protein: 35, carbs: 20, fat: 45 };
            default: return { protein: 30, carbs: 40, fat: 30 };
          }
        };
        const macros = getMacros();
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Your macros, visualized</h1>
            <p className="text-muted-foreground text-sm mb-6">Based on your profile</p>
            
            <MacroDonut protein={macros.protein} carbs={macros.carbs} fat={macros.fat} animate={macroAnimate} />
            
            {/* Legend */}
            <div className="flex gap-6 mt-6">
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: macroAnimate ? 1 : 0, y: macroAnimate ? 0 : 10 }}
                transition={{ delay: 1 }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(160, 100%, 50%)' }} />
                <span className="text-sm">Protein {macros.protein}%</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: macroAnimate ? 1 : 0, y: macroAnimate ? 0 : 10 }}
                transition={{ delay: 1.1 }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(220, 90%, 60%)' }} />
                <span className="text-sm">Carbs {macros.carbs}%</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: macroAnimate ? 1 : 0, y: macroAnimate ? 0 : 10 }}
                transition={{ delay: 1.2 }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(45, 100%, 55%)' }} />
                <span className="text-sm">Fat {macros.fat}%</span>
              </motion.div>
            </div>
            
            <motion.p
              className="text-xs text-muted-foreground mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: macroAnimate ? 1 : 0 }}
              transition={{ delay: 1.5 }}
            >
              Frigy adjusts this automatically with your weekly plans.
            </motion.p>
          </motion.div>
        );

      case "fridge-intro":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Let your fridge decide.</h1>
            <p className="text-muted-foreground text-sm mb-8">
              We build meals from what you already have.
            </p>
            
            <AnimatedFridge isOpen={fridgeOpen} />
            
            <div className="flex flex-col gap-3 w-full max-w-xs mt-8">
              <Button onClick={goNext} className="w-full h-12 rounded-xl">
                <Camera className="w-5 h-5 mr-2" />
                Scan fridge now
              </Button>
              <Button onClick={goNext} variant="ghost" className="w-full h-10 text-muted-foreground">
                Skip for now
              </Button>
            </div>
          </motion.div>
        );

      case "permissions":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Camera className="w-8 h-8 text-primary" />
            </motion.div>
            
            <h1 className="text-2xl font-bold mb-2">Enable camera</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Required for scanning your fridge
            </p>
            
            <div className="w-full max-w-sm space-y-3">
              {/* Camera permission */}
              <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block text-sm">Camera access</span>
                    <span className="text-xs text-muted-foreground">For fridge scanning</span>
                  </div>
                </div>
                <button
                  onClick={() => setUserData({ ...userData, cameraPermission: !userData.cameraPermission })}
                  className={`w-12 h-7 rounded-full transition-colors ${
                    userData.cameraPermission ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-card rounded-full shadow-sm"
                    animate={{ x: userData.cameraPermission ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              
              {/* Optional health sync */}
              <div className="pt-4">
                <p className="text-xs text-muted-foreground mb-3">Optional: Sync your health data</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserData({ ...userData, healthSync: userData.healthSync === "apple" ? null : "apple" })}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      userData.healthSync === "apple" ? "border-red-400 bg-red-50" : "border-border bg-card"
                    }`}
                  >
                    <Apple className="w-5 h-5 text-red-500" />
                    <span className="text-sm">Apple Health</span>
                  </button>
                  <button
                    onClick={() => setUserData({ ...userData, healthSync: userData.healthSync === "google" ? null : "google" })}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      userData.healthSync === "google" ? "border-green-400 bg-green-50" : "border-border bg-card"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Google Fit</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "weekly-plan":
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Your week, done.</h1>
            <p className="text-muted-foreground text-sm mb-6">
              2-3 balanced meals per day
            </p>
            
            <div className="w-full max-w-sm space-y-2 overflow-hidden">
              {days.map((day, i) => (
                <motion.div
                  key={day}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <span className="w-10 text-sm font-semibold text-primary">{day}</span>
                  <div className="flex-1 flex gap-1">
                    <div className="flex-1 h-2 bg-primary/30 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${60 + Math.random() * 30}%` }}
                        transition={{ delay: i * 0.1 + 0.3 }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span className="text-xs">🍳</span>
                    <span className="text-xs">🥗</span>
                    <span className="text-xs">🍝</span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <Button onClick={goNext} className="w-full max-w-xs h-12 rounded-xl mt-6">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate my plan
            </Button>
          </motion.div>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Only buy what's missing</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Smart shopping list based on your fridge
            </p>
            
            <div className="w-full max-w-sm bg-card rounded-2xl border border-border p-4">
              {shoppingItems.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-center gap-3 py-2 ${i < shoppingItems.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    item.have ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    {item.have ? (
                      <Check className="w-3 h-3 text-primary" />
                    ) : (
                      <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className={`text-sm ${item.have ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                    {item.name}
                  </span>
                  {item.have && (
                    <span className="ml-auto text-xs text-primary">In fridge</span>
                  )}
                </motion.div>
              ))}
            </div>
            
            <motion.p
              className="text-xs text-muted-foreground mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              No overbuying. No waste.
            </motion.p>
          </motion.div>
        );

      case "comparison":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Planning without vs with Frigy</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Your progress over time
            </p>
            
            <div className="w-full max-w-sm">
              <ComparisonLineChart animate={chartAnimate} />
            </div>
            
            <motion.p
              className="text-sm text-muted-foreground mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: chartAnimate ? 1 : 0 }}
              transition={{ delay: 2 }}
            >
              Less thinking. Better results.
            </motion.p>
          </motion.div>
        );

      case "premium-hint":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Want full control?</h1>
            <p className="text-muted-foreground text-sm mb-6">Compare plans</p>
            
            <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-6">
              {/* Free */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                <span className="text-sm font-semibold block mb-3">Free</span>
                <ul className="space-y-2 text-left text-xs text-muted-foreground">
                  <li>• 1 scan/week</li>
                  <li>• 1 plan/week</li>
                  <li>• Read-only list</li>
                </ul>
              </div>
              
              {/* Premium */}
              <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/30 relative">
                <motion.div
                  className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  Popular
                </motion.div>
                <span className="text-sm font-semibold block mb-3 text-primary">Premium</span>
                <ul className="space-y-2 text-left text-xs">
                  <li className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Unlimited scans</li>
                  <li className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Unlimited plans</li>
                  <li className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Smart shopping</li>
                </ul>
              </div>
            </div>
            
            <Button onClick={goNext} variant="outline" className="w-full max-w-xs h-12 rounded-xl">
              Continue with Free
            </Button>
          </motion.div>
        );

      case "community":
        const recipes = [
          { user: "Lisa M.", name: "Avocado Toast 🥑", likes: 234 },
          { user: "Tom K.", name: "Protein Bowl 💪", likes: 189 },
          { user: "Sarah", name: "Green Smoothie 🥬", likes: 156 },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Cook with others</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Discover recipes from the community
            </p>
            
            <div className="w-full max-w-sm space-y-3">
              {recipes.map((recipe, i) => (
                <motion.div
                  key={recipe.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.12 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium block">{recipe.name}</span>
                    <span className="text-xs text-muted-foreground">by {recipe.user}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs">{recipe.likes}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <Button onClick={goNext} variant="outline" className="w-full max-w-xs h-12 rounded-xl mt-6">
              Explore later
            </Button>
          </motion.div>
        );

      case "done":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center mb-6"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.span
                className="text-5xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎉
              </motion.span>
            </motion.div>
            
            <h1 className="text-3xl font-bold mb-2">You're all set.</h1>
            <p className="text-muted-foreground mb-8">
              Your fridge just got smarter.
            </p>
            
            <Button onClick={handleComplete} className="w-full max-w-xs h-12 rounded-xl">
              Go to dashboard
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
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
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {currentIndex > 0 ? (
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        
        {/* Progress bar */}
        <div className="flex-1 mx-4 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Skip button */}
        {["permissions", "community"].includes(currentStep) ? (
          <button
            onClick={goNext}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
      {!["fridge-intro", "weekly-plan", "premium-hint", "community", "done"].includes(currentStep) && (
        <div className="p-6 pb-8">
          <Button
            onClick={goNext}
            disabled={!canProceed()}
            className={`w-full h-12 rounded-xl transition-opacity ${!canProceed() ? "opacity-50" : ""}`}
          >
            {currentStep === "hero" ? "Get started" : "Continue"}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};
