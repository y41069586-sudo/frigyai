import { useEffect, useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Settings, Bot, Crown } from "lucide-react";
import { PremiumSuccessDialog } from "@/components/PremiumSuccessDialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { onboardingSteps, type OnboardingStep } from "@/components/onboarding/types";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useTrackerSettings } from "@/hooks/useTrackerSettings";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { HealthDashboard } from "@/components/food-ai";
import { MacroTracker } from "@/components/MacroTracker";
import type { UserGoal } from "@/lib/food-ai/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AIChatbot } from "@/components/AIChatbot";
import type { MealFocusKey } from "@/lib/mealFocus";
import { useGamification } from "@/hooks/useGamification";
import {
  WATER_GLASSES_CHANGED,
  WATER_GOAL_CUPS_CHANGED,
  dispatchWaterGlassesChanged,
  goalCupsToMl,
  readWaterGoalCupsFromStorage,
} from "@/lib/waterSync";
import {
  FRIGY_STORAGE_UPDATED,
  POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY,
} from "@/lib/frigyStorageSync";
import { STRIPE_CHECKOUT_PENDING_KEY } from "@/lib/stripePaymentLinks";
import { hasReferralSkipPaywallPending } from "@/lib/referralCode";
import { getLocalDateString } from "@/lib/localDate";

type CachedTodayFoodEntry = {
  name?: string;
  time?: string;
  created_at?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  meal_type?: MealFocusKey;
  mealType?: MealFocusKey;
};

