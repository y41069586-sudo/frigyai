import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronRight, Camera, Scale, Target, Dumbbell, Leaf, Check, X,
  Apple, Smartphone, ShoppingCart, Heart, Users, Sparkles, Star, Globe,
  Zap, Clock, Rocket, TrendingUp, Flame, BarChart3, Activity, User,
  Ruler, Calendar, Brain, AlertTriangle, Salad, Fish, Utensils, Wheat,
  Milk, Egg, Bean, CircleCheck, ChefHat, Award, PersonStanding, Bike,
  GraduationCap, Medal, Crown, Armchair, Footprints, Carrot, CupSoda,
  Droplets, Coffee, Mail, Lock, Eye, EyeOff, Save, Beef, Cherry,
  Bot, MessageCircle, BookOpen, ArrowRight, RefreshCw, ListChecks
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  AnimatedBicycle, AnimatedCar, AnimatedRocket, OnboardingProgressBar
} from "./onboarding/components";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { MotivationStep, CookingTimeStep, NotificationPrefsStep } from "./onboarding/steps";
import { WheelPicker } from "./WheelPicker";
import { MacroRing } from "./MacroRing";
import HeroAnimationCompact from "./HeroAnimationCompact";
import { InteractiveTutorial } from "./onboarding/InteractiveTutorial";

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
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { lightTap, successFeedback, selectionTap } = useHapticFeedback();
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  
  // Check if returning from scan with feedback request
  const showScanFeedback = location.state?.showScanFeedback === true;
  const initialStep: OnboardingStep = showScanFeedback ? "scan-feedback" : "language-select";
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep);
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [fridgeScan, setFridgeScan] = useState(false);
  const [macroAnimate, setMacroAnimate] = useState(false);
  const [chartAnimate, setChartAnimate] = useState(false);
  const [selectedPlanOption, setSelectedPlanOption] = useState<'free' | 'premium' | null>(null);
  const [introPhase, setIntroPhase] = useState<'rising' | 'greeting' | 'settling' | 'done'>('rising');
  
  // Save progress auth state
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  
  // Scan feedback state (moved to top level to avoid hooks in switch)
  const [scanFeedback, setScanFeedback] = useState<'positive' | 'negative' | null>(null);
  const [selectedFeedbackReason, setSelectedFeedbackReason] = useState<string | null>(null);
  
  // Ref for scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const currentIndex = onboardingSteps.indexOf(currentStep);
  const totalSteps = onboardingSteps.length;

  // Scroll to top on every step change
  useEffect(() => {
    // Scroll the main container ref
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    // Also scroll window as fallback (use 'auto' - 'instant' is not valid)
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [currentStep]);

  // Step-specific effects - with proper cleanup to avoid setState on unmounted component
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    if (currentStep === "fridge-intro") {
      timeouts.push(setTimeout(() => setFridgeOpen(true), 300));
      timeouts.push(setTimeout(() => setFridgeScan(true), 800));
    }
    if (currentStep === "macro-preview") {
      timeouts.push(setTimeout(() => setMacroAnimate(true), 300));
    }
    if (currentStep === "comparison") {
      timeouts.push(setTimeout(() => setChartAnimate(true), 400));
    }
    if (currentStep === "analyzing") {
      timeouts.push(setTimeout(() => setCurrentStep("macro-preview"), 9000));
    }
    if (currentStep === "celebration") {
      timeouts.push(setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.4 },
          colors: ["#22c55e", "#4ade80", "#86efac", "#fbbf24", "#fb7185"]
        });
      }, 600));
    }
    if (currentStep === "done") {
      timeouts.push(setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["hsl(142, 76%, 36%)", "hsl(142, 69%, 58%)", "hsl(43, 96%, 56%)"]
        });
      }, 400));
    }

    // Cleanup: clear all timeouts when component unmounts or step changes
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [currentStep]);

  const goNext = () => {
    lightTap(); // Haptic feedback on navigation
    
    // Handle conditional navigation for app-mode steps
    if (currentStep === "spontan-mode-1") {
      setCurrentStep("spontan-mode-2");
      return;
    }
    if (currentStep === "structured-mode-1") {
      setCurrentStep("structured-mode-2");
      return;
    }
    if (currentStep === "structured-mode-2") {
      setCurrentStep("structured-mode-3");
      return;
    }
    
    let nextIndex = currentIndex + 1;
    
    // Check if user already used their free onboarding scan (persists across sessions)
    const scanUsed = localStorage.getItem('onboardingScanUsed') === 'true';
    
    // Skip fridge-intro if scan was already used in a previous session
    if (scanUsed && onboardingSteps[nextIndex] === "fridge-intro") {
      nextIndex++; // Skip fridge-intro
    }
    
    // Skip scan-feedback if user didn't actually scan (no showScanFeedback state)
    const didScan = location.state?.showScanFeedback === true;
    if (onboardingSteps[nextIndex] === "scan-feedback" && !didScan) {
      nextIndex++; // Skip to next step after scan-feedback
    }
    
    if (nextIndex < onboardingSteps.length) {
      setCurrentStep(onboardingSteps[nextIndex]);
    } else {
      handleComplete();
    }
  };

  const goBack = () => {
    lightTap(); // Haptic feedback on navigation
    let prevIndex = currentIndex - 1;
    
    // Check if user already used their free onboarding scan
    const scanUsed = localStorage.getItem('onboardingScanUsed') === 'true';
    
    // If scan was used, prevent going back to fridge-intro step
    if (scanUsed && prevIndex >= 0) {
      const prevStep = onboardingSteps[prevIndex];
      if (prevStep === "fridge-intro") {
        // Skip fridge-intro and go to the step before it
        prevIndex--;
      }
    }
    
    if (prevIndex >= 0) setCurrentStep(onboardingSteps[prevIndex]);
  };

  const handleComplete = () => {
    successFeedback(); // Success haptic on completion
    saveOnboardingData(userData);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingComplete', 'true');
    onComplete();
  };

  const handleSelection = (callback: () => void) => {
    selectionTap(); // Haptic feedback on selection
    callback();
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "goal": return userData.goal !== null;
      case "gender": return userData.gender !== null;
      case "planning-setup": return userData.activityLevel !== null;
      case "save-progress": return !!user; // User must be logged in to proceed
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
            <div className="flex flex-col items-center text-center px-6 w-full pt-20">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="mb-4"
              >
                <Globe className="w-12 h-12 text-primary" />
              </motion.div>
              
              <motion.h1 className="text-2xl font-bold mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
                {t.chooseLanguage}
              </motion.h1>
              <motion.p className="text-muted-foreground/60 text-sm mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }}>
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

      case "name-input":
        return (
          <StepCard step="name-input">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="mb-4"
              >
                <AnimatedFrigyMascot size={100} animate={false} />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {t.onboardingWhatsYourName}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground/60 text-sm mb-8" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                {t.onboardingNameSubtitle}
              </motion.p>
              
              <motion.div
                className="w-full max-w-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  placeholder={t.onboardingYourName}
                  className="w-full px-6 py-4 text-xl text-center font-semibold bg-card border-2 border-border rounded-2xl focus:border-primary focus:outline-none transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userData.name.trim()) {
                      goNext();
                    }
                  }}
                />
              </motion.div>
              
              <motion.div
                className="w-full max-w-sm mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <Button 
                  onClick={goNext} 
                  disabled={!userData.name.trim()}
                  className="w-full h-14 text-lg font-semibold rounded-2xl"
                  size="lg"
                >
                  {t.next} <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </motion.div>
            </div>
          </StepCard>
        );

      case "welcome":
        return (
          <div className="fixed inset-0 bg-background flex flex-col">
            {/* Main content - centered vertically */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              {/* Animated Fridge Popup */}
              <motion.div
                initial={{ scale: 0, y: 100, rotateY: -90 }}
                animate={{ scale: 1, y: 0, rotateY: 0 }}
                transition={{ 
                  duration: 0.8, 
                  type: "spring", 
                  stiffness: 120,
                  damping: 12
                }}
                className="relative"
              >
                {/* Fridge Door Animation */}
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: [-20, 0] }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <AnimatedFrigyMascot size={160} animate={true} />
                </motion.div>
                
                {/* Sparkle Effects */}
                <motion.div
                  className="absolute -top-2 -right-2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.3 }}
                >
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </motion.div>
                <motion.div
                  className="absolute -top-4 left-0"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4, duration: 0.3 }}
                >
                  <Star className="w-5 h-5 text-primary fill-primary" />
                </motion.div>
              </motion.div>
              
              {/* Greeting with User's Name */}
              <motion.div
                className="text-center mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
              >
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.3 }}
                >
                  <span className="text-xl">👋</span>
                  <span className="text-primary font-semibold">
                    {language === 'de' ? 'Hallo' : language === 'fr' ? 'Salut' : 'Hello'}, {userData.name || 'du'}!
                  </span>
                </motion.div>
                
                <h1 className="text-3xl font-bold text-foreground">
                  {t.onboardingImFrigy}
                </h1>
                <p className="text-muted-foreground mt-3 text-lg max-w-xs mx-auto">
                  {t.onboardingReadyToReachGoals}
                </p>
              </motion.div>
              
            </div>
            
            {/* Bottom CTA */}
            <motion.div
              className="px-6 pb-8 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 0.4 }}
            >
              <Button 
                onClick={goNext} 
                className="w-full h-14 text-lg font-semibold rounded-2xl"
                size="lg"
              >
                {t.onboardingYesLetsGo} <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          </div>
        );

      case "goal":
        const goalOptionsData = [
          { id: "lose", label: t.onboardingLoseWeight, Icon: Flame },
          { id: "maintain", label: t.onboardingMaintainWeight, Icon: Scale },
          { id: "gain", label: t.onboardingGainMuscle, Icon: Dumbbell },
          { id: "healthier", label: t.onboardingEatHealthier, Icon: Salad },
        ];
        return (
          <StepCard step="goal">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <h1 className="text-2xl font-bold mb-1">{t.onboardingWhatsYourGoal}</h1>
              <p className="text-muted-foreground/60 text-xs mb-6">{t.onboardingSelectToPersonalize}</p>
              
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
          { name: "Sarah M.", text: language === 'de' ? "8kg in 2 Monaten verloren!" : language === 'fr' ? "Perdu 8kg en 2 mois!" : "Lost 8kg in 2 months!", color: "from-pink-500/20 to-rose-500/20", rating: 5 },
          { name: "Thomas K.", text: language === 'de' ? "Endlich meine Makros erreicht!" : language === 'fr' ? "Enfin atteint mes macros!" : "Finally hitting my macros!", color: "from-blue-500/20 to-cyan-500/20", rating: 5 },
          { name: "Lisa R.", text: language === 'de' ? "Beste Meal-Planning App!" : language === 'fr' ? "La meilleure app de planification!" : "Best meal planning app ever", color: "from-purple-500/20 to-pink-500/20", rating: 5 },
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
                {t.onboardingLovedByThousands}
              </motion.h1>
              <motion.p className="text-muted-foreground/50 text-xs mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }}>
                {t.onboardingJoinUsers}
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
          { value: 94, suffix: "%", label: t.onboardingReachGoals, color: "bg-primary" },
          { value: 2.5, suffix: "kg", label: t.onboardingAvgWeightLoss, color: "bg-blue-500" },
          { value: 15, suffix: "min", label: t.onboardingTimeSaved, color: "bg-purple-500" },
        ];
        return (
          <StepCard step="success-stats">
            <div className="flex flex-col items-center text-center px-6 w-full">
              {/* Animated Bar Chart */}
              <motion.div 
                className="relative w-full max-w-xs h-40 flex items-end justify-center gap-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {[
                  { height: 60, color: "bg-primary/70", delay: 0.2 },
                  { height: 85, color: "bg-primary/85", delay: 0.4 },
                  { height: 100, color: "bg-primary", delay: 0.6 },
                ].map((bar, i) => (
                  <motion.div
                    key={i}
                    className={`w-12 rounded-t-xl ${bar.color} relative overflow-hidden`}
                    initial={{ height: 0 }}
                    animate={{ height: `${bar.height}%` }}
                    transition={{ 
                      delay: bar.delay, 
                      duration: 0.8, 
                      ease: [0.34, 1.56, 0.64, 1] 
                    }}
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                      initial={{ y: "100%" }}
                      animate={{ y: "-100%" }}
                      transition={{ delay: bar.delay + 0.5, duration: 0.6 }}
                    />
                  </motion.div>
                ))}
                
                {/* Trend arrow */}
                <motion.div
                  className="absolute -right-2 top-2"
                  initial={{ opacity: 0, x: -20, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                >
                  <TrendingUp className="w-8 h-8 text-primary" />
                </motion.div>
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-1" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                {t.onboardingRealResults}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground/50 text-xs mb-6" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                {t.onboardingBasedOnData}
              </motion.p>
              
              <div className="w-full max-w-sm space-y-3">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + i * 0.15, duration: 0.4 }}
                    className="relative p-4 rounded-2xl bg-card border border-border overflow-hidden"
                  >
                    <div className="flex items-center gap-4">
                      <motion.span 
                        className="text-2xl font-bold text-primary"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 + i * 0.15, duration: 0.3, ease: "backOut" }}
                      >
                        {stat.value}{stat.suffix}
                      </motion.span>
                      <span className="text-sm text-muted-foreground/60">{stat.label}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </StepCard>
        );

      case "tutorial-transition":
        return (
          <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
            {/* Animated background gradient */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
            
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
              {/* Animated Frigy mascot appearing */}
              <motion.div
                className="relative mb-6"
                initial={{ y: 100, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {/* Glow effect behind mascot */}
                <motion.div
                  className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.5 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                />
                <AnimatedFrigyMascot size={140} animate={true} />
              </motion.div>
              
              {/* Personalized greeting */}
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <motion.p 
                  className="text-muted-foreground/60 text-sm mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  {t.onboardingPerfect}, {userData.name}! 🎉
                </motion.p>
                <motion.h1 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {t.onboardingIKnowWhatYouWant}
                  </span>
                </motion.h1>
              </motion.div>
              
              {/* Goal summary card */}
              <motion.div
                className="w-full max-w-sm bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4 mb-6"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground/60">{t.onboardingYourGoalMode}</p>
                    <p className="font-semibold text-foreground">
                      {userData.goal === 'lose' && t.onboardingLoseWeight}
                      {userData.goal === 'gain' && t.onboardingGainMuscle}
                      {userData.goal === 'maintain' && t.onboardingMaintainWeight}
                      {userData.goal === 'health' && t.onboardingEatHealthier}
                      {!userData.goal && t.onboardingEatHealthier}
                    </p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, duration: 0.3, type: "spring" }}
                  >
                    <Check className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Transition text */}
              <motion.p
                className="text-center text-muted-foreground/70 text-sm max-w-xs mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                {t.onboardingLetMeShowYou} 
                <motion.span
                  className="inline-block ml-1"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  →
                </motion.span>
              </motion.p>
            </div>
            
            {/* Bottom CTA */}
            <motion.div
              className="px-6 pb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.4 }}
            >
              <Button
                onClick={goNext}
                size="lg"
                className="w-full h-14 text-lg font-semibold rounded-2xl relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t.onboardingShowMeHow} 
                  <Sparkles className="w-5 h-5" />
                </span>
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ x: ["100%", "-100%"] }}
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                />
              </Button>
            </motion.div>
          </div>
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
                {t.onboardingTimeToPersonalize}
              </motion.h1>
              <motion.p className="text-muted-foreground/60 text-sm mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.3 }}>
                {t.onboardingQuickSteps}
              </motion.p>
              
              <div className="flex gap-4 mb-8">
                {[
                  { Icon: Ruler, label: t.onboardingBody },
                  { Icon: Activity, label: t.onboardingActivity },
                  { Icon: BarChart3, label: t.onboardingMacros }
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
                {t.onboardingTakesLess30Sec} <Zap className="w-3 h-3 text-primary" />
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
              
              <h1 className="text-xl font-bold mb-1">{t.onboardingYourBodyData}</h1>
              <p className="text-muted-foreground/40 text-xs mb-4">{t.onboardingScrollToSet}</p>
              
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
                    <span className="text-xs font-medium">{t.onboardingHeight}</span>
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
                    <span className="text-xs font-medium">{t.onboardingWeightLabel}</span>
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
                    <span className="text-xs font-medium">{t.onboardingAgeLabel}</span>
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
                <span className="text-xs text-muted-foreground/60">{t.onboardingPrivate}</span>
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
              
              <h1 className="text-2xl font-bold mb-1">{t.onboardingYourGender}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">{t.onboardingGenderImportant}</p>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {[
                  { id: 'male' as const, label: t.onboardingMale, color: 'from-blue-500/20 to-cyan-500/20' },
                  { id: 'female' as const, label: t.onboardingFemale, color: 'from-pink-500/20 to-rose-500/20' },
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
                {language === 'de' ? '~166 kcal Unterschied zwischen Männern & Frauen' : language === 'fr' ? '~166 kcal différence entre hommes & femmes' : '~166 kcal difference between men & women'}
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
              
              <h1 className="text-2xl font-bold mb-1">{t.onboardingYourGoalMode}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">{t.onboardingWhatDirection}</p>
              
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
                  <span className="text-lg font-bold block">{t.onboardingLoseWeightMode}</span>
                  <span className="text-xs text-muted-foreground/40">{language === 'de' ? 'Kaloriendefizit' : language === 'fr' ? 'Déficit calorique' : 'Calorie deficit'}</span>
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
                  <span className="text-lg font-bold block">{t.onboardingGainWeightMode}</span>
                  <span className="text-xs text-muted-foreground/40">{language === 'de' ? 'Kalorienüberschuss' : language === 'fr' ? 'Surplus calorique' : 'Calorie surplus'}</span>
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
              
              <h1 className="text-2xl font-bold mb-1">{t.onboardingTargetWeight}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">
                {userData.goalMode === 'lose' 
                  ? (language === 'de' ? 'Wie viel möchtest du verlieren?' : language === 'fr' ? 'Combien voulez-vous perdre?' : 'How much do you want to lose?')
                  : (language === 'de' ? 'Wie viel möchtest du zunehmen?' : language === 'fr' ? 'Combien voulez-vous prendre?' : 'How much do you want to gain?')}
              </p>
              
              <div className="w-full max-w-sm space-y-6">
                <motion.div 
                  className="relative h-40 flex items-end justify-center gap-8 pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <div className="flex flex-col items-center">
                    <motion.div 
                      className="w-16 bg-muted-foreground/30 rounded-t-xl"
                      initial={{ height: 0 }}
                      animate={{ height: 80 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    />
                    <span className="text-xs text-muted-foreground/60 mt-2">{language === 'de' ? 'Aktuell' : language === 'fr' ? 'Actuel' : 'Current'}</span>
                    <span className="text-lg font-bold">{userData.weight}kg</span>
                  </div>
                  
                  <motion.div 
                    className="flex items-center gap-1 mb-16"
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
                      style={{ minHeight: 30, maxHeight: 120 }}
                    />
                    <span className="text-xs text-primary mt-2">{t.goal}</span>
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
                      {userData.goalMode === 'lose' 
                        ? (language === 'de' ? 'Gewichtsverlust' : language === 'fr' ? 'Perte de poids' : 'Weight loss')
                        : (language === 'de' ? 'Gewichtszunahme' : language === 'fr' ? 'Prise de poids' : 'Weight gain')}
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
                  <Sparkles className="w-3 h-3 text-primary" /> 
                  {language === 'de' 
                    ? `Max. 10kg ${userData.goalMode === 'lose' ? 'Verlust' : 'Zunahme'} für nachhaltige Ergebnisse`
                    : language === 'fr'
                      ? `Max. 10kg ${userData.goalMode === 'lose' ? 'de perte' : 'de gain'} pour résultats durables`
                      : `Max. 10kg ${userData.goalMode === 'lose' ? 'loss' : 'gain'} for sustainable results`}
                </motion.p>
              </div>
            </div>
          </StepCard>
        );

      case "speed-select":
        // Slider-based tempo selection (0.1 - 1.5 kg/week)
        const minSpeed = 0.1;
        const maxSpeed = 1.5;
        const currentSpeed = userData.weeklyGoal || 0.5;
        
        // Determine category for visual feedback with animated icons
        const getSpeedCategory = (speed: number): { label: string; desc: string; Component: typeof AnimatedBicycle; color: string } => {
          if (speed <= 0.5) return { label: t.onboardingSlow, desc: t.onboardingGentle, Component: AnimatedBicycle, color: "text-green-500" };
          if (speed <= 0.9) return { label: t.onboardingModerate, desc: t.onboardingSteady, Component: AnimatedCar, color: "text-blue-500" };
          return { label: t.onboardingFast, desc: t.onboardingAmbitious, Component: AnimatedRocket, color: "text-orange-500" };
        };
        
        const speedCategory = getSpeedCategory(currentSpeed);
        const SpeedIcon = speedCategory.Component;
        
        return (
          <StepCard step="speed-select">
            <div className="flex flex-col items-center text-center px-6 w-full">
              {/* Animated Speed Icon */}
              <motion.div 
                key={speedCategory.label}
                initial={{ scale: 0.5, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ duration: 0.3, type: "spring" }} 
                className={`mb-4 ${speedCategory.color}`}
              >
                <SpeedIcon selected={true} />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">{t.onboardingYourSpeed}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">
                {t.onboardingHowFast}
              </p>
              
              {/* Speed Display */}
              <motion.div 
                className="mb-6 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-5xl font-bold text-primary mb-1">
                  {currentSpeed.toFixed(1)}
                  <span className="text-lg font-normal text-muted-foreground ml-1">kg/{language === 'de' ? 'Woche' : language === 'fr' ? 'semaine' : 'week'}</span>
                </div>
                <motion.div 
                  key={speedCategory.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm font-medium ${speedCategory.color}`}
                >
                  {speedCategory.label} – {speedCategory.desc}
                </motion.div>
              </motion.div>
              
              {/* Animated Icons as Markers */}
              <div className="w-full max-w-sm px-2 mb-2">
                <div className="flex justify-between items-end px-1 mb-1">
                  <div className={`transition-all duration-200 ${currentSpeed <= 0.5 ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`}>
                    <AnimatedBicycle selected={currentSpeed <= 0.5} />
                  </div>
                  <div className={`transition-all duration-200 ${currentSpeed > 0.5 && currentSpeed <= 0.9 ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`}>
                    <AnimatedCar selected={currentSpeed > 0.5 && currentSpeed <= 0.9} />
                  </div>
                  <div className={`transition-all duration-200 ${currentSpeed > 0.9 ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`}>
                    <AnimatedRocket selected={currentSpeed > 0.9} />
                  </div>
                </div>
              </div>
              
              {/* Slider */}
              <div className="w-full max-w-sm px-2">
                <input
                  type="range"
                  min={minSpeed * 10}
                  max={maxSpeed * 10}
                  step={1}
                  value={currentSpeed * 10}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) / 10;
                    selectionTap();
                    setUserData({ ...userData, weeklyGoal: newValue });
                  }}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((currentSpeed - minSpeed) / (maxSpeed - minSpeed)) * 100}%, hsl(var(--muted)) ${((currentSpeed - minSpeed) / (maxSpeed - minSpeed)) * 100}%, hsl(var(--muted)) 100%)`
                  }}
                />
                
                {/* Labels */}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground/60">
                  <span>0.1 kg</span>
                  <span>0.5 kg</span>
                  <span>1.0 kg</span>
                  <span>1.5 kg</span>
                </div>
              </div>
              
              {/* Quick Select Buttons */}
              <div className="flex gap-2 mt-6">
                {[0.3, 0.5, 0.8, 1.0, 1.2].map((speed) => (
                  <motion.button
                    key={speed}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      selectionTap();
                      setUserData({ ...userData, weeklyGoal: speed });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      Math.abs(currentSpeed - speed) < 0.05
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {speed}
                  </motion.button>
                ))}
              </div>
              
              <motion.p 
                className="text-xs text-muted-foreground/40 mt-6 flex items-center gap-1" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <AlertTriangle className="w-3 h-3 text-yellow-500" /> 
                {currentSpeed >= 1.0 ? t.onboardingHighTempoWarning : t.onboardingRecommendedTempo}
              </motion.p>
            </div>
          </StepCard>
        );

      case "dietary-preferences":
        const dietOptionsData = [
          { id: 'vegetarian', label: t.onboardingVegetarian, Icon: Salad, desc: t.onboardingNoMeatFish },
          { id: 'vegan', label: t.onboardingVegan, Icon: Leaf, desc: t.onboardingNoAnimalProducts },
          { id: 'pescatarian', label: t.onboardingPescatarian, Icon: Fish, desc: t.onboardingFishNoMeat },
          { id: 'none', label: t.onboardingNone, Icon: Utensils, desc: t.onboardingEverythingAllowed },
        ];
        return (
          <StepCard step="dietary-preferences">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-lg">
                <Leaf className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">{t.onboardingDietaryPrefs}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">{t.onboardingForMatchingRecipes}</p>
              
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
          { id: 'gluten', label: t.onboardingGluten, Icon: Wheat },
          { id: 'lactose', label: t.onboardingLactose, Icon: Milk },
          { id: 'nuts', label: t.onboardingNuts, Icon: Apple },
          { id: 'soy', label: t.onboardingSoy, Icon: Bean },
          { id: 'eggs', label: t.onboardingEggs, Icon: Egg },
          { id: 'none', label: t.onboardingNone, Icon: CircleCheck },
        ];
        return (
          <StepCard step="allergies">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                <AlertTriangle className="w-8 h-8 text-white" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">{t.onboardingAllergies}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">{t.onboardingMultiSelect}</p>
              
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
          { id: 'beginner' as const, label: t.onboardingBeginner, icon: GraduationCap, desc: t.onboardingSimpleRecipes, color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-500' },
          { id: 'intermediate' as const, label: t.onboardingIntermediate, icon: ChefHat, desc: t.onboardingMediumDishes, color: 'from-yellow-500/20 to-orange-500/20', iconColor: 'text-yellow-500' },
          { id: 'advanced' as const, label: t.onboardingAdvanced, icon: Crown, desc: t.onboardingDemandingCuisine, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-500' },
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
              
              <h1 className="text-2xl font-bold mb-1">{t.onboardingCookingExperience}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">{t.onboardingForRecipeDifficulty}</p>
              
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
          { id: "low", label: t.onboardingChill, icon: Armchair, desc: t.onboardingDeskJob, color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
          { id: "medium", label: t.onboardingActive, icon: Footprints, desc: t.onboardingRegularWorkouts, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
          { id: "high", label: t.onboardingBeast, icon: Flame, desc: t.onboardingIntenseTraining, color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
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
              
              <h1 className="text-2xl font-bold mb-1">{t.onboardingActivityLevel}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">{t.onboardingHowActive}</p>
              
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
          { id: 1, text: t.onboardingAnalyzingGoals, delay: 0 },
          { id: 2, text: t.onboardingProcessingBodyData, delay: 1600 },
          { id: 3, text: t.onboardingCalculatingTargetWeight, delay: 3200 },
          { id: 4, text: t.onboardingDeterminingMacros, delay: 4800 },
          { id: 5, text: t.onboardingCreatingPlan, delay: 6400 },
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
        const goalDateFormatted = goalDate.toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' });
        
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
              {/* Hero Goal Prediction Banner - TOP */}
              <motion.div 
                className="w-full max-w-sm mb-6"
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 shadow-lg">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative z-10">
                    <motion.div 
                      className="flex items-center justify-center gap-2 mb-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className="text-2xl">🎯</span>
                      <span className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">{t.yourGoalLabel2}</span>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <p className="text-primary-foreground text-lg font-bold mb-1">
                        {t.youWillReach} <span className="text-2xl">{userData.targetWeight}kg</span> {language === 'de' ? 'erreichen' : ''}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4 text-primary-foreground/70" />
                        <p className="text-primary-foreground/90 font-semibold text-xl">
                          {t.onDate} {goalDateFormatted}
                        </p>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="mt-4 flex items-center justify-center gap-4 text-primary-foreground/70 text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <span>{userData.weight}kg {t.now}</span>
                      <span className="text-primary-foreground/50">→</span>
                      <span>{userData.weeklyGoal > 0 ? '-' : '+'}{Math.abs(userData.weeklyGoal)}kg/{t.weekLabel}</span>
                      <span className="text-primary-foreground/50">→</span>
                      <span className="font-semibold text-primary-foreground">{userData.targetWeight}kg</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Section title */}
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <h2 className="text-lg font-bold text-foreground">{t.yourDailyPlan}</h2>
                <p className="text-muted-foreground/60 text-xs">{t.tapToAdjust}</p>
              </motion.div>
              
              {/* Calorie Ring - Modern Card Style */}
              <motion.div
                className="mb-5 relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                  <MacroRing
                    value={userData.dailyCalories || calculatedMacros.dailyCalories}
                    max={userData.dailyCalories || calculatedMacros.dailyCalories}
                    label={t.dailyGoalLabel}
                    unit=" kcal"
                    color="calories"
                    size="lg"
                  />
                </div>
                <button
                  onClick={() => handleMacroEdit('dailyCalories', userData.dailyCalories || calculatedMacros.dailyCalories)}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center hover:bg-primary/10 hover:border-primary transition-all shadow-md"
                >
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </motion.div>
              
              {/* Macro Rings - Modern Grid */}
              <motion.div 
                className="grid grid-cols-3 gap-3 w-full max-w-xs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                {/* Protein */}
                <div className="relative p-3 rounded-xl bg-card border border-border/50 shadow-sm">
                  <MacroRing
                    value={userData.dailyProtein || calculatedMacros.dailyProtein}
                    max={userData.dailyProtein || calculatedMacros.dailyProtein}
                    label="Protein"
                    color="protein"
                    size="sm"
                  />
                  <button
                    onClick={() => handleMacroEdit('dailyProtein', userData.dailyProtein || calculatedMacros.dailyProtein)}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border border-blue-300 flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                
                {/* Carbs */}
                <div className="relative p-3 rounded-xl bg-card border border-border/50 shadow-sm">
                  <MacroRing
                    value={userData.dailyCarbs || calculatedMacros.dailyCarbs}
                    max={userData.dailyCarbs || calculatedMacros.dailyCarbs}
                    label="Carbs"
                    color="carbs"
                    size="sm"
                  />
                  <button
                    onClick={() => handleMacroEdit('dailyCarbs', userData.dailyCarbs || calculatedMacros.dailyCarbs)}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border border-amber-300 flex items-center justify-center hover:bg-amber-50 transition-colors shadow-sm"
                  >
                    <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                
                {/* Fat */}
                <div className="relative p-3 rounded-xl bg-card border border-border/50 shadow-sm">
                  <MacroRing
                    value={userData.dailyFat || calculatedMacros.dailyFat}
                    max={userData.dailyFat || calculatedMacros.dailyFat}
                    label="Fett"
                    color="fat"
                    size="sm"
                  />
                  <button
                    onClick={() => handleMacroEdit('dailyFat', userData.dailyFat || calculatedMacros.dailyFat)}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border border-rose-300 flex items-center justify-center hover:bg-rose-50 transition-colors shadow-sm"
                  >
                    <svg className="w-3 h-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
               </motion.div>
              
              {/* Scientific Sources Card - ehrliche Quellen die tatsächlich verwendet werden */}
              <motion.div
                className="w-full max-w-sm mt-6 p-4 rounded-2xl bg-card border border-border/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <p className="text-sm text-foreground/80 mb-3 text-left">
                  {t.calculationBasedOn}
                </p>
                <ul className="space-y-1.5 text-left">
                  {[
                    { name: t.onboardingMifflinFormula, url: "https://pubmed.ncbi.nlm.nih.gov/2305711/", desc: t.bmrCalculation },
                    { name: t.onboardingTDEEFactors, url: "https://pubmed.ncbi.nlm.nih.gov/8878356/", desc: t.totalEnergyExpenditure },
                    { name: t.onboardingProteinRecommendation, url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8", desc: t.issnProteinRecommendation },
                    { name: t.onboardingDeficitRule, url: "https://pubmed.ncbi.nlm.nih.gov/21872751/", desc: t.energyBalanceRule },
                  ].map((source, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.05, duration: 0.2 }}
                      className="flex flex-col"
                    >
                      <div className="flex items-start gap-1">
                        <span className="text-sm text-muted-foreground">• </span>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                        >
                          {source.name}
                        </a>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 ml-3">{source.desc}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </StepCard>
        );

      case "fridge-intro":
        return (
          <StepCard step="fridge-intro">
            <div className="flex flex-col items-center justify-center text-center px-4 w-full min-h-[60vh]">
              {/* Hero Animation - Full width */}
              <motion.div
                className="w-full max-w-sm mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <HeroAnimationCompact />
              </motion.div>
              
              <motion.h1 
                className="text-xl font-bold mb-2" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                {t.letFridgeDecide}
              </motion.h1>
              
              <motion.p 
                className="text-muted-foreground/70 text-sm mb-6 max-w-xs" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.15, duration: 0.2 }}
              >
                {t.weBuildMeals}
              </motion.p>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button 
                  onClick={() => navigate("/scan")} 
                  className="w-full h-12 rounded-xl text-base font-semibold"
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  {t.onboardingScanFridgeNow}
                </Button>
                <Button onClick={goNext} variant="ghost" className="w-full h-10 text-muted-foreground/60">
                  {language === 'de' ? 'Später scannen' : 'Scan later'}
                </Button>
              </div>
              
              <motion.p 
                className="text-[11px] text-muted-foreground/40 mt-6 italic max-w-xs" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.4, duration: 0.2 }}
              >
                &quot;{t.iHandlePlanning}&quot;
              </motion.p>
            </div>
          </StepCard>
        );

      case "scan-feedback":
        const feedbackReasons = [
          { id: 'not-enough', label: language === 'de' ? 'Zu wenige Zutaten erkannt' : 'Too few ingredients detected' },
          { id: 'wrong-items', label: language === 'de' ? 'Falsche Zutaten erkannt' : 'Wrong ingredients detected' },
          { id: 'too-slow', label: language === 'de' ? 'Zu langsam' : 'Too slow' },
          { id: 'other', label: language === 'de' ? 'Sonstiges' : 'Other' },
        ];
        
        const handleFeedbackContinue = () => {
          // Save feedback to localStorage for analytics
          localStorage.setItem('scanFeedback', JSON.stringify({
            positive: scanFeedback === 'positive',
            reason: selectedFeedbackReason,
            timestamp: new Date().toISOString()
          }));
          // Reset feedback state for next time
          setScanFeedback(null);
          setSelectedFeedbackReason(null);
          goNext();
        };
        
        return (
          <StepCard step="scan-feedback">
            <div className="flex flex-col items-center text-center px-6 w-full">
              {/* Mascot */}
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="mb-6"
              >
                <AnimatedFrigyMascot size={120} animate={true} />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {language === 'de' ? 'Hat der Scan gefallen?' : 'Did you like the scan?'}
              </motion.h1>
              
              <motion.p 
                className="text-muted-foreground/60 text-sm mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {language === 'de' ? 'Dein Feedback hilft uns besser zu werden' : 'Your feedback helps us improve'}
              </motion.p>
              
              {/* Feedback buttons */}
              {!scanFeedback && (
                <motion.div 
                  className="flex gap-4 w-full max-w-xs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setScanFeedback('positive')}
                    className="flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border bg-card hover:border-primary/50 transition-all"
                  >
                    <span className="text-4xl">👍</span>
                    <span className="font-semibold text-lg">{language === 'de' ? 'Ja!' : 'Yes!'}</span>
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setScanFeedback('negative')}
                    className="flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border bg-card hover:border-destructive/50 transition-all"
                  >
                    <span className="text-4xl">👎</span>
                    <span className="font-semibold text-lg">{language === 'de' ? 'Nein' : 'No'}</span>
                  </motion.button>
                </motion.div>
              )}
              
              {/* Positive feedback - show continue */}
              {scanFeedback === 'positive' && (
                <motion.div 
                  className="w-full max-w-xs"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <Check className="w-10 h-10 text-primary" />
                    </motion.div>
                    <p className="text-lg font-semibold text-primary">
                      {language === 'de' ? 'Super, danke! 🎉' : 'Great, thanks! 🎉'}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleFeedbackContinue}
                    className="w-full h-14 text-lg font-semibold rounded-2xl"
                  >
                    {language === 'de' ? 'Weiter' : 'Continue'} <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}
              
              {/* Negative feedback - show reasons */}
              {scanFeedback === 'negative' && (
                <motion.div 
                  className="w-full max-w-xs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === 'de' ? 'Was war das Problem?' : 'What was the issue?'}
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    {feedbackReasons.map((reason, index) => (
                      <motion.button
                        key={reason.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedFeedbackReason(reason.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedFeedbackReason === reason.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border bg-card hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{reason.label}</span>
                          {selectedFeedbackReason === reason.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={handleFeedbackContinue}
                    disabled={!selectedFeedbackReason}
                    className="w-full h-14 text-lg font-semibold rounded-2xl"
                  >
                    {language === 'de' ? 'Weiter' : 'Continue'} <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}
              
              {/* Skip option if user didn't scan */}
              {!scanFeedback && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={goNext}
                  className="mt-6 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {language === 'de' ? 'Ich habe nicht gescannt' : 'I didn\'t scan'}
                </motion.button>
              )}
            </div>
          </StepCard>
        );

      case "how-it-works":
        return (
          <StepCard step="how-it-works">
            <div className="flex flex-col items-center text-center px-6 w-full">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-lg"
              >
                <Zap className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {t.onboardingHowItWorks}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground/60 text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {t.onboardingHowItWorksSubtitle}
              </motion.p>
              
              {/* Steps */}
              <div className="w-full max-w-sm space-y-4">
                {/* Step 1: Scan */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="relative p-4 rounded-2xl border-2 border-border bg-card text-left"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Camera className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.onboardingHowItWorksStep1Title}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{t.onboardingHowItWorksStep1Desc}</p>
                    </div>
                  </div>
                  {/* Arrow down */}
                  <motion.div 
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-primary"
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </motion.div>
                </motion.div>
                
                {/* Step 2: Weekly Plan */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="relative p-4 rounded-2xl border-2 border-border bg-card text-left"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.onboardingHowItWorksStep2Title}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{t.onboardingHowItWorksStep2Desc}</p>
                    </div>
                  </div>
                  {/* Arrow down */}
                  <motion.div 
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-primary"
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  >
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </motion.div>
                </motion.div>
                
                {/* Step 3: Connection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 text-left"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.onboardingHowItWorksStep3Title}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{t.onboardingHowItWorksStep3Desc}</p>
                    </div>
                  </div>
                </motion.div>
                
                {/* Pro Tip */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
                >
                  <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">{t.onboardingHowItWorksTip}</p>
                </motion.div>
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
              
              <h1 className="text-2xl font-bold mb-1">{t.enableCamera}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">{t.requiredForScanning}</p>
              
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
                      <span className="font-medium block text-sm">{t.cameraAccessLabel}</span>
                      <span className="text-[10px] text-muted-foreground/40">{t.forFridgeScanning}</span>
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
                      {t.allowAccess}
                    </Button>
                  )}
                </motion.div>
                
                <div className="pt-4">
                  <p className="text-[10px] text-muted-foreground/40 mb-3">{t.onboardingOptionalHealthSync}</p>
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
                  {t.skipForNowBtn}
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
                {t.onboardingYourWeeklyPlan}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground/60 text-sm mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                {t.onboardingPersonalizedMealPlan} - {targetCalories} kcal
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
                          <span>{t.breakfast}</span>
                        </div>
                        <span className="text-muted-foreground/80 line-clamp-1">{day.breakfast}</span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1 text-muted-foreground/60 mb-0.5">
                          <Salad className="w-2.5 h-2.5" />
                          <span>{t.lunch}</span>
                        </div>
                        <span className="text-muted-foreground/80 line-clamp-1">{day.lunch}</span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1 text-muted-foreground/60 mb-0.5">
                          <Utensils className="w-2.5 h-2.5" />
                          <span>{t.dinner}</span>
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
                <span>{t.personalizedOnPrefs}</span>
              </motion.div>
              
              <Button onClick={goNext} className="w-full max-w-xs h-12 rounded-xl">
                <ChevronRight className="w-5 h-5 mr-2" />
                {t.continueBtn}
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
                {t.planningWithFrigy}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground/60 text-sm mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {t.yourWayToSuccess}
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
                      <div className="text-xs text-muted-foreground/60 mb-2">{t.withoutFrigyLabel}</div>
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
                          <span>{t.noStructure}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                          <X className="w-3 h-3" />
                          <span>{t.goalsMissed}</span>
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
                        {t.withFrigyLabel}
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
                          <span>{t.clearPlan}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-primary">
                          <Check className="w-3 h-3" />
                          <span>{t.successRate94}</span>
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
                    { value: "94%", label: t.goalAchievementLabel, icon: Target },
                    { value: "2.4x", label: t.fasterLabel, icon: Sparkles },
                    { value: "15min", label: t.savedPerDayLabel, icon: Heart },
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
                    {t.usersReachGoalsFaster}
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </StepCard>
        );

      case "transformation":
        const transformationItems = [
          { label: t.moreEnergyLabel, Icon: Zap, value: "+40%" },
          { label: t.timeSavedLabel, Icon: Clock, value: "15 min" },
          { label: t.goalSuccessLabel, Icon: Target, value: "94%" },
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
              
              <h1 className="text-2xl font-bold mb-1">{t.yourTransformationLabel}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">{t.whatToExpectWithFrigy}</p>
              
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

      case "tutorial":
        return (
          <InteractiveTutorial 
            onComplete={goNext} 
            onSkip={() => setCurrentStep("tracker-intro")} 
          />
        );

      case "app-mode-choice":
        return (
          <StepCard step="app-mode-choice">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.4, type: "spring" }} 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center mb-4 shadow-xl"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {language === 'de' ? 'Wie möchtest du kochen?' : language === 'fr' ? 'Comment veux-tu cuisiner ?' : 'How do you want to cook?'}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground text-sm mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {language === 'de' ? 'Wähle deinen Stil – du kannst ihn später ändern' : language === 'fr' ? 'Choisis ton style – tu peux le changer plus tard' : 'Choose your style – you can change it later'}
              </motion.p>
              
              <div className="w-full max-w-sm space-y-4">
                {/* Option 1: Spontan */}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentStep("spontan-mode-1")}
                  className="w-full p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                        {language === 'de' ? '🎲 Spontan & Flexibel' : language === 'fr' ? '🎲 Spontané & Flexible' : '🎲 Spontaneous & Flexible'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {language === 'de' ? 'Scanne deinen Kühlschrank, wähle deine Stimmung – bekomme passende Rezepte' : language === 'fr' ? 'Scanne ton frigo, choisis ton humeur – reçois des recettes adaptées' : 'Scan your fridge, choose your mood – get matching recipes'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors mt-4" />
                  </div>
                </motion.button>
                
                {/* Option 2: Strukturiert */}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentStep("structured-mode-1")}
                  className="w-full p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                        {language === 'de' ? '📋 Strukturiert & Geplant' : language === 'fr' ? '📋 Structuré & Planifié' : '📋 Structured & Planned'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {language === 'de' ? 'Wochenplan der täglich deine Makros trifft + automatische Einkaufsliste' : language === 'fr' ? 'Plan hebdomadaire qui atteint tes macros + liste de courses automatique' : 'Weekly plan that hits your daily macros + automatic shopping list'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors mt-4" />
                  </div>
                </motion.button>
              </div>
            </div>
          </StepCard>
        );

      case "spontan-mode-1":
        // Camera permission step for spontan mode
        const requestCameraPermissionSpontan = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setUserData({ ...userData, cameraPermission: true });
            // Navigate to fridge scan
            navigate('/scan', { state: { fromOnboarding: true, returnToOnboarding: true, nextStep: 'spontan-mode-2' } });
          } catch (err) {
            console.log('Camera permission denied');
            // Still allow to continue but without scan
            setCurrentStep("spontan-mode-2");
          }
        };
        
        return (
          <StepCard step="spontan-mode-1">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium mb-4"
              >
                {language === 'de' ? 'Spontan-Modus' : language === 'fr' ? 'Mode Spontané' : 'Spontaneous Mode'}
              </motion.div>
              
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.4, type: "spring" }} 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-xl"
              >
                <Camera className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {language === 'de' ? 'Kühlschrank scannen' : language === 'fr' ? 'Scanne ton frigo' : 'Scan Your Fridge'}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {language === 'de' ? 'Zeig uns was du hast – wir machen Rezepte draus' : language === 'fr' ? 'Montre-nous ce que tu as – on en fait des recettes' : 'Show us what you have – we\'ll make recipes from it'}
              </motion.p>
              
              <motion.div
                className="w-full max-w-sm space-y-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {[
                  { Icon: Camera, desc: language === 'de' ? 'Mach ein Foto von deinem Kühlschrank' : language === 'fr' ? 'Prends une photo de ton frigo' : 'Take a photo of your fridge', color: "text-amber-500" },
                  { Icon: Brain, desc: language === 'de' ? 'KI erkennt automatisch alle Zutaten' : language === 'fr' ? 'L\'IA reconnaît automatiquement tous les ingrédients' : 'AI automatically recognizes all ingredients', color: "text-violet-500" },
                  { Icon: ChefHat, desc: language === 'de' ? 'Bekomme 3 Rezepte basierend auf deiner Stimmung' : language === 'fr' ? 'Reçois 3 recettes selon ton humeur' : 'Get 3 recipes based on your mood', color: "text-emerald-500" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left"
                  >
                    <item.Icon className={`w-5 h-5 ${item.color} shrink-0`} />
                    <span className="text-sm">{item.desc}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Camera access hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4 w-full max-w-sm"
              >
                <Camera className="w-5 h-5 text-primary shrink-0" />
                <span className="text-xs text-primary font-medium text-left">
                  {language === 'de' ? 'Wir benötigen Kamera-Zugriff für den Scan' : language === 'fr' ? 'Nous avons besoin d\'accéder à la caméra pour le scan' : 'We need camera access for scanning'}
                </span>
              </motion.div>
              
              <div className="w-full max-w-xs space-y-3">
                <Button onClick={requestCameraPermissionSpontan} className="w-full h-12 rounded-xl">
                  <Camera className="w-5 h-5 mr-2" />
                  {language === 'de' ? 'Jetzt scannen' : language === 'fr' ? 'Scanner maintenant' : 'Scan Now'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep("spontan-mode-2")}
                  className="w-full h-10 text-muted-foreground"
                >
                  {language === 'de' ? 'Später scannen' : language === 'fr' ? 'Scanner plus tard' : 'Scan Later'}
                </Button>
              </div>
            </div>
          </StepCard>
        );

      case "spontan-mode-2":
        return (
          <StepCard step="spontan-mode-2">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium mb-4"
              >
                {language === 'de' ? 'Schritt 2 von 2' : language === 'fr' ? 'Étape 2 sur 2' : 'Step 2 of 2'}
              </motion.div>
              
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.4, type: "spring" }} 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 shadow-xl"
              >
                <Heart className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {language === 'de' ? 'Wie fühlst du dich?' : language === 'fr' ? 'Comment te sens-tu ?' : 'How are you feeling?'}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {language === 'de' ? 'Deine Stimmung bestimmt die Rezept-Komplexität' : language === 'fr' ? 'Ton humeur détermine la complexité des recettes' : 'Your mood determines recipe complexity'}
              </motion.p>
              
              <motion.div
                className="w-full max-w-sm space-y-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {[
                  { emoji: "😴", label: language === 'de' ? 'Müde' : language === 'fr' ? 'Fatigué' : 'Tired', desc: language === 'de' ? 'Super einfache 5-Minuten Rezepte' : language === 'fr' ? 'Recettes super simples de 5 minutes' : 'Super simple 5-minute recipes', color: "from-blue-400 to-indigo-500" },
                  { emoji: "😊", label: language === 'de' ? 'Normal' : language === 'fr' ? 'Normal' : 'Normal', desc: language === 'de' ? 'Ausgewogene 15-20 Minuten Gerichte' : language === 'fr' ? 'Plats équilibrés de 15-20 minutes' : 'Balanced 15-20 minute dishes', color: "from-emerald-400 to-green-500" },
                  { emoji: "🔥", label: language === 'de' ? 'Motiviert' : language === 'fr' ? 'Motivé' : 'Motivated', desc: language === 'de' ? 'Anspruchsvollere Kreationen' : language === 'fr' ? 'Créations plus élaborées' : 'More challenging creations', color: "from-orange-400 to-red-500" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border text-left"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl`}>
                      {item.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4 w-full max-w-sm"
              >
                <ChefHat className="w-5 h-5 text-primary shrink-0" />
                <span className="text-xs text-primary font-medium text-left">
                  {language === 'de' ? 'Du bekommst 3 personalisierte Rezepte basierend auf deinen Zutaten + Stimmung' : language === 'fr' ? 'Tu reçois 3 recettes personnalisées basées sur tes ingrédients + humeur' : 'You get 3 personalized recipes based on your ingredients + mood'}
                </span>
              </motion.div>
              
              <Button onClick={() => setCurrentStep("notification-prefs")} className="w-full max-w-xs h-12 rounded-xl">
                <Check className="w-5 h-5 mr-2" />
                {language === 'de' ? 'Verstanden!' : language === 'fr' ? 'Compris !' : 'Got it!'}
              </Button>
            </div>
          </StepCard>
        );

      case "structured-mode-1":
        return (
          <StepCard step="structured-mode-1">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-1.5 rounded-full bg-violet-500/10 text-violet-600 text-xs font-medium mb-4"
              >
                {language === 'de' ? 'Schritt 1 von 3' : language === 'fr' ? 'Étape 1 sur 3' : 'Step 1 of 3'}
              </motion.div>
              
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.4, type: "spring" }} 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-xl"
              >
                <Calendar className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {language === 'de' ? 'Dein Wochenplan' : language === 'fr' ? 'Ton plan hebdomadaire' : 'Your Weekly Plan'}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {language === 'de' ? '7 Tage perfekt auf deine Makros abgestimmt' : language === 'fr' ? '7 jours parfaitement adaptés à tes macros' : '7 days perfectly matched to your macros'}
              </motion.p>
              
              <motion.div
                className="w-full max-w-sm space-y-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {[
                  { Icon: Target, desc: language === 'de' ? 'Jeder Tag trifft exakt deine Kalorien & Makros' : language === 'fr' ? 'Chaque jour atteint exactement tes calories & macros' : 'Every day hits your exact calories & macros', color: "text-violet-500" },
                  { Icon: ChefHat, desc: language === 'de' ? '5 Mahlzeiten pro Tag – Frühstück bis Abendessen' : language === 'fr' ? '5 repas par jour – du petit-déjeuner au dîner' : '5 meals per day – breakfast to dinner', color: "text-emerald-500" },
                  { Icon: RefreshCw, desc: language === 'de' ? 'Einzelne Mahlzeiten jederzeit austauschen' : language === 'fr' ? 'Échanger des repas individuels à tout moment' : 'Swap individual meals anytime', color: "text-amber-500" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left"
                  >
                    <item.Icon className={`w-5 h-5 ${item.color} shrink-0`} />
                    <span className="text-sm">{item.desc}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Week preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-xs p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 mb-6"
              >
                <div className="flex gap-1 justify-center">
                  {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day, i) => (
                    <motion.div
                      key={day}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className={`flex-1 p-2 rounded-lg text-center ${i === 0 ? 'bg-violet-500 text-white' : 'bg-card'}`}
                    >
                      <span className="text-[10px] font-medium">{day}</span>
                      <div className="mt-1 space-y-0.5">
                        <div className="h-1.5 w-full rounded-full bg-emerald-400/60" />
                        <div className="h-1.5 w-full rounded-full bg-amber-400/60" />
                        <div className="h-1.5 w-full rounded-full bg-blue-400/60" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <Button onClick={goNext} className="w-full max-w-xs h-12 rounded-xl">
                <ChevronRight className="w-5 h-5 mr-2" />
                {t.continueBtn}
              </Button>
            </div>
          </StepCard>
        );

      case "structured-mode-2":
        return (
          <StepCard step="structured-mode-2">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-1.5 rounded-full bg-violet-500/10 text-violet-600 text-xs font-medium mb-4"
              >
                {language === 'de' ? 'Schritt 2 von 3' : language === 'fr' ? 'Étape 2 sur 3' : 'Step 2 of 3'}
              </motion.div>
              
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.4, type: "spring" }} 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 shadow-xl"
              >
                <ShoppingCart className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {language === 'de' ? 'Automatische Einkaufsliste' : language === 'fr' ? 'Liste de courses automatique' : 'Automatic Shopping List'}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {language === 'de' ? 'Alles was du für die Woche brauchst' : language === 'fr' ? 'Tout ce dont tu as besoin pour la semaine' : 'Everything you need for the week'}
              </motion.p>
              
              <motion.div
                className="w-full max-w-sm space-y-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {[
                  { Icon: ListChecks, desc: language === 'de' ? 'Liste wird aus Wochenplan generiert' : language === 'fr' ? 'Liste générée à partir du plan hebdomadaire' : 'List is generated from weekly plan', color: "text-pink-500" },
                  { Icon: Check, desc: language === 'de' ? 'Abhaken beim Einkaufen' : language === 'fr' ? 'Cocher en faisant les courses' : 'Check off while shopping', color: "text-emerald-500" },
                  { Icon: Camera, desc: language === 'de' ? 'Scan aktualisiert deine Liste automatisch' : language === 'fr' ? 'Le scan met à jour ta liste automatiquement' : 'Scan automatically updates your list', color: "text-amber-500" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left"
                  >
                    <item.Icon className={`w-5 h-5 ${item.color} shrink-0`} />
                    <span className="text-sm">{item.desc}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Shopping list preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-xs p-3 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 mb-6"
              >
                <div className="space-y-2">
                  {[
                    { item: "Tomaten", checked: true },
                    { item: "Mozzarella", checked: true },
                    { item: "Basilikum", checked: false },
                    { item: "Olivenöl", checked: false },
                  ].map((listItem, i) => (
                    <motion.div
                      key={listItem.item}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.08 }}
                      className={`flex items-center gap-2 p-2 rounded-lg ${listItem.checked ? 'bg-primary/10' : 'bg-card'}`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${listItem.checked ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                        {listItem.checked && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span className={`text-sm ${listItem.checked ? 'line-through text-muted-foreground' : ''}`}>{listItem.item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <Button onClick={goNext} className="w-full max-w-xs h-12 rounded-xl">
                <ChevronRight className="w-5 h-5 mr-2" />
                {t.continueBtn}
              </Button>
            </div>
          </StepCard>
        );

      case "structured-mode-3":
        return (
          <StepCard step="structured-mode-3">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-1.5 rounded-full bg-violet-500/10 text-violet-600 text-xs font-medium mb-4"
              >
                {language === 'de' ? 'Schritt 3 von 3' : language === 'fr' ? 'Étape 3 sur 3' : 'Step 3 of 3'}
              </motion.div>
              
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.4, type: "spring" }} 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-xl"
              >
                <RefreshCw className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {language === 'de' ? 'Der Kreislauf' : language === 'fr' ? 'Le cycle' : 'The Cycle'}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {language === 'de' ? 'Scan → Plan → Einkaufen → Wiederholen' : language === 'fr' ? 'Scan → Plan → Courses → Répéter' : 'Scan → Plan → Shop → Repeat'}
              </motion.p>
              
              {/* Cycle diagram */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-xs mb-6"
              >
                <div className="relative">
                  {/* Circle items */}
                  <div className="flex justify-center gap-2 flex-wrap">
                    {[
                      { Icon: Camera, label: language === 'de' ? 'Scannen' : language === 'fr' ? 'Scanner' : 'Scan', color: "from-cyan-500 to-blue-500" },
                      { Icon: Calendar, label: language === 'de' ? 'Planen' : language === 'fr' ? 'Planifier' : 'Plan', color: "from-violet-500 to-purple-500" },
                      { Icon: ShoppingCart, label: language === 'de' ? 'Einkaufen' : language === 'fr' ? 'Courses' : 'Shop', color: "from-pink-500 to-rose-500" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.15 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                          <item.Icon className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-xs font-medium">{item.label}</span>
                        {i < 2 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="absolute"
                            style={{ left: `${33 + i * 33}%`, top: '30%' }}
                          >
                            <ArrowRight className="w-5 h-5 text-muted-foreground/40" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Cycle arrow */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex justify-center mt-4"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                      <RefreshCw className="w-4 h-4 text-primary" />
                      <span className="text-xs text-primary font-medium">
                        {language === 'de' ? 'Jede Woche neu' : language === 'fr' ? 'Chaque semaine' : 'Every week'}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4 w-full max-w-sm"
              >
                <Target className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-xs text-emerald-600 font-medium text-left">
                  {language === 'de' ? 'Dein Kühlschrank-Scan aktualisiert automatisch was du noch brauchst' : language === 'fr' ? 'Ton scan de frigo met à jour automatiquement ce dont tu as besoin' : 'Your fridge scan automatically updates what you still need'}
                </span>
              </motion.div>
              
              <Button onClick={() => setCurrentStep("notification-prefs")} className="w-full max-w-xs h-12 rounded-xl">
                <Check className="w-5 h-5 mr-2" />
                {language === 'de' ? 'Verstanden!' : language === 'fr' ? 'Compris !' : 'Got it!'}
              </Button>
            </div>
          </StepCard>
        );

      case "save-progress":
        const handleAuth = async () => {
          // Validate email and password
          if (!authEmail || !authPassword) {
            toast({
              title: t.error,
              description: t.onboardingEnterEmailPassword,
              variant: "destructive",
            });
            return;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(authEmail)) {
            toast({
              title: t.error,
              description: "Ungültige E-Mail-Adresse",
              variant: "destructive",
            });
            return;
          }

          // Validate password length
          if (authPassword.length < 8) {
            toast({
              title: t.error,
              description: "Passwort muss mindestens 8 Zeichen lang sein",
              variant: "destructive",
            });
            return;
          }

          setIsAuthLoading(true);
          try {
            if (authMode === 'signup') {
              const redirectTo = `${window.location.origin}/email-confirmation?confirmed=true&from=onboarding&next=/premium-pricing`;
              const { error } = await signUp(authEmail, authPassword, { emailRedirectTo: redirectTo });
              if (error) {
                toast({
                  title: t.onboardingRegistrationFailed,
                  description: error.message === "User already registered" 
                    ? t.onboardingEmailAlreadyRegistered
                    : error.message,
                  variant: "destructive",
                });
                if (error.message === "User already registered") {
                  setAuthMode('login');
                }
              } else {
                toast({
                  title: t.onboardingSuccessfullyRegistered,
                  description: t.onboardingProgressSavedMsg,
                });
                saveOnboardingData(userData);
                goNext();
              }
            } else {
              const { error } = await signIn(authEmail, authPassword);
              if (error) {
                toast({
                  title: t.onboardingLoginFailed,
                  description: error.message,
                  variant: "destructive",
                });
              } else {
                toast({
                  title: t.onboardingWelcomeBack,
                  description: t.onboardingProgressLoaded,
                });
                saveOnboardingData(userData);
                goNext();
              }
            }
          } finally {
            setIsAuthLoading(false);
          }
        };
        
        return (
          <StepCard step="save-progress">
            <div className="flex flex-col items-center text-center px-6 w-full">
              {/* Header icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-lg"
              >
                <Save className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <motion.h1 
                className="text-2xl font-bold mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {t.saveYourProgress}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground/60 text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {authMode === 'signup' 
                  ? t.createAccountToSave
                  : t.signInToContinue}
              </motion.p>
              
              {/* Auth form */}
              <motion.div 
                className="w-full max-w-sm space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {/* Google Sign In Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    setIsAuthLoading(true);
                    try {
                      const { error } = await signInWithGoogle();
                      if (error) {
                        toast({
                          title: t.error,
                          description: error.message || 'Google sign-in failed. Please try again.',
                          variant: "destructive",
                        });
                      }
                    } catch (err) {
                      toast({
                        title: t.error,
                        description: 'An unexpected error occurred during Google sign-in.',
                        variant: "destructive",
                      });
                    } finally {
                      setIsAuthLoading(false);
                    }
                  }}
                  disabled={isAuthLoading}
                  className="w-full h-12 rounded-xl bg-card border-border hover:bg-muted/50 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{t.signInWithGoogle}</span>
                </Button>
                
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 text-muted-foreground/50">{t.or}</span>
                  </div>
                </div>
                
                {/* Email input */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    type="email"
                    placeholder={t.emailAddressPlaceholder}
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-card border-border"
                  />
                </div>
                
                {/* Password input */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t.passwordPlaceholder}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 rounded-xl bg-card border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Submit button */}
                <Button 
                  onClick={handleAuth}
                  disabled={isAuthLoading || !authEmail || !authPassword}
                  className="w-full h-12 rounded-xl"
                >
                  {isAuthLoading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      {authMode === 'signup' ? t.registerBtn : t.signInBtn}
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
                
                {/* Toggle auth mode */}
                <motion.button
                  onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                  className="text-sm text-muted-foreground/60 hover:text-primary transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  {authMode === 'signup' 
                    ? t.alreadyRegisteredSignIn
                    : t.noAccountRegister}
                </motion.button>
              </motion.div>
              
              {/* Benefits reminder */}
              <motion.div 
                className="mt-6 w-full max-w-sm p-4 rounded-xl bg-primary/5 border border-primary/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{t.whyRegister}</span>
                </div>
                <ul className="space-y-1.5 text-left">
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-primary flex-shrink-0" />
                    <span>{t.personalizedPlanSaved}</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-primary flex-shrink-0" />
                    <span>{t.progressSyncedDevices}</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-primary flex-shrink-0" />
                    <span>{t.accessRecipesMeals}</span>
                  </li>
                </ul>
              </motion.div>
              
              {/* Skip option for already logged in users */}
              {user && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  className="mt-4"
                >
                  <Button variant="ghost" onClick={goNext} className="text-muted-foreground/60">
                    {t.alreadyLoggedInContinue}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}
            </div>
          </StepCard>
        );

      case "premium-hint":
        const freeFeatures = [
          t.weeklyPlan1Gen,
          t.waterTrackerLabel,
          t.scansPerDay2,
          t.basicRecipeSuggestions
        ];
        
        const premiumFeaturesOnboarding = [
          t.unlimitedScansLabel,
          t.unlimitedMealPlanGen,
          t.shoppingListsLabel,
          t.statsMacroTracking,
          t.aiChatbotLabel
        ];
        
        const handlePlanContinue = () => {
          if (selectedPlanOption === 'free') {
            goNext();
          } else if (selectedPlanOption === 'premium') {
            // Save onboarding data and navigate using react-router
            saveOnboardingData(userData);
            // Use navigate from react-router to avoid SPA routing conflicts
            // onComplete will handle the state callback if needed
            onComplete();
            navigate('/premium-pricing');
          }
        };
        
        return (
          <StepCard step="premium-hint">
            <div className="flex flex-col items-center text-center px-4 w-full">
              <h1 className="text-2xl font-bold mb-1">{t.chooseYourPlan}</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">{t.startFreeOrPremium}</p>
              
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
                    <h3 className="text-lg font-bold">{t.freeLabel}</h3>
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
                      {t.recommendedLabel}
                    </span>
                  </div>
                  
                  <div className="text-center mb-3 mt-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 mb-2">
                      <Star className="h-5 w-5 text-primary" fill="currentColor" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">{t.premiumLabel2}</h3>
                    <div className="mt-1">
                      <span className="text-2xl font-bold text-primary">€4,99</span>
                      <span className="text-muted-foreground text-[10px]">/Mo</span>
                    </div>
                    <p className="text-[9px] text-primary mt-0.5">{t.trial7DaysFree}</p>
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background safe-area-inset"
    >
      {/* Progress Bar at Top */}
      {currentStep !== 'language-select' && currentStep !== 'analyzing' && currentStep !== 'tutorial' && (
        <OnboardingProgressBar 
          currentStep={currentIndex + 1} 
          totalSteps={totalSteps} 
        />
      )}

      {/* Header - hidden for tutorial */}
      {currentStep !== 'tutorial' && (
        <div className={`flex items-center justify-between p-4 ${currentStep === 'language-select' ? 'mt-0' : 'mt-12'} ${currentStep === 'analyzing' || currentStep === 'language-select' ? 'opacity-0 pointer-events-none' : ''}`}>
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
          
          {/* Progress bar only - no dots */}

          <button 
            onClick={handleSkip} 
            className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors px-2 py-1"
          >
            {t.skip || "Überspringen"}
          </button>
        </div>
      )}

      {/* Main content */}
      {currentStep === 'tutorial' ? (
        // Tutorial renders fullscreen
        <div className="flex-1 min-h-0">
          {renderStepContent()}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 flex flex-col items-center justify-start overflow-y-auto py-6"
        >
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} className="w-full max-w-md">
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Bottom button */}
      {!["language-select", "name-input", "fridge-intro", "scan-feedback", "weekly-plan", "premium-hint", "community", "celebration", "done", "analyzing", "tutorial", "save-progress"].includes(currentStep) && (
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
             currentStep === "tracker-intro" ? t.letsGo : 
             currentStep === "macro-preview" ? t.perfectBtn :
             t.next}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
