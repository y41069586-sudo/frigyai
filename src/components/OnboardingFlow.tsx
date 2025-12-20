import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, Camera, Scale, Target, Dumbbell, Leaf, Check, X,
  Apple, Smartphone, ShoppingCart, Heart, Users, Sparkles, Star, Globe,
  Zap, Clock, Rocket, TrendingUp, Flame, BarChart3, Activity, User,
  Ruler, Calendar, Brain, AlertTriangle, Salad, Fish, Utensils, Wheat,
  Milk, Egg, Bean, CircleCheck, ChefHat, Award, PersonStanding, Bike,
  GraduationCap, Medal, Crown, Armchair, Footprints, Carrot, CupSoda,
  Droplets, Coffee
} from "lucide-react";
import frigLogo from "@/assets/frig-logo.png";
import frigyMascotSrc from "@/assets/frigy-mascot.png";
import frigyPeekSrc from "@/assets/frigy-peek.png";
import confetti from "canvas-confetti";
import { FrigyMascotInline, FrigyPeek } from "./FrigyMascot";
import { AnimatedFrigyMascot } from "./AnimatedFrigyMascot";
import { useLanguage, Language } from "@/contexts/LanguageContext";

import { 
  OnboardingStep, UserData, defaultUserData, onboardingSteps 
} from "./onboarding/types";
import { calculateMacros, calculateWeeksToGoal, saveOnboardingData } from "./onboarding/utils";
import { 
  StepCard, ProgressDots, AnimatedCounter, SelectionCard,
  AnimatedBicycle, AnimatedCar, AnimatedRocket
} from "./onboarding/components";
import { MotivationStep, CookingTimeStep, NotificationPrefsStep } from "./onboarding/steps";
import { WheelPicker } from "./WheelPicker";

