import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMealPlanGeneration } from '@/contexts/MealPlanContext';
import { ArrowLeft, Sparkles, ShoppingCart, Flame, TrendingDown, Check, Bell, User, Crown } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MealDetailDialog } from '@/components/MealDetailDialog';
import frigyMascot from '@/assets/frigy-mascot.png';
import { ShoppingList } from '@/components/ShoppingList';
import { ExportMealPlan } from '@/components/ExportMealPlan';
import { ReminderSettings } from '@/components/ReminderSettings';
import { useReminders } from '@/hooks/useReminders';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { toast } from '@/hooks/use-toast';
import StreakBadge from '@/components/StreakBadge';
import { BottomNavigation } from '@/components/BottomNavigation';
import { PremiumSuccessDialog } from '@/components/PremiumSuccessDialog';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';
import { notifyFrigyStorageUpdated, POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY } from '@/lib/frigyStorageSync';
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
  const { user, session, subscriptionStatus, loading, checkSubscription } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addEntry } = useFoodEntries();
  // Use global meal plan context for background generation
  const {
    mealPlan: globalMealPlan,
    shoppingList: globalShoppingList,
    generateMealPlan: globalGenerateMealPlan,
    isGenerating,
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
  const [shoppingList, setShoppingList] = useState<Ingredient[]>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('weeklyShoppingList');
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isActivatingSubscription, setIsActivatingSubscription] = useState(false);
  
  // Use centralized tracker settings hook for consistent data
  const { settings: trackerSettings, isConfigured: trackerSetup, loading: trackerLoading, reloadSettings } = useTrackerSettings();

  // Sync activeTab with URL params
  const activeTab = searchParams.get('tab') || 'meals';

  const setActiveTab = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'meals';
    const allowedTabs = new Set(['meals', 'shopping', 'reminders']);
    if (!allowedTabs.has(currentTab)) {
      if (currentTab === 'tracker') {
        const p = new URLSearchParams(searchParams);
        p.delete('tab');
        const qs = p.toString();
        navigate(qs ? `/?${qs}` : '/', { replace: true });
        return;
      }
      setActiveTab('meals');
    }
  }, [searchParams, setActiveTab, navigate]);

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

  const pendingMealPlanRefreshRef = useRef(false);

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (loading) return;
    
    // Don't redirect if coming from successful subscription - wait for status to update
    const subscriptionParam = searchParams.get('subscription');
    if (subscriptionParam === 'success') return;

    if (user && !user.email_confirmed_at) {
      const q = new URLSearchParams();
      if (user.email) q.set('email', user.email);
      q.set('next', '/premium-pricing');
      q.set('from', 'signup');
      navigate(`/email-confirmation?${q.toString()}`, { replace: true });
      return;
    }
    
    // Only redirect to auth if not logged in
    if (!user) {
      navigate('/auth');
    }
  }, [user, loading, navigate, searchParams]);

  // Validate if meal plan meets current calorie target
  const validateMealPlanCalories = (plan: DayPlan[], targetCalories: number): boolean => {
    if (!Array.isArray(plan) || plan.length === 0) return false;

    const dailyAnalysis = plan.map((day) => {
      const dayCalories = (day.meals || []).reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const percentage = (dayCalories / targetCalories) * 100;
      return { day: day.day, calories: dayCalories, percentage };
    });

    const daysMeetingTarget = dailyAnalysis.filter(d => d.percentage >= 85).length;
    const isValid = daysMeetingTarget >= 5;

    console.log('[MEALPLANS] Calorie validation:', {
      isValid,
      daysMeetingTarget,
      targetCalories,
      dailyAnalysis
    });

    return isValid;
  };

  // Sync meal plan and shopping list from global context or localStorage
  useEffect(() => {
    console.log('[MEALPLANS] Syncing meal plan from context:', {
      globalMealPlanExists: !!globalMealPlan,
      globalMealPlanLength: globalMealPlan?.length,
      globalShoppingListLength: globalShoppingList?.length,
    });

    if (globalMealPlan && globalMealPlan.length > 0) {
      setMealPlan(globalMealPlan);
    } else {
      const saved = localStorage.getItem('weeklyMealPlan');
      if (saved && trackerSettings && trackerSettings.dailyCalories > 0) {
        try {
          const parsed = JSON.parse(saved);
          const isValid = validateMealPlanCalories(parsed, trackerSettings.dailyCalories);

          if (isValid) {
            setMealPlan(parsed);
          } else {
            console.warn('[MEALPLANS] Saved meal plan does not meet current calorie target - clearing');
            localStorage.removeItem('weeklyMealPlan');
            notifyFrigyStorageUpdated();
            setMealPlan([]);
            toast({
              title: 'Wochenplan veraltet',
              description: `Ihr gespeicherter Plan erfüllt das Kalorienziel von ${trackerSettings.dailyCalories} kcal nicht. Bitte generieren Sie einen neuen Plan.`,
              variant: 'destructive',
            });
          }
        } catch (e) {
          console.error('[MEALPLANS] Failed to load saved meal plan:', e);
          setMealPlan([]);
        }
      } else if (!saved) {
        setMealPlan([]);
      }
    }

    if (globalShoppingList && globalShoppingList.length > 0) {
      setShoppingList(globalShoppingList as Ingredient[]);
    } else {
      const sl = localStorage.getItem('weeklyShoppingList');
      if (sl) {
        try {
          const parsed = JSON.parse(sl);
          if (Array.isArray(parsed)) {
            setShoppingList(parsed as Ingredient[]);
          }
        } catch {
          /* ignore */
        }
      }
    }
  }, [globalMealPlan, globalShoppingList, trackerSettings]);

  // Auto-generate meal plan on login was removed: plans are persisted and should never regenerate automatically.


  // Listen for tracker setup changes - reload settings from DB
  const handleTrackerSetup = () => {
    reloadSettings();
  };

  // Handle tracker reset from chatbot
  const handleResetTracker = () => {
    reloadSettings();
    navigate('/?setupTracker=1', { replace: true });
  };

  const generateMealPlan = useCallback(async () => {
    if (!trackerSetup || !trackerSettings) {
      toast({
        title: t.setupTracker,
        description: t.setupTrackerFirst,
        variant: 'destructive',
      });
      navigate('/?setupTracker=1');
      return;
    }

    if (!session) {
      toast({ title: t.notLoggedIn, variant: 'destructive' });
      navigate('/auth');
      return;
    }

    // Use tracker settings from database/hook (single source of truth)
    const dailyCalories = trackerSettings.dailyCalories || 1600;
    const dailyProtein = trackerSettings.dailyProtein || Math.round(dailyCalories * 0.3 / 4);
    const dailyCarbs = trackerSettings.dailyCarbs || Math.round(dailyCalories * 0.4 / 4);
    const dailyFat = trackerSettings.dailyFat || Math.round(dailyCalories * 0.3 / 9);
    const mealsPerDay = trackerSettings.mealsPerDay || 5;

    console.log('[MEAL-PLAN] Using global context for generation:', { dailyCalories, dailyProtein, dailyCarbs, dailyFat, mealsPerDay });

    // Use global context for background generation
    await globalGenerateMealPlan({
      dailyCalories,
      dailyProtein,
      dailyCarbs,
      dailyFat,
      mealsPerDay,
    });
  }, [
    trackerSetup,
    trackerSettings,
    session,
    navigate,
    globalGenerateMealPlan,
    setActiveTab,
    t,
  ]);

  useEffect(() => {
    const shouldRegenerate = activeTab === 'meals' && searchParams.get('regenerate') === '1';

    if (!shouldRegenerate || trackerLoading || pendingMealPlanRefreshRef.current) {
      return;
    }

    pendingMealPlanRefreshRef.current = true;

    const params = new URLSearchParams(searchParams);
    params.delete('regenerate');
    setSearchParams(params, { replace: true });

    void (async () => {
      try {
        await generateMealPlan();
      } finally {
        pendingMealPlanRefreshRef.current = false;
      }
    })();
  }, [activeTab, generateMealPlan, searchParams, setSearchParams, trackerLoading]);

  const openMealDetail = (meal: Meal) => {
    // Ensure meal has all required fields with safe defaults
    const safeMeal: Meal = {
      ...meal,
      instructions: meal.instructions && Array.isArray(meal.instructions) ? meal.instructions : [],
      prepTime: meal.prepTime || 20,
      ingredients: meal.ingredients || [],
    };
    setSelectedMeal(safeMeal);
    setDialogOpen(true);
  };

  const addMealToTracker = async (meal: Meal, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening meal detail

    try {
      // Ensure all values are numbers - handle potential undefined/null values
      const calories = Number(meal.calories) || 0;
      const protein = Number(meal.protein) || 0;
      const carbs = Number(meal.carbs) || 0;
      const fat = Number(meal.fat) || 0;
      const prepTime = meal.prepTime || 20;

      // Log meal to database via food entries hook
      console.log('[ADD-MEAL-TO-TRACKER] Adding meal:', {
        name: meal.name,
        calories,
        protein,
        carbs,
        fat,
        portion: `${prepTime}min`,
        meal_type: meal.type,
      });

      const result = await addEntry({
        name: meal.name,
        calories,
        protein,
        carbs,
        fat,
        portion: `${prepTime}min`,
        meal_type: meal.type,
      });

      if (result) {
        toast({
          title: `${t.eaten}! ✓`,
          description: `${meal.name} - ${calories} kcal ${t.toastProductAdded}`
        });
      } else {
        console.error('[ADD-MEAL-TO-TRACKER] Failed to add meal - result is null');
        toast({
          title: 'Fehler',
          description: 'Mahlzeit konnte nicht hinzugefügt werden',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('[ADD-MEAL-TO-TRACKER] Error:', error);
      toast({
        title: 'Fehler',
        description: 'Konnte Mahlzeit nicht speichern',
        variant: 'destructive'
      });
    }
  };

  const handleTabChange = (value: string) => {
    // Only shopping requires tracker setup
    if (value === 'shopping' && !trackerSetup) {
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
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-primary/20 safe-top">
        <div className="container mx-auto flex items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex min-w-0 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="mr-1 h-9 w-9 shrink-0 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <NavLink to="/">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="rounded-xl bg-primary/10 p-0.5 shadow-[0_10px_28px_-14px_hsl(var(--primary)/0.45)]">
                  <img src={frigyMascot} alt="Frigy" className="h-6 w-6 rounded-lg sm:h-7 sm:w-7" />
                </span>
                <h1 className="bg-gradient-to-r from-primary via-emerald-400 to-primary/60 bg-clip-text text-[18px] font-black tracking-[-0.04em] text-transparent drop-shadow-[0_8px_18px_hsl(var(--primary)/0.2)] sm:text-xl">
                  Frigy
                </h1>
              </div>
            </NavLink>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StreakBadge />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-2.5 min-[360px]:px-3 sm:px-4 py-4 sm:py-6 pb-bottom-nav">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">

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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-4 sm:mb-6">
                  <div className="flex w-full flex-wrap items-center gap-2 min-h-9">
                    <ExportMealPlan mealPlan={mealPlan} pdfOnly />
                    <div className="ml-auto grid min-w-0 shrink grid-cols-2 gap-1.5 min-[390px]:gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 min-w-0 rounded-2xl border-primary/30 px-2 text-[10px] min-[360px]:h-10 min-[390px]:px-2.5 min-[390px]:text-xs sm:h-9 sm:text-sm"
                        onClick={() => navigate("/scan")}
                      >
                        <span className="truncate">
                          Zutaten erkennen
                        </span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 min-w-0 rounded-2xl bg-primary px-2 text-[10px] text-primary-foreground min-[360px]:h-10 min-[390px]:px-2.5 min-[390px]:text-xs sm:h-9 sm:text-sm"
                        onClick={generateMealPlan}
                        disabled={isGenerating}
                      >
                        <span className="truncate">
                          {isGenerating ? (
                            "Erstellt..."
                          ) : (
                            <>
                              <span className="min-[390px]:hidden">Erstellen</span>
                              <span className="hidden min-[390px]:inline">Wochenplan erstellen</span>
                            </>
                          )}
                        </span>
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
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {day.meals.map((meal, mealIndex) => (
                            <div
                              key={mealIndex}
                              onClick={() => openMealDetail(meal)}
                              className="min-w-0 p-2 sm:p-3 bg-background/50 rounded-xl cursor-pointer hover:bg-primary/10 transition-all duration-200 active:scale-[0.98] touch-manipulation"
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
                                className="w-full mt-2 h-7 min-[360px]:h-8 sm:h-7 text-[10px] min-[360px]:text-[11px] sm:text-xs border-primary/30 hover:bg-primary/20 touch-target"
                                onClick={(e) => addMealToTracker(meal, e)}
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
              <div>
                {mealPlan.length === 0 && (
                  <Card className="mb-4 p-4 bg-amber-500/10 border-amber-500/30">
                    <p className="text-sm text-amber-700">
                      💡 Erstelle einen <strong>Frigy Plan</strong> oder scanne den Kühlschrank: Die Einkaufsliste zeigt dann nur Zutaten, die noch fehlen.
                    </p>
                  </Card>
                )}
                <ShoppingList mealPlan={mealPlan} />
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      <MealDetailDialog
        meal={selectedMeal}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onMealLogged={() => {
          // Refresh food entries when meal is logged from dialog
          toast({
            title: `${t.eaten}! ✓`,
            description: `Mahlzeit zu deinem Tracker hinzugefügt`
          });
        }}
      />

      {/* Premium Success Dialog */}
      <PremiumSuccessDialog
        open={showSuccessDialog}
        onClose={() => {
          setShowSuccessDialog(false);
          localStorage.setItem(POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY, '1');
        }}
        onScanFridge={() => {
          setShowSuccessDialog(false);
          localStorage.setItem(POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY, '1');
          navigate('/scan');
        }}
      />

      {/* Bottom Navigation */}
      <BottomNavigation trackerSetup={trackerSetup} trackerLoading={trackerLoading} />
    </div>
    </>
  );
};

export default MealPlansPage;
