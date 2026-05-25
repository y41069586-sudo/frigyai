import { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronRight, ChevronLeft, Camera, Scale, Target, Dumbbell, Leaf, Check, X,
  Apple, Smartphone, ShoppingCart, Heart, Users, Sparkles, Star, Globe,
  Zap, Clock, Rocket, TrendingUp, Flame, BarChart3, Activity, User,
  Ruler, Calendar, Brain, AlertTriangle, Salad, Fish, Utensils, Wheat,
  Milk, Egg, Bean, CircleCheck, ChefHat, Award, PersonStanding,
  GraduationCap, Medal, Crown, Armchair, Footprints, Carrot, CupSoda,
  Droplets, Coffee, Mail, Lock, Eye, EyeOff, Save, Beef, Cherry,
  Bot, MessageCircle, BookOpen, ArrowRight, RefreshCw, ListChecks
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import frigyLogoSrc from "@/assets/frigy-onboarding-logo-transparent.png";
import frigyPeekSrc from "@/assets/frigy-peek.png";
import { confettiBurst } from "@/lib/mobileEffects";
import { FrigyMascotInline, FrigyPeek } from "./FrigyMascot";
import { AnimatedFrigyMascot } from "./AnimatedFrigyMascot";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { isSubscriptionActive } from "@/lib/subscription";

import { 
  OnboardingStep, UserData, defaultUserData, onboardingSteps,
  ONBOARDING_MINT_BODY_STEPS,
  ONBOARDING_MINT_PROGRESS_LINE_STEPS,
  showsOnboardingTopProgress,
} from "./onboarding/types";
import { calculateMacros, calculateWeeksToGoal, saveOnboardingData, saveOnboardingAfterSignup } from "./onboarding/utils";
import {
  StepCard, AnimatedCounter, SelectionCard,
  AnimatedBicycle, AnimatedMotorcycle, AnimatedRocket, OnboardingProgressBar
} from "./onboarding/components";
import { OnboardingDataNotice } from "./onboarding/components/OnboardingDataNotice";
import { GenderSelectStep } from "./onboarding/components/GenderSelectStep";
import { BirthdateSelectStep } from "./onboarding/components/BirthdateSelectStep";
import { WeightSelectStep } from "./onboarding/components/WeightSelectStep";
import { HeightSelectStep } from "./onboarding/components/HeightSelectStep";
import { ActivitySelectStep } from "./onboarding/components/ActivitySelectStep";
import { MainGoalSelectStep } from "./onboarding/components/MainGoalSelectStep";
import { TargetWeightSelectStep } from "./onboarding/components/TargetWeightSelectStep";
import { GoalPreviewStep } from "./onboarding/components/GoalPreviewStep";
import { PaceSelectStep } from "./onboarding/components/PaceSelectStep";
import { HealthGoalsSelectStep } from "./onboarding/components/HealthGoalsSelectStep";
import { DietStyleSelectStep } from "./onboarding/components/DietStyleSelectStep";
import { AllergiesSelectStep } from "./onboarding/components/AllergiesSelectStep";
import { WeeklyPlanPreviewStep } from "./onboarding/components/WeeklyPlanPreviewStep";
import { FridgeScanStep } from "./onboarding/components/FridgeScanStep";
import { ShoppingListStep } from "./onboarding/components/ShoppingListStep";
import { HealthConnectStep } from "./onboarding/components/HealthConnectStep";
import { DataConsentStep } from "./onboarding/components/DataConsentStep";
import { ReferralCodeStep } from "./onboarding/components/ReferralCodeStep";
import {
  isEmailRateLimited,
  isUserAlreadyRegistered,
  resolveAuthErrorMessage,
  waitForAuthSession,
} from "@/lib/authErrors";
import { consumeReferralSkipPaywall } from "@/lib/referralCode";
import { buildStripePaymentUrl, markStripeCheckoutPending } from "@/lib/stripePaymentLinks";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { syncAffiliateAttributionToServer } from "@/lib/affiliateSync";
import { supabase } from "@/integrations/supabase/client";
import { MINT_STEP_HEADER_PT, ONBOARDING_MINT_PALETTE } from "./onboarding/layout";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useIsMobile } from "@/hooks/use-mobile";
import { MotivationStep, CookingTimeStep, NotificationPrefsStep } from "./onboarding/steps";
import { WheelPicker } from "./WheelPicker";
import { MacroRing } from "./MacroRing";
import { EditMacroGoalsDialog, type FocusMacro } from "./EditMacroGoalsDialog";
import {
  OnboardingPaywallStep,
  type PaywallBillingPlan,
} from "./onboarding/components/OnboardingPaywallStep";
import HeroAnimation from "./HeroAnimation";
import { InteractiveTutorial } from "./onboarding/InteractiveTutorial";

