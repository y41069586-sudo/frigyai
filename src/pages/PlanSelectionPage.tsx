import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Calendar, ShoppingCart, BarChart, Droplets, TrendingDown, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import frigLogo from "@/assets/frig-logo.png";

const PlanSelectionPage = () => {
  const { t } = useLanguage();
  const { user, session, subscriptionStatus, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user already has a plan selected or subscription
  useEffect(() => {
    // If user already completed plan selection, go to home
    const hasSelectedPlan = localStorage.getItem('onboardingComplete') === 'true';
    if (hasSelectedPlan) {
      navigate('/', { replace: true });
      return;
    }
    
    // If already subscribed, mark complete and go home
    if (subscriptionStatus?.subscribed) {
      localStorage.setItem('onboardingComplete', 'true');
      navigate('/', { replace: true });
    }
  }, [subscriptionStatus, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth?from=onboarding', { replace: true });
    }
  }, [user, navigate]);

  const premiumFeatures = [
    { icon: Calendar, text: t.weeklyPersonalizedMealPlans || "Wöchentliche personalisierte Meal Plans" },
    { icon: ShoppingCart, text: t.automaticShoppingLists || "Automatische Einkaufslisten" },
    { icon: BarChart, text: t.macroTrackingCalorieAnalysis || "Makro-Tracking & Kalorienanalyse" },
    { icon: Sparkles, text: t.unlimitedRecipeGeneration || "Unbegrenzte Rezeptgenerierung" },
    { icon: Droplets, text: t.waterTrackerFeature || "Wasser-Tracker" },
    { icon: TrendingDown, text: t.weightProgressFeature || "Gewichtsverlauf & Fortschritt" },
  ];

  const handleFreePlan = () => {
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/', { replace: true });
    toast({
      title: "Willkommen!",
      description: "Dein kostenloser Account ist aktiviert.",
    });
  };

  const handlePremiumPlan = async () => {
    if (!session) {
      toast({ title: t.error, description: "Bitte anmelden", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data?.url) {
        // Mark as complete before redirect (will be confirmed after payment)
        localStorage.setItem('onboardingComplete', 'true');
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: t.error,
        description: error.message || "Checkout fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <img src={frigLogo} alt="FriG AI" className="h-16 w-16 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center bg-background p-4 safe-area-inset overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-4 w-full max-w-sm py-6"
      >
        <img src={frigLogo} alt="FriG AI" className="h-16 w-16 rounded-xl" />
        
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold">{t.choosePlan}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {user.email}
          </p>
        </div>

        {/* Free Plan */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full p-4 rounded-xl border-2 border-border bg-card"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">{t.freePlan}</h3>
            <span className="text-xl font-bold">€0</span>
          </div>
          <p className="text-muted-foreground text-sm mb-3">{t.freePlanDesc}</p>
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-muted-foreground" />
              <span>{t.freeFeature1}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-muted-foreground" />
              <span>{t.freeFeature2}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-muted-foreground" />
              <span>{t.freeFeature3}</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleFreePlan}
          >
            {t.continueWithFree}
          </Button>
        </motion.div>

        {/* Premium Plan */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full p-4 rounded-xl border-2 border-primary bg-primary/5 relative overflow-hidden"
        >
          <div className="absolute top-2 right-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-primary">{t.premiumPlan}</h3>
            <div className="text-right">
              <span className="text-xl font-bold">€4,99</span>
              <span className="text-muted-foreground text-sm">{t.perMonth}</span>
            </div>
          </div>
          <p className="text-xs text-primary font-medium mb-2">{t.freeTrialInfo}</p>
          <p className="text-muted-foreground text-sm mb-3">{t.premiumPlanDesc}</p>
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>{t.premiumFeature1}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>{t.premiumFeature2}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>{t.premiumFeature3}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>{t.premiumFeature4}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>{t.premiumFeature5}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>{t.premiumFeature6}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>{t.premiumFeature7}</span>
            </div>
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handlePremiumPlan}
            disabled={isLoading}
          >
            {isLoading ? t.loading : t.startFreeTrial}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default PlanSelectionPage;
