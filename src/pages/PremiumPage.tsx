import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Sparkles, Check, Calendar, ShoppingCart, BarChart, XCircle, Settings, Droplets, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NavLink } from '@/components/NavLink';
import { WaterTracker } from '@/components/WaterTracker';
import { ProgressTracker } from '@/components/ProgressTracker';
import { PremiumSuccessDialog } from '@/components/PremiumSuccessDialog';
import frigLogo from '@/assets/frigy-mascot.png';
import { canManageStripeSubscription, canManageStoreSubscription } from '@/lib/subscription';
import { getEdgeFunctionErrorMessage } from '@/lib/edgeFunctionError';
import { getPublicErrorMessage } from '@/lib/publicErrorMessage';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { startPremiumCheckout } from '@/lib/purchaseCheckout';
import type { PaywallBillingPlan } from '@/components/onboarding/components/OnboardingPaywallStep';
import { openStoreSubscriptionManagement } from '@/lib/storeBilling';
import { usesStoreBilling } from '@/lib/billingPlatform';

const PremiumPage = () => {
  const { user, session, subscriptionStatus, checkSubscription } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'water' | 'weight'>('overview');
  const [autoCheckoutTriggered, setAutoCheckoutTriggered] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const canManageStripe = canManageStripeSubscription(subscriptionStatus);
  const canManageStore = canManageStoreSubscription(subscriptionStatus);
  const canManageSubscription = canManageStripe || canManageStore;
  
  // Check if we're returning from Stripe payment
  const isReturningFromStripe = searchParams.get('subscription') === 'success';
  
  const [isAutoCheckout, setIsAutoCheckout] = useState(() => {
    if (isReturningFromStripe) {
      localStorage.removeItem('startCheckoutAfterAuth');
      return false;
    }
    return localStorage.getItem('startCheckoutAfterAuth') === 'true';
  });

  const startCheckout = async () => {
    if (!session) {
      toast({
        title: t.notLoggedIn,
        description: t.pleaseLoginAgain,
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const stored = localStorage.getItem('selectedPlan');
      const plan: PaywallBillingPlan =
        stored === 'monthly' || stored === 'yearly' ? stored : 'yearly';

      const result = await startPremiumCheckout(plan, {
        userId: user?.id,
        email: user?.email,
        accessToken: session.access_token,
        attributionSource: 'premium_page',
      });

      if (result.ok && result.channel === 'store') {
        const status = await checkSubscription();
        if (status?.subscribed) {
          setShowSuccessDialog(true);
        }
      } else if (!result.ok && !result.cancelled && result.message) {
        toast({
          title: t.error,
          description: getPublicErrorMessage(result.message, 'Premium konnte gerade nicht geöffnet werden. Bitte versuche es erneut.'),
          variant: 'destructive',
        });
        setIsAutoCheckout(false);
      }
    } catch (error: unknown) {
      toast({
        title: t.error,
        description: getPublicErrorMessage(error, 'Premium konnte gerade nicht geöffnet werden. Bitte versuche es erneut.'),
        variant: 'destructive',
      });
      setIsAutoCheckout(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Handle returning from Stripe with success
  useEffect(() => {
    if (!isReturningFromStripe || !session) return;

    let cancelled = false;
    setIsActivating(true);

    const activatePremium = async () => {
      const maxAttempts = 15;

      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt++) {
        const status = await checkSubscription();
        if (status?.subscribed) {
          setIsActivating(false);
          setShowSuccessDialog(true);
          setSearchParams({}, { replace: true });
          return;
        }
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (!cancelled) {
        setIsActivating(false);
        setSearchParams({}, { replace: true });
        toast({
          title: t.premiumNotActiveYet,
          description: t.premiumNotActiveDesc,
          variant: "destructive",
        });
      }
    };

    void activatePremium();
    return () => {
      cancelled = true;
    };
  }, [isReturningFromStripe, session, checkSubscription, setSearchParams, toast, language]);

  // Auto-trigger checkout if coming from onboarding
  useEffect(() => {
    const shouldStartCheckout = localStorage.getItem('startCheckoutAfterAuth');
    if (shouldStartCheckout === 'true' && session && !autoCheckoutTriggered && !subscriptionStatus?.subscribed) {
      localStorage.removeItem('startCheckoutAfterAuth');
      setAutoCheckoutTriggered(true);
      startCheckout();
    }
  }, [session, autoCheckoutTriggered, subscriptionStatus]);

  // Show activating screen when returning from Stripe
  if (isActivating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-primary safe-area-inset">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <img src={frigLogo} alt="Frigy" className="h-16 w-16 mx-auto mb-4 rounded-xl animate-pulse" />
          <h2 className="text-xl font-bold mb-2">{t.premiumActivating}</h2>
          <p className="text-muted-foreground">{t.pleaseWait}</p>
        </motion.div>
      </div>
    );
  }

  // Show loading screen while auto-checkout is in progress
  if (isAutoCheckout && !subscriptionStatus?.subscribed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-primary safe-area-inset">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <img src={frigLogo} alt="Frigy" className="h-16 w-16 mx-auto mb-4 rounded-xl animate-pulse" />
          <h2 className="text-xl font-bold mb-2">{usesStoreBilling() ? t.premiumActivating : t.redirectingToStripe}</h2>
          <p className="text-muted-foreground">{t.pleaseWait}</p>
        </motion.div>
      </div>
    );
  }

  const handleSubscribe = async () => {
    await startCheckout();
  };

  const handleManageSubscription = async () => {
    if (!session) {
      toast({
        title: t.notLoggedIn,
        description: t.pleaseLoginAgain,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (canManageStore) {
        await openStoreSubscriptionManagement();
        return;
      }
      toast({ title: t.loadingStripePortal, description: t.pleaseWait });
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(await getEdgeFunctionErrorMessage(error, data));
      }

      if (data?.url) {
        await openExternalUrl(data.url);
      } else {
        throw new Error(t.noPortalUrl);
      }
    } catch (error: unknown) {
      toast({
        title: t.error,
        description: getPublicErrorMessage(error, 'Die Aboverwaltung konnte gerade nicht geöffnet werden. Bitte versuche es erneut.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Calendar, text: t.weeklyPersonalizedMealPlans },
    { icon: ShoppingCart, text: t.automaticShoppingLists },
    { icon: BarChart, text: t.macroTrackingCalorieAnalysis },
    { icon: Sparkles, text: t.unlimitedRecipeGeneration },
    { icon: Droplets, text: t.waterTrackerFeature },
    { icon: TrendingDown, text: t.weightProgressFeature },
  ];

  const isPremium = subscriptionStatus?.subscribed;

  return (
    <div className="min-h-screen bg-background safe-area-inset overflow-x-hidden">
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/30 safe-top">
        <div className="w-full px-3 py-3 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="mr-2 h-9 w-9 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <NavLink to="/">
              <div className="flex items-center gap-2">
                <img src={frigLogo} alt="Frigy" className="h-7 w-7 rounded-lg flex-shrink-0" />
                <h1 className="text-base font-bold text-foreground truncate">Frigy</h1>
              </div>
            </NavLink>
          </div>
          
          {/* Premium Button in Header */}
          {!isPremium && (
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              size="sm"
              className="h-8 px-3 text-xs font-semibold flex-shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {loading ? '...' : 'Premium'}
            </Button>
          )}
        </div>
      </nav>

      <div className="w-full px-4 py-6 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          {isPremium ? (
            <div className="space-y-4">
              {/* Premium Status Header */}
              <div className="bg-card/80 backdrop-blur-lg rounded-2xl p-4 border border-border/30">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/15 rounded-full flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-foreground">{t.premiumActive}</h2>
                      {subscriptionStatus?.subscription_end && (
                        <p className="text-xs text-muted-foreground">
                          {t.renewsOn}: {new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {canManageSubscription && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleManageSubscription}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-xs"
                      >
                        <Settings className="mr-1.5 h-3.5 w-3.5" />
                        {t.manage}
                      </Button>
                      <Button
                        onClick={handleManageSubscription}
                        disabled={loading}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 text-xs"
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Kündigen
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Navigation - Scrollable */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <Button
                  variant={activeSection === 'overview' ? 'default' : 'outline'}
                  onClick={() => setActiveSection('overview')}
                  size="sm"
                  className="h-9 text-xs flex-shrink-0"
                >
                  <BarChart className="mr-1.5 h-3.5 w-3.5" />
                  {t.overview}
                </Button>
                <Button
                  variant={activeSection === 'water' ? 'default' : 'outline'}
                  onClick={() => setActiveSection('water')}
                  size="sm"
                  className="h-9 text-xs flex-shrink-0"
                >
                  <Droplets className="mr-1.5 h-3.5 w-3.5" />
                  {t.waterTracker}
                </Button>
                <Button
                  variant={activeSection === 'weight' ? 'default' : 'outline'}
                  onClick={() => setActiveSection('weight')}
                  size="sm"
                  className="h-9 text-xs flex-shrink-0"
                >
                  <TrendingDown className="mr-1.5 h-3.5 w-3.5" />
                  {t.weightProgress}
                </Button>
              </div>

              {/* Content Sections */}
              {activeSection === 'overview' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="bg-card/80 backdrop-blur-lg rounded-2xl p-4 border border-border/30">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t.quickAccess}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => navigate('/meal-plans')}
                        className="h-10 text-xs"
                        size="sm"
                      >
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        {t.mealPlans}
                      </Button>
                      <Button
                        onClick={() => navigate('/manual')}
                        variant="outline"
                        className="h-10 text-xs"
                        size="sm"
                      >
                        <BarChart className="mr-1.5 h-3.5 w-3.5" />
                        Tracker
                      </Button>
                      <Button
                        onClick={() => setActiveSection('water')}
                        variant="outline"
                        className="h-10 text-xs"
                        size="sm"
                      >
                        <Droplets className="mr-1.5 h-3.5 w-3.5" />
                        Wasser
                      </Button>
                      <Button
                        onClick={() => setActiveSection('weight')}
                        variant="outline"
                        className="h-10 text-xs"
                        size="sm"
                      >
                        <TrendingDown className="mr-1.5 h-3.5 w-3.5" />
                        Gewicht
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-card/80 backdrop-blur-lg rounded-2xl p-4 border border-border/30">
                    <h3 className="font-semibold mb-3 text-sm">{t.yourPremiumFeatures}</h3>
                    <div className="space-y-2">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="min-w-0">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'water' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <WaterTracker />
                </motion.div>
              )}

              {activeSection === 'weight' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <ProgressTracker />
                </motion.div>
              )}
            </div>
          ) : (
            <div className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-lg p-5 sm:p-8 border border-border/30 max-w-lg mx-auto">
              <div className="text-center mb-6">
                <div className="inline-block p-3 bg-primary/15 rounded-full mb-3">
                  <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                  Frigy Premium
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t.premiumCheckoutHint}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-xl"
                  >
                    <div className="p-1.5 bg-primary/15 rounded-lg flex-shrink-0">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm flex-1 min-w-0">{feature.text}</span>
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={() => navigate('/premium-pricing')}
                disabled={loading}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {loading ? t.loading : t.premiumViewPlansBtn}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-3">
                {t.premiumTrialHint}
              </p>
            </div>
          )}
        </motion.div>
      </div>
      
      <PremiumSuccessDialog 
        open={showSuccessDialog} 
        onClose={() => {
          setShowSuccessDialog(false);
          navigate('/');
        }} 
      />
    </div>
  );
};

export default PremiumPage;