// ─── Typewriter hook ─────────────────────────────────────────────────────────
const useTypewriter = (text: string, speed = 40, startDelay = 1400) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      let i = 0;
      intervalId = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          if (intervalId) clearInterval(intervalId);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);
  return { displayed, done };
};

const NOTEBOOK_MASKOT_STEPS: OnboardingStep[] = ["gender"];

type NotebookChromeProps = {
  questionLines: string;
  progressFilledIndex: number;
  totalProgressSegments: number;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  canProceedNext: boolean;
  showBack: boolean;
};

const NotebookOnboardingChrome = ({
  questionLines,
  progressFilledIndex,
  totalProgressSegments,
  children,
  onBack,
  onNext,
  canProceedNext,
  showBack,
}: NotebookChromeProps) => {
  const { language, t } = useLanguage();
  const { displayed, done } = useTypewriter(questionLines, 34, 140);
  return (
    <div className="flex flex-1 min-h-0 flex-col bg-background">
      {/* Fortschritt: nur Punkte */}
      <div className="flex flex-wrap justify-center gap-2 px-4 pt-14 pb-4">
        {Array.from({ length: totalProgressSegments }).map((_, i) => (
          <div
            key={i}
            className={`size-2 shrink-0 rounded-full transition-colors ${i <= progressFilledIndex ? "bg-neutral-950" : "bg-neutral-400"}`}
          />
        ))}
      </div>

      <div className="shrink-0 px-4 pb-4">
        <p className="whitespace-pre-line font-black text-[15px] uppercase leading-snug tracking-wide text-neutral-900">
          {displayed}
          {!done ? (
            <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-emerald-700 align-middle" />
          ) : null}
        </p>
      </div>

      {/* Middle + actions: scroll together so „Weiter“ sits under content, not pinned to viewport bottom */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {children}
        <div className="shrink-0 border-t border-border/40 px-4 pt-5 pb-8">
          <OnboardingDataNotice className="mb-6" />
          <div className="flex items-center gap-4">
            {showBack ? (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="h-12 min-w-[52px] rounded-2xl border-border bg-[#EDE9E4] px-0 shadow-none hover:bg-[#E5E2DC]"
                aria-label="Zurück"
              >
                <ChevronRight className="size-6 rotate-180 text-neutral-900" />
              </Button>
            ) : (
              <div className="min-w-[52px]" aria-hidden />
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={!canProceedNext}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500 bg-emerald-300 px-4 text-base font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-emerald-300"
            >
              {t.next}
              <ChevronRight className="ml-1 size-5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const APP_LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

const SplashLanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();
  const current = APP_LANGUAGES.find((lang) => lang.code === language) ?? APP_LANGUAGES[1];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white/95 px-3 py-1.5 text-[13px] font-bold tracking-wide text-neutral-900 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#75FBB2] focus-visible:ring-offset-2"
          aria-label={t.changeLanguage}
        >
          <span className="text-base leading-none" aria-hidden>
            {current.flag}
          </span>
          <span>{current.code.toUpperCase()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[500] min-w-[168px] rounded-2xl p-1.5">
        {APP_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={(e) => {
              e.preventDefault();
              setLanguage(lang.code);
            }}
            onClick={() => setLanguage(lang.code)}
            className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
              language === lang.code ? "bg-[#75FBB2]/15 text-neutral-900" : ""
            }`}
          >
            <span className="text-lg leading-none">{lang.flag}</span>
            <span className="flex-1">{lang.label}</span>
            {language === lang.code && <Check className="h-4 w-4 text-[#2E7D32]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SplashScreen = ({ onNext }: { onNext: () => void }) => {
  const { t } = useLanguage();

  return (
    <div className="relative flex h-full w-full min-w-0 flex-col overflow-hidden bg-[#FEFFFC] text-neutral-950">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-6 top-[calc(env(safe-area-inset-top,0px)+1.25rem)] z-[60] pointer-events-auto"
      >
        <SplashLanguageSwitcher />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f7fff9_100%)]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)]">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-[28px] font-black leading-none tracking-[-0.06em] text-[#39D47F]"
        >
          Frigy
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto flex h-[35svh] min-h-[230px] w-full max-w-[370px] shrink-0 items-center justify-center max-[380px]:min-h-[210px]"
        >
          <motion.div
            className="relative flex h-[196px] w-[196px] items-center justify-center"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <img
              src={frigyLogoSrc}
              alt="Frigy"
              className="h-full w-full object-contain drop-shadow-[0_30px_45px_rgba(46,125,50,0.16)]"
              draggable={false}
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col items-center text-center"
        >
          <h1 className="max-w-[345px] text-[43px] font-extrabold leading-[0.92] tracking-[-0.08em] text-black max-[380px]:text-[38px]">
            {t.onboardingWelcomeHeadline1}
            <br />
            <span className="relative inline-block">
              <span className="relative">{t.onboardingWelcomeHeadline2}</span>
            </span>
          </h1>

          <p className="mt-5 max-w-[318px] text-[15px] font-semibold leading-relaxed tracking-[-0.03em] text-neutral-500 max-[380px]:mt-4 max-[380px]:text-[14px]">
            {t.onboardingWelcomeSubline}
          </p>

          <div className="mt-auto w-full pb-[max(1.15rem,env(safe-area-inset-bottom,0px)+0.85rem)] pt-6">
            <motion.button
              type="button"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.965 }}
              onClick={onNext}
              className="relative flex h-[64px] w-full items-center justify-center gap-2 overflow-hidden rounded-[28px] bg-[#75FBB2] text-[17px] font-black tracking-[-0.035em] text-black shadow-[0_0_0_1px_rgba(255,255,255,0.75)_inset,0_10px_24px_-18px_rgba(57,212,127,0.38)]"
            >
              <span className="relative">{t.onboardingGetStarted}</span>
              <ArrowRight className="relative h-5 w-5 stroke-[2.6]" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
// ──────────────────────────────────────────────────────────────────────────────

interface OnboardingFlowProps {
  onComplete: () => void;
  /** QA helper: jump directly to a given step on mount (used by /onboarding-preview?step=…). */
  initialStep?: OnboardingStep;
}

// Analysis Step component
const AnalysisStep = ({ text, delay }: { text: string; delay: number }) => {
  const [status, setStatus] = useState<'waiting' | 'loading' | 'done'>('waiting');
  
  useEffect(() => {
    const loadTimer = setTimeout(() => setStatus('loading'), delay);
    const doneTimer = setTimeout(() => setStatus('done'), delay + 720);
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay / 1000, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        {status === 'waiting' && <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
        {status === 'loading' && (
          <motion.div
            className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        )}
        {status === 'done' && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </motion.div>
        )}
      </div>
      <span className={`text-sm transition-colors ${status === 'done' ? 'text-primary font-medium' : 'text-muted-foreground/60'}`}>
        {text}
      </span>
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

export const OnboardingFlow = ({ onComplete, initialStep: initialStepOverride }: OnboardingFlowProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { lightTap, successFeedback, selectionTap } = useHapticFeedback();
  const { user, signUp, signIn, isPremium, checkSubscription } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const mintStepEase = [0.22, 1, 0.36, 1] as const;
  const mintStepTransition = {
    duration: isMobile ? 0.14 : 0.18,
    ease: mintStepEase,
  };
  const mintStepVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };
  const legacyStepTransition = {
    duration: isMobile ? 0.2 : 0.32,
    ease: [0.4, 0, 0.2, 1] as const,
  };
  const legacyStepVariants = isMobile
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };

  // Check if returning from scan with feedback request
  const showScanFeedback = location.state?.showScanFeedback === true;
  const fallbackStep: OnboardingStep =
    showScanFeedback && onboardingSteps.includes("scan-feedback") ? "scan-feedback" : onboardingSteps[0];
  const initialStep: OnboardingStep =
    initialStepOverride && onboardingSteps.includes(initialStepOverride)
      ? initialStepOverride
      : fallbackStep;
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep);
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [fridgeScan, setFridgeScan] = useState(false);
  const [macroAnimate, setMacroAnimate] = useState(false);
  const [chartAnimate, setChartAnimate] = useState(false);
  const [selectedPlanOption, setSelectedPlanOption] = useState<'premium' | null>(null);
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
  const [macroPreviewCtaVisible, setMacroPreviewCtaVisible] = useState(false);

  const [macroEditOpen, setMacroEditOpen] = useState(false);
  const [macroEditFocus, setMacroEditFocus] = useState<FocusMacro>(null);

  const calculatedMacroGoals = useMemo(() => calculateMacros(userData), [userData]);
  const macroGoalsForEdit = useMemo(
    () => ({
      dailyCalories: userData.dailyCalories || calculatedMacroGoals.dailyCalories,
      dailyProtein: userData.dailyProtein || calculatedMacroGoals.dailyProtein,
      dailyCarbs: userData.dailyCarbs || calculatedMacroGoals.dailyCarbs,
      dailyFat: userData.dailyFat || calculatedMacroGoals.dailyFat,
    }),
    [userData, calculatedMacroGoals],
  );

  const openMacroEdit = useCallback(
    (focus: FocusMacro) => {
      selectionTap();
      setMacroEditFocus(focus);
      setMacroEditOpen(true);
    },
    [selectionTap],
  );

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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || currentStep !== "macro-preview") {
      setMacroPreviewCtaVisible(false);
      return;
    }

    const updateVisibility = () => {
      setMacroPreviewCtaVisible(container.scrollTop > 56);
    };

    updateVisibility();
    container.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      container.removeEventListener("scroll", updateVisibility);
    };
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
        confettiBurst({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.4 },
          colors: ["#22c55e", "#4ade80", "#86efac", "#fbbf24", "#fb7185"]
        });
      }, 600));
    }
    if (currentStep === "done") {
      timeouts.push(setTimeout(() => {
        confettiBurst({
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

  useEffect(() => {
    if (currentStep === "save-progress") {
      setAuthMode("signup");
    }
  }, [currentStep]);

  const finishOnboardingExit = () => {
    saveOnboardingData(userData, { markOnboardingComplete: true });
    onComplete();
  };

  const canAccessDashboard = useCallback(async (): Promise<boolean> => {
    if (consumeReferralSkipPaywall()) return true;
    if (isPremium) return true;
    const status = await checkSubscription();
    return isSubscriptionActive(status);
  }, [isPremium, checkSubscription]);

  const goToPaywall = () => {
    if (onboardingSteps.includes("paywall")) {
      setCurrentStep("paywall");
    }
  };

  const tryFinishOnboardingWithAccess = useCallback(async () => {
    if (await canAccessDashboard()) {
      finishOnboardingExit();
      return;
    }
    goToPaywall();
  }, [canAccessDashboard]);

  const handlePaywallCheckout = async (plan: PaywallBillingPlan) => {
    lightTap();
    localStorage.setItem("selectedPlan", plan);
    markStripeCheckoutPending();
    const token = session?.access_token;
    if (token) {
      await syncAffiliateAttributionToServer(token, { source: "paywall" });
    }
    await openExternalUrl(
      buildStripePaymentUrl(plan, user?.email ?? authEmail, {
        userId: user?.id,
      }),
    );
  };

  const goAfterSignup = () => {
    saveOnboardingAfterSignup(userData);
    void tryFinishOnboardingWithAccess();
  };

  const goNext = () => {
    // Check if user can proceed from current step before allowing navigation
    if (!canProceed()) {
      // Show user-friendly error message based on failed step
      if (currentStep === "goal") {
        toast({
          title: t.error,
          description: t.pleaseSelectGoal || "Please select a goal",
          variant: "destructive",
        });
      } else if (currentStep === "gender") {
        toast({
          title: t.error,
          description: t.pleaseSelectGender || "Please select your gender",
          variant: "destructive",
        });
      } else if (currentStep === "planning-setup") {
        toast({
          title: t.error,
          description: t.pleaseSelectActivityLevel || "Please select your activity level",
          variant: "destructive",
        });
      } else if (currentStep === "save-progress") {
        toast({
          title: t.error,
          description: t.onboardingPleaseLoginToProceed || "Please log in to continue",
          variant: "destructive",
        });
      }
      return;
    }

    lightTap(); // Haptic feedback on navigation

    /* Splash immer explizit auf den nächsten Eintrag in onboardingSteps –
     * verhindert Verwechslung mit anderer Navigation; wenn der Array (z. B. alter PWA-Cache)
     * nur noch "splash" hat, gibt es ohne neuen Build keinen zweiten Screen – dann Dev-Hinweis. */
    if (currentStep === "splash") {
      const splashI = onboardingSteps.indexOf("splash");
      const nextStep = splashI >= 0 ? onboardingSteps[splashI + 1] : undefined;
      if (import.meta.env.DEV && !nextStep) {
        console.warn(
          "[Frigy Onboarding] Kein zweiter Schritt nach „splash“. Bitte neu bauen: npm run build, PWA-Service-Worker entfernen, neu laden.",
        );
      }
      if (nextStep) {
        setCurrentStep(nextStep);
        return;
      }
      handleComplete();
      return;
    }

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

    // Skip scan-feedback if user didn't actually scan (no showScanFeedback state)
    const didScan = location.state?.showScanFeedback === true;
    if (onboardingSteps[nextIndex] === "scan-feedback" && !didScan) {
      nextIndex++; // Skip to next step after scan-feedback
    }

    if (currentStep === "macro-preview") {
      setAuthMode("signup");
      if (user) {
        void tryFinishOnboardingWithAccess();
      } else {
        setCurrentStep("save-progress");
      }
      return;
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
    
    if (prevIndex >= 0) setCurrentStep(onboardingSteps[prevIndex]);
  };

  const handleComplete = () => {
    successFeedback(); // Success haptic on completion
    saveOnboardingData(userData);
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

  const languages = APP_LANGUAGES;

  const renderStepContent = () => {
    const stepProps = { userData, setUserData, goNext, goBack };

    switch (currentStep) {
      case "splash":
        return <SplashScreen onNext={goNext} />;

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
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setLanguage(lang.code); goNext(); }}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      language === lang.code ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{lang.flag}</span>
                      <span className="font-semibold text-lg">{lang.label}</span>
                      {language === lang.code && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        >
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
            <motion.div
              key="name-input-content"
              className="flex flex-col items-center text-center px-6 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                key="name-mascot"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <AnimatedFrigyMascot size={100} animate={false} />
              </motion.div>

              <motion.h1
                key="name-title"
                className="text-xl sm:text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.3 }}
              >
                {t.onboardingWhatsYourName}
              </motion.h1>
              <motion.p
                key="name-subtitle"
                className="text-muted-foreground/60 text-xs sm:text-sm mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {t.onboardingNameSubtitle}
              </motion.p>

              <motion.div
                key="name-input-wrapper"
                className="w-full max-w-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
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
                key="name-button-wrapper"
                className="w-full max-w-sm mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
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
            </motion.div>
          </StepCard>
        );

      case "welcome":
        return (
          <div className="min-h-screen bg-background flex flex-col items-center justify-center px-3 sm:px-6 py-6 sm:py-8">
            {/* Animated Fridge Popup */}
            <motion.div
              key="welcome-mascot"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              className="relative mb-6 sm:mb-8"
            >
              {/* Fridge Door Animation - using scale instead of rotateY */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <AnimatedFrigyMascot size={160} animate={true} />
              </motion.div>

              {/* Sparkle Effects */}
              <motion.div
                key="sparkle-1"
                className="absolute -top-2 -right-2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </motion.div>
              <motion.div
                key="sparkle-2"
                className="absolute -top-4 left-0"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.3 }}
              >
                <Star className="w-5 h-5 text-primary fill-primary" />
              </motion.div>
            </motion.div>

            {/* Greeting with User's Name */}
            <motion.div
              key="welcome-greeting"
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <motion.div
                key="greeting-bubble"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                <span className="text-xl">👋</span>
                <span className="text-primary font-semibold">
                  {language === 'de' ? 'Hallo' : language === 'fr' ? 'Salut' : 'Hello'}, {userData.name || 'du'}!
                </span>
              </motion.div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                {t.onboardingImFrigy}
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xs mx-auto mb-8">
                {t.onboardingReadyToReachGoals}
              </p>

              <motion.div
                key="welcome-button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
                className="w-full max-w-sm"
              >
                <Button
                  onClick={goNext}
                  className="w-full h-14 text-lg font-semibold rounded-2xl"
                  size="lg"
                >
                  {t.onboardingYesLetsGo} <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </motion.div>
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

      case "success-stats":
        const stats = [
          { value: 94, suffix: "%", label: t.onboardingReachGoals, color: "bg-primary" },
          { value: 2.5, suffix: "kg", label: t.onboardingAvgWeightLoss, color: "bg-primary/85" },
          { value: 15, suffix: "min", label: t.onboardingTimeSaved, color: "bg-emerald-500" },
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
                      {userData.goal === 'healthier' && t.onboardingEatHealthier}
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
                  className="overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <div className="flex items-center justify-center gap-1.5 py-2">
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
                  className="overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <div className="flex items-center justify-center gap-1.5 py-2">
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
                  className="overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <div className="flex items-center justify-center gap-1.5 py-2">
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
          <GenderSelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "birthdate":
        return (
          <BirthdateSelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "weight":
        return (
          <WeightSelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "height":
        return (
          <HeightSelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "activity":
        return (
          <ActivitySelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "main-goal":
        return (
          <MainGoalSelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "target-weight":
        return (
          <TargetWeightSelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "goal-preview":
        return (
          <GoalPreviewStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "speed-select":
        return (
          <PaceSelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "health-goals":
        return (
          <HealthGoalsSelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "weekly-plan-preview":
        return (
          <WeeklyPlanPreviewStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "scan-fridge":
        return (
          <FridgeScanStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "shopping-list":
        return (
          <ShoppingListStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "health-sync":
        return (
          <HealthConnectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "data-consent":
        return (
          <DataConsentStep
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "referral-code":
        return (
          <ReferralCodeStep
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
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

      case "dietary-preferences":
        return (
          <DietStyleSelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
        );

      case "allergies":
        return (
          <AllergiesSelectStep
            userData={userData}
            setUserData={setUserData}
            onBack={currentIndex > 0 ? goBack : undefined}
            onNext={goNext}
          />
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
            <div className="flex w-full flex-col items-center px-6 pt-6 text-center sm:pt-2">
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

        return (
          <StepCard step="macro-preview">
            <div className="flex w-full flex-col items-center px-4 pb-28 text-center sm:pb-10">
              {/* Hero Goal Prediction Banner - TOP */}
              <motion.div 
                className="mb-5 w-full max-w-sm sm:mb-6"
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-4 shadow-lg sm:p-5">
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
                      <p className="mb-1 text-base font-bold text-primary-foreground sm:text-lg">
                        {t.youWillReach} <span className="text-[1.55rem] sm:text-2xl">{userData.targetWeight}kg</span> {language === 'de' ? 'erreichen' : ''}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4 text-primary-foreground/70" />
                        <p className="text-lg font-semibold text-primary-foreground/90 sm:text-xl">
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
                      <span>{userData.goalMode === 'lose' ? '-' : '+'}{Math.abs(userData.weeklyGoal)}kg/{t.weekLabel}</span>
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
                className="relative mb-4 w-full max-w-[18.5rem] sm:mb-5"
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
                  type="button"
                  onClick={() => openMacroEdit("calories")}
                  aria-label={t.changeGoal}
                  className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center hover:bg-primary/10 hover:border-primary transition-all shadow-md touch-manipulation"
                >
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </motion.div>
              
              {/* Macro Rings - Modern Grid */}
              <motion.div 
                className="grid w-full max-w-[18.5rem] grid-cols-3 gap-2 sm:max-w-xs sm:gap-3"
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
                    type="button"
                    onClick={() => openMacroEdit("protein")}
                    aria-label={language === "de" ? "Protein anpassen" : "Edit protein"}
                    className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-background border border-blue-300 flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm touch-manipulation"
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
                    type="button"
                    onClick={() => openMacroEdit("carbs")}
                    aria-label={language === "de" ? "Kohlenhydrate anpassen" : "Edit carbs"}
                    className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-background border border-amber-300 flex items-center justify-center hover:bg-amber-50 transition-colors shadow-sm touch-manipulation"
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
                    type="button"
                    onClick={() => openMacroEdit("fat")}
                    aria-label={language === "de" ? "Fett anpassen" : "Edit fat"}
                    className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-background border border-rose-300 flex items-center justify-center hover:bg-rose-50 transition-colors shadow-sm touch-manipulation"
                  >
                    <svg className="w-3 h-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
               </motion.div>
              
              {/* Scientific Sources Card - ehrliche Quellen die tatsächlich verwendet werden */}
              <motion.div
                className="mt-5 w-full max-w-sm rounded-2xl border border-border/50 bg-card p-4 sm:mt-6"
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
                className="w-full max-w-xl mb-6 px-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <HeroAnimation />
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
            onBackToOnboarding={() => setCurrentStep("tutorial-transition")}
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
              description: t.enterEmailAndPassword,
              variant: "destructive",
            });
            return;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(authEmail)) {
            toast({
              title: t.error,
              description: t.invalidEmail,
              variant: "destructive",
            });
            return;
          }

          // Validate password length
          if (authPassword.length < 8) {
            toast({
              title: t.error,
              description: t.passwordTooShort,
              variant: "destructive",
            });
            return;
          }

          setIsAuthLoading(true);
          try {
            if (authMode === "signup") {
              const { error } = await signUp(authEmail, authPassword, { silent: true });

              const ensureSessionAfterSignup = async (): Promise<boolean> => {
                if (await waitForAuthSession(3200)) return true;
                await signIn(authEmail, authPassword, { silent: true });
                return waitForAuthSession(2000);
              };

              if (error) {
                if (
                  (isUserAlreadyRegistered(error) || isEmailRateLimited(error)) &&
                  (await ensureSessionAfterSignup())
                ) {
                  goAfterSignup();
                  return;
                }

                const resolved = resolveAuthErrorMessage(error, language, "signup");
                toast({
                  title: t.onboardingRegistrationFailed,
                  description: resolved?.message ?? error.message,
                  variant: resolved?.variant === "info" ? "default" : "destructive",
                });
                if (
                  resolved?.switchToLogin &&
                  (isUserAlreadyRegistered(error) || isEmailRateLimited(error))
                ) {
                  setAuthMode("login");
                }
                return;
              }

              if (!(await ensureSessionAfterSignup())) {
                toast({
                  title: t.onboardingRegistrationFailed,
                  description: t.onboardingPleaseLoginToProceed,
                  variant: "destructive",
                });
                return;
              }

              goAfterSignup();
            } else {
              const { error } = await signIn(authEmail, authPassword);
              if (error) {
                const resolved = resolveAuthErrorMessage(error, language, "login");
                toast({
                  title: t.onboardingLoginFailed,
                  description: resolved?.message ?? error.message,
                  variant: resolved?.variant === "info" ? "default" : "destructive",
                });
                return;
              }
              saveOnboardingAfterSignup(userData);
              void tryFinishOnboardingWithAccess();
            }
          } finally {
            setIsAuthLoading(false);
          }
        };
        
        return (
          <StepCard step="save-progress">
            <motion.div
              className="flex h-full min-h-0 w-full flex-col overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-4"
                style={{ paddingTop: MINT_STEP_HEADER_PT }}
              >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, type: "spring", stiffness: 220 }}
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg"
              >
                <Save className="h-7 w-7 text-primary-foreground" />
              </motion.div>

              <motion.h1
                className="text-center text-[22px] font-bold leading-tight tracking-tight min-[390px]:text-2xl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.3 }}
              >
                {t.saveYourProgress}
              </motion.h1>

              <motion.div
                className="mx-auto mt-7 w-full max-w-sm space-y-3.5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {/* Email input */}
                <div className="relative">
                  <label htmlFor="auth-email" className="sr-only">{t.emailAddressPlaceholder}</label>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" aria-hidden="true" />
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder={t.emailAddressPlaceholder}
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-card border-border"
                    aria-label={t.emailAddressPlaceholder}
                  />
                </div>

                {/* Password input */}
                <div className="relative">
                  <label htmlFor="auth-password" className="sr-only">{t.passwordPlaceholder}</label>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" aria-hidden="true" />
                  <Input
                    id="auth-password"
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
                
                {authMode === "signup" ? (
                  <motion.button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="w-full pt-1 text-sm text-muted-foreground/70 transition-colors hover:text-primary"
                  >
                    {t.alreadyRegisteredSignIn}
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className="w-full pt-1 text-sm text-muted-foreground/70 transition-colors hover:text-primary"
                  >
                    {t.noAccountRegister}
                  </motion.button>
                )}
              </motion.div>

              <motion.div
                className="mx-auto mt-5 w-full max-w-sm rounded-xl border border-primary/20 bg-primary/5 p-4"
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
              </motion.div>
            </motion.div>
          </StepCard>
        );

      case "paywall":
        return (
          <OnboardingPaywallStep
            language={language}
            onBack={goBack}
            onCheckout={handlePaywallCheckout}
          />
        );

      case "premium-hint":
        const premiumFeaturesOnboarding = [
          t.unlimitedScansLabel,
          t.unlimitedMealPlanGen,
          t.shoppingListsLabel,
          t.statsMacroTracking,
          t.aiChatbotLabel
        ];
        
        const handlePlanContinue = () => {
          if (selectedPlanOption === 'premium') {
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
              <p className="text-muted-foreground/40 text-xs mb-6">{t.trial7DaysFree}</p>
              
              <div className="w-full max-w-sm grid grid-cols-1 gap-3 mb-6">
                {/* Premium Plan */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
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
                    <p className="text-[9px] text-primary mt-1">{t.trial7DaysFree}</p>
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
                {selectedPlanOption === 'premium' && (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Weiter zu Premium
                  </>
                )}
                {!selectedPlanOption && "Wähle einen Plan"}
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
                size={window.innerWidth < 640 ? 240 : 340} 
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

  const notebookQuestionLines =
    currentStep === "gender"
      ? language === "de"
        ? "WAS IST DEIN\nGESCHLECHT?"
        : language === "fr"
          ? "QUEL EST TON\nGENRE ?"
          : "WHAT'S YOUR\nGENDER?"
      : "";

  return (
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          className="onboarding-flow-root fixed inset-0 z-[100] flex min-h-0 flex-col overflow-hidden safe-area-inset"
          style={{ backgroundColor: "#F2FFF8" }}
        >
      {/* Legacy progress bar — hidden from macro-preview onward (mint line steps use thin bar) */}
      {showsOnboardingTopProgress(currentStep) &&
        currentStep !== "analyzing" &&
        currentStep !== "save-progress" &&
        currentStep !== "paywall" &&
        currentStep !== "tutorial" &&
        currentStep !== "splash" &&
        !ONBOARDING_MINT_BODY_STEPS.has(currentStep) &&
        !NOTEBOOK_MASKOT_STEPS.includes(currentStep) && (
        <OnboardingProgressBar
          currentStep={currentIndex + 1}
          totalSteps={totalSteps}
        />
      )}

      {/* Thin mint progress line on main onboarding flow */}
      {ONBOARDING_MINT_PROGRESS_LINE_STEPS.has(currentStep) && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[110] px-5 pt-[calc(env(safe-area-inset-top,0px)+6px)]"
          aria-hidden
        >
          <div
            className="mx-auto h-[3px] max-w-md overflow-hidden rounded-full"
            style={{ backgroundColor: ONBOARDING_MINT_PALETTE.progressTrack }}
          >
            <motion.div
              className="h-full w-full origin-left rounded-full"
              style={{ background: ONBOARDING_MINT_PALETTE.progressFill }}
              initial={false}
              animate={{
                scaleX: Math.min(1, (currentIndex + 1) / Math.max(1, totalSteps)),
              }}
              transition={{ duration: isMobile ? 0.22 : 0.32, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      )}

      {/* Header - hidden on mint body steps, splash, tutorial, notebook chrome */}
      {currentStep !== "tutorial" &&
        currentStep !== "splash" &&
        currentStep !== "analyzing" &&
        currentStep !== "save-progress" &&
        currentStep !== "paywall" &&
        !ONBOARDING_MINT_BODY_STEPS.has(currentStep) &&
        !NOTEBOOK_MASKOT_STEPS.includes(currentStep) && (
        <div className={`flex items-center justify-between p-4 ${currentStep === "macro-preview" ? "mt-5" : "mt-12"}`}>
          {currentIndex > 0 ? (
            <motion.button
              onClick={goBack}
              whileTap={{ scale: 0.95 }}
              className="flex h-12 w-12 items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: "#F2FFF8", color: "#050505", boxShadow: "0 1px 2px rgba(15,40,30,0.04)" }}
            >
              <ChevronRight className="w-6 h-6 rotate-180" strokeWidth={2.8} />
            </motion.button>
          ) : (
            <div className="h-12 w-12" />
          )}
          
          {/* Progress bar only - no dots */}

          <div className="h-12 w-12" />
        </div>
      )}

      {/* Main content */}
      {currentStep === "paywall" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key="paywall"
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : currentStep === "tutorial" ||
        currentStep === "splash" ||
        ONBOARDING_MINT_BODY_STEPS.has(currentStep) ? (
        // These steps render fullscreen with their own layout
        <motion.div className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentStep}
              className="onboarding-step-surface flex min-h-0 flex-1 flex-col"
              variants={mintStepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={mintStepTransition}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ) : NOTEBOOK_MASKOT_STEPS.includes(currentStep) ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <NotebookOnboardingChrome
            questionLines={notebookQuestionLines}
            progressFilledIndex={currentIndex}
            totalProgressSegments={totalSteps}
            onBack={goBack}
            onNext={goNext}
            canProceedNext={canProceed()}
            showBack={currentIndex > 0}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentStep}
                className="onboarding-step-surface mx-auto w-full max-w-lg pb-6"
                variants={legacyStepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={legacyStepTransition}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </NotebookOnboardingChrome>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 flex flex-col items-center justify-start overflow-y-auto py-6"
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentStep}
              className="onboarding-step-surface w-full max-w-md"
              variants={legacyStepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={legacyStepTransition}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
          {currentStep === "macro-preview" && (
            <motion.div
              className="sticky bottom-0 z-20 w-full max-w-md shrink-0 px-4 pb-6 pt-4"
              initial={false}
              animate={{
                opacity: macroPreviewCtaVisible ? 1 : 0,
                y: macroPreviewCtaVisible ? 0 : 18,
              }}
              transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
              style={{ pointerEvents: macroPreviewCtaVisible ? "auto" : "none" }}
            >
              <div className="rounded-[28px] bg-[linear-gradient(180deg,rgba(242,255,248,0),#F2FFF8_24%,#F2FFF8_100%)] px-1 pt-6">
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className={`h-12 w-full rounded-xl border border-[#57EE9A]/30 bg-[linear-gradient(135deg,#75FBB2_0%,#57EE9A_52%,#39D47F_100%)] text-[#082013] shadow-[0_18px_42px_-20px_rgba(57,212,127,0.52)] transition-all ${!canProceed() ? "opacity-50" : "hover:brightness-[1.02]"}`}
                >
                  {t.perfectBtn}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
          {!["name-input", "welcome", "fridge-intro", "scan-feedback", "weekly-plan", "premium-hint", "community", "celebration", "done", "analyzing", "tutorial", "save-progress", "paywall", "splash", "gender", "birthdate", "weight", "height", "activity", "main-goal", "target-weight", "goal-preview", "speed-select", "health-goals", "dietary-preferences", "allergies", "weekly-plan-preview", "scan-fridge", "shopping-list", "notification-prefs", "macro-preview"].includes(currentStep) && (
            <motion.div
              className="w-full max-w-md shrink-0 px-4 pt-2 pb-8"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                className={`h-12 w-full rounded-xl border border-[#57EE9A]/30 bg-[linear-gradient(135deg,#75FBB2_0%,#57EE9A_52%,#39D47F_100%)] text-[#082013] shadow-[0_18px_42px_-20px_rgba(57,212,127,0.52)] transition-all ${!canProceed() ? "opacity-50" : "hover:brightness-[1.02]"}`}
              >
                {currentStep === "welcome" ? t.start : 
                 currentStep === "tracker-intro" ? t.letsGo : 
                 currentStep === "macro-preview" ? t.perfectBtn :
                 t.next}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}
        </div>
      )}

      <EditMacroGoalsDialog
        open={macroEditOpen}
        onOpenChange={(open) => {
          setMacroEditOpen(open);
          if (!open) setMacroEditFocus(null);
        }}
        currentGoals={macroGoalsForEdit}
        focusMacro={macroEditFocus}
        onSave={(goals) => {
          setUserData((prev) => ({
            ...prev,
            dailyCalories: goals.dailyCalories,
            dailyProtein: goals.dailyProtein,
            dailyCarbs: goals.dailyCarbs,
            dailyFat: goals.dailyFat,
          }));
        }}
      />
    </motion.div>
  );
};
