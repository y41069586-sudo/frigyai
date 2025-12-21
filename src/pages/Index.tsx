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
      {/* Main Content */}
      <main className="flex-1 flex flex-col px-5 pb-32 pt-32 safe-top">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          
          {/* Header Section - Clean & Minimal */}
          <motion.div
            className="w-full mb-6 mt-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Hallo, {displayName || 'Willkommen'}! 👋
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Bleib dran, du bist auf Kurs.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Streak Badge */}
                {currentStreak > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded-full">
                    <Zap className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-xs font-medium text-primary">{currentStreak}</span>
                  </div>
                )}
                
                {/* Weight Progress Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button 
                      className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    >
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Gewichtsverlauf</DialogTitle>
                    </DialogHeader>
                    <ProgressCharts />
                  </DialogContent>
                </Dialog>
                
                {/* Profile Settings */}
                <button 
                  onClick={() => navigate('/profile')}
                  className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <Settings className="w-5 h-5 text-primary" />
                </button>
              </div>
            </div>
          </motion.div>
          
          {/* Main Calorie Card */}
          <motion.div
            className="w-full mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div 
              className="p-5 bg-card rounded-3xl border border-border/30 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
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
          
          {/* Meal Plan & Shopping List Cards */}
          <motion.div
            className="w-full grid grid-cols-2 gap-3 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {/* Meal Plan Card */}
            <DashboardMealPlanCard />
            
            {/* Shopping List Card */}
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
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">Mahlzeiten heute</h2>
              <button 
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => navigate('/meal-plans?tab=tracker')}
              >
                Alles sehen
              </button>
            </div>
            
            {todayMeals.length === 0 ? (
              <div 
                className="p-4 bg-card rounded-2xl border border-border/30 text-center cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate('/meal-plans?tab=tracker')}
              >
                <Utensils className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">Noch keine Mahlzeiten eingetragen</p>
                <p className="text-primary text-sm font-medium mt-1">+ Mahlzeit hinzufügen</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayMeals.slice(0, 3).map((meal, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/30">
                    <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">{meal.time} Uhr</p>
                    </div>
                    <span className="font-semibold text-foreground">{meal.calories} kcal</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
          
          {/* Scan CTA */}
          <motion.div
            className="w-full mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Button 
              onClick={() => navigate("/scan")}
              className="w-full h-14 text-lg font-semibold rounded-2xl gap-3 shadow-lg"
              size="lg"
            >
              <Camera className="w-5 h-5" />
              {t.scanFridge}
            </Button>
            
            {/* Scan limit for free users */}
            {user && !subscriptionStatus?.subscribed && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                <span className={scansRemaining > 0 ? "text-primary" : "text-destructive"}>
                  {scansRemaining}/2 {t.scansRemaining}
                </span>
              </p>
            )}
          </motion.div>
        
          {/* Premium Upsell - Compact */}
          {!subscriptionStatus?.subscribed && (
            <motion.div
              className="w-full mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div 
                onClick={() => user ? navigate('/premium') : navigate('/auth?from=premium')}
                className="p-4 bg-primary/10 rounded-2xl border border-primary/30 cursor-pointer hover:bg-primary/15 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{t.unlockPremium}</p>
                    <p className="text-xs text-muted-foreground">{t.premiumFeatures}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Auth CTA for non-logged users */}
          {!user && (
            <motion.div
              className="w-full mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <NavLink to="/auth">
                <Button variant="outline" className="w-full h-12 rounded-2xl">
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
