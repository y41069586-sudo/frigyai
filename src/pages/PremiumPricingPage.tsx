import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowLeft, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import frigLogo from "@/assets/frig-logo.png";

const PremiumPricingPage = () => {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1' || searchParams.get('preview') === 'true';
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    if (!user && !isPreview) {
      // After successful auth, come back here (avoid bouncing back to onboarding/home)
      localStorage.setItem('redirectAfterAuth', '/premium-pricing');
      navigate('/auth?from=premium-pricing', { replace: true });
    }
  }, [user, navigate, isPreview]);

  const handleCheckout = async (billingInterval: 'monthly' | 'yearly') => {
    if (!session) {
      toast({ title: "Fehler", description: "Bitte anmelden", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { billing_interval: billingInterval },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Fehler",
        description: error.message || "Checkout fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col bg-background safe-area-inset"
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/plan-selection')}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <img src={frigLogo} alt="FrigBuddy" className="h-8 w-8 rounded-lg" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Wähle deinen Plan</h1>
          <p className="text-muted-foreground text-sm">
            7 Tage kostenlos testen, jederzeit kündbar
          </p>
        </motion.div>

        {/* Pricing Cards - Side by Side */}
        <div className="w-full max-w-md grid grid-cols-2 gap-3">
          {/* Monthly Plan */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => setSelectedPlan('monthly')}
            className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              selectedPlan === 'monthly'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Monatlich</h3>
              <div className="mb-3">
                <span className="text-3xl font-bold">€11,99</span>
                <span className="text-muted-foreground text-sm">/Monat</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Monatlich abgerechnet
              </p>
            </div>
            
            {/* Selection indicator */}
            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selectedPlan === 'monthly' 
                ? 'border-primary bg-primary' 
                : 'border-muted-foreground/30'
            }`}>
              {selectedPlan === 'monthly' && (
                <Check className="h-3 w-3 text-primary-foreground" />
              )}
            </div>
          </motion.div>

          {/* Yearly Plan */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setSelectedPlan('yearly')}
            className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              selectedPlan === 'yearly'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            {/* Popular badge */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                BELIEBTESTE
              </span>
            </div>
            
            <div className="text-center mt-1">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Jährlich</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold text-primary">€4,99</span>
                <span className="text-muted-foreground text-sm">/Monat</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                €59,88/Jahr
              </p>
              <div className="inline-block bg-primary/15 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full">
                58% SPAREN
              </div>
            </div>
            
            {/* Selection indicator */}
            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selectedPlan === 'yearly' 
                ? 'border-primary bg-primary' 
                : 'border-muted-foreground/30'
            }`}>
              {selectedPlan === 'yearly' && (
                <Check className="h-3 w-3 text-primary-foreground" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Features List */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md mt-6 p-4 rounded-xl bg-card/50 border border-border"
        >
          <h4 className="font-semibold mb-3 text-sm">Premium beinhaltet:</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Unbegrenzte Scans",
              "KI-Chatbot",
              "Wöchentliche Meal Plans",
              "Einkaufslisten",
              "Makro-Tracking",
              "Wasser-Tracker",
              "Gewichtsverlauf",
              "Export-Funktionen"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md mt-6"
        >
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={() => handleCheckout(selectedPlan)}
            disabled={isLoading}
          >
            {isLoading ? (
              "Wird geladen..."
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                7 Tage kostenlos starten
              </>
            )}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Nach der Testphase {selectedPlan === 'yearly' ? '€59,88/Jahr' : '€11,99/Monat'}. Jederzeit kündbar.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PremiumPricingPage;
