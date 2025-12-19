import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Heart, LogOut, Crown, Calendar, Settings, XCircle, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { AIChatbot } from "@/components/AIChatbot";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useTrackerSettings } from "@/hooks/useTrackerSettings";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { AnimatedFrigyMascot } from "@/components/AnimatedFrigyMascot";
import frigLogo from "@/assets/frig-logo.png";

const Index = () => {
  const { user, session, subscriptionStatus, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const { settings: trackerSettings, isConfigured: trackerSetup, loading: trackerLoading } = useTrackerSettings();
  const { isComplete: dbOnboardingComplete, loading: onboardingLoading, saveProgress } = useOnboardingProgress();
  const [portalLoading, setPortalLoading] = useState(false);
  
  // Check localStorage once at mount
  const urlParams = new URLSearchParams(window.location.search);
  const isFromSubscription = urlParams.get('subscription') === 'success';
  const resetOnboarding = urlParams.get('resetOnboarding') === 'true';
  
  // Handle reset onboarding from URL parameter (for testing on iPad etc.)
  useEffect(() => {
    if (resetOnboarding) {
      localStorage.removeItem('onboardingComplete');
      localStorage.removeItem('onboardingUserData');
      // Clear URL parameter and reload
      window.history.replaceState({}, '', '/');
      window.location.reload();
    }
  }, [resetOnboarding]);
  
  // Initialize states - check if user already completed onboarding
  const hasCompletedOnboarding = localStorage.getItem('onboardingComplete') === 'true';
  // Skip splash, go directly to onboarding with mascot intro
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding);
  const [onboardingComplete, setOnboardingComplete] = useState(hasCompletedOnboarding);
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const navigate = useNavigate();
  
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

  // Tracker setup is now handled by useTrackerSettings hook

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
  
  // Removed splash screen - onboarding now starts directly with mascot intro
  
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
  
  // Show onboarding after splash (no navigation)
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border safe-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={frigLogo} alt="Frigy" className="h-8 w-8 rounded-xl" />
            <span className="text-lg font-bold text-foreground">Frigy</span>
          </div>
          <div className="flex items-center gap-1">
            {user ? (
              <>
                {subscriptionStatus?.subscribed && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Crown className="h-5 w-5 text-primary" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="end">
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleManageSubscription} disabled={portalLoading}>
                        <Settings className="mr-2 h-4 w-4" /> {t.manageSubscription}
                      </Button>
                    </PopoverContent>
                  </Popover>
                )}
                <NavLink to="/profile">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </NavLink>
              </>
            ) : (
              <NavLink to="/auth">
                <Button size="sm">{t.login}</Button>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 pb-24">
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
          
          {/* Mascot */}
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 180 }}
          >
            <AnimatedFrigyMascot size={120} animate={false} />
          </motion.div>
          
          {/* Greeting */}
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h1 className="text-2xl font-bold text-foreground">
              {user ? `Hallo! 👋` : t.homeTitle}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t.homeSubtitle}
            </p>
          </motion.div>
          
          {/* Quick Stats for logged in users */}
          {user && trackerSettings && (
            <motion.div
              className="w-full mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="flex justify-center gap-4">
                {[
                  { label: "Kalorien", value: trackerSettings.dailyCalories, unit: "kcal" },
                  { label: "Protein", value: trackerSettings.dailyProtein, unit: "g" },
                ].map((stat, i) => (
                  <div key={i} className="text-center px-4 py-3 bg-muted/50 rounded-2xl border border-border">
                    <p className="text-xl font-bold text-primary">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.unit} {stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Main CTA - Scan Button */}
          <motion.div
            className="w-full mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Button 
              onClick={() => navigate("/scan")}
              className="w-full h-16 text-lg font-semibold rounded-2xl gap-3"
              size="lg"
            >
              <Camera className="w-6 h-6" />
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
          
          {/* Quick Actions */}
          <motion.div
            className="w-full mt-4 grid grid-cols-2 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <NavLink to="/meal-plans?tab=tracker" className="block">
              <div className="p-4 bg-muted/50 rounded-2xl border border-border text-center hover:border-primary/30 transition-colors">
                <span className="text-2xl">📊</span>
                <p className="text-sm font-medium mt-1">Tracker</p>
              </div>
            </NavLink>
            <NavLink to="/meal-plans?tab=meals" className="block">
              <div className="p-4 bg-muted/50 rounded-2xl border border-border text-center hover:border-primary/30 transition-colors">
                <span className="text-2xl">🍽️</span>
                <p className="text-sm font-medium mt-1">Meal Plan</p>
              </div>
            </NavLink>
          </motion.div>
        </div>
        
        {/* Premium Upsell - Compact */}
        {!subscriptionStatus?.subscribed && (
          <motion.div
            className="max-w-sm mx-auto w-full mt-6"
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
            className="max-w-sm mx-auto w-full mt-4"
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
