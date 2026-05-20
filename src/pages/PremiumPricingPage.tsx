import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OnboardingPaywallStep, type PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { buildStripePaymentUrl, markStripeCheckoutPending } from "@/lib/stripePaymentLinks";

const PremiumPricingPage = () => {
  const { language } = useLanguage();
  const { session, subscriptionStatus, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1" || searchParams.get("preview") === "true";

  useEffect(() => {
    if (subscriptionStatus?.subscribed && !isPreview) {
      navigate("/", { replace: true });
    }
  }, [subscriptionStatus, navigate, isPreview]);

  const handleCheckout = (plan: PaywallBillingPlan) => {
    if (!session) {
      localStorage.setItem("selectedPlan", plan);
      navigate("/?onboardingStep=save-progress", { replace: true });
      return;
    }
    markStripeCheckoutPending();
    window.top!.location.href = buildStripePaymentUrl(plan, user?.email);
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
        onSkip={() => navigate("/", { replace: true })}
        onCheckout={handleCheckout}
      />
    </motion.div>
  );
};

export default PremiumPricingPage;
