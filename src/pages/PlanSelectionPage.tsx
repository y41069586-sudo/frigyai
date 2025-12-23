import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import frigLogo from "@/assets/frig-logo.png";

const PlanSelectionPage = () => {
  const { t } = useLanguage();
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1' || searchParams.get('preview') === 'true';
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | null>(null);
  const { saveProgress, isComplete } = useOnboardingProgress();

  // Check if user already has a plan selected or subscription
  useEffect(() => {
    if (isPreview) return;

    if (isComplete) {
      navigate('/', { replace: true });
      return;
    }

    if (subscriptionStatus?.subscribed) {
      saveProgress({ onboarding_complete: true });
      localStorage.setItem('onboardingComplete', 'true');
      navigate('/', { replace: true });
    }
  }, [subscriptionStatus, navigate, isComplete, saveProgress, isPreview]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth?from=onboarding', { replace: true });
    }
  }, [user, navigate]);

  const handleFreePlan = async () => {
    setSelectedPlan('free');
  };

  const handlePremiumPlan = () => {
    setSelectedPlan('premium');
  };

  const handleContinue = async () => {
    if (selectedPlan === 'free') {
      await saveProgress({ onboarding_complete: true });
      localStorage.setItem('onboardingComplete', 'true');
      navigate('/', { replace: true });
      toast({
        title: "Willkommen!",
        description: "Dein kostenloser Account ist aktiviert.",
      });
    } else if (selectedPlan === 'premium') {
      navigate('/premium-pricing');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <img src={frigLogo} alt="Fridgie" className="h-16 w-16 rounded-2xl" />
        </div>
      </div>
    );
  }

  const freeFeatures = [
    "2 Kühlschrank-Scans/Tag",
    "Basis-Rezeptvorschläge",
    "Kalorien-Anzeige"
  ];

  const premiumFeatures = [
    "Unbegrenzte Scans",
    "KI-Chatbot",
    "Wöchentliche Meal Plans",
    "Einkaufslisten",
    "Makro-Tracking",
    "Wasser-Tracker"
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center bg-background p-4 safe-area-inset"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center w-full max-w-md py-6"
      >
        <img src={frigLogo} alt="Fridgie" className="h-14 w-14 rounded-xl mb-4" />
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{t.choosePlan || "Wähle deinen Plan"}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {user.email}
          </p>
        </div>

        {/* Plan Cards - Side by Side */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          {/* Free Plan */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={handleFreePlan}
            className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              selectedPlan === 'free'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-2">
                <Check className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">Free</h3>
              <div className="mt-1">
                <span className="text-2xl font-bold">€0</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              {freeFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-1.5 text-xs">
                  <Check className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
            
            {/* Selection indicator */}
            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selectedPlan === 'free' 
                ? 'border-primary bg-primary' 
                : 'border-muted-foreground/30'
            }`}>
              {selectedPlan === 'free' && (
                <Check className="h-3 w-3 text-primary-foreground" />
              )}
            </div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={handlePremiumPlan}
            className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              selectedPlan === 'premium'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            {/* Recommended badge */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                EMPFOHLEN
              </span>
            </div>
            
            <div className="text-center mb-3 mt-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 mb-2">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary">Premium</h3>
              <div className="mt-1">
                <span className="text-2xl font-bold text-primary">€4,99</span>
                <span className="text-muted-foreground text-xs">/Mo</span>
              </div>
              <p className="text-[10px] text-primary mt-0.5">7 Tage gratis</p>
            </div>
            
            <div className="space-y-1.5">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-1.5 text-xs">
                  <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            {/* Selection indicator */}
            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selectedPlan === 'premium' 
                ? 'border-primary bg-primary' 
                : 'border-muted-foreground/30'
            }`}>
              {selectedPlan === 'premium' && (
                <Check className="h-3 w-3 text-primary-foreground" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full"
        >
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handleContinue}
            disabled={!selectedPlan}
          >
            {selectedPlan === 'free' && (
              <>
                Mit Free starten
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
            {selectedPlan === 'premium' && (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Weiter zu Premium
              </>
            )}
            {!selectedPlan && "Wähle einen Plan"}
          </Button>
          
          {selectedPlan === 'free' && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              Du hast den kostenlosen Plan ausgewählt. Drücke den Button um zu starten!
            </p>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default PlanSelectionPage;