function readTodayFoodSnapshot() {
  const saved = localStorage.getItem("todayFood");
  if (!saved) return null;

  try {
    const data = JSON.parse(saved);
    if (data.date !== getLocalDateString() || !Array.isArray(data.entries)) {
      return null;
    }

    const meals = data.entries.map((entry: CachedTodayFoodEntry) => ({
      name: entry.name || "Mahlzeit",
      time:
        entry.time ||
        (entry.created_at
          ? new Date(entry.created_at).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date().toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })),
      calories: Number(entry.calories) || 0,
      mealType: entry.meal_type ?? entry.mealType,
    }));

    const totals = data.entries.reduce(
      (
        acc: { calories: number; protein: number; carbs: number; fat: number },
        entry: CachedTodayFoodEntry,
      ) => ({
        calories: acc.calories + (Number(entry.calories) || 0),
        protein: acc.protein + (Number(entry.protein) || 0),
        carbs: acc.carbs + (Number(entry.carbs) || 0),
        fat: acc.fat + (Number(entry.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return { meals, totals };
  } catch (error) {
    console.error("Failed to parse todayFood", error);
    return null;
  }
}

const Index = () => {
  const { user, session, subscriptionStatus, signOut, loading, checkSubscription, isPremium } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isActivatingPremium, setIsActivatingPremium] = useState(
    () => searchParams.get("subscription") === "success",
  );
  const [showPremiumSuccess, setShowPremiumSuccess] = useState(false);
  const { t, language } = useLanguage();
  const { settings: trackerSettings, isConfigured: trackerSetup, loading: trackerLoading, reloadSettings } = useTrackerSettings();
  const { streak, recordActivity, checkAndAwardBadge } = useGamification();
  const { isComplete: dbOnboardingComplete, loading: onboardingLoading, userName: dbUserName, saveProgress } = useOnboardingProgress();
  const [portalLoading, setPortalLoading] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [showPostPayCoach, setShowPostPayCoach] = useState(false);
  const [chatBootstrapMessage, setChatBootstrapMessage] = useState<string | null>(null);
  const landedFromSubscriptionSuccessRef = useRef(false);

  const isFromSubscription = searchParams.get("subscription") === "success";
  const resetOnboarding = searchParams.get("resetOnboarding") === "true";
  const onboardingResumeStep = useMemo(() => {
    const step = searchParams.get("onboardingStep");
    return onboardingSteps.includes(step as OnboardingStep) ? (step as OnboardingStep) : undefined;
  }, [searchParams]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("subscription") === "success") {
      landedFromSubscriptionSuccessRef.current = true;
    }
  }, []);

  // Get user name from localStorage or DB
  const [userName, setUserName] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [waterGoalMl, setWaterGoalMl] = useState(() => goalCupsToMl(readWaterGoalCupsFromStorage()));
  const [todayMeals, setTodayMeals] = useState<{ name: string; time: string; calories: number; mealType?: MealFocusKey }[]>([]);
  const loggedMealTypes = useMemo(
    () => Array.from(new Set(todayMeals.map((meal) => meal.mealType).filter(Boolean))) as MealFocusKey[],
    [todayMeals],
  );
  const [caloriesEaten, setCaloriesEaten] = useState(0);
  const [proteinEaten, setProteinEaten] = useState(0);
  const [carbsEaten, setCarbsEaten] = useState(0);
  const [fatEaten, setFatEaten] = useState(0);
  const [foodGoal, setFoodGoal] = useState<UserGoal>(() => {
    const s = localStorage.getItem("userFoodGoal") as UserGoal | null;
    if (s === "lose" || s === "gain" || s === "maintain") return s;
    return "maintain";
  });

  useEffect(() => {
    localStorage.setItem("userFoodGoal", foodGoal);
  }, [foodGoal]);

  useEffect(() => {
    const localName = localStorage.getItem('userName');
    if (localName) {
      setUserName(localName);
    } else if (dbUserName) {
      setUserName(dbUserName);
    }
  }, [dbUserName]);
  
  // Fetch user streak
  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setCurrentStreak(data.current_streak);
    };
    fetchStreak();
  }, [user]);

  useEffect(() => {
    setCurrentStreak(streak.current_streak || 0);
  }, [streak.current_streak]);
  
  // Fetch water intake
  useEffect(() => {
    const fetchWater = async () => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('water_intake')
        .select('glasses')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (data) setWaterGlasses(data.glasses);
    };
    fetchWater();
  }, [user]);

  // Gleiches Wasser-Ziel wie auf der Wasser-Seite (localStorage)
  useEffect(() => {
    const onGoal = (e: Event) => {
      const cups = (e as CustomEvent<{ cups: number }>).detail?.cups;
      if (typeof cups === "number" && cups >= 1) setWaterGoalMl(goalCupsToMl(Math.min(20, cups)));
    };
    const onGlasses = (e: Event) => {
      const g = (e as CustomEvent<{ glasses: number }>).detail?.glasses;
      if (typeof g === "number" && g >= 0) setWaterGlasses(g);
    };
    window.addEventListener(WATER_GOAL_CUPS_CHANGED, onGoal);
    window.addEventListener(WATER_GLASSES_CHANGED, onGlasses);
    return () => {
      window.removeEventListener(WATER_GOAL_CUPS_CHANGED, onGoal);
      window.removeEventListener(WATER_GLASSES_CHANGED, onGlasses);
    };
  }, []);

  useEffect(() => {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== "waterDailyGoalCups" || ev.newValue == null) return;
      const c = parseInt(ev.newValue, 10);
      if (!Number.isNaN(c) && c >= 1) setWaterGoalMl(goalCupsToMl(Math.min(20, c)));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updateWaterGlasses = async (newGlasses: number) => {
    if (!user) return;
    const previousMl = waterGlasses * 250;
    const nextMl = newGlasses * 250;
    setWaterGlasses(newGlasses);
    dispatchWaterGlassesChanged(newGlasses);
    if (previousMl < 2000 && nextMl >= 2000) {
      void recordActivity();
      void checkAndAwardBadge('water_goal');
    }
    const today = new Date().toISOString().split("T")[0];
    try {
      const { error } = await supabase.from("water_intake").upsert(
        { user_id: user.id, date: today, glasses: newGlasses },
        { onConflict: "user_id,date" },
      );
      if (error) throw error;
    } catch (e) {
      console.error("water update failed", e);
    }
  };

  // Load today's meals from localStorage
  useEffect(() => {
    let frameId: number | null = null;

    const loadTodayMeals = () => {
      const snapshot = readTodayFoodSnapshot();
      if (!snapshot) {
        setTodayMeals([]);
        setCaloriesEaten(0);
        setProteinEaten(0);
        setCarbsEaten(0);
        setFatEaten(0);
        return false;
      }

      setTodayMeals(snapshot.meals);
      setCaloriesEaten(snapshot.totals.calories);
      setProteinEaten(snapshot.totals.protein);
      setCarbsEaten(snapshot.totals.carbs);
      setFatEaten(snapshot.totals.fat);
      return true;
    };

    const scheduleLoadTodayMeals = () => {
      if (frameId != null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        loadTodayMeals();
      });
    };
    
    loadTodayMeals();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "todayFood") scheduleLoadTodayMeals();
    };

    window.addEventListener("storage", handleStorageChange, { passive: true });
    window.addEventListener(FRIGY_STORAGE_UPDATED, scheduleLoadTodayMeals, { passive: true });

    const interval = setInterval(scheduleLoadTodayMeals, 30000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(FRIGY_STORAGE_UPDATED, scheduleLoadTodayMeals);
      clearInterval(interval);
      if (frameId != null) window.cancelAnimationFrame(frameId);
    };
  }, []);
  
  // Fallback: if local today cache is missing, hydrate macros from DB.
  useEffect(() => {
    const fetchDailyMacros = async () => {
      if (!user) return;
      if (readTodayFoodSnapshot()) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_macros')
        .select('calories, protein, carbs, fat')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (data) {
        setCaloriesEaten(data.calories);
        setProteinEaten(data.protein);
        setCarbsEaten(data.carbs);
        setFatEaten(data.fat);
      }
    };

    fetchDailyMacros();

    const handleFoodEntryChanged = () => {
      if (!readTodayFoodSnapshot()) {
        void fetchDailyMacros();
      }
    };

    window.addEventListener('foodEntryAdded', handleFoodEntryChanged, { passive: true });

    if (user) {
      const intervalId = setInterval(async () => {
        if (readTodayFoodSnapshot()) return;
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('daily_macros')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (data) {
          setCaloriesEaten(data.calories || 0);
          setProteinEaten(data.protein || 0);
          setCarbsEaten(data.carbs || 0);
          setFatEaten(data.fat || 0);
        }
      }, 30000);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('foodEntryAdded', handleFoodEntryChanged);
      };
    }

    return () => {
      window.removeEventListener('foodEntryAdded', handleFoodEntryChanged);
    };
  }, [user]);
  
  // Handle reset onboarding from URL parameter (for testing or "Erneut starten" in profile)
  useEffect(() => {
    if (!resetOnboarding || loading) return;
    const run = async () => {
      const { clearOnboardingForLogout } = await import("@/components/onboarding/utils");
      clearOnboardingForLogout();
      await saveProgress({ onboarding_complete: false });
      window.history.replaceState({}, '', '/');
      window.location.reload();
    };
    void run();
  }, [resetOnboarding, saveProgress, loading]);
  
  // Initialize states - check if user already completed onboarding
  // TESTMODUS: Onboarding wird bei jeder Session angezeigt (Login bleibt möglich)
  const ONBOARDING_TEST_MODE = false; // Testmodus deaktiviert
  
  const hasCompletedOnboarding = localStorage.getItem('onboardingComplete') === 'true';
  // Skip only when onboarding was actually completed (local or DB), not merely because user is logged in
  const shouldSkipOnboarding = ONBOARDING_TEST_MODE ? false : (hasCompletedOnboarding || dbOnboardingComplete);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(shouldSkipOnboarding);
  const navigate = useNavigate();

  // Update onboarding visibility when loading completes
  useEffect(() => {
    if (!onboardingLoading && !loading) {
      if (onboardingResumeStep) {
        setShowOnboarding(true);
        setOnboardingComplete(false);
        return;
      }

      const skip = ONBOARDING_TEST_MODE ? false : (hasCompletedOnboarding || dbOnboardingComplete);
      setShowOnboarding(!skip);
      setOnboardingComplete(skip);
    }
  }, [onboardingLoading, loading, user, dbOnboardingComplete, hasCompletedOnboarding, onboardingResumeStep]);
  
  // Skip onboarding only if coming from subscription success
  useEffect(() => {
    if (isFromSubscription) {
      setShowOnboarding(false);
      setOnboardingComplete(true);
    }
  }, [isFromSubscription]);
  
  // Nach Stripe-Rückkehr (URL oder Tab-Wechsel): Premium-Status aktualisieren
  useEffect(() => {
    if (!user) return;

    const refresh = () => {
      void checkSubscription();
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (localStorage.getItem(STRIPE_CHECKOUT_PENDING_KEY)) {
        localStorage.removeItem(STRIPE_CHECKOUT_PENDING_KEY);
        refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user, checkSubscription]);

  // Nach Stripe-Rückkehr (?subscription=success): Premium aktivieren + Erfolg anzeigen
  useEffect(() => {
    if (searchParams.get("subscription") !== "success" || !user || !session) return;

    localStorage.removeItem(STRIPE_CHECKOUT_PENDING_KEY);
    let cancelled = false;

    const activatePremium = async () => {
      setIsActivatingPremium(true);
      const maxAttempts = 15;

      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt++) {
        const status = await checkSubscription();
        if (status?.subscribed) {
          if (!cancelled) {
            setIsActivatingPremium(false);
            setShowPremiumSuccess(true);
            setShowOnboarding(false);
            setOnboardingComplete(true);
            localStorage.setItem("onboardingComplete", "true");
            const next = new URLSearchParams(searchParams);
            next.delete("subscription");
            setSearchParams(next, { replace: true });
          }
          return;
        }
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (!cancelled) {
        setIsActivatingPremium(false);
        setShowPremiumSuccess(true);
        setShowOnboarding(false);
        setOnboardingComplete(true);
        localStorage.setItem("onboardingComplete", "true");
        const next = new URLSearchParams(searchParams);
        next.delete("subscription");
        setSearchParams(next, { replace: true });
        toast({
          title: language === "de" ? "Zahlung erhalten" : "Payment received",
          description:
            language === "de"
              ? "Premium wird gleich aktiv. Falls nicht, App neu öffnen oder kurz warten."
              : "Premium will activate shortly. Reopen the app if needed.",
        });
      }
    };

    void activatePremium();
    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, checkSubscription, user, session, language]);

  // Erstes Dashboard nach Zahlung: Hinweis nach 6 Sekunden (einmalig)
  useEffect(() => {
    if (!user || !onboardingComplete) return;
    if (localStorage.getItem(POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY) === "1") return;
    if (!landedFromSubscriptionSuccessRef.current) return;

    const t = window.setTimeout(() => setShowPostPayCoach(true), 6000);
    return () => window.clearTimeout(t);
  }, [user, onboardingComplete]);

  const handleOnboardingComplete = () => {
    // Im Testmodus: Onboarding neu starten statt zum Dashboard
    if (ONBOARDING_TEST_MODE) {
      // Onboarding bleibt sichtbar, nur zurück zum Anfang
      window.location.reload();
      return;
    }

    if (user && !isPremium && !hasReferralSkipPaywallPending()) {
      setShowOnboarding(true);
      setOnboardingComplete(false);
      window.history.replaceState(window.history.state, "", "/?onboardingStep=paywall");
      return;
    }

    setShowOnboarding(false);

    if (!user) {
      window.history.replaceState(window.history.state, '', '/?onboardingStep=save-progress');
      setShowOnboarding(true);
      setOnboardingComplete(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) {
      toast({ title: t.error, variant: 'destructive' });
      return;
    }
    setPortalLoading(true);
    toast({ title: t.loading });
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) {
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow) {
          window.location.href = data.url;
        }
      }
    } catch (error: any) {
      toast({ title: t.error, description: error.message, variant: 'destructive' });
    } finally {
      setPortalLoading(false);
    }
  };

  const dismissPostPayCoach = () => {
    localStorage.setItem(POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY, "1");
    setShowPostPayCoach(false);
  };

  const handlePostPayScan = () => {
    localStorage.setItem(POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY, "1");
    setShowPostPayCoach(false);
    navigate("/scan");
  };

  useEffect(() => {
    if (loading || showOnboarding || user || onboardingResumeStep) return;
    const completedLocally = localStorage.getItem("onboardingComplete") === "true";
    if (!completedLocally && !dbOnboardingComplete) {
      setShowOnboarding(true);
      setOnboardingComplete(false);
      return;
    }
    navigate("/auth", { replace: true });
  }, [loading, showOnboarding, user, onboardingResumeStep, navigate, dbOnboardingComplete]);

  const targetCalories = trackerSettings?.dailyCalories || 2000;
  const targetProtein = trackerSettings?.dailyProtein || 150;
  const targetCarbs = trackerSettings?.dailyCarbs || 200;
  const targetFat = trackerSettings?.dailyFat || 65;
  
  
  // Wait for auth before showing anything
  if (loading) {
    return null;
  }

  if (isActivatingPremium) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F7FAF7] safe-area-inset px-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-[280px] flex-col items-center text-center"
        >
          <div className="relative mb-8 flex h-[88px] w-[88px] items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-primary/15" />
            <div
              className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin"
              aria-hidden
            />
            <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-[0_12px_32px_-12px_hsl(var(--primary)/0.55)]">
              <Crown className="h-8 w-8 text-primary-foreground" strokeWidth={2.2} />
            </div>
          </div>
          <h2 className="text-[1.35rem] font-bold leading-tight tracking-tight">
            {language === "de" ? "Premium wird aktiviert…" : "Activating Premium…"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {language === "de"
              ? "Einen Moment – wir verbinden deine Zahlung mit deinem Konto."
              : "One moment — linking your payment to your account."}
          </p>
        </motion.div>
      </div>
    );
  }

  // Show onboarding with mascot intro (no separate splash screen)
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} initialStep={onboardingResumeStep} />;
  }

  // If not logged in and onboarding is done, redirect to auth without showing an intermediate screen.
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F2FFF8] flex flex-col overflow-x-hidden">
      {/* Subtle background without white edge fade */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.10),transparent_34%),linear-gradient(to_bottom,#F2FFF8,#F2FFF8)] pointer-events-none" />

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col px-4 pb-bottom-nav pt-9 sm:px-6 sm:pt-11 safe-top">
        <div className="flex-1 flex flex-col w-full max-w-full sm:max-w-md lg:max-w-2xl mx-auto space-y-8">
          
          {/* Header - Clean & Modern */}
          <motion.header
            className="flex items-start justify-between gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex-1 min-w-0">
              <h1 className="bg-gradient-to-r from-primary via-emerald-400 to-primary/60 bg-clip-text text-[26px] font-black leading-tight tracking-[-0.05em] text-transparent drop-shadow-[0_10px_22px_hsl(var(--primary)/0.24)]">
                Frigy
              </h1>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentStreak > 0 && (
                <motion.button
                  type="button"
                  onClick={() => navigate("/badges")}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-amber-400/14 px-3 text-amber-700 transition-colors hover:bg-amber-400/20"
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 420, damping: 28 }}
                  aria-label="Badge-Seite öffnen"
                >
                  <span className="text-base">🔥</span>
                  <span className="text-[13px] font-bold tabular-nums">{currentStreak}</span>
                </motion.button>
              )}

              <motion.button
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                className="w-10 h-10 rounded-full bg-white/80 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.32)] flex items-center justify-center hover:bg-white transition-colors"
                whileTap={{ scale: 0.95 }}
                title="AI Chatbot"
              >
                <Bot className="w-4 h-4 text-primary" />
              </motion.button>

              <motion.button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-full bg-white/80 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.32)] flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>
          </motion.header>

          <div className="dashboard-fast-scroll">
            <HealthDashboard
              caloriesEaten={caloriesEaten}
              targetCalories={targetCalories}
              proteinEaten={proteinEaten}
              targetProtein={targetProtein}
              carbsEaten={carbsEaten}
              targetCarbs={trackerSettings?.dailyCarbs ?? 200}
              fatEaten={fatEaten}
              targetFat={trackerSettings?.dailyFat ?? 65}
              loggedMealTypes={loggedMealTypes}
              waterGlasses={waterGlasses}
              waterGoalMl={waterGoalMl}
              onWaterGlassesChange={updateWaterGlasses}
              aiChatEnabled
              onAiChatPromptSubmit={(text) => {
                setChatBootstrapMessage(text);
                setIsChatbotOpen(true);
              }}
            />
          </div>
        </div>
      </main>

      {user && onboardingComplete && (
        <MacroTracker onSetupComplete={reloadSettings} />
      )}

      {/* Bottom Navigation - Show for all logged in users */}
      {user && onboardingComplete && (
        <BottomNavigation trackerSetup={trackerSetup} trackerLoading={trackerLoading} />
      )}

      <Dialog
        open={showPostPayCoach}
        onOpenChange={(open) => {
          if (!open) dismissPostPayCoach();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.postPayCoachTitle}</DialogTitle>
            <DialogDescription className="text-left space-y-2">
              <span className="block">
                {t.postPayCoachScanLine}{" "}
                <strong className="text-foreground">{t.postPayCoachBody2}</strong>.
              </span>
              <span className="block text-muted-foreground">{t.postPayCoachShoppingLine}</span>
              <span className="block text-muted-foreground text-xs">{t.postPayCoachBody3}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={dismissPostPayCoach}>
              {t.laterBtn}
            </Button>
            <Button type="button" onClick={handlePostPayScan}>
              {t.scanNow}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIChatbot
        isOpen={isChatbotOpen}
        setIsOpen={setIsChatbotOpen}
        bootstrapMessage={chatBootstrapMessage}
        onBootstrapConsumed={() => setChatBootstrapMessage(null)}
        userProfile={trackerSettings ? {
          dailyCalories: trackerSettings.dailyCalories,
          dailyProtein: trackerSettings.dailyProtein,
          dailyCarbs: trackerSettings.dailyCarbs,
          dailyFat: trackerSettings.dailyFat,
          weight: 0, // Will be loaded from DB in chatbot
          targetWeight: 0,
        } : null}
      />

      <PremiumSuccessDialog
        open={showPremiumSuccess}
        onClose={() => {
          setShowPremiumSuccess(false);
          void checkSubscription();
        }}
      />

    </div>
  );
};

export default Index;
