import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMealPlanGeneration } from '@/contexts/MealPlanContext';
import { ArrowLeft, Calendar, ChefHat, Sparkles, ShoppingCart, Flame, Loader2, Lock, TrendingDown, Droplets, Settings, XCircle, Check, Bell, User, BarChart3, Crown } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MealDetailDialog } from '@/components/MealDetailDialog';
import frigyMascot from '@/assets/frigy-mascot.png';
import { ShoppingList } from '@/components/ShoppingList';
import { MacroTracker } from '@/components/MacroTracker';
import { ProgressTracker } from '@/components/ProgressTracker';
import { WaterTracker } from '@/components/WaterTracker';
import { ExportMealPlan } from '@/components/ExportMealPlan';
import { ReminderSettings } from '@/components/ReminderSettings';
import { WeeklySummary } from '@/components/WeeklySummary';
import { useReminders } from '@/hooks/useReminders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import StreakBadge from '@/components/StreakBadge';
import { BottomNavigation } from '@/components/BottomNavigation';
import { PremiumSuccessDialog } from '@/components/PremiumSuccessDialog';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { FreeModePaywallOverlay } from '@/components/FreeModePaywallOverlay';

interface UserProfile {
  age: number;
  weight: number;
  targetWeight: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}
interface Ingredient {
  name: string;
  amount: string;
  price: number;
}

