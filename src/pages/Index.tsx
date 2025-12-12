import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Heart, LogOut, Crown, Calendar, Settings, XCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import HeroAnimation from "@/components/HeroAnimation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { SplashScreen } from "@/components/SplashScreen";
import { AIChatbot } from "@/components/AIChatbot";
import { BottomNavigation } from "@/components/BottomNavigation";
import frigLogo from "@/assets/frig-logo.png";

interface UserProfile {
  age: number;
  weight: number;
  targetWeight: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

const Index = () => {
  const { user, session, subscriptionStatus, signOut } = useAuth();
  const { t } = useLanguage();
  const [trackerSetup, setTrackerSetup] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  // Skip splash/onboarding if coming from subscription success
  const urlParams = new URLSearchParams(window.location.search);
  const isFromSubscription = urlParams.get('subscription') === 'success';
  
  const [showSplash, setShowSplash] = useState(!isFromSubscription);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(isFromSubscription);
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const navigate = useNavigate();
  
  // Redirect to meal-plans if coming from successful subscription
  useEffect(() => {
    if (isFromSubscription) {
      navigate('/meal-plans?subscription=success', { replace: true });
    }
  }, [isFromSubscription, navigate]);

  useEffect(() => {
    const profile = localStorage.getItem("userProfile");
    setTrackerSetup(!!profile);
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (e) {
        console.error('Failed to parse user profile');
      }
    }
    
    // If user is logged in, skip onboarding automatically
    if (user) {
      setOnboardingComplete(true);
    }
  }, [user]);

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
  
  const handleSplashComplete = () => {
    setShowSplash(false);
    // Only show onboarding if user is NOT logged in
    if (!user) {
      setShowOnboarding(true);
      setOnboardingComplete(false);
    } else {
      // User is logged in - skip onboarding
      setOnboardingComplete(true);
      setShowOnboarding(false);
    }
  };
  
  const handleOnboardingComplete = () => {
    // Just close onboarding - user still needs to register/login
    setShowOnboarding(false);
    setOnboardingComplete(true);
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

  // Show splash screen first (no navigation)
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }
  
  // Show onboarding after splash (no navigation)
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20 safe-top">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={frigLogo} alt="FriG AI" className="h-8 w-8 rounded-lg" />
            <h1 className="text-lg sm:text-2xl font-bold neon-text">FriG AI</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                {subscriptionStatus?.subscribed && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="bg-primary/20 rounded-full">
                        <Crown className="h-5 w-5 text-primary" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 bg-card" align="end">
                      <Button variant="ghost" className="w-full justify-start" onClick={handleManageSubscription} disabled={portalLoading}>
                        <Settings className="mr-2 h-4 w-4" /> {t.manageSubscription}
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleManageSubscription} disabled={portalLoading}>
                        <XCircle className="mr-2 h-4 w-4" /> {t.cancelSubscription}
                      </Button>
                    </PopoverContent>
                  </Popover>
                )}
                <NavLink to="/meal-plans">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/20">
                    <Calendar className="h-5 w-5" />
                  </Button>
                </NavLink>
                <NavLink to="/favorites">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/20">
                    <Heart className="h-5 w-5" />
                  </Button>
                </NavLink>
                <NavLink to="/profile">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/20">
                    <User className="h-5 w-5" />
                  </Button>
                </NavLink>
                <Button variant="ghost" size="icon" onClick={signOut} className="hover:bg-primary/20">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <NavLink to="/auth">
                <Button className="glow-button" size="sm">{t.login}</Button>
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8 pb-24">
        <div className="max-w-md mx-auto space-y-6 sm:space-y-8">
          
          {/* Hero Animation - Only shows after onboarding */}
          <AnimatePresence>
            {onboardingComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
              >
                <HeroAnimation />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-3"
          >
            <h2 className="text-2xl sm:text-4xl font-bold">
              {t.homeTitle.split(' ')[0]} <span className="text-neon">{t.homeTitle.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {t.homeSubtitle}
            </p>
          </motion.div>

          {/* Scan Button - Extra Large and prominent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="py-4"
          >
            <Button
              size="lg"
              onClick={() => navigate("/scan")}
              className="w-full glow-button gradient-neon text-black font-bold text-xl sm:text-2xl py-10 sm:py-12 rounded-3xl shadow-2xl hover:scale-[1.02] transition-transform"
            >
              <Camera className="mr-4 h-10 w-10 sm:h-12 sm:w-12" />
              {t.scanFridge}
            </Button>
            
            {/* Scan limit indicator for free users */}
            {user && !subscriptionStatus?.subscribed && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                <span className={scansRemaining > 0 ? "text-primary" : "text-destructive"}>
                  {scansRemaining}/2 {t.scansRemaining}
                </span>
                {" "}• <NavLink to="/premium" className="text-primary underline">{t.unlimitedWithPremium}</NavLink>
              </p>
            )}
          </motion.div>

          {/* Motivational Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground text-center">
                💡 <span className="text-foreground font-medium">{t.tip}:</span> {t.tipText}
              </p>
            </div>
            
            {userProfile && (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t.dailyGoal}</p>
                  <p className="text-2xl font-bold text-primary">{userProfile.dailyCalories} kcal</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userProfile.dailyProtein}g {t.protein} • {userProfile.dailyCarbs}g {t.carbs} • {userProfile.dailyFat}g {t.fat}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Premium Upsell for non-subscribed users */}
          {user && !subscriptionStatus?.subscribed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NavLink to="/premium">
                <div className="p-5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 hover:shadow-neon transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/20">
                      <Crown className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{t.unlockPremium}</h3>
                      <p className="text-xs text-muted-foreground">{t.premiumFeatures}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">4,99€</p>
                      <p className="text-[10px] text-muted-foreground">{t.perMonth}</p>
                    </div>
                  </div>
                </div>
              </NavLink>
            </motion.div>
          )}

          {/* Auth CTA for non-logged in users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NavLink to="/auth">
                <div className="p-4 bg-card rounded-xl border border-border/50 text-center hover:border-primary/50 transition-all">
                  <p className="text-sm text-muted-foreground mb-2">{t.signInForFeatures}</p>
                  <Button className="glow-button">{t.startNow}</Button>
                </div>
              </NavLink>
            </motion.div>
          )}

        </div>
      </div>

      {/* Bottom Navigation - Only for subscribed users after onboarding */}
      {user && subscriptionStatus?.subscribed && onboardingComplete && (
        <BottomNavigation />
      )}

      {/* AI Chatbot - Only for subscribed users */}
      {user && subscriptionStatus?.subscribed && onboardingComplete && (
        <AIChatbot userProfile={userProfile} />
      )}
    </div>
  );
};

export default Index;
