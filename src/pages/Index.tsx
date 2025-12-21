import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Crown, Settings, User, ChevronRight, Droplets, Zap, Plus, Utensils, TrendingUp } from "lucide-react";
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
import { WeekProgressWidget } from "@/components/WeekProgressWidget";
import frigLogo from "@/assets/frig-logo.png";

const Index = () => {
  const { user, session, subscriptionStatus, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const { settings: trackerSettings, isConfigured: trackerSetup, loading: trackerLoading } = useTrackerSettings();
  const { isComplete: dbOnboardingComplete, loading: onboardingLoading, userName: dbUserName, saveProgress } = useOnboardingProgress();
  const [portalLoading, setPortalLoading] = useState(false);
  
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
  // Skip onboarding if user is logged in OR has completed it before
  const hasCompletedOnboarding = localStorage.getItem('onboardingComplete') === 'true';
  const shouldSkipOnboarding = hasCompletedOnboarding || dbOnboardingComplete || !!user;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(shouldSkipOnboarding);
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const navigate = useNavigate();
  
  // Update onboarding visibility when loading completes
  useEffect(() => {
    if (!onboardingLoading && !loading) {
      const skip = hasCompletedOnboarding || dbOnboardingComplete || !!user;
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
  const waterLiters = (waterGlasses * 0.25).toFixed(1);

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

  const greeting = new Date().getHours() < 12 ? "Guten Morgen" : new Date().getHours() < 18 ? "Guten Tag" : "Guten Abend";
  const displayName = userName || (user?.email?.split('@')[0]) || '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 mesh-gradient opacity-50 pointer-events-none" />
      
      {/* Main Content */}
      <main className="relative flex-1 flex flex-col px-4 pb-32 pt-6 safe-top">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          
          {/* Header Section - Modern & Minimal */}
          <motion.div
            className="w-full mb-5"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {currentStreak > 0 && (
                    <motion.div 
                      className="flex items-center gap-1 px-2 py-0.5 bg-primary/15 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <Zap className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-[10px] font-bold text-primary">{currentStreak} Tage</span>
                    </motion.div>
                  )}
                </div>
                <h1 className="text-xl font-bold text-foreground">
                  Hallo{displayName ? `, ${displayName}` : ''}! 👋
                </h1>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Bleib dran, du schaffst das.
                </p>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Premium Button for non-subscribers */}
                {!subscriptionStatus?.subscribed && (
                  <motion.button 
                    onClick={() => user ? navigate('/premium') : navigate('/auth?from=premium')}
                    className="h-9 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center gap-1.5 shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Crown className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-bold text-white">Premium</span>
                  </motion.button>
                )}
                
                {/* Weight Progress Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <motion.button 
                      className="h-9 w-9 rounded-xl bg-card border border-border/30 flex items-center justify-center hover:border-primary/30 transition-colors shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Gewichtsverlauf</DialogTitle>
                    </DialogHeader>
                    <ProgressCharts />
                  </DialogContent>
                </Dialog>
                
                {/* Profile Settings */}
                <motion.button 
                  onClick={() => navigate('/profile')}
                  className="h-9 w-9 rounded-xl bg-card border border-border/30 flex items-center justify-center hover:border-primary/30 transition-colors shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>
            </div>
          </motion.div>
          
          {/* Main Calorie Card - Glass effect */}
          <motion.div
            className="w-full mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div 
              className="p-5 glass-card rounded-3xl shadow-sm cursor-pointer hover:shadow-md transition-all"
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
          </motion.div>
          
          {/* Quick Action Cards - 2 Column Grid */}
          <motion.div
            className="w-full grid grid-cols-2 gap-3 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <DashboardMealPlanCard />
            <DashboardShoppingCard />
          </motion.div>
          
          {/* Week Progress Widget */}
          <div className="w-full mb-4">
            <WeekProgressWidget targetCalories={targetCalories} />
          </div>
          
          {/* Today's Meals Section */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">Heute</h2>
              </div>
              <button 
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => navigate('/meal-plans?tab=tracker')}
              >
                Alle Mahlzeiten
              </button>
            </div>
            
            {todayMeals.length === 0 ? (
              <motion.div 
                className="p-5 bg-card/50 backdrop-blur-sm rounded-2xl border border-dashed border-border/50 text-center cursor-pointer hover:border-primary/40 transition-all group"
                onClick={() => navigate('/meal-plans?tab=tracker')}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                  <Plus className="w-6 h-6 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-muted-foreground text-sm">Keine Mahlzeiten eingetragen</p>
                <p className="text-primary text-sm font-semibold mt-1">+ Jetzt hinzufügen</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {todayMeals.slice(0, 3).map((meal, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-3 p-3.5 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/20"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🍽️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{meal.name}</p>
                      <p className="text-[10px] text-muted-foreground">{meal.time} Uhr</p>
                    </div>
                    <span className="font-bold text-foreground text-sm">{meal.calories} <span className="text-xs font-normal text-muted-foreground">kcal</span></span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
          
          {/* Scan CTA - Modern floating style */}
          <motion.div
            className="w-full mt-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <motion.button 
              onClick={() => navigate("/scan")}
              className="w-full h-14 bg-gradient-to-r from-primary to-emerald-400 text-primary-foreground text-base font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ boxShadow: '0 8px 24px -8px hsla(160, 100%, 50%, 0.4)' }}
            >
              <Camera className="w-5 h-5" />
              {t.scanFridge}
            </motion.button>
            
            {/* Scan limit for free users */}
            {user && !subscriptionStatus?.subscribed && (
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                <span className={scansRemaining > 0 ? "text-primary font-medium" : "text-destructive"}>
                  {scansRemaining}/2 {t.scansRemaining}
                </span>
              </p>
            )}
          </motion.div>
        
          {/* Premium Upsell - Subtle gradient card */}
          {!subscriptionStatus?.subscribed && (
            <motion.div
              className="w-full mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <motion.div 
                onClick={() => user ? navigate('/premium') : navigate('/auth?from=premium')}
                className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-primary/10 rounded-2xl border border-amber-500/20 cursor-pointer group"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">{t.unlockPremium}</p>
                    <p className="text-[10px] text-muted-foreground">{t.premiumFeatures}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {/* Auth CTA for non-logged users */}
          {!user && (
            <motion.div
              className="w-full mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <NavLink to="/auth">
                <Button variant="outline" className="w-full h-12 rounded-2xl border-border/50 hover:border-primary/50">
                  {t.startNow}
                </Button>
              </NavLink>
            </motion.div>
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
