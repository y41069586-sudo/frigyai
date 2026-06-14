import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OnboardingPaywallStep, type PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { startPremiumCheckout } from "@/lib/purchaseCheckout";
import { restoreStorePurchases } from "@/lib/storeBilling";
import { waitForPremiumAfterPurchase } from "@/lib/subscriptionRefresh";
import { useStoreOfferingPrices } from "@/hooks/useStoreOfferingPrices";
import { useStorePromoRedeem } from "@/hooks/useStorePromoRedeem";
import { useToast } from "@/hooks/use-toast";
import {
  isRenewPaywallSearch,
  markEverPremium,
  resolveTrialEligibleFromLocal,
} from "@/lib/trialEligibility";
import { scheduleTrialEndingReminder } from "@/lib/notifications";

const PremiumPricingPage = () => {
  const { language, t } = useLanguage();
  const { session, subscriptionStatus, user, checkSubscription, signOut } = useAuth();
  const {
    prices: storePrices,
    loading: storePricesLoading,
    error: storePricesError,
    reload: reloadStorePrices,
  } = useStoreOfferingPrices(user?.id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const isPreview = searchParams.get("preview") === "1" || searchParams.get("preview") === "true";
  const trialEligible =
    !isPreview &&
    !isRenewPaywallSearch(searchParams.toString()) &&
    resolveTrialEligibleFromLocal();

  const { startRedeem: startPromoRedeem, loading: promoRedeemLoading, promoCodeDialog } =
    useStorePromoRedeem({
      accessToken: session?.access_token,
      userId: user?.id,
      checkSubscription,
      onSuccess: () => {
        markEverPremium();
        localStorage.setItem("onboardingComplete", "true");
        navigate("/", { replace: true });
      },
    });

  useEffect(() => {
    if (subscriptionStatus?.subscribed && !isPreview) {
      navigate("/", { replace: true });
    }
  }, [subscriptionStatus, navigate, isPreview]);

  const handleCheckout = async (plan: PaywallBillingPlan) => {
    if (checkoutLoading) return;
    if (!session) {
      localStorage.setItem("selectedPlan", plan);
      navigate("/?onboardingStep=save-progress", { replace: true });
      return;
    }

    setCheckoutLoading(true);
    try {
      const result = await startPremiumCheckout(plan, {
        userId: user?.id,
        email: user?.email,
        accessToken: session.access_token,
        attributionSource: "premium_pricing",
      });
      if (result.ok && result.channel === "store") {
        const active = await waitForPremiumAfterPurchase(
          checkSubscription,
          session.access_token,
        );
        if (active) {
          markEverPremium();
          if (plan === "monthly" && trialEligible) {
            void scheduleTrialEndingReminder();
          }
          localStorage.setItem("onboardingComplete", "true");
          navigate("/", { replace: true });
        }
        return;
      }
      if (!result.ok && !result.cancelled && result.message) {
        toast({
          title: t.error,
          description: result.message,
          variant: "destructive",
        });
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRestore = async () => {
    if (restoreLoading) return;
    if (!session?.access_token) {
      toast({
        title: t.error,
        description: t.onboardingPleaseLoginToProceed,
        variant: "destructive",
      });
      return;
    }
    setRestoreLoading(true);
    try {
      const result = await restoreStorePurchases(session.access_token);
      const active = await waitForPremiumAfterPurchase(
        checkSubscription,
        session.access_token,
        4,
      );
      if (result.ok || active) {
        markEverPremium();
        localStorage.setItem("onboardingComplete", "true");
        navigate("/", { replace: true });
        return;
      }
      if (result.message) {
        toast({
          title: t.error,
          description: result.message,
          variant: "destructive",
        });
      }
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex min-h-0 flex-col bg-white safe-area-inset"
    >
      {promoCodeDialog}
      <OnboardingPaywallStep
        language={language}
        onBack={() => navigate(-1)}
        onCheckout={handleCheckout}
        onRestorePurchases={handleRestore}
        onRedeemPromoCode={startPromoRedeem}
        onSignOut={async () => {
          await signOut();
          navigate("/auth", { replace: true });
        }}
        isCheckoutLoading={checkoutLoading}
        isRestoreLoading={restoreLoading}
        isPromoRedeemLoading={promoRedeemLoading}
        storePrices={storePrices}
        storePricesLoading={storePricesLoading}
        storePricesError={storePricesError}
        onReloadStorePrices={reloadStorePrices}
        trialEligible={trialEligible}
        showRestorePurchases
      />
    </motion.div>
  );
};

export default PremiumPricingPage;
