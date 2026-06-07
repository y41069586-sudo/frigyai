import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Settings, Bot, Crown, Scale } from "lucide-react";
import { PremiumSuccessDialog } from "@/components/PremiumSuccessDialog";
import { useLocation, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getAppLocale } from "@/lib/mealPlanLanguage";
import { getStoredLanguage, useLanguage } from "@/contexts/LanguageContext";
import { resolveDashboardMacroTargets } from "@/lib/trackerTargets";
import { isMealPlanGenerationActive } from "@/lib/mealPlanGenerationLock";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { onboardingSteps, type OnboardingStep } from "@/components/onboarding/types";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useTrackerSettings } from "@/hooks/useTrackerSettings";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { HealthDashboard } from "@/components/food-ai";
import { DashboardWeightWidget } from "@/components/DashboardWeightWidget";
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
import { PageLoader } from "@/components/PageLoader";
import type { MealFocusKey } from "@/lib/mealFocus";
import { getPublicErrorMessage } from "@/lib/publicErrorMessage";
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
import { openStoreSubscriptionManagement } from "@/lib/storeBilling";
import { hasReferralSkipPaywallPending } from "@/lib/referralCode";
import { getLocalDateISO, getLocalDateString } from "@/lib/localDate";
import { ML_PER_WATER_GLASS } from "@/lib/waterUnits";
import { recordWaterGoalDayMet } from "@/lib/waterGoalStreak";
import { resolvePostAuthDestination } from "@/lib/resolvePostAuthDestination";

function readOnboardingCompleteLocal(): boolean {
  return localStorage.getItem("onboardingComplete") === "true";
}

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

