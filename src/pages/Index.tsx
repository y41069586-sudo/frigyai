import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Crown, Settings, User, ChevronRight, Droplets, Zap, Plus, Utensils, TrendingUp, Scan, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProgressCharts from "@/components/ProgressCharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useTrackerSettings } from "@/hooks/useTrackerSettings";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { DashboardMealPlanCard } from "@/components/DashboardMealPlanCard";
import { DashboardShoppingCard } from "@/components/DashboardShoppingCard";
import { DashboardMacroRing } from "@/components/DashboardMacroRing";
import { DashboardWaterWidget } from "@/components/DashboardWaterWidget";
import { DashboardWeightWidget } from "@/components/DashboardWeightWidget";
import { DashboardTodayMealsCard } from "@/components/DashboardTodayMealsCard";
import { useReminders } from "@/hooks/useReminders";

import frigLogo from "@/assets/frig-logo.png";
import { AIChatbot } from "@/components/AIChatbot";

const Index = () => {
  const { user, session, subscriptionStatus, signOut, loading } = useAuth();
  const { t, language } = useLanguage();
  const { settings: trackerSettings, isConfigured: trackerSetup, loading: trackerLoading } = useTrackerSettings();
  const { isComplete: dbOnboardingComplete, loading: onboardingLoading, userName: dbUserName, saveProgress } = useOnboardingProgress();
  const [portalLoading, setPortalLoading] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Initialize reminders system
  useReminders();
  
  // Check localStorage once at mount
  const urlParams = new URLSearchParams(window.location.search);
  const isFromSubscription = urlParams.get('subscription') === 'success';
  const resetOnboarding = urlParams.get('resetOnboarding') === 'true';
  
  // Get user name from localStorage or DB
  const [userName, setUserName] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [todayMeals, setTodayMeals] = useState<{ name: string; time: string; calories: number }[]>([]);
  const [caloriesEaten, setCaloriesEaten] = useState(0);
  const [proteinEaten, setProteinEaten] = useState(0);
  const [carbsEaten, setCarbsEaten] = useState(0);
  const [fatEaten, setFatEaten] = useState(0);

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
    
    // Listen for storage changes (when user adds food in tracker)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'todayFood') {
        loadTodayMeals();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for same-tab updates
    const interval = setInterval(loadTodayMeals, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
  
  // Handle reset onboarding from URL parameter (for testing on iPad etc.)
  useEffect(() => {
    if (resetOnboarding) {
      localStorage.removeItem('onboardingComplete');
      localStorage.removeItem('onboardingUserData');
      localStorage.removeItem('userName');
      // Clear URL parameter and reload
      window.history.replaceState({}, '', '/');
      window.location.reload();
    }
  }, [resetOnboarding]);
  
  // Initialize states - check if user already completed onboarding
  // TESTMODUS: Onboarding wird bei jeder Session angezeigt (Login bleibt möglich)
  const ONBOARDING_TEST_MODE = false; // Testmodus deaktiviert
  
  const hasCompletedOnboarding = localStorage.getItem('onboardingComplete') === 'true';
  const shouldSkipOnboarding = ONBOARDING_TEST_MODE ? false : (hasCompletedOnboarding || dbOnboardingComplete || !!user);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(shouldSkipOnboarding);
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const navigate = useNavigate();
  
  // Update onboarding visibility when loading completes
  useEffect(() => {
    if (!onboardingLoading && !loading) {
      const skip = ONBOARDING_TEST_MODE ? false : (hasCompletedOnboarding || dbOnboardingComplete || !!user);
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
  
  // Redirect to meal-plans if coming from successful subscription
  useEffect(() => {
    if (isFromSubscription) {
      navigate('/meal-plans?subscription=success', { replace: true });
    }
  }, [isFromSubscription, navigate]);


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

  const scansRemaining = Math.max(0, 1 - dailyScansUsed);
  const targetCalories = trackerSettings?.dailyCalories || 2000;
  const targetProtein = trackerSettings?.dailyProtein || 150;
  const targetCarbs = trackerSettings?.dailyCarbs || 200;
  const targetFat = trackerSettings?.dailyFat || 65;
  
  
  const remainingCalories = Math.max(0, targetCalories - caloriesEaten);
  const calorieProgress = Math.min(100, (caloriesEaten / targetCalories) * 100);
  const waterLiters = (waterGlasses * 0.2).toFixed(1);

  // Wait for auth before showing anything
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse">
          <img src={frigLogo} alt="FrigBuddy" className="h-16 w-16 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Show onboarding with mascot intro (no separate splash screen)
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // If not logged in and onboarding is done, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <img src={frigLogo} alt="frigy" className="h-16 w-16 rounded-2xl mb-6" />
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.goodMorning : hour < 18 ? t.goodAfternoon : t.goodEvening;
  const displayName = userName || (user?.email?.split('@')[0]) || '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Subtle background */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent pointer-events-none" />

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col px-3 sm:px-5 pb-32 pt-6 sm:pt-8 safe-top">
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
          
          {/* Main Calorie Ring - Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div 
              className="p-6 bg-card rounded-3xl border border-border/30 cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => navigate('/meal-plans?tab=tracker')}
            >
              <DashboardMacroRing
                caloriesEaten={caloriesEaten}
                targetCalories={targetCalories}
                proteinEaten={proteinEaten}
                targetProtein={targetProtein}
                carbsEaten={carbsEaten}
                targetCarbs={targetCarbs}
                fatEaten={fatEaten}
                targetFat={targetFat}
              />
            </div>
            
            {/* Scan Fridge Button - Mobile Optimized */}
            <motion.button
              onClick={() => {
                navigate('/scan');
              }}
              className="w-full mt-4 py-3 sm:py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 text-white font-semibold sm:text-base active:scale-[0.98] transition-all relative overflow-hidden"
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Premium indicator - only for free users to show this is a premium feature */}
              {!subscriptionStatus?.subscribed && (
                <div className="absolute top-1 right-1 z-10">
                  <Crown className="w-3 h-3 text-amber-300 fill-amber-300 -rotate-12 drop-shadow-sm" />
                </div>
              )}

              {/* Mobile: Icon with Scan Badge Overlay */}
              <motion.div
                className="sm:hidden relative"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Scan className="w-6 h-6" />
              </motion.div>

              {/* Desktop: Icon + Text */}
              <motion.div
                className="hidden sm:block"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Scan className="w-5 h-5" />
              </motion.div>
              <span className="hidden sm:inline text-base">{t.scanFridge}</span>
              <span className="sm:hidden text-xs">Kühlschrank scannen</span>
            </motion.button>
          </motion.section>
          
          {/* Today's Meals Widget - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DashboardTodayMealsCard />
          </motion.section>

          {/* Water Widget - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <DashboardWaterWidget
              waterGlasses={waterGlasses}
              onWaterUpdate={setWaterGlasses}
            />
          </motion.section>


          {/* Wochenplan Widget - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <DashboardMealPlanCard />
          </motion.section>

          {/* Shopping List Widget - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <DashboardShoppingCard />
          </motion.section>

          {/* Weight Tracker Widget - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <DashboardWeightWidget targetWeight={trackerSettings?.targetWeight} />
          </motion.section>
          
          
          {/* Login CTA for guests */}
          {!user && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <NavLink to="/auth">
                <Button variant="outline" className="w-full h-12 rounded-2xl">
                  {t.startNow}
                </Button>
              </NavLink>
            </motion.section>
          )}
        </div>
      </main>

      {/* Bottom Navigation - Show for all logged in users */}
      {user && onboardingComplete && (
        <BottomNavigation
          trackerSetup={trackerSetup}
          trackerLoading={trackerLoading}
          onTabChange={(tab) => navigate(`/meal-plans?tab=${tab}`)}
        />
      )}

      {/* AI Chatbot - Premium Only */}
      <AIChatbot
        isOpen={isChatbotOpen}
        setIsOpen={setIsChatbotOpen}
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
