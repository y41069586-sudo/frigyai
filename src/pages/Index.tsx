import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Crown, Settings, User, ChevronRight, Droplets, Zap, Plus, Utensils, TrendingUp, Scan } from "lucide-react";
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
import { AIChatbot } from "@/components/AIChatbot";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useTrackerSettings } from "@/hooks/useTrackerSettings";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { DashboardMealPlanCard } from "@/components/DashboardMealPlanCard";
import { DashboardShoppingCard } from "@/components/DashboardShoppingCard";
import { DashboardMacroRing } from "@/components/DashboardMacroRing";
import { DashboardWaterWidget } from "@/components/DashboardWaterWidget";
import { useReminders } from "@/hooks/useReminders";

import frigLogo from "@/assets/frig-logo.png";

const Index = () => {
  const { user, session, subscriptionStatus, signOut, loading } = useAuth();
  const { t, language } = useLanguage();
  const { settings: trackerSettings, isConfigured: trackerSetup, loading: trackerLoading } = useTrackerSettings();
  const { isComplete: dbOnboardingComplete, loading: onboardingLoading, userName: dbUserName, saveProgress } = useOnboardingProgress();
  const [portalLoading, setPortalLoading] = useState(false);
  
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
        setCaloriesEaten(data.calories);
        setProteinEaten(data.protein);
        setCarbsEaten(data.carbs);
        setFatEaten(data.fat);
      }
    };
    
    fetchDailyMacros();
    
    // Subscribe to realtime updates
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const channel = supabase
        .channel('dashboard-macros')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_macros',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[DASHBOARD] Macro update received:', payload);
            if (payload.new && (payload.new as any).date === today) {
              const newData = payload.new as any;
              setCaloriesEaten(newData.calories || 0);
              setProteinEaten(newData.protein || 0);
              setCarbsEaten(newData.carbs || 0);
              setFatEaten(newData.fat || 0);
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
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

  // Fetch daily scan usage for free users
  useEffect(() => {
    const fetchScanUsage = async () => {
      if (!user || subscriptionStatus?.subscribed) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('scan_usage')
          .select('scan_count')
          .eq('user_id', user.id)
          .eq('scan_date', today)
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
    // After onboarding slides, mark complete and go to auth page
    setShowOnboarding(false);
    setOnboardingComplete(true);
    navigate('/auth?from=onboarding');
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

  const scansRemaining = 2 - dailyScansUsed;
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.goodMorning : hour < 18 ? t.goodAfternoon : t.goodEvening;
  const displayName = userName || (user?.email?.split('@')[0]) || '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Subtle background */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent pointer-events-none" />
      
      {/* Main Content */}
      <main className="relative flex-1 flex flex-col px-5 pb-32 pt-8 safe-top">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full space-y-6">
          
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
            
            {/* Scan Fridge Button */}
            <motion.button
              onClick={() => navigate('/scan')}
              className="w-full mt-4 py-4 px-4 
                         bg-gradient-to-r from-emerald-500 to-teal-500
                         hover:from-emerald-600 hover:to-teal-600
                         rounded-2xl shadow-lg shadow-emerald-500/25
                         flex items-center justify-center gap-3
                         text-white font-semibold text-base
                         active:scale-[0.98] transition-all"
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Scan className="w-5 h-5" />
              </motion.div>
              {t.scanFridge}
            </motion.button>
          </motion.section>
          
          {/* Water Widget - Full Width */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DashboardWaterWidget 
              waterGlasses={waterGlasses} 
              onWaterUpdate={setWaterGlasses} 
            />
          </motion.section>
          
          {/* Progress/Verlauf Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Dialog>
              <DialogTrigger asChild>
                <div className="p-4 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent rounded-2xl border border-purple-500/20 cursor-pointer active:scale-[0.98] transition-transform">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.weightHistory}</p>
                        <p className="text-xs text-muted-foreground">{t.tapForDetails}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-500/50" />
                  </div>
                  
                  {/* Mini Chart Preview */}
                  <div className="h-12 flex items-end gap-1">
                    {[65, 45, 70, 55, 80, 60, 75].map((height, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-500/40 to-purple-400/20 rounded-t-sm"
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: "easeOut" }}
                      />
                    ))}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">{t.progressTracker}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <ProgressCharts />
                </div>
              </DialogContent>
            </Dialog>
          </motion.section>
          
          {/* Action Cards Grid */}
          <motion.section
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DashboardMealPlanCard />
            <DashboardShoppingCard />
          </motion.section>
          
          {/* Today's Meals */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">{t.eaten} {t.today.toLowerCase()}</h2>
              <button 
                className="text-xs text-primary font-medium"
                onClick={() => navigate('/meal-plans?tab=tracker')}
              >
                {t.more} →
              </button>
            </div>
            
            {todayMeals.length === 0 ? (
              <motion.div 
                className="p-6 bg-card/50 rounded-2xl border border-dashed border-border/50 text-center cursor-pointer"
                onClick={() => navigate('/meal-plans?tab=tracker')}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">{t.nothingEatenToday}</p>
                <p className="text-sm font-medium text-primary mt-1">+ {t.addFood}</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {todayMeals.slice(0, 3).map((meal, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/20"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg">
                      🍽️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{meal.name}</p>
                      <p className="text-[10px] text-muted-foreground">{meal.time}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground">{meal.calories}</span>
                    <span className="text-[10px] text-muted-foreground">kcal</span>
                  </motion.div>
                ))}
                {todayMeals.length > 3 && (
                  <button 
                    className="w-full py-2 text-xs text-primary font-medium"
                    onClick={() => navigate('/meal-plans?tab=tracker')}
                  >
                    + {todayMeals.length - 3} {t.more}
                  </button>
                )}
              </div>
            )}
          </motion.section>
          
          
          {/* Premium Upsell */}
          {!subscriptionStatus?.subscribed && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <motion.div 
                onClick={() => user ? navigate('/premium') : navigate('/auth?from=premium')}
                className="p-4 bg-gradient-to-r from-amber-500/5 to-primary/5 rounded-2xl border border-amber-500/10 cursor-pointer"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{t.unlockPremium}</p>
                    <p className="text-[10px] text-muted-foreground">Unbegrenzte Scans & mehr</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.div>
            </motion.section>
          )}
          
          {/* Login CTA for guests */}
          {!user && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
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

      {/* AI Chatbot - Only for subscribed users */}
      {user && subscriptionStatus?.subscribed && onboardingComplete && (
        <AIChatbot userProfile={trackerSettings} />
      )}
    </div>
  );
};

export default Index;