function readTodayFoodSnapshot(timeLocale: string, defaultMealName: string) {
  const saved = localStorage.getItem("todayFood");
  if (!saved) return null;

  try {
    const data = JSON.parse(saved);
    if (data.date !== getLocalDateString() || !Array.isArray(data.entries)) {
      return null;
    }

    const meals = data.entries.map((entry: CachedTodayFoodEntry) => ({
      name: entry.name || defaultMealName,
      time:
        entry.time ||
        (entry.created_at
          ? new Date(entry.created_at).toLocaleTimeString(timeLocale, {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date().toLocaleTimeString(timeLocale, {
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

function getInitialTodayMacroTotals() {
  const snap = readTodayFoodSnapshot(getAppLocale(getStoredLanguage()), "Mahlzeit");
  return snap?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

const Index = () => {
  const { user, session, subscriptionStatus, signOut, loading, checkSubscription, isPremium } = useAuth();
  const onboardingExitInFlightRef = useRef(false);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isActivatingPremium, setIsActivatingPremium] = useState(
    () => searchParams.get("subscription") === "success",
  );
  const [showPremiumSuccess, setShowPremiumSuccess] = useState(false);
  const { t, language } = useLanguage();
  const timeLocale = getAppLocale(language);
  const { settings: trackerSettings, isConfigured: trackerSetup, loading: trackerLoading, reloadSettings } = useTrackerSettings();
  const { streak, recordActivity, checkAndAwardBadge } = useGamification();
  const { isComplete: dbOnboardingComplete, loading: onboardingLoading, userName: dbUserName, saveProgress } = useOnboardingProgress();
  const [portalLoading, setPortalLoading] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [showPostPayCoach, setShowPostPayCoach] = useState(false);
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [chatBootstrapMessage, setChatBootstrapMessage] = useState<string | null>(null);
  const landedFromSubscriptionSuccessRef = useRef(false);

  const isFromSubscription = searchParams.get("subscription") === "success";
  const resetOnboarding = searchParams.get("resetOnboarding") === "true";
  const onboardingResumeStep = useMemo(() => {
    const fromState = (location.state as { onboardingStep?: string } | null)?.onboardingStep;
    if (fromState && onboardingSteps.includes(fromState as OnboardingStep)) {
      return fromState as OnboardingStep;
    }
    const step = searchParams.get("onboardingStep");
    return onboardingSteps.includes(step as OnboardingStep) ? (step as OnboardingStep) : undefined;
  }, [searchParams, location.state]);

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
  const initialMacros = getInitialTodayMacroTotals();
  const [caloriesEaten, setCaloriesEaten] = useState(initialMacros.calories);
  const [proteinEaten, setProteinEaten] = useState(initialMacros.protein);
  const [carbsEaten, setCarbsEaten] = useState(initialMacros.carbs);
  const [fatEaten, setFatEaten] = useState(initialMacros.fat);
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
      const today = getLocalDateISO();
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
    const previousMl = waterGlasses * ML_PER_WATER_GLASS;
    const nextMl = newGlasses * ML_PER_WATER_GLASS;
    setWaterGlasses(newGlasses);
    dispatchWaterGlassesChanged(newGlasses);
    const goalMl = waterGoalMl > 0 ? waterGoalMl : goalCupsToMl(readWaterGoalCupsFromStorage());
    if (previousMl < goalMl && nextMl >= goalMl) {
      void recordActivity();
      void checkAndAwardBadge("water_goal");
      const streakDays = recordWaterGoalDayMet();
      if (streakDays >= 7) {
        void checkAndAwardBadge("water_week");
      }
    }
    const today = getLocalDateISO();
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
      const snapshot = readTodayFoodSnapshot(timeLocale, t.defaultMealName);
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
  }, [timeLocale, t.defaultMealName, user?.id]);
  
  // Fallback: if local today cache is missing, hydrate macros from DB.
  useEffect(() => {
    const fetchDailyMacros = async () => {
      if (!user) return;
      if (readTodayFoodSnapshot(timeLocale, t.defaultMealName)) return;
      const today = getLocalDateISO();
      const { data } = await supabase
        .from('daily_macros')
        .select('calories, protein, carbs, fat')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (data && !readTodayFoodSnapshot(timeLocale, t.defaultMealName)) {
        setCaloriesEaten(data.calories);
        setProteinEaten(data.protein);
        setCarbsEaten(data.carbs);
        setFatEaten(data.fat);
      }
    };

    fetchDailyMacros();

    const handleFoodEntryChanged = () => {
      if (!readTodayFoodSnapshot(timeLocale, t.defaultMealName)) {
        void fetchDailyMacros();
      }
    };

    window.addEventListener('foodEntryAdded', handleFoodEntryChanged, { passive: true });

    if (user) {
      const intervalId = setInterval(async () => {
        if (readTodayFoodSnapshot(timeLocale, t.defaultMealName)) return;
        const today = getLocalDateISO();
        const { data } = await supabase
          .from('daily_macros')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (data && !readTodayFoodSnapshot(timeLocale, t.defaultMealName)) {
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
  }, [user, timeLocale, t.defaultMealName]);
  
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
  
  const [localOnboardingComplete, setLocalOnboardingComplete] = useState(readOnboardingCompleteLocal);
  const hasCompletedOnboarding = localOnboardingComplete;
  // Skip only when onboarding was actually completed (local or DB), not merely because user is logged in
  const shouldSkipOnboarding = ONBOARDING_TEST_MODE ? false : (hasCompletedOnboarding || dbOnboardingComplete);
  const [showOnboarding, setShowOnboarding] = useState(() =>
    ONBOARDING_TEST_MODE ? false : !readOnboardingCompleteLocal(),
  );
  const [onboardingComplete, setOnboardingComplete] = useState(shouldSkipOnboarding);
  const dashboardReady = onboardingComplete || hasCompletedOnboarding || dbOnboardingComplete;
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => setLocalOnboardingComplete(readOnboardingCompleteLocal());
    sync();
    window.addEventListener(FRIGY_STORAGE_UPDATED, sync);
    return () => window.removeEventListener(FRIGY_STORAGE_UPDATED, sync);
  }, [user, dbOnboardingComplete]);

  // Update onboarding visibility when loading completes
  useEffect(() => {
    if (!onboardingLoading && !loading) {
      const returnToOnboarding =
        (location.state as { returnToOnboarding?: boolean } | null)?.returnToOnboarding === true;

      if (onboardingResumeStep || returnToOnboarding) {
        setShowOnboarding(true);
        setOnboardingComplete(false);
        return;
      }

      // Keep active onboarding session when auth state updates mid-flow
      if (showOnboarding && !(hasCompletedOnboarding || dbOnboardingComplete)) {
        return;
      }

      const skip = ONBOARDING_TEST_MODE ? false : (hasCompletedOnboarding || dbOnboardingComplete);
      setShowOnboarding(!skip);
      setOnboardingComplete(skip);
    }
  }, [
    onboardingLoading,
    loading,
    user,
    dbOnboardingComplete,
    hasCompletedOnboarding,
    onboardingResumeStep,
    location.state,
    showOnboarding,
  ]);
  
  // Skip onboarding only if coming from subscription success
  useEffect(() => {
    if (isFromSubscription) {
      setShowOnboarding(false);
      setOnboardingComplete(true);
    }
  }, [isFromSubscription]);
  
  // Nach Store-Rückkehr (?subscription=success): Premium aktivieren + Erfolg anzeigen
  useEffect(() => {
    if (searchParams.get("subscription") !== "success" || !user || !session) return;

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
        const next = new URLSearchParams(searchParams);
        next.delete("subscription");
        setSearchParams(next, { replace: true });
        toast({
          title: t.premiumNotActiveYet,
          description: t.premiumNotActiveDesc,
          variant: "destructive",
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

  const handleOnboardingComplete = useCallback(async () => {
    if (ONBOARDING_TEST_MODE) {
      window.location.reload();
      return;
    }

    if (onboardingExitInFlightRef.current) return;
    onboardingExitInFlightRef.current = true;

    try {
      let activeUser = user;
      if (!activeUser) {
        const { data } = await supabase.auth.getSession();
        activeUser = data.session?.user ?? null;
      }

      const completedLocally = readOnboardingCompleteLocal();

      if (activeUser && (completedLocally || dbOnboardingComplete || hasReferralSkipPaywallPending())) {
        setShowOnboarding(false);
        setOnboardingComplete(true);
        setLocalOnboardingComplete(true);
        if (!dbOnboardingComplete) {
          await saveProgress({ onboarding_complete: true });
        }
        const next = new URLSearchParams(searchParams);
        if (next.has("onboardingStep")) {
          next.delete("onboardingStep");
          setSearchParams(next, { replace: true });
        }
        return;
      }

      if (activeUser && !hasReferralSkipPaywallPending()) {
        const route = await resolvePostAuthDestination({
          userId: activeUser.id,
          checkSubscription,
          fromOnboarding: true,
          sessionWaitMs: 4500,
        });

        if (route.phase === "dashboard") {
          localStorage.setItem("onboardingComplete", "true");
          setLocalOnboardingComplete(true);
          setShowOnboarding(false);
          setOnboardingComplete(true);
          await saveProgress({ onboarding_complete: true });
          const next = new URLSearchParams(searchParams);
          if (next.has("onboardingStep")) {
            next.delete("onboardingStep");
            setSearchParams(next, { replace: true });
          }
          return;
        }

        if (route.phase === "onboarding_paywall" || route.phase === "standalone_paywall") {
          setShowOnboarding(true);
          setOnboardingComplete(false);
          setSearchParams({ onboardingStep: "paywall" }, { replace: true });
          return;
        }
      }

      setShowOnboarding(false);
      setOnboardingComplete(true);

      if (!activeUser) {
        setSearchParams({ onboardingStep: "save-progress" }, { replace: true });
        setShowOnboarding(true);
        setOnboardingComplete(false);
      }
    } finally {
      onboardingExitInFlightRef.current = false;
    }
  }, [
    user,
    dbOnboardingComplete,
    checkSubscription,
    saveProgress,
    searchParams,
    setSearchParams,
  ]);

  const handleManageSubscription = async () => {
    if (!session) {
      toast({ title: t.error, variant: 'destructive' });
      return;
    }
    setPortalLoading(true);
    toast({ title: t.loading });
    try {
      await openStoreSubscriptionManagement();
    } catch (error: unknown) {
      toast({
        title: t.error,
        description: getPublicErrorMessage(error, 'Die Aboverwaltung konnte gerade nicht geöffnet werden. Bitte versuche es erneut.'),
        variant: 'destructive',
      });
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
    }
  }, [loading, showOnboarding, user, onboardingResumeStep, dbOnboardingComplete]);

  const macroTargets = useMemo(
    () => resolveDashboardMacroTargets(trackerSettings, { preferLocal: trackerLoading }),
    [trackerSettings, trackerLoading],
  );
  const targetCalories = macroTargets?.dailyCalories ?? 0;
  const targetProtein = macroTargets?.dailyProtein ?? 0;
  const targetCarbs = macroTargets?.dailyCarbs ?? 0;
  const targetFat = macroTargets?.dailyFat ?? 0;
  const targetsReady = targetCalories > 0;
  
  
  // Wait for auth before showing anything (never cover active Wochenplan generation)
  if (loading && !isMealPlanGenerationActive()) {
    return <PageLoader />;
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
            {t.premiumActivating}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t.premiumActivatingDesc}
          </p>
        </motion.div>
      </div>
    );
  }

  // Show onboarding with mascot intro (no separate splash screen)
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} initialStep={onboardingResumeStep} />;
  }

  // Not logged in: onboarding or redirect to auth (no blank loader loop).
  if (!user) {
    if (hasCompletedOnboarding || dbOnboardingComplete) {
      return <Navigate to="/auth" replace />;
    }
    return (
      <OnboardingFlow onComplete={handleOnboardingComplete} initialStep={onboardingResumeStep} />
    );
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#FFFFFF]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#FCFFFD_100%)]" />

      {/* Main Content — single scroll container (fixes stuck scroll at tracker height on mobile) */}
      <main className="dashboard-scroll-main relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 pb-bottom-nav pt-9 sm:px-6 sm:pt-11 safe-top [-webkit-overflow-scrolling:touch]">
        <div className="mx-auto flex w-full max-w-full flex-col space-y-8 sm:max-w-md lg:max-w-2xl">
          
          {/* Header - Clean & Modern */}
          <motion.header
            className="flex items-start justify-between gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex-1 min-w-0">
              <h1 className="text-[26px] font-black leading-tight tracking-[-0.05em] text-transparent bg-clip-text bg-gradient-to-br from-[#D4FFE8] via-[#75FBB2] to-[#39D47F] drop-shadow-[0_0_20px_rgba(117,251,178,0.45)]">
                Frigy
              </h1>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                type="button"
                onClick={() => setShowWeightDialog(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.32)] transition-colors hover:bg-[#F2FFF8]"
                whileTap={{ scale: 0.95 }}
                aria-label={t.weightProgress}
                title={t.weightProgress}
              >
                <Scale className="h-4 w-4 text-[#39D47F]" strokeWidth={2.2} />
              </motion.button>

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

          <HealthDashboard
              caloriesEaten={caloriesEaten}
              targetCalories={targetCalories}
              proteinEaten={proteinEaten}
              targetProtein={targetProtein}
              carbsEaten={carbsEaten}
              targetCarbs={targetCarbs}
              fatEaten={fatEaten}
              targetFat={targetFat}
              targetsReady={targetsReady}
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
      </main>

      {user && dashboardReady && (
        <MacroTracker onSetupComplete={reloadSettings} />
      )}

      {/* Bottom Navigation - Show for all logged in users */}
      {user && dashboardReady && (
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

      <Dialog open={showWeightDialog} onOpenChange={setShowWeightDialog}>
        <DialogContent stackLevel="high" className="max-h-[88dvh] max-w-sm gap-0 overflow-y-auto p-0 sm:rounded-2xl">
          <DialogHeader className="px-5 pb-2 pt-5">
            <DialogTitle>{t.weightProgress}</DialogTitle>
          </DialogHeader>
          <div className="px-3 pb-5" onClick={(e) => e.stopPropagation()}>
            <DashboardWeightWidget
              embedded
              hideTitle
              targetWeight={trackerSettings?.targetWeight}
            />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Index;
