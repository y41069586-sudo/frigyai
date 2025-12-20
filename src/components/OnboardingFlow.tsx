import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, Camera, Scale, Target, Dumbbell, Leaf, Check, X,
  Apple, Smartphone, ShoppingCart, Heart, Users, Sparkles, Star, Globe,
  Zap, TrendingUp, BarChart3, Activity, User,
  Ruler, Calendar, AlertTriangle, Salad, Fish, Utensils, Wheat,
  Milk, Egg, Bean, CircleCheck, ChefHat, Crown, Carrot,
  Droplets, Coffee
} from "lucide-react";
import frigLogo from "@/assets/frig-logo.png";
import confetti from "canvas-confetti";
import { AnimatedFrigyMascot } from "./AnimatedFrigyMascot";
import { useLanguage, Language } from "@/contexts/LanguageContext";

import { 
  OnboardingStep, UserData, defaultUserData, onboardingSteps 
} from "./onboarding/types";
import { calculateMacros, calculateWeeksToGoal, saveOnboardingData } from "./onboarding/utils";
import { 
  StepCard, ProgressDots, SelectionCard
} from "./onboarding/components";
import { 
  MotivationStep, CookingTimeStep, NotificationPrefsStep,
  WelcomeStep, GoalStep, SocialProofStep, BodyBasicsStep,
  GenderStep, ActivityLevelStep, AnalyzingStep, CelebrationStep, DoneStep
} from "./onboarding/steps";
import { WheelPicker } from "./WheelPicker";
import { MacroRing } from "./MacroRing";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { language, setLanguage, t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [fridgeScan, setFridgeScan] = useState(false);
  const [macroAnimate, setMacroAnimate] = useState(false);
  const [chartAnimate, setChartAnimate] = useState(false);
  const [selectedPlanOption, setSelectedPlanOption] = useState<'free' | 'premium' | null>(null);

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

  const stepProps = { userData, setUserData, goNext, goBack };

  const renderStepContent = () => {
    switch (currentStep) {
      case "language-select":
        return (
          <StepCard step="language-select">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div>
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
        return <WelcomeStep goNext={goNext} />;

      case "goal":
        return <GoalStep {...stepProps} />;

      case "motivation":
        return <MotivationStep {...stepProps} />;

      case "social-proof":
        return <SocialProofStep />;

      case "success-stats":
        const stats = [
          { value: 94, suffix: "%", label: "erreichen ihre Ziele", color: "from-green-500 to-emerald-500" },
          { value: 2.5, suffix: "kg", label: "Gewichtsverlust/Monat", color: "from-blue-500 to-cyan-500" },
          { value: 15, suffix: "min", label: "täglich gespart beim Planen", color: "from-purple-500 to-pink-500" },
        ];
        return (
          <StepCard step="success-stats">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="text-5xl mb-4">
                📊
              </motion.div>
              
              <motion.h1 className="text-2xl font-bold mb-1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
                Echte Ergebnisse
              </motion.h1>
              <motion.p className="text-muted-foreground/50 text-xs mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }}>
                Basierend auf Nutzerdaten der letzten 6 Monate
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
                Zeit für deine Daten!
              </motion.h1>
              <motion.p className="text-muted-foreground/60 text-sm mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.3 }}>
                3 schnelle Schritte zu deinen perfekten Makros
              </motion.p>
              
              <div className="flex gap-4 mb-8">
                {[
                  { Icon: Ruler, label: "Körper" },
                  { Icon: Activity, label: "Aktivität" },
                  { Icon: BarChart3, label: "Makros" }
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
                Dauert weniger als 30 Sekunden <Zap className="w-3 h-3 text-primary" />
              </motion.p>
            </div>
          </StepCard>
        );

      case "body-basics":
        return <BodyBasicsStep {...stepProps} />;

      case "gender":
        return <GenderStep {...stepProps} />;

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
                    <span className="text-xs text-muted-foreground mt-2">Jetzt</span>
                    <span className="text-lg font-bold">{userData.weight}kg</span>
                  </div>
                  
                  <motion.div 
                    className="flex items-center gap-1 mb-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </motion.div>
                  
                  <div className="flex flex-col items-center">
                    <motion.div 
                      className="w-16 bg-primary rounded-t-xl"
                      initial={{ height: 0 }}
                      animate={{ height: userData.goalMode === 'lose' ? 80 - weightDiff * 4 : 80 + weightDiff * 2 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      style={{ minHeight: 30, maxHeight: 120 }}
                    />
                    <span className="text-xs text-primary mt-2">Ziel</span>
                    <span className="text-lg font-bold text-primary">{userData.targetWeight}kg</span>
                  </div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.3 }}>
                  <WheelPicker
                    value={userData.targetWeight}
                    onChange={(val) => setUserData({ ...userData, targetWeight: val })}
                    min={userData.goalMode === 'lose' ? Math.max(40, userData.weight - 50) : userData.weight}
                    max={userData.goalMode === 'lose' ? userData.weight - 1 : userData.weight + 30}
                    step={1}
                    unit="kg"
                  />
                </motion.div>
              </div>
            </div>
          </StepCard>
        );

      case "weekly-goal":
        const weeklyOptions = userData.goalMode === 'lose' 
          ? [
              { value: 0.25, label: "0.25 kg/Woche", desc: "Langsam & nachhaltig", icon: "🐢" },
              { value: 0.5, label: "0.5 kg/Woche", desc: "Empfohlen", icon: "🎯", recommended: true },
              { value: 0.75, label: "0.75 kg/Woche", desc: "Schnell", icon: "🚀" },
            ]
          : [
              { value: 0.25, label: "0.25 kg/Woche", desc: "Lean Bulk", icon: "💪" },
              { value: 0.5, label: "0.5 kg/Woche", desc: "Empfohlen", icon: "🎯", recommended: true },
              { value: 0.75, label: "0.75 kg/Woche", desc: "Schneller Aufbau", icon: "🚀" },
            ];
        
        return (
          <StepCard step="weekly-goal">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }} className="text-5xl mb-4">
                ⚡
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-1">Dein Tempo</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Wie schnell möchtest du dein Ziel erreichen?</p>
              
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {weeklyOptions.map((option, i) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserData({ ...userData, weeklyGoal: option.value })}
                    className={`relative p-4 rounded-2xl border-2 transition-all ${
                      userData.weeklyGoal === option.value
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    {option.recommended && (
                      <span className="absolute -top-2 right-4 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full">
                        EMPFOHLEN
                      </span>
                    )}
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{option.icon}</span>
                      <div className="text-left flex-1">
                        <span className="font-bold block">{option.label}</span>
                        <span className="text-xs text-muted-foreground/50">{option.desc}</span>
                      </div>
                      {userData.weeklyGoal === option.value && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
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

      case "dietary-preferences":
        const dietOptionsData = [
          { id: 'vegetarian', label: 'Vegetarisch', Icon: Leaf, desc: 'Kein Fleisch' },
          { id: 'vegan', label: 'Vegan', Icon: Salad, desc: 'Keine tierischen Produkte' },
          { id: 'pescatarian', label: 'Pescetarisch', Icon: Fish, desc: 'Fisch & Meeresfrüchte' },
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
          { id: 'beginner' as const, label: 'Anfänger', icon: Ruler, desc: 'Einfache Rezepte', color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-500' },
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
        return <ActivityLevelStep {...stepProps} />;

      case "analyzing":
        return <AnalyzingStep />;

      case "macro-preview":
        const calculatedMacros = calculateMacros(userData);
        const weeksToGoal = calculateWeeksToGoal(userData);
        
        const goalDate = new Date();
        goalDate.setDate(goalDate.getDate() + (weeksToGoal * 7));
        const goalDateFormatted = goalDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
        
        if (userData.dailyCalories !== calculatedMacros.dailyCalories && userData.dailyCalories === 0) {
          setTimeout(() => setUserData(prev => ({ ...prev, ...calculatedMacros })), 0);
        }

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
                Berechnet basierend auf deinen Daten
              </motion.p>
              
              <motion.div 
                className="relative mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: macroAnimate ? 1 : 0 }}
                transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
              >
                <MacroRing 
                  calories={userData.dailyCalories || calculatedMacros.dailyCalories} 
                  targetCalories={userData.dailyCalories || calculatedMacros.dailyCalories} 
                  protein={0} 
                  targetProtein={userData.dailyProtein || calculatedMacros.dailyProtein}
                  carbs={0}
                  targetCarbs={userData.dailyCarbs || calculatedMacros.dailyCarbs}
                  fat={0}
                  targetFat={userData.dailyFat || calculatedMacros.dailyFat}
                  size={160}
                />
              </motion.div>
              
              <motion.div 
                className="grid grid-cols-3 gap-3 w-full max-w-xs mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Dumbbell className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-500">{userData.dailyProtein || calculatedMacros.dailyProtein}g</p>
                  <p className="text-[9px] text-muted-foreground/50">Protein</p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <Wheat className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-yellow-500">{userData.dailyCarbs || calculatedMacros.dailyCarbs}g</p>
                  <p className="text-[9px] text-muted-foreground/50">Carbs</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Droplets className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-purple-500">{userData.dailyFat || calculatedMacros.dailyFat}g</p>
                  <p className="text-[9px] text-muted-foreground/50">Fett</p>
                </div>
              </motion.div>
              
              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Ziel erreichbar bis <span className="text-primary font-bold">{goalDateFormatted}</span></span>
              </motion.div>
            </div>
          </StepCard>
        );

      case "fridge-intro":
        return (
          <StepCard step="fridge-intro">
            <div className="flex flex-col items-center text-center px-6 w-full">
              <motion.h1 className="text-2xl font-bold mb-2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                Kühlschrank scannen
              </motion.h1>
              <motion.p className="text-muted-foreground/60 text-sm mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
                Ein Foto, tausend Möglichkeiten
              </motion.p>
              
              <motion.div 
                className="relative w-44 h-52 mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className={`absolute inset-0 bg-card rounded-3xl border-4 border-border shadow-xl transition-all duration-500 ${fridgeOpen ? 'scale-95 opacity-90' : ''}`}>
                  {fridgeOpen && (
                    <>
                      {[
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
                </div>
                
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
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button onClick={goNext} className="w-full h-12 rounded-xl">
                  <Camera className="w-5 h-5 mr-2" />
                  Jetzt scannen
                </Button>
                <Button onClick={goNext} variant="ghost" className="w-full h-10 text-muted-foreground/60 text-sm">
                  Später
                </Button>
              </div>
            </div>
          </StepCard>
        );

      case "permissions":
        const requestCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setUserData({ ...userData, cameraPermission: true });
            goNext();
          } catch (error) {
            console.log("Camera permission denied or error:", error);
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
              
              <h1 className="text-2xl font-bold mb-1">Kamera aktivieren</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Zum Scannen deines Kühlschranks</p>
              
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
                      <span className="font-medium block text-sm">Kamera-Zugriff</span>
                      <span className="text-[10px] text-muted-foreground/40">Für Kühlschrank-Scan</span>
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
                      Erlauben
                    </Button>
                  )}
                </motion.div>
                
                <div className="pt-4">
                  <p className="text-[10px] text-muted-foreground/40 mb-3">Optional: Gesundheitsdaten synchronisieren</p>
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

                <Button 
                  variant="ghost" 
                  onClick={goNext}
                  className="w-full h-10 text-muted-foreground/60 text-sm mt-4"
                >
                  Später
                </Button>
              </div>
            </div>
          </StepCard>
        );

      case "notification-prefs":
        return <NotificationPrefsStep {...stepProps} />;

      case "weekly-plan":
        const weeklyMacros = calculateMacros(userData);
        const targetCalories = userData.dailyCalories || weeklyMacros.dailyCalories;
        const sampleMealPlan = [
          { day: "Mo", breakfast: "Rührei mit Spinat", lunch: "Hähnchen-Salat", dinner: "Lachs mit Brokkoli", kcal: Math.round(targetCalories * 0.98) },
          { day: "Di", breakfast: "Haferflocken mit Beeren", lunch: "Thunfisch-Wrap", dinner: "Putenbrust mit Reis", kcal: Math.round(targetCalories * 1.02) },
          { day: "Mi", breakfast: "Griechischer Joghurt", lunch: "Quinoa-Bowl", dinner: "Rinderfilet mit Gemüse", kcal: Math.round(targetCalories * 0.99) },
          { day: "Do", breakfast: "Vollkornbrot mit Avocado", lunch: "Garnelen-Salat", dinner: "Hähnchen-Curry", kcal: Math.round(targetCalories * 1.01) },
          { day: "Fr", breakfast: "Protein-Smoothie", lunch: "Linsensalat", dinner: "Lachs-Pasta", kcal: Math.round(targetCalories) },
        ];
        
        return (
          <StepCard step="weekly-plan">
            <div className="flex flex-col items-center text-center px-4 w-full">
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
                className="text-muted-foreground/60 text-sm mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                Basierend auf {targetCalories} kcal/Tag
              </motion.p>
              
              <div className="w-full max-w-sm space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {sampleMealPlan.map((day, i) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
                    className="p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-primary">{day.day}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{day.kcal} kcal</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="text-left">
                        <span className="text-muted-foreground/80 line-clamp-1">{day.breakfast}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-muted-foreground/80 line-clamp-1">{day.lunch}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-muted-foreground/80 line-clamp-1">{day.dinner}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <Button onClick={goNext} className="w-full max-w-xs h-12 rounded-xl mt-4">
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
                Dein Weg zum Erfolg
              </motion.h1>
              <motion.p 
                className="text-muted-foreground/60 text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Mit Frigy vs. ohne Frigy
              </motion.p>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
                <motion.div 
                  className="relative p-4 rounded-2xl bg-muted/30 border border-border"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <div className="text-xs text-muted-foreground/60 mb-2">Ohne Frigy</div>
                  <div className="h-24 flex items-end justify-center">
                    <motion.div 
                      className="w-full max-w-[60px] bg-muted/60 rounded-t-xl"
                      initial={{ height: 0 }}
                      animate={{ height: chartAnimate ? 40 : 0 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
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
                </motion.div>
                
                <motion.div 
                  className="relative p-4 rounded-2xl bg-primary/10 border border-primary/30"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <div className="text-xs text-primary mb-2 font-medium">Mit Frigy ✨</div>
                  <div className="h-24 flex items-end justify-center">
                    <motion.div 
                      className="w-full max-w-[60px] bg-primary rounded-t-xl"
                      initial={{ height: 0 }}
                      animate={{ height: chartAnimate ? 80 : 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-primary">
                      <Check className="w-3 h-3" />
                      <span>Klare Struktur</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-primary">
                      <Check className="w-3 h-3" />
                      <span>Ziele erreicht</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </StepCard>
        );

      case "premium-hint":
        const freeFeatures = [
          "2 Scans pro Tag",
          "Basis-Rezepte",
          "Macro-Tracking",
        ];
        const premiumFeatures = [
          "Unbegrenzte Scans",
          "KI-Rezeptvorschläge",
          "Wochenpläne",
          "Einkaufslisten",
          "Prioritäts-Support",
        ];
        
        const handlePlanContinue = () => {
          if (selectedPlanOption === 'premium') {
            window.location.href = '/premium';
          } else {
            goNext();
          }
        };
        
        return (
          <StepCard step="premium-hint">
            <div className="flex flex-col items-center text-center px-4 w-full">
              <h1 className="text-2xl font-bold mb-1">Wähle deinen Plan</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">7 Tage Premium gratis testen</p>
              
              <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-6">
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  onClick={() => setSelectedPlanOption('free')}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
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
                    <span className="text-2xl font-bold">€0</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {freeFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-1.5 text-[10px]">
                        <Check className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground text-left">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlanOption === 'free' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  }`}>
                    {selectedPlanOption === 'free' && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  onClick={() => setSelectedPlanOption('premium')}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPlanOption === 'premium'
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      EMPFOHLEN
                    </span>
                  </div>
                  
                  <div className="text-center mb-3 mt-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 mb-2">
                      <Star className="h-5 w-5 text-primary" fill="currentColor" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">Premium</h3>
                    <div>
                      <span className="text-2xl font-bold text-primary">€4,99</span>
                      <span className="text-muted-foreground text-[10px]">/Mo</span>
                    </div>
                    <p className="text-[9px] text-primary">7 Tage gratis</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    {premiumFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-1.5 text-[10px]">
                        <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-left">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlanOption === 'premium' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  }`}>
                    {selectedPlanOption === 'premium' && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </motion.div>
              </div>
              
              <Button 
                onClick={handlePlanContinue} 
                disabled={!selectedPlanOption}
                className="w-full max-w-sm h-12 rounded-xl"
              >
                {selectedPlanOption === 'free' && "Mit Free starten"}
                {selectedPlanOption === 'premium' && (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Premium testen
                  </>
                )}
                {!selectedPlanOption && "Wähle einen Plan"}
                <ChevronRight className="w-5 h-5 ml-1" />
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
              <h1 className="text-2xl font-bold mb-1">Community Rezepte</h1>
              <p className="text-muted-foreground/40 text-xs mb-6">Entdecke Rezepte anderer Nutzer</p>
              
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
                      <span className="text-[10px] text-muted-foreground/40">von {recipe.user}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground/60">
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">{recipe.likes}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <Button onClick={goNext} variant="outline" className="w-full max-w-xs h-12 rounded-xl mt-6">
                Später entdecken
              </Button>
            </div>
          </StepCard>
        );

      case "celebration":
        return <CelebrationStep goNext={goNext} />;

      case "done":
        return <DoneStep onComplete={handleComplete} />;

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
      <div className={`flex items-center justify-between p-4 ${currentStep === 'analyzing' || currentStep === 'language-select' || currentStep === 'welcome' ? 'opacity-0 pointer-events-none' : ''}`}>
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
      {!["language-select", "welcome", "fridge-intro", "weekly-plan", "premium-hint", "community", "celebration", "done", "analyzing"].includes(currentStep) && (
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
            {currentStep === "tracker-intro" ? "Los geht's! 🚀" : 
             currentStep === "macro-preview" ? "Perfekt! 🎯" :
             t.next || "Weiter"}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
