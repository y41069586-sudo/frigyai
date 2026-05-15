import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Settings, Bot } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useTrackerSettings } from "@/hooks/useTrackerSettings";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { useReminders } from "@/hooks/useReminders";
import { HealthDashboard } from "@/components/food-ai";
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
import frigyLogo from "@/assets/frigy-mascot.png";
import { AIChatbot } from "@/components/AIChatbot";
import {
  WATER_GLASSES_CHANGED,
  WATER_GOAL_CUPS_CHANGED,
  dispatchWaterGlassesChanged,
  goalCupsToMl,
  readWaterGoalCupsFromStorage,
} from "@/lib/waterSync";
import { FRIGY_STORAGE_UPDATED, POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY } from "@/lib/frigyStorageSync";

const Index = () => {
  const { user, session, subscriptionStatus, signOut, loading, checkSubscription } = useAuth();
  const { t, language } = useLanguage();
  const { settings: trackerSettings, isConfigured: trackerSetup, loading: trackerLoading } = useTrackerSettings();
  const { isComplete: dbOnboardingComplete, loading: onboardingLoading, userName: dbUserName, saveProgress } = useOnboardingProgress();
  const [portalLoading, setPortalLoading] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [showPostPayCoach, setShowPostPayCoach] = useState(false);
  const [chatBootstrapMessage, setChatBootstrapMessage] = useState<string | null>(null);
  const landedFromSubscriptionSuccessRef = useRef(false);

  // Initialize reminders system
  useReminders();

  const [searchParams, setSearchParams] = useSearchParams();
  const isFromSubscription = searchParams.get("subscription") === "success";
  const resetOnboarding = searchParams.get("resetOnboarding") === "true";

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
  const [todayMeals, setTodayMeals] = useState<{ name: string; time: string; calories: number }[]>([]);
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
    setWaterGlasses(newGlasses);
    dispatchWaterGlassesChanged(newGlasses);
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
    const loadTodayMeals = () => {
      const saved = localStorage.getItem('todayFood');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.date === new Date().toDateString() && data.entries) {
            const meals = data.entries.map((entry: any) => ({
              name: entry.name || 'Mahlzeit',
              time: entry.time || new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
              calories: entry.calories || 0,
            }));
            setTodayMeals(meals);
          }
        } catch (e) {
          console.error('Failed to parse todayFood');
        }
      }
    };
    
    loadTodayMeals();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "todayFood") loadTodayMeals();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(FRIGY_STORAGE_UPDATED, loadTodayMeals);

    const interval = setInterval(loadTodayMeals, 15000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(FRIGY_STORAGE_UPDATED, loadTodayMeals);
      clearInterval(interval);
    };
  }, []);
  
  // Fetch today's macros from daily_macros table with realtime subscription
  useEffect(() => {
    const fetchDailyMacros = async () => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_macros')
        .select('calories, protein, carbs, fat')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (data) {
        console.log('[DASHBOARD] Updated macros:', data);
        setCaloriesEaten(data.calories);
        setProteinEaten(data.protein);
        setCarbsEaten(data.carbs);
        setFatEaten(data.fat);
      }
    };

    fetchDailyMacros();

    // Listen for food entry changes - update immediately when meal is added from meal plan
    const handleFoodEntryAdded = () => {
      console.log('[DASHBOARD] Food entry added event detected, refreshing macros...');
      fetchDailyMacros();
    };

    window.addEventListener('foodEntryAdded', handleFoodEntryAdded);

    // Also periodic refresh as fallback (every 10 seconds instead of 30)
    if (user) {
      const intervalId = setInterval(async () => {
        console.log('[DASHBOARD] Periodic macro refresh...');
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
      }, 10000);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('foodEntryAdded', handleFoodEntryAdded);
      };
    }

    return () => {
      window.removeEventListener('foodEntryAdded', handleFoodEntryAdded);
    };
  }, [user]);
  
  // Handle reset onboarding from URL parameter (for testing or "Erneut starten" in profile)
  useEffect(() => {
    if (!resetOnboarding || loading) return;
    const run = async () => {
      localStorage.removeItem('onboardingComplete');
      localStorage.removeItem('onboardingUserData');
      localStorage.removeItem('userName');
      localStorage.removeItem('onboardingScanUsed');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('reminderConfig');
      localStorage.removeItem('weeklyMealPlan');
      localStorage.removeItem('mealPlanGenerationCount');
      localStorage.removeItem('scanFeedback');
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
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const navigate = useNavigate();

  // Ohne bestätigte E-Mail kein Dashboard – zur Bestätigungs-/Warteseite
  useEffect(() => {
    if (!user || loading) return;
    if (!user.email_confirmed_at) {
      const q = new URLSearchParams();
      if (user.email) q.set("email", user.email);
      q.set("next", "/premium-pricing");
      q.set("from", "signup");
      navigate(`/email-confirmation?${q.toString()}`, { replace: true });
    }
  }, [user, loading, navigate]);

  // Update onboarding visibility when loading completes
  useEffect(() => {
    if (!onboardingLoading && !loading) {
      const skip = ONBOARDING_TEST_MODE ? false : (hasCompletedOnboarding || dbOnboardingComplete);
      setShowOnboarding(!skip);
      setOnboardingComplete(skip);
    }
  }, [onboardingLoading, loading, user, dbOnboardingComplete, hasCompletedOnboarding]);
  
  // Skip onboarding only if coming from subscription success
  useEffect(() => {
    if (isFromSubscription) {
      setShowOnboarding(false);
      setOnboardingComplete(true);
    }
  }, [isFromSubscription]);
  
  // Nach Zahlung: Abo-Status pollen (wie Mahlzeiten-Seite), ohne vom Dashboard wegzuleiten
  useEffect(() => {
    if (searchParams.get("subscription") !== "success" || !user) return;

    let attempts = 0;
    const maxAttempts = 15;
    const pollSubscription = setInterval(async () => {
      attempts++;
      await checkSubscription();

      if (subscriptionStatus?.subscribed || attempts >= maxAttempts) {
        clearInterval(pollSubscription);
        const next = new URLSearchParams(searchParams);
        next.delete("subscription");
        setSearchParams(next, { replace: true });
      }
    }, 2000);

    return () => clearInterval(pollSubscription);
  }, [searchParams, setSearchParams, checkSubscription, subscriptionStatus?.subscribed, user]);

  // Erstes Dashboard nach Zahlung: Hinweis nach 6 Sekunden (einmalig)
  useEffect(() => {
    if (!user || !onboardingComplete) return;
    if (localStorage.getItem(POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY) === "1") return;
    if (!landedFromSubscriptionSuccessRef.current) return;

    const t = window.setTimeout(() => setShowPostPayCoach(true), 6000);
    return () => window.clearTimeout(t);
  }, [user, onboardingComplete]);

  // Fetch daily scan usage for free users - updated to weekly
  useEffect(() => {
    const fetchScanUsage = async () => {
      if (!user || subscriptionStatus?.subscribed) return;

      try {
        const weekStart = new Date();
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(weekStart.setDate(diff)).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('scan_usage')
          .select('scan_count')
          .eq('user_id', user.id)
          .eq('week_start', monday)
          .maybeSingle();

        if (!error && data) {
          setDailyScansUsed(data.scan_count);
        }
      } catch (e) {
        console.error('Failed to fetch scan usage');
      }
    };

    fetchScanUsage();
  }, [user, subscriptionStatus]);
  
  const handleOnboardingComplete = () => {
    // Im Testmodus: Onboarding neu starten statt zum Dashboard
    if (ONBOARDING_TEST_MODE) {
      // Onboarding bleibt sichtbar, nur zurück zum Anfang
      window.location.reload();
      return;
    }

    // After onboarding slides, mark complete and go to paywall (if logged in) or auth
    localStorage.setItem('onboardingComplete', 'true');
    setShowOnboarding(false);
    setOnboardingComplete(true);

    if (user) {
      navigate('/premium-pricing', { replace: true });
    } else {
      navigate('/auth?from=onboarding', { replace: true });
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

  const scansRemaining = Math.max(0, 1 - dailyScansUsed);
  const targetCalories = trackerSettings?.dailyCalories || 2000;
  const targetProtein = trackerSettings?.dailyProtein || 150;
  const targetCarbs = trackerSettings?.dailyCarbs || 200;
  const targetFat = trackerSettings?.dailyFat || 65;
  
  
  // Wait for auth before showing anything
  if (loading) {
    return null;
  }

  // Show onboarding with mascot intro (no separate splash screen)
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // If not logged in and onboarding is done, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <img src={frigyLogo} alt="Frigy" className="h-20 w-20 object-contain mb-6" />
        <h1 className="text-xl font-bold text-foreground mb-2">{t.notLoggedIn}</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Melde dich an, um dein Dashboard zu sehen
        </p>
        <Button onClick={() => navigate("/auth")} className="w-full max-w-xs">
          {t.login}
        </Button>
      </div>
    );
  }

  const displayName = userName || (user?.email?.split('@')[0]) || '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Subtle background */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent pointer-events-none" />

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col px-3 sm:px-5 pb-bottom-nav pt-6 sm:pt-8 safe-top">
        <div className="flex-1 flex flex-col max-w-sm sm:max-w-md lg:max-w-2xl mx-auto w-full space-y-6 sm:space-y-8">
          
          {/* Header - Clean & Modern */}
          <motion.header
            className="flex items-center justify-between gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">
                {new Date().toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
              <h1 className="text-xl font-bold text-foreground mt-0.5 truncate">
                {displayName ? `Hey, ${displayName}` : t.welcome} 👋
              </h1>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentStreak > 0 && (
                <motion.div
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-bold text-amber-600">{currentStreak}</span>
                </motion.div>
              )}

              {/* AI Chatbot Button - Only for Premium users */}
              {subscriptionStatus?.subscribed && (
                <motion.button
                  onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                  className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-card/80 transition-colors"
                  whileTap={{ scale: 0.95 }}
                  title="AI Chatbot"
                >
                  <Bot className="w-4 h-4 text-primary" />
                </motion.button>
              )}

              <motion.button
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center"
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
            targetCarbs={trackerSettings?.dailyCarbs ?? 200}
            fatEaten={fatEaten}
            targetFat={trackerSettings?.dailyFat ?? 65}
            waterGlasses={waterGlasses}
            waterGoalMl={waterGoalMl}
            onWaterGlassesChange={updateWaterGlasses}
            scansRemaining={!subscriptionStatus?.subscribed ? scansRemaining : null}
            aiChatEnabled={!!subscriptionStatus?.subscribed}
            onAiChatPromptSubmit={(text) => {
              setChatBootstrapMessage(text);
              setIsChatbotOpen(true);
            }}
          />
        </div>
      </main>

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
            <DialogTitle>Dein erster Wochenplan</DialogTitle>
            <DialogDescription className="text-left space-y-2">
              <span className="block">
                Scanne deinen Kühlschrank – Frigy erkennt deine Zutaten und erstellt daraus einen{" "}
                <strong className="text-foreground">7-Tage-Wochenplan</strong>.
              </span>
              <span className="block text-muted-foreground">
                Die <strong className="text-foreground">Einkaufsliste</strong> entsteht automatisch aus dem Wochenplan als
                Lücke: nur Zutaten, die dir noch fehlen.
              </span>
              <span className="block text-muted-foreground text-xs">
                Frigy priorisiert deine vorhandenen Zutaten, ergänzt aber automatisch alles, was für deine Makroziele fehlt.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={dismissPostPayCoach}>
              Später
            </Button>
            <Button type="button" onClick={handlePostPayScan}>
              Jetzt scannen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Chatbot - Premium Only */}
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

    </div>
  );
};

export default Index;
