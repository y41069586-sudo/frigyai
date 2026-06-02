import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OnboardingPaywallStep, type PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { startPremiumCheckout } from "@/lib/purchaseCheckout";
import { useToast } from "@/hooks/use-toast";

const PremiumPricingPage = () => {
  const { language } = useLanguage();
  const { session, subscriptionStatus, user, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isPreview = searchParams.get("preview") === "1" || searchParams.get("preview") === "true";

  useEffect(() => {
    if (subscriptionStatus?.subscribed && !isPreview) {
      navigate("/", { replace: true });
    }
  }, [subscriptionStatus, navigate, isPreview]);

  const handleCheckout = async (plan: PaywallBillingPlan) => {
    if (!session) {
      localStorage.setItem("selectedPlan", plan);
      navigate("/?onboardingStep=save-progress", { replace: true });
      return;
    }
    const result = await startPremiumCheckout(plan, {
      userId: user?.id,
      email: user?.email,
      accessToken: session.access_token,
      attributionSource: "premium_pricing",
    });
    if (result.ok && result.channel === "store") {
      await checkSubscription();
      navigate("/", { replace: true });
      return;
    }
    if (!result.ok && !result.cancelled && result.message) {
      toast({
        title: "Fehler",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex min-h-0 flex-col bg-white safe-area-inset"
    >
      <OnboardingPaywallStep
        language={language}
        onBack={() => navigate(-1)}
        onCheckout={handleCheckout}
      />
    </motion.div>
  );
};

export default PremiumPricingPage;