import { MacroRing } from "./MacroRing";

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Analysis Step component
const AnalysisStep = ({ text, delay }: { text: string; delay: number }) => {
  const [status, setStatus] = useState<'waiting' | 'loading' | 'done'>('waiting');
  
  useEffect(() => {
    const loadTimer = setTimeout(() => setStatus('loading'), delay);
    const doneTimer = setTimeout(() => setStatus('done'), delay + 600);
    return () => { clearTimeout(loadTimer); clearTimeout(doneTimer); };
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
      transition={{ delay: delay / 1000, duration: 0.3 }}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        {status === 'waiting' && <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
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
            transition={{ duration: 0.2 }}
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}
      </div>
      <span className={`text-sm transition-colors ${status === 'done' ? 'text-primary font-medium' : 'text-muted-foreground/60'}`}>
        {text}
      </span>
      {status === 'done' && (
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-auto text-xs text-primary">✓</motion.span>
      )}
    </motion.div>
  );
};

// Analysis Progress Counter
const AnalysisProgress = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const milestones = [
      { time: 1200, target: 20 }, { time: 2800, target: 40 },
      { time: 4400, target: 60 }, { time: 6000, target: 80 },
      { time: 7600, target: 95 }, { time: 8400, target: 100 },
    ];
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let targetProgress = 0;
      
      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        const prevMilestone = milestones[i - 1] || { time: 0, target: 0 };
        if (elapsed <= milestone.time) {
          const timeInSegment = elapsed - prevMilestone.time;
          const segmentDuration = milestone.time - prevMilestone.time;
          const segmentProgress = milestone.target - prevMilestone.target;
          const fraction = timeInSegment / segmentDuration;
          const eased = fraction * fraction * (3 - 2 * fraction);
          targetProgress = prevMilestone.target + (segmentProgress * eased);
          break;
        }
        targetProgress = milestone.target;
      }
      
      setProgress(Math.round(targetProgress));
      if (elapsed >= 8400) clearInterval(interval);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  return <span>{progress}%</span>;
};

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { language, setLanguage, t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [fridgeScan, setFridgeScan] = useState(false);
  const [macroAnimate, setMacroAnimate] = useState(false);
  const [chartAnimate, setChartAnimate] = useState(false);
  const [selectedPlanOption, setSelectedPlanOption] = useState<'free' | 'premium' | null>(null);
  const [introPhase, setIntroPhase] = useState<'rising' | 'greeting' | 'settling' | 'done'>('rising');
  

  const currentIndex = onboardingSteps.indexOf(currentStep);

  // Step-specific effects
  useEffect(() => {
    if (currentStep === "fridge-intro") {
      setTimeout(() => setFridgeOpen(true), 300);
      setTimeout(() => setFridgeScan(true), 800);
    }
    if (currentStep === "macro-preview") {
      setTimeout(() => setMacroAnimate(true), 300);
    }
    if (currentStep === "comparison") {
      setTimeout(() => setChartAnimate(true), 400);
    }
    if (currentStep === "analyzing") {
      setTimeout(() => setCurrentStep("macro-preview"), 9000);
    }
    if (currentStep === "celebration") {
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.4 },
          colors: ["#22c55e", "#4ade80", "#86efac", "#fbbf24", "#fb7185"]
        });
      }, 600);
    }
    if (currentStep === "done") {
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
    if (nextIndex < onboardingSteps.length) {
      setCurrentStep(onboardingSteps[nextIndex]);
    } else {
      handleComplete();
    }
  };

  const goBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) setCurrentStep(onboardingSteps[prevIndex]);
  };

  const handleComplete = () => {
    saveOnboardingData(userData);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingComplete', 'true');
    onComplete();
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "goal": return userData.goal !== null;
      case "gender": return userData.gender !== null;
      case "planning-setup": return userData.activityLevel !== null;
      default: return true;
    }
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  const renderStepContent = () => {
    const stepProps = { userData, setUserData, goNext, goBack };

    switch (currentStep) {
      case "language-select":
        return (
          <StepCard step="language-select">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
              >
                <Globe className="w-8 h-8 text-primary" />
              </motion.div>
              
              <motion.h1 className="text-2xl font-bold mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
                {t.chooseLanguage}
              </motion.h1>
              <motion.p className="text-muted-foreground/50 text-sm mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }}>
                Select your preferred language
              </motion.p>
              
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {languages.map((lang, index) => (
                  <motion.button
                    key={lang.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.08, duration: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setLanguage(lang.code); goNext(); }}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      language === lang.code ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{lang.flag}</span>
                      <span className="font-semibold text-lg">{lang.label}</span>
                      {language === lang.code && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </StepCard>
        );

      case "welcome":
        return (
          <div className="fixed inset-0 bg-background flex flex-col">
            {/* Main content - centered vertically */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              {/* Mascot */}
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 180 }}
              >
                <AnimatedFrigyMascot size={140} animate={false} />
              </motion.div>
              
              {/* Title & Subtitle */}
              <motion.div
                className="text-center mt-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <h1 className="text-3xl font-bold text-foreground">
                  {t.welcomeToFrigy}
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                  {t.welcomeSubtitle}
                </p>
              </motion.div>
              
              {/* Feature Pills */}
              <motion.div
                className="flex flex-wrap justify-center gap-2 mt-8 max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
              {[
                  { icon: "📸", text: "Scannen" },
                  { icon: "📊", text: "Tracken" },
                  { icon: "🎯", text: "Ziele" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                    className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            {/* Bottom CTA */}
            <motion.div
              className="px-6 pb-8 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <Button 
                onClick={goNext} 
                className="w-full h-14 text-lg font-semibold rounded-2xl"
                size="lg"
              >
                {t.letsGo} <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          </div>
        );

      case "goal":
        const goalOptionsData = [
          { id: "lose", label: "Lose weight", Icon: Flame },
          { id: "maintain", label: "Maintain weight", Icon: Scale },
          { id: "gain", label: "Gain muscle", Icon: Dumbbell },
          { id: "healthier", label: "Eat healthier", Icon: Salad },
        ];
        return (
          <StepCard step="goal">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <h1 className="text-2xl font-bold mb-1">What&apos;s your goal?</h1>
              <p className="text-muted-foreground/60 text-xs mb-6">Select one to personalize your experience</p>
              
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {goalOptionsData.map((option, i) => (
                  <SelectionCard
                    key={option.id}
                    selected={userData.goal === option.id}
                    onClick={() => setUserData({ ...userData, goal: option.id })}
                    delay={i * 0.05}
                    className="flex flex-col items-center gap-2 p-5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <option.Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </SelectionCard>
                ))}
              </div>
            </div>
          </StepCard>
        );

      case "motivation":
        return <MotivationStep {...stepProps} />;

      case "social-proof":
        const testimonials = [
          { name: "Sarah M.", text: "Lost 8kg in 2 months!", color: "from-pink-500/20 to-rose-500/20", rating: 5 },
          { name: "Thomas K.", text: "Finally hitting my macros!", color: "from-blue-500/20 to-cyan-500/20", rating: 5 },
          { name: "Lisa R.", text: "Best meal planning app ever", color: "from-purple-500/20 to-pink-500/20", rating: 5 },
        ];
        return (
          <StepCard step="social-proof">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <span className="font-bold text-lg">4.9</span>
              </motion.div>
              
              <motion.h1 className="text-2xl font-bold mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
                Loved by thousands
              </motion.h1>
              <motion.p className="text-muted-foreground/50 text-xs mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }}>
                Join 50,000+ happy users
              </motion.p>
              
              <div className="w-full max-w-sm space-y-3">
                {testimonials.map((testimonial, i) => (
                  <motion.div
                    key={testimonial.name}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border"
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center`}>
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground/60">&quot;{testimonial.text}&quot;</p>
                    </div>
                    <div className="flex text-yellow-500">
                      {Array.from({ length: testimonial.rating }).map((_, idx) => (
                        <Star key={idx} className="w-3 h-3 fill-yellow-500" />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </StepCard>
        );

      case "success-stats":
        const stats = [
          { value: 94, suffix: "%", label: "reach their goals", color: "from-green-500 to-emerald-500" },
          { value: 2.5, suffix: "kg", label: "avg. weight loss/month", color: "from-blue-500 to-cyan-500" },
          { value: 15, suffix: "min", label: "saved daily on meal planning", color: "from-purple-500 to-pink-500" },
        ];
        return (
          <StepCard step="success-stats">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="text-5xl mb-4">
                📊
              </motion.div>
              
              <motion.h1 className="text-2xl font-bold mb-1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
                Real results
              </motion.h1>
              <motion.p className="text-muted-foreground/50 text-xs mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }}>
                Based on user data from the last 6 months
              </motion.p>
              
              <div className="w-full max-w-sm space-y-4">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                    className="relative p-4 rounded-2xl bg-card border border-border overflow-hidden"
                  >
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0`}
                      animate={{ opacity: 0.08 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    />
                    <div className="relative flex items-center gap-4">
                      <span className="text-3xl font-bold text-primary">{stat.value}{stat.suffix}</span>
                      <span className="text-sm text-muted-foreground/60">{stat.label}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </StepCard>
        );

      case "tracker-intro":
        return (
          <StepCard step="tracker-intro">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.3 }}>
                  <Target className="w-12 h-12 text-primary" />
                </motion.div>
              </motion.div>
              
              <motion.h1 className="text-2xl font-bold mb-2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
                Time to personalize!
              </motion.h1>
              <motion.p className="text-muted-foreground/60 text-sm mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.3 }}>
                3 quick steps to unlock your perfect macros
              </motion.p>
              
              <div className="flex gap-4 mb-8">
                {[
                  { Icon: Ruler, label: "Body" },
                  { Icon: Activity, label: "Activity" },
                  { Icon: BarChart3, label: "Macros" }
                ].map((step, i) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-card border-2 border-border flex items-center justify-center">
                      <step.Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-[10px] text-muted-foreground/40">{step.label}</span>
                  </motion.div>
                ))}
              </div>
              
              <motion.p className="text-xs text-muted-foreground/40 italic flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.3 }}>
                Takes less than 30 seconds <Zap className="w-3 h-3 text-primary" />
              </motion.p>
            </div>
          </StepCard>
        );

      case "body-basics":
        return (
          <StepCard step="body-basics">
            <div className="flex flex-col items-center text-center px-4 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3 shadow-lg">
                <PersonStanding className="w-7 h-7 text-primary-foreground" />
              </motion.div>
              
              <h1 className="text-xl font-bold mb-1">Deine Körperdaten</h1>
              <p className="text-muted-foreground/40 text-xs mb-4">Scrolle um Werte einzustellen</p>
              
              {/* Three wheel pickers side by side */}
              <div className="w-full max-w-md grid grid-cols-3 gap-2">
                {/* Height Picker */}
                <motion.div 
                  className="rounded-2xl bg-card border-2 border-border overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
                    <PersonStanding className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium">Größe</span>
                  </div>
                  <WheelPicker
                    value={userData.height}
                    onChange={(val) => setUserData({ ...userData, height: val })}
                    min={60}
                    max={220}
                    step={1}
                    unit="cm"
                  />
                </motion.div>
                
                {/* Weight Picker */}
                <motion.div 
                  className="rounded-2xl bg-card border-2 border-border overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
                    <Scale className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium">Gewicht</span>
                  </div>
                  <WheelPicker
                    value={userData.weight}
                    onChange={(val) => setUserData({ ...userData, weight: val })}
                    min={10}
                    max={250}
                    step={1}
                    unit="kg"
                  />
                </motion.div>
                
                {/* Age Picker */}
                <motion.div 
                  className="rounded-2xl bg-card border-2 border-border overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium">Alter</span>
                  </div>
                  <WheelPicker
                    value={userData.age}
                    onChange={(val) => setUserData({ ...userData, age: val })}
                    min={10}
                    max={100}
                    step={1}
                    unit="J."
                  />
                </motion.div>
              </div>
              
              <motion.div
                className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-primary/5 border border-primary/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <span className="text-sm">🔒</span>
                <span className="text-xs text-muted-foreground/60">100% privat</span>
              </motion.div>
            </div>
          </StepCard>
        );

      case "gender":
        return (
          <StepCard step="gender">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg">
                <User className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Dein Geschlecht</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Wichtig für genaue Kalorien-Berechnung</p>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {[
                  { id: 'male' as const, label: 'Männlich', color: 'from-blue-500/20 to-cyan-500/20' },
                  { id: 'female' as const, label: 'Weiblich', color: 'from-pink-500/20 to-rose-500/20' },
                ].map((option, index) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserData({ ...userData, gender: option.id })}
                    className={`relative p-6 rounded-2xl border-2 transition-all overflow-hidden ${
                      userData.gender === option.id
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-50`} />
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-card/80 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium">{option.label}</span>
                    </div>
                    {userData.gender === option.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
              
              <motion.p className="text-xs text-muted-foreground/40 mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.3 }}>
                ~166 kcal Unterschied zwischen Männern & Frauen
              </motion.p>
            </div>
          </StepCard>
        );

      case "goal-mode":
        return (
          <StepCard step="goal-mode">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-lg">
                <Target className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Dein Ziel</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Abnehmen oder Zunehmen?</p>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserData({ ...userData, goalMode: 'lose', targetWeight: userData.weight - 5 })}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    userData.goalMode === 'lose' ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-red-500 rotate-180" />
                  </div>
                  <span className="text-lg font-bold block">Abnehmen</span>
                  <span className="text-xs text-muted-foreground/40">Kaloriendefizit</span>
                  {userData.goalMode === 'lose' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserData({ ...userData, goalMode: 'gain', targetWeight: userData.weight + 5 })}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    userData.goalMode === 'gain' ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <span className="text-lg font-bold block">Zunehmen</span>
                  <span className="text-xs text-muted-foreground/40">Kalorienüberschuss</span>
                  {userData.goalMode === 'gain' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
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
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-lg">
                <Scale className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Dein Zielgewicht</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">
                {userData.goalMode === 'lose' ? 'Wie viel möchtest du verlieren?' : 'Wie viel möchtest du zunehmen?'}
              </p>
              
              <div className="w-full max-w-sm space-y-6">
                <motion.div 
                  className="relative h-32 flex items-end justify-center gap-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <div className="flex flex-col items-center">
                    <motion.div 
                      className="w-16 bg-muted rounded-t-xl"
                      initial={{ height: 0 }}
                      animate={{ height: 80 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    />
                    <span className="text-xs text-muted-foreground/60 mt-2">Aktuell</span>
                    <span className="text-lg font-bold">{userData.weight}kg</span>
                  </div>
                  
                  <motion.div 
                    className="flex items-center gap-1 mb-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <span className="text-2xl">→</span>
                  </motion.div>
                  
                  <div className="flex flex-col items-center">
                    <motion.div 
                      className="w-16 bg-primary rounded-t-xl"
                      initial={{ height: 0 }}
                      animate={{ height: userData.goalMode === 'lose' ? 80 - weightDiff * 4 : 80 + weightDiff * 2 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      style={{ minHeight: 30, maxHeight: 100 }}
                    />
                    <span className="text-xs text-primary mt-2">Ziel</span>
                    <span className="text-lg font-bold text-primary">{userData.targetWeight}kg</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="p-4 rounded-2xl bg-card border-2 border-border"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">
                      {userData.goalMode === 'lose' ? 'Gewichtsverlust' : 'Gewichtszunahme'}
                    </span>
                    <div className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                      {userData.goalMode === 'lose' ? '-' : '+'}{weightDiff}kg
                    </div>
                  </div>
                  <input
                    type="range" min={minTarget} max={maxTarget} value={userData.targetWeight}
                    onChange={(e) => setUserData({ ...userData, targetWeight: parseInt(e.target.value) })}
                    className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-1">
                    <span>{minTarget}kg</span>
                    <span>{maxTarget}kg</span>
                  </div>
                </motion.div>
                
                <motion.p className="text-xs text-muted-foreground/40 text-center flex items-center justify-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.3 }}>
                  <Sparkles className="w-3 h-3 text-primary" /> Max. 10kg {userData.goalMode === 'lose' ? 'Verlust' : 'Zunahme'} für nachhaltige Ergebnisse
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
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="text-5xl mb-4">
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserData({ ...userData, weeklyGoal: option.id })}
                    className={`relative w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      userData.weeklyGoal === option.id
                        ? "border-primary bg-primary/10 shadow-md"
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
                      <span className={`text-xs font-semibold block mt-1 ${userData.weeklyGoal === option.id ? 'text-primary' : 'text-muted-foreground/50'}`}>
                        ~{option.id}kg / Woche
                      </span>
                    </div>
                    
                    {userData.weeklyGoal === option.id && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }} className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
              
              <motion.p className="text-xs text-muted-foreground/40 mt-6 flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.3 }}>
                <AlertTriangle className="w-3 h-3 text-yellow-500" /> Schnelleres Tempo = mehr Disziplin erforderlich
              </motion.p>
            </div>
          </StepCard>
        );

      case "dietary-preferences":
        const dietOptionsData = [
          { id: 'vegetarian', label: 'Vegetarisch', Icon: Salad, desc: 'Kein Fleisch oder Fisch' },
          { id: 'vegan', label: 'Vegan', Icon: Leaf, desc: 'Keine tierischen Produkte' },
          { id: 'pescatarian', label: 'Pescetarisch', Icon: Fish, desc: 'Fisch, kein Fleisch' },
          { id: 'none', label: 'Keine', Icon: Utensils, desc: 'Alles erlaubt' },
        ];
        return (
          <StepCard step="dietary-preferences">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-lg">
                <Leaf className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Ernährungsweise</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Für passende Rezepte</p>
              
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {dietOptionsData.map((option, index) => {
                  const isSelected = option.id === 'none' 
                    ? userData.dietaryPreferences.length === 0 
                    : userData.dietaryPreferences.includes(option.id);
                  
                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + index * 0.05, duration: 0.3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (option.id === 'none') {
                          setUserData({ ...userData, dietaryPreferences: [] });
                        } else {
                          const newPrefs = userData.dietaryPreferences.includes(option.id)
                            ? userData.dietaryPreferences.filter(p => p !== option.id)
                            : [...userData.dietaryPreferences.filter(p => p !== 'none'), option.id];
                          setUserData({ ...userData, dietaryPreferences: newPrefs });
                        }
                      }}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <option.Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-[10px] text-muted-foreground/50">{option.desc}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </StepCard>
        );

      case "allergies":
        const allergyOptionsData = [
          { id: 'gluten', label: 'Gluten', Icon: Wheat },
          { id: 'lactose', label: 'Laktose', Icon: Milk },
          { id: 'nuts', label: 'Nüsse', Icon: Apple },
          { id: 'soy', label: 'Soja', Icon: Bean },
          { id: 'eggs', label: 'Eier', Icon: Egg },
          { id: 'none', label: 'Keine', Icon: CircleCheck },
        ];
        return (
          <StepCard step="allergies">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                <AlertTriangle className="w-8 h-8 text-white" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Allergien & Unverträglichkeiten</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Mehrfachauswahl möglich</p>
              
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                {allergyOptionsData.map((option, index) => {
                  const isSelected = option.id === 'none' 
                    ? userData.allergies.length === 0 
                    : userData.allergies.includes(option.id);
                  
                  return (
                    <motion.button
                      key={option.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.03 + index * 0.03, duration: 0.3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (option.id === 'none') {
                          setUserData({ ...userData, allergies: [] });
                        } else {
                          const newAllergies = userData.allergies.includes(option.id)
                            ? userData.allergies.filter(a => a !== option.id)
                            : [...userData.allergies.filter(a => a !== 'none'), option.id];
                          setUserData({ ...userData, allergies: newAllergies });
                        }
                      }}
                      className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <option.Icon className="w-6 h-6 text-primary" />
                      <span className="text-xs font-medium">{option.label}</span>
                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </StepCard>
        );

      case "cooking-time":
        return <CookingTimeStep {...stepProps} />;

      case "cooking-experience":
        const experienceOptions = [
          { id: 'beginner' as const, label: 'Anfänger', icon: GraduationCap, desc: 'Einfache Rezepte', color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-500' },
          { id: 'intermediate' as const, label: 'Fortgeschritten', icon: ChefHat, desc: 'Mittelschwere Gerichte', color: 'from-yellow-500/20 to-orange-500/20', iconColor: 'text-yellow-500' },
          { id: 'advanced' as const, label: 'Profi', icon: Crown, desc: 'Anspruchsvolle Küche', color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-500' },
        ];
        return (
          <StepCard step="cooking-experience">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.4 }} 
                className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"
              >
                <Utensils className="w-8 h-8 text-primary" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Kocherfahrung</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Für passende Rezept-Schwierigkeit</p>
              
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {experienceOptions.map((option, index) => {
                  const IconComponent = option.icon;
                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.08, duration: 0.3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setUserData({ ...userData, cookingExperience: option.id })}
                      className={`relative p-4 rounded-xl border-2 transition-all overflow-hidden ${
                        userData.cookingExperience === option.id
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${option.color} opacity-50`} />
                      <div className="relative z-10 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center ${option.iconColor}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{option.label}</p>
                          <p className="text-xs text-muted-foreground/60">{option.desc}</p>
                        </div>
                        {userData.cookingExperience === option.id && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </StepCard>
        );

      case "planning-setup":
        const activityLevels = [
          { id: "low", label: "Chill", icon: Armchair, desc: "Desk job, light walks", color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
          { id: "medium", label: "Active", icon: Footprints, desc: "Regular workouts", color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
          { id: "high", label: "Beast", icon: Flame, desc: "Intense training", color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
        ];
        return (
          <StepCard step="planning-setup">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.4 }} 
                className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"
              >
                <Activity className="w-8 h-8 text-primary" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Aktivitätslevel</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Wie aktiv bist du?</p>
              
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {activityLevels.map((level, i) => {
                  const IconComponent = level.icon;
                  return (
                    <motion.button
                      key={level.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setUserData({ ...userData, activityLevel: level.id })}
                      className={`relative w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        userData.activityLevel === level.id
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${level.bgColor} flex items-center justify-center ${level.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-bold block">{level.label}</span>
                        <span className="text-xs text-muted-foreground/60">{level.desc}</span>
                      </div>
                      {userData.activityLevel === level.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }} className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </StepCard>
        );

      case "analyzing":
        const analysisSteps = [
          { id: 1, text: "Ziele werden analysiert", delay: 0 },
          { id: 2, text: "Körperdaten verarbeiten", delay: 1600 },
          { id: 3, text: "Zielgewicht berechnen", delay: 3200 },
          { id: 4, text: "Optimale Makros ermitteln", delay: 4800 },
          { id: 5, text: "Plan wird erstellt", delay: 6400 },
        ];
        
        return (
          <StepCard step="analyzing">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                className="relative w-28 h-28 mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-primary/40"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">🧠</span>
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Analysiere dein Profil...
              </motion.h1>
              
              <motion.div
                className="text-5xl font-bold text-primary mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <AnalysisProgress />
              </motion.div>
              
              <div className="w-full max-w-sm space-y-3">
                {analysisSteps.map((step) => (
                  <AnalysisStep key={step.id} text={step.text} delay={step.delay} />
                ))}
              </div>
            </div>
          </StepCard>
        );

      case "macro-preview":
        const calculatedMacros = calculateMacros(userData);
        const weeksToGoal = calculateWeeksToGoal(userData);
        
        // Calculate goal date
        const goalDate = new Date();
        goalDate.setDate(goalDate.getDate() + (weeksToGoal * 7));
        const goalDateFormatted = goalDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
        
        if (userData.dailyCalories !== calculatedMacros.dailyCalories && userData.dailyCalories === 0) {
          setTimeout(() => setUserData(prev => ({ ...prev, ...calculatedMacros })), 0);
        }

        const handleMacroEdit = (field: string, currentValue: number) => {
          const newValue = prompt(`${field} anpassen:`, currentValue.toString());
          if (newValue !== null) {
            const num = parseInt(newValue);
            if (!isNaN(num) && num > 0) {
              setUserData(prev => ({ ...prev, [field]: num }));
            }
          }
        };

        return (
          <StepCard step="macro-preview">
            <div className="flex flex-col items-center text-center px-4 w-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-3"
              >
                <span className="text-2xl">✨</span>
              </motion.div>
              
              <motion.h1 className="text-xl font-bold mb-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
                Dein optimaler Plan
              </motion.h1>
              <motion.p className="text-muted-foreground/50 text-xs mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }}>
                Tippe auf ✏️ um Werte anzupassen
              </motion.p>
              
              {/* Calorie Ring with Edit */}
              <motion.div
                className="mb-5 relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <MacroRing
                  value={userData.dailyCalories || calculatedMacros.dailyCalories}
                  max={userData.dailyCalories || calculatedMacros.dailyCalories}
                  label="Tägliches Ziel"
                  unit=" kcal"
                  color="calories"
                  size="lg"
                />
                <button
                  onClick={() => handleMacroEdit('dailyCalories', userData.dailyCalories || calculatedMacros.dailyCalories)}
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-primary/20 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </motion.div>
              
              {/* Macro Rings with Edit Buttons */}
              <motion.div 
                className="flex justify-center gap-8 mb-5 w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {/* Protein */}
                <div className="relative">
                  <MacroRing
                    value={userData.dailyProtein || calculatedMacros.dailyProtein}
                    max={userData.dailyProtein || calculatedMacros.dailyProtein}
                    label="Protein"
                    color="protein"
                    size="sm"
                  />
                  <button
                    onClick={() => handleMacroEdit('dailyProtein', userData.dailyProtein || calculatedMacros.dailyProtein)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-primary/20 transition-colors shadow-sm"
                  >
                    <svg className="w-2.5 h-2.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                
                {/* Carbs */}
                <div className="relative">
                  <MacroRing
                    value={userData.dailyCarbs || calculatedMacros.dailyCarbs}
                    max={userData.dailyCarbs || calculatedMacros.dailyCarbs}
                    label="Carbs"
                    color="carbs"
                    size="sm"
                  />
                  <button
                    onClick={() => handleMacroEdit('dailyCarbs', userData.dailyCarbs || calculatedMacros.dailyCarbs)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-primary/20 transition-colors shadow-sm"
                  >
                    <svg className="w-2.5 h-2.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                
                {/* Fat */}
                <div className="relative">
                  <MacroRing
                    value={userData.dailyFat || calculatedMacros.dailyFat}
                    max={userData.dailyFat || calculatedMacros.dailyFat}
                    label="Fett"
                    color="fat"
                    size="sm"
                  />
                  <button
                    onClick={() => handleMacroEdit('dailyFat', userData.dailyFat || calculatedMacros.dailyFat)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-primary/20 transition-colors shadow-sm"
                  >
                    <svg className="w-2.5 h-2.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </motion.div>
              
              {/* Goal Date Banner */}
              <motion.div 
                className="w-full max-w-xs p-4 rounded-2xl bg-primary/10 border border-primary/30 mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold text-primary block">
                      🎯 {goalDateFormatted}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      erreichst du dein Ziel von {userData.targetWeight}kg
                    </span>
                  </div>
                </div>
              </motion.div>
              
              {/* Goal details */}
              <motion.div 
                className="w-full max-w-xs p-3 rounded-xl bg-muted/50 border border-border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Aktuell: {userData.weight}kg</span>
                  <span>→ {userData.weeklyGoal}kg/Woche →</span>
                  <span className="text-primary font-medium">Ziel: {userData.targetWeight}kg</span>
                </div>
              </motion.div>
            </div>
          </StepCard>
        );

      case "fridge-intro":
        return (
          <StepCard step="fridge-intro">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <h1 className="text-2xl font-bold mb-1">Let your fridge decide.</h1>
              <p className="text-muted-foreground/60 text-xs mb-8">We build meals from what you already have.</p>
              
              {/* Animated Fridge */}
              <motion.div 
                className="relative w-36 h-48"
                animate={{ rotate: fridgeScan ? [0, -2, 2, -1, 1, 0] : 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden"
                  animate={{ boxShadow: fridgeScan ? "0 0 30px rgba(34, 197, 94, 0.4)" : "0 10px 30px rgba(0,0,0,0.1)" }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-slate-400 rounded-full" />
                  <div className="absolute left-0 right-0 top-[35%] h-[2px] bg-slate-300" />
                  
                  {fridgeOpen && (
                    <>
                      {[
                        { icon: CupSoda, color: 'text-blue-400', pos: 'top-3 left-2' },
                        { icon: Apple, color: 'text-red-400', pos: 'top-3 right-4' },
                        { icon: Carrot, color: 'text-orange-400', pos: 'top-[40%] left-2' },
                        { icon: Milk, color: 'text-yellow-400', pos: 'top-[40%] right-4' },
                        { icon: Salad, color: 'text-green-400', pos: 'bottom-3 left-1/2 -translate-x-1/2' },
                      ].map((item, i) => {
                        const IconComponent = item.icon;
                        return (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                            className={`absolute ${item.pos} ${item.color}`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </motion.div>
                
                {fridgeScan && (
                  <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <motion.div
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ boxShadow: "0 0 15px hsl(var(--primary))" }}
                    />
                  </motion.div>
                )}
              </motion.div>
              
              <motion.p className="text-xs text-muted-foreground/40 mt-6 mb-4 italic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.3 }}>
                &quot;I&apos;ll handle the planning. You just eat.&quot;
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
        const requestCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Permission granted - stop the stream immediately (we just wanted permission)
            stream.getTracks().forEach(track => track.stop());
            setUserData({ ...userData, cameraPermission: true });
            // Go to next step after permission is granted
            goNext();
          } catch (error) {
            console.log("Camera permission denied or error:", error);
            // Still allow user to proceed, they can grant permission later
            setUserData({ ...userData, cameraPermission: false });
          }
        };

        return (
          <StepCard step="permissions">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Camera className="w-8 h-8 text-primary" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Enable camera</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Required for scanning your fridge</p>
              
              <div className="w-full max-w-sm space-y-4">
                <motion.div 
                  className="flex items-center justify-between p-4 rounded-2xl border-2 border-border bg-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
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
                  {userData.cameraPermission ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={requestCameraPermission}
                      className="h-8 px-4 text-sm"
                    >
                      Allow
                    </Button>
                  )}
                </motion.div>
                
                <div className="pt-4">
                  <p className="text-[10px] text-muted-foreground/40 mb-3">Optional: Sync your health data</p>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setUserData({ ...userData, healthSync: userData.healthSync === "apple" ? null : "apple" })}
                      className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        userData.healthSync === "apple" ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-border bg-card"
                      }`}
                    >
                      <Apple className="w-5 h-5 text-red-500" />
                      <span className="text-sm">Apple Health</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
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

                {/* Skip button for users who don't want to grant permission now */}
                <Button 
                  variant="ghost" 
                  onClick={goNext}
                  className="w-full h-10 text-muted-foreground/60 text-sm mt-4"
                >
                  Skip for now
                </Button>
              </div>
            </div>
          </StepCard>
        );

      case "notification-prefs":
        return <NotificationPrefsStep {...stepProps} />;

      case "weekly-plan":
        // Generate personalized meal plan based on user's calculated macros
        const weeklyMacros = calculateMacros(userData);
        const targetCalories = userData.dailyCalories || weeklyMacros.dailyCalories;
        const sampleMealPlan = [
          { day: "Mo", breakfast: "Rührei mit Spinat", lunch: "Hähnchen-Salat", dinner: "Lachs mit Brokkoli", kcal: Math.round(targetCalories * 0.98) },
          { day: "Di", breakfast: "Haferflocken mit Beeren", lunch: "Thunfisch-Wrap", dinner: "Putenbrust mit Reis", kcal: Math.round(targetCalories * 1.02) },
          { day: "Mi", breakfast: "Griechischer Joghurt", lunch: "Quinoa-Bowl", dinner: "Rinderfilet mit Gemüse", kcal: Math.round(targetCalories * 0.99) },
          { day: "Do", breakfast: "Vollkornbrot mit Avocado", lunch: "Garnelen-Salat", dinner: "Hähnchen-Curry", kcal: Math.round(targetCalories * 1.01) },
          { day: "Fr", breakfast: "Protein-Smoothie", lunch: "Linsensalat", dinner: "Lachs-Pasta", kcal: Math.round(targetCalories) },
          { day: "Sa", breakfast: "Pancakes mit Früchten", lunch: "Caesar Salat", dinner: "Steak mit Kartoffeln", kcal: Math.round(targetCalories * 1.03) },
          { day: "So", breakfast: "Omelett mit Käse", lunch: "Buddha Bowl", dinner: "Gebratener Lachs", kcal: Math.round(targetCalories * 0.97) },
        ];
        
        return (
          <StepCard step="weekly-plan">
            <div className="flex flex-col items-center text-center px-4 w-full">
              {/* Header */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-lg"
              >
                <Calendar className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                Dein Wochenplan ist fertig!
              </motion.h1>
              <motion.p 
                className="text-muted-foreground/60 text-sm mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                Basierend auf deinen {targetCalories} kcal Tagesziel
              </motion.p>
              
              {/* Macro summary badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex gap-3 mb-4"
              >
                <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-xs font-medium flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" />
                  {userData.dailyProtein || weeklyMacros.dailyProtein}g
                </div>
                <div className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-medium flex items-center gap-1">
                  <Wheat className="w-3 h-3" />
                  {userData.dailyCarbs || weeklyMacros.dailyCarbs}g
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-500 text-xs font-medium flex items-center gap-1">
                  <Droplets className="w-3 h-3" />
                  {userData.dailyFat || weeklyMacros.dailyFat}g
                </div>
              </motion.div>
              
              {/* Meal plan grid */}
              <div className="w-full max-w-sm space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {sampleMealPlan.map((day, i) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
                    className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-primary">{day.day}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{day.kcal} kcal</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="text-left">
                        <div className="flex items-center gap-1 text-muted-foreground/60 mb-0.5">
                          <Coffee className="w-2.5 h-2.5" />
                          <span>Früh</span>
                        </div>
                        <span className="text-muted-foreground/80 line-clamp-1">{day.breakfast}</span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1 text-muted-foreground/60 mb-0.5">
                          <Salad className="w-2.5 h-2.5" />
                          <span>Mittag</span>
                        </div>
                        <span className="text-muted-foreground/80 line-clamp-1">{day.lunch}</span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1 text-muted-foreground/60 mb-0.5">
                          <Utensils className="w-2.5 h-2.5" />
                          <span>Abend</span>
                        </div>
                        <span className="text-muted-foreground/80 line-clamp-1">{day.dinner}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.6, duration: 0.3 }} 
                className="flex items-center gap-2 text-[10px] text-muted-foreground/50 mt-3 mb-4"
              >
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Personalisiert auf deine Präferenzen</span>
              </motion.div>
              
              <Button onClick={goNext} className="w-full max-w-xs h-12 rounded-xl">
                <ChevronRight className="w-5 h-5 mr-2" />
                Weiter
              </Button>
            </div>
          </StepCard>
        );

      case "comparison":
        return (
          <StepCard step="comparison">
            <div className="flex flex-col items-center text-center px-6 w-full">
              {/* Header with icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-lg"
              >
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                Planning with Frigy
              </motion.h1>
              <motion.p 
                className="text-muted-foreground/60 text-sm mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Dein Weg zum Erfolg
              </motion.p>
              
              {/* Comparison visualization */}
              <motion.div 
                className="w-full max-w-sm relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {/* Progress comparison cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Without Frigy */}
                  <motion.div 
                    className="relative p-4 rounded-2xl bg-muted/30 border border-border overflow-hidden"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <div className="relative z-10">
                      <div className="text-xs text-muted-foreground/60 mb-2">Ohne Frigy</div>
                      <div className="h-24 flex items-end justify-center">
                        <motion.div 
                          className="w-full max-w-[60px] bg-muted/60 rounded-t-xl"
                          initial={{ height: 0 }}
                          animate={{ height: chartAnimate ? 40 : 0 }}
                          transition={{ duration: 0.8, delay: 0.5 }}
                        />
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                          <X className="w-3 h-3" />
                          <span>Keine Struktur</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                          <X className="w-3 h-3" />
                          <span>Ziele verfehlt</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* With Frigy */}
                  <motion.div 
                    className="relative p-4 rounded-2xl bg-primary/5 border-2 border-primary/30 overflow-hidden"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="text-xs text-primary font-medium mb-2 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-primary" />
                        Mit Frigy
                      </div>
                      <div className="h-24 flex items-end justify-center">
                        <motion.div 
                          className="w-full max-w-[60px] bg-gradient-to-t from-primary to-primary/70 rounded-t-xl shadow-lg"
                          initial={{ height: 0 }}
                          animate={{ height: chartAnimate ? 96 : 0 }}
                          transition={{ duration: 1, delay: 0.6 }}
                          style={{ boxShadow: '0 -4px 20px hsla(var(--primary) / 0.3)' }}
                        />
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-primary">
                          <Check className="w-3 h-3" />
                          <span>Klarer Plan</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-primary">
                          <Check className="w-3 h-3" />
                          <span>94% Erfolg</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Stats row */}
                <motion.div 
                  className="grid grid-cols-3 gap-2 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                >
                  {[
                    { value: "94%", label: "Zielerreichung", icon: Target },
                    { value: "2.4x", label: "Schneller", icon: Sparkles },
                    { value: "15min", label: "Gespart/Tag", icon: Heart },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className="p-3 rounded-xl bg-card border border-border text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + i * 0.1, duration: 0.3 }}
                    >
                      <stat.icon className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <div className="text-sm font-bold text-foreground">{stat.value}</div>
                      <div className="text-[9px] text-muted-foreground/60">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
                
                {/* Success message */}
                <motion.div 
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.3 }}
                >
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Nutzer erreichen ihre Ziele 2.4x schneller
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </StepCard>
        );

      case "transformation":
        const transformationItems = [
          { label: "More Energy", Icon: Zap, value: "+40%" },
          { label: "Time Saved", Icon: Clock, value: "15 min/day" },
          { label: "Goal Success", Icon: Target, value: "94%" },
        ];
        return (
          <StepCard step="transformation">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.4 }} 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-lg"
              >
                <Rocket className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Your Transformation</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">What to expect with Frigy</p>
              
              <div className="w-full max-w-sm space-y-4">
                {transformationItems.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    <span className="text-primary font-bold">{item.value}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </StepCard>
        );

      case "premium-hint":
        const freeFeatures = [
          "2 Kühlschrank-Scans/Tag",
          "Basis-Rezeptvorschläge",
          "Kalorien-Anzeige"
        ];
        
        const premiumFeaturesOnboarding = [
          "Unbegrenzte Scans",
          "KI-Chatbot",
          "Wöchentliche Meal Plans",
          "Einkaufslisten",
          "Makro-Tracking",
          "Wasser-Tracker"
        ];
        
        const handlePlanContinue = () => {
          if (selectedPlanOption === 'free') {
            goNext();
          } else if (selectedPlanOption === 'premium') {
            // Save onboarding data and go to premium pricing
            saveOnboardingData(userData);
            onComplete();
            // Small delay to ensure navigation happens after onComplete
            setTimeout(() => {
              window.location.href = '/premium-pricing';
            }, 100);
          }
        };
        
        return (
          <StepCard step="premium-hint">
            <div className="flex flex-col items-center text-center px-4 w-full">
              <h1 className="text-2xl font-bold mb-1">Wähle deinen Plan</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Starte mit Free oder teste Premium 7 Tage gratis</p>
              
              <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-6">
                {/* Free Plan */}
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  onClick={() => setSelectedPlanOption('free')}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedPlanOption === 'free'
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-2">
                      <Check className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold">Free</h3>
                    <div className="mt-1">
                      <span className="text-2xl font-bold">€0</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    {freeFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-1.5 text-[10px]">
                        <Check className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground text-left">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Selection indicator */}
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedPlanOption === 'free' 
                      ? 'border-primary bg-primary' 
                      : 'border-muted-foreground/30'
                  }`}>
                    {selectedPlanOption === 'free' && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                </motion.div>

                {/* Premium Plan */}
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  onClick={() => setSelectedPlanOption('premium')}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedPlanOption === 'premium'
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  {/* Recommended badge */}
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      EMPFOHLEN
                    </span>
                  </div>
                  
                  <div className="text-center mb-3 mt-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 mb-2">
                      <Star className="h-5 w-5 text-primary" fill="currentColor" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">Premium</h3>
                    <div className="mt-1">
                      <span className="text-2xl font-bold text-primary">€4,99</span>
                      <span className="text-muted-foreground text-[10px]">/Mo</span>
                    </div>
                    <p className="text-[9px] text-primary mt-0.5">7 Tage gratis</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    {premiumFeaturesOnboarding.map((feature, index) => (
                      <div key={index} className="flex items-start gap-1.5 text-[10px]">
                        <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-left">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Selection indicator */}
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedPlanOption === 'premium' 
                      ? 'border-primary bg-primary' 
                      : 'border-muted-foreground/30'
                  }`}>
                    {selectedPlanOption === 'premium' && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                </motion.div>
              </div>
              
              <Button 
                onClick={handlePlanContinue} 
                disabled={!selectedPlanOption}
                className="w-full max-w-sm h-12 rounded-xl"
              >
                {selectedPlanOption === 'free' && (
                  <>
                    Mit Free starten
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </>
                )}
                {selectedPlanOption === 'premium' && (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Weiter zu Premium
                  </>
                )}
                {!selectedPlanOption && "Wähle einen Plan"}
              </Button>
              
              {selectedPlanOption === 'free' && (
                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-[10px] text-muted-foreground/40 mt-3"
                >
                  Du hast den kostenlosen Plan ausgewählt. Drücke den Button um zu starten!
                </motion.p>
              )}
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
              <p className="text-muted-foreground/40 text-xs mb-6">Discover recipes from the community</p>
              
              <div className="w-full max-w-sm space-y-3">
                {recipes.map((recipe, i) => (
                  <motion.div
                    key={recipe.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
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

      case "celebration":
        return (
          <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
            {/* Text at top */}
            <motion.div
              className="absolute top-[12%] text-center z-10 px-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
            >
              <motion.h1 
                className="text-4xl sm:text-5xl font-bold text-primary tracking-tight"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ delay: 1, duration: 0.4 }}
              >
                Du hast es geschafft! 🎉
              </motion.h1>
              <motion.p
                className="text-lg text-muted-foreground mt-4 max-w-xs mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.4 }}
              >
                Frigy ist bereit für dich!
              </motion.p>
            </motion.div>

            {/* Animated Frigy mascot - pops up from bottom */}
            <motion.div 
              className="absolute bottom-0 flex items-end justify-center w-full"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 1
              }}
            >
              <AnimatedFrigyMascot 
                size={340} 
                animate={false}
              />
            </motion.div>

            {/* Continue button at bottom */}
            <motion.div 
              className="absolute bottom-8 left-0 right-0 px-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.4 }}
            >
              <Button
                onClick={goNext}
                className="w-full max-w-sm mx-auto h-12 rounded-xl flex items-center justify-center"
              >
                Weiter geht's!
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          </div>
        );

      case "done":
        return (
          <StepCard step="done">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                Dein System ist bereit.
              </motion.h1>
              
              <motion.p 
                className="text-muted-foreground/40 text-sm mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                Makros. Struktur. Weniger nachdenken.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <Button onClick={handleComplete} className="w-full max-w-xs h-12 rounded-xl">
                  Zum Dashboard
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

  // Determine when mascot should peek (every 4th slide approximately)
  const shouldShowMascotPeek = currentIndex > 0 && currentIndex % 4 === 0 && 
    !["analyzing", "done", "welcome", "language-select"].includes(currentStep);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background safe-area-inset"
    >
      {/* Frigy Mascot Peek Animation */}
      <FrigyPeek 
        show={shouldShowMascotPeek} 
        from="bottom-right" 
        delay={0.5} 
      />

      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${currentStep === 'analyzing' || currentStep === 'language-select' ? 'opacity-0 pointer-events-none' : ''}`}>
        {currentIndex > 0 ? (
          <motion.button
            onClick={goBack}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180 text-muted-foreground" />
          </motion.button>
        ) : (
          <div className="w-10" />
        )}
        
        <ProgressDots current={currentIndex} total={onboardingSteps.length} />

        <button 
          onClick={handleSkip} 
          className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors px-2 py-1"
        >
          {t.skip || "Überspringen"}
        </button>
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
      {!["language-select", "fridge-intro", "weekly-plan", "premium-hint", "community", "celebration", "done", "analyzing"].includes(currentStep) && (
        <motion.div 
          className="p-6 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Button
            onClick={goNext}
            disabled={!canProceed()}
            className={`w-full h-12 rounded-xl transition-all ${!canProceed() ? "opacity-50" : ""}`}
          >
            {currentStep === "welcome" ? t.start : 
             currentStep === "tracker-intro" ? "Let's go! 🚀" : 
             currentStep === "macro-preview" ? "Perfekt! 🎯" :
             t.next}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