interface Meal {
  type: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  ingredients: Ingredient[];
  instructions: string[];
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

// Empty placeholder - no more demo plan, real plan gets auto-generated

const MealPlansPage = () => {
  const { user, session, subscriptionStatus, loading, checkSubscription, isFreeMode, isPremium } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Use global meal plan context for background generation
  const { 
    mealPlan: globalMealPlan, 
    isGenerating: globalIsGenerating, 
    elapsedSeconds: globalElapsedSeconds,
    generateMealPlan: globalGenerateMealPlan 
  } = useMealPlanGeneration();
  
  const [mealPlan, setMealPlan] = useState<DayPlan[]>(() => {
    // Initialize from localStorage - no demo plan fallback
    const saved = localStorage.getItem('weeklyMealPlan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isActivatingSubscription, setIsActivatingSubscription] = useState(false);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  
  // Use centralized tracker settings hook for consistent data
  const { settings: trackerSettings, isConfigured: trackerSetup, loading: trackerLoading, reloadSettings } = useTrackerSettings();

  // Sync activeTab with URL params
  const activeTab = searchParams.get('tab') || 'tracker';

  const setActiveTab = (tab: string) => {
    searchParams.set('tab', tab);
    setSearchParams(searchParams, { replace: true });
  };

  // Initialize reminder system
  useReminders();

  // Show success dialog and auto-refresh subscription after purchase
  useEffect(() => {
    const subscriptionParam = searchParams.get('subscription');
    if (subscriptionParam === 'success') {
      setIsActivatingSubscription(true);
      
      // Poll for subscription activation every 2 seconds
      let attempts = 0;
      const maxAttempts = 15; // Max 30 seconds
      
      const pollSubscription = setInterval(async () => {
        attempts++;
        await checkSubscription();
        
        if (subscriptionStatus?.subscribed || attempts >= maxAttempts) {
          clearInterval(pollSubscription);
          setIsActivatingSubscription(false);
          setShowSuccessDialog(true);
          // Clean up URL
          searchParams.delete('subscription');
          setSearchParams(searchParams, { replace: true });
        }
      }, 2000);
      
      return () => clearInterval(pollSubscription);
    }
  }, [searchParams, setSearchParams, checkSubscription, subscriptionStatus]);

  const handleManageSubscription = async () => {
    if (!session) {
      toast({ title: t.notLoggedIn, variant: 'destructive' });
      return;
    }
    setPortalLoading(true);
    toast({ title: t.loadingStripePortal, description: t.pleaseWait });
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

  // isPremium now comes from useAuth() hook above

  // Get meal plan generation count for free users
  const [mealPlanGenerationCount, setMealPlanGenerationCount] = useState(0);
  
  useEffect(() => {
    const count = parseInt(localStorage.getItem('mealPlanGenerationCount') || '0', 10);
    setMealPlanGenerationCount(count);
  }, []);

  // Free users: can regenerate meal plan only once after the onboarding plan
  const maxFreeGenerations = 1;
  const canGenerateMealPlan = isPremium || mealPlanGenerationCount < maxFreeGenerations;

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (loading) return;
    
    // Don't redirect if coming from successful subscription - wait for status to update
    const subscriptionParam = searchParams.get('subscription');
    if (subscriptionParam === 'success') return;
    
    // Only redirect to auth if not logged in
    if (!user) {
      navigate('/auth');
    }
    // Remove premium redirect - allow free users to access with limitations
  }, [user, loading, navigate, searchParams]);

  // Sync meal plan from global context or localStorage
  useEffect(() => {
    if (globalMealPlan && globalMealPlan.length > 0) {
      setMealPlan(globalMealPlan);
    } else {
      const saved = localStorage.getItem('weeklyMealPlan');
      if (saved) {
        try {
          setMealPlan(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load saved meal plan');
          setMealPlan([]);
        }
      } else {
        setMealPlan([]);
      }
    }
  }, [globalMealPlan]);

  // Auto-generate meal plan on login was removed: plans are persisted and should never regenerate automatically.


  // Listen for tracker setup changes - reload settings from DB
  const handleTrackerSetup = () => {
    reloadSettings();
  };

  // Handle tracker reset from chatbot
  const handleResetTracker = () => {
    reloadSettings();
    setActiveTab('tracker');
  };

  const generateMealPlan = async () => {
    if (!trackerSetup || !trackerSettings) {
      toast({
        title: t.setupTracker,
        description: t.setupTrackerFirst,
        variant: 'destructive',
      });
      setActiveTab('tracker');
      return;
    }

    if (!session) {
      toast({ title: t.notLoggedIn, variant: 'destructive' });
      navigate('/auth');
      return;
    }

    // Check if free user has reached generation limit
    if (!isPremium && mealPlanGenerationCount >= maxFreeGenerations) {
      toast({
        title: "Limit erreicht",
        description: "Upgrade auf Premium für unbegrenzte Generierungen",
        variant: 'destructive',
      });
      navigate('/premium-pricing');
      return;
    }

    // Use tracker settings from database/hook (single source of truth)
    const dailyCalories = trackerSettings.dailyCalories || 1600;
    const dailyProtein = trackerSettings.dailyProtein || Math.round(dailyCalories * 0.3 / 4);
    const dailyCarbs = trackerSettings.dailyCarbs || Math.round(dailyCalories * 0.4 / 4);
    const dailyFat = trackerSettings.dailyFat || Math.round(dailyCalories * 0.3 / 9);

    console.log('[MEAL-PLAN] Using global context for generation:', { dailyCalories, dailyProtein, dailyCarbs, dailyFat });

    // Use global context for background generation
    const success = await globalGenerateMealPlan({
      dailyCalories,
      dailyProtein,
      dailyCarbs,
      dailyFat,
    });

    if (success && !isPremium) {
      // Track generation count for free users
      const newCount = mealPlanGenerationCount + 1;
      setMealPlanGenerationCount(newCount);
      localStorage.setItem('mealPlanGenerationCount', String(newCount));
    }
  };

  const openMealDetail = (meal: Meal) => {
    setSelectedMeal(meal);
    setDialogOpen(true);
  };

  const addMealToTracker = (meal: Meal, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening meal detail
    
    // Get current food entries from localStorage
    const saved = localStorage.getItem('todayFood');
    let entries = [];
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === new Date().toDateString()) {
        entries = data.entries;
      }
    }
    
    // Add the meal
    const newEntry = {
      id: Date.now().toString(),
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    };
    
    entries.push(newEntry);
    localStorage.setItem('todayFood', JSON.stringify({
      date: new Date().toDateString(),
      entries,
    }));
    
    toast({ 
      title: `${t.eaten}! ✓`, 
      description: `${meal.name} - ${meal.calories} kcal ${t.toastProductAdded}` 
    });
  };

  const handleTabChange = (value: string) => {
    // Only shopping and progress require tracker setup
    if ((value === 'shopping' || value === 'progress') && !trackerSetup) {
      toast({ 
        title: t.setupTracker, 
        description: t.setupTrackerFirst, 
        variant: 'destructive' 
      });
      return;
    }
    setActiveTab(value);
  };

  const canAccessPremiumFeatures = trackerSetup;

  // Check if user has generated their own plan (not demo)
  const hasGeneratedPlan = localStorage.getItem('weeklyMealPlan') !== null;

  // Show loading screen while activating subscription
  if (isActivatingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 p-8"
        >
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Premium wird aktiviert...</h2>
            <p className="text-muted-foreground text-sm">
              Bitte warte einen Moment, während wir dein Abo einrichten.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-primary safe-area-inset">
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20 safe-top">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="mr-2 touch-target h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <NavLink to="/">
              <div className="flex items-center gap-2">
                <img src={frigyMascot} alt="Fridgie" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
                <h1 className="text-lg sm:text-xl font-bold neon-text hidden sm:block">Fridgie</h1>
              </div>
            </NavLink>
          </div>
          <div className="flex items-center gap-2">
            <StreakBadge />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 sm:space-x-2 hover:bg-primary/10 touch-target">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse" />
                  <span className="text-xs sm:text-sm font-medium">Premium</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start touch-target"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t.manageSubscription}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 touch-target"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t.cancelSubscription}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">

          <TabsContent value="tracker">
            <MacroTracker onSetupComplete={handleTrackerSetup} />
          </TabsContent>

          <TabsContent value="progress">
            <div className="relative">
              {!isPremium && (
                <PremiumLockOverlay 
                  title="Stats & Makros"
                  description="Upgrade auf Premium um diese Funktion zu sehen"
                />
              )}
              <div className={!isPremium ? "pointer-events-none" : ""}>
                <div className="flex justify-end mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowWeeklySummary(true)}
                    className="gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Wochenübersicht
                  </Button>
                </div>
                <ProgressTracker />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reminders">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold neon-text mb-1">{t.reminderSettings}</h2>
                <p className="text-sm text-muted-foreground">{t.reminderSettings}</p>
              </div>
              <ReminderSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="meals">
            <div className="relative">
              {isFreeMode && (
                <FreeModePaywallOverlay 
                  title="Wochenplan"
                  description="Plane deine Woche automatisch mit KI-generierten Mahlzeiten"
                />
              )}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className={isFreeMode ? "pointer-events-none select-none" : ""}
              >
                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold neon-text mb-1">{t.weeklyPlan}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t.tip}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <ExportMealPlan mealPlan={mealPlan} />
                    <div className="flex items-center gap-2">
                      {!isPremium && !isFreeMode && (
                        <span className="text-xs text-muted-foreground">
                          {mealPlanGenerationCount}/{maxFreeGenerations} Generierungen
                        </span>
                      )}
                      <Button 
                        className="glow-button shrink-0 touch-target text-xs sm:text-sm" 
                        size="sm"
                        onClick={generateMealPlan}
                        disabled={globalIsGenerating || !canGenerateMealPlan || isFreeMode}
                      >
                        {globalIsGenerating ? (() => {
                          const expectedSeconds = 40;
                          const remaining = Math.max(5, expectedSeconds - globalElapsedSeconds);
                          const label = globalElapsedSeconds < expectedSeconds
                            ? `Wird generiert… ca. ${remaining}s`
                            : t.almostDone;

                          return (
                            <>
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              <span>{label}</span>
                            </>
                          );
                        })() : !canGenerateMealPlan ? (
                          <>
                            <Lock className="mr-1 h-4 w-4" />
                            <span>Limit erreicht</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="mr-1 h-4 w-4" />
                            <span className="sm:hidden">{t.generateNewPlan.split(' ')[0]}</span>
                            <span className="hidden sm:inline">{t.generateNewPlan}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {mealPlan.map((day, index) => (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-3 sm:p-4 bg-card/80 backdrop-blur-lg border-primary/20 hover:shadow-neon transition-all duration-300">
                        <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-primary">{day.day}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {day.meals.map((meal, mealIndex) => (
                            <div
                              key={mealIndex}
                              onClick={() => !isFreeMode && openMealDetail(meal)}
                              className="p-2 sm:p-3 bg-background/50 rounded-xl cursor-pointer hover:bg-primary/10 transition-all duration-200 active:scale-[0.98]"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{meal.type}</p>
                                <span className="text-[10px] sm:text-xs text-primary font-medium">{meal.calories}</span>
                              </div>
                              <p className="font-medium text-xs sm:text-sm line-clamp-2">{meal.name}</p>
                              <div className="flex gap-1 sm:gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                                <span className="text-red-400">{meal.protein}P</span>
                                <span className="text-amber-400">{meal.carbs}K</span>
                                <span className="text-blue-400">{meal.fat}F</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-1.5 sm:mt-2 h-6 sm:h-7 text-[10px] sm:text-xs border-primary/30 hover:bg-primary/20 touch-target"
                                onClick={(e) => !isFreeMode && addMealToTracker(meal, e)}
                                disabled={isFreeMode}
                              >
                                <Check className="h-3 w-3 mr-0.5 sm:mr-1" />
                                {t.eaten}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="shopping">
            <div className="relative">
              {isFreeMode && (
                <FreeModePaywallOverlay 
                  title="Einkaufsliste"
                  description="Erstelle automatisch Einkaufslisten aus deinem Wochenplan"
                />
              )}
              {!isFreeMode && !isPremium && (
                <PremiumLockOverlay 
                  title="Einkaufsliste"
                  description="Upgrade auf Premium um diese Funktion zu sehen"
                />
              )}
              <div className={(!isPremium || isFreeMode) ? "pointer-events-none" : ""}>
                <ShoppingList mealPlan={mealPlan} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="water">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-bold neon-text mb-4">{t.waterTracker}</h2>
              <WaterTracker />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <MealDetailDialog 
        meal={selectedMeal} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />

      {/* Weekly Summary Dialog */}
      <WeeklySummary 
        open={showWeeklySummary} 
        onClose={() => setShowWeeklySummary(false)} 
      />

      {/* Premium Success Dialog */}
      <PremiumSuccessDialog 
        open={showSuccessDialog} 
        onClose={() => setShowSuccessDialog(false)} 
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} trackerSetup={trackerSetup} trackerLoading={trackerLoading} onTabChange={setActiveTab} />
    </div>
    </>
  );
};

export default MealPlansPage;
