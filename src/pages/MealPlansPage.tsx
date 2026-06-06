import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMealPlanGeneration } from '@/contexts/MealPlanContext';
import { ArrowLeft, Sparkles, ShoppingCart, Flame, TrendingDown, Check, Bell, User, Crown, Calendar, Refrigerator } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Card } from '@/components/ui/card';
import { MealDetailDialog } from '@/components/MealDetailDialog';
import frigyMascot from '@/assets/frigy-mascot.png';
import { ShoppingList } from '@/components/ShoppingList';
const ReminderSettings = lazy(() =>
  import('@/components/ReminderSettings').then((m) => ({ default: m.ReminderSettings })),
);
import { ExportMealPlan } from '@/components/ExportMealPlan';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { toast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/BottomNavigation';
import { AiDisclaimer } from '@/components/AiDisclaimer';
import { PremiumSuccessDialog } from '@/components/PremiumSuccessDialog';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';
import { POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY } from '@/lib/frigyStorageSync';
import { resolveTodayMealPlanDayIndex } from '@/lib/food-ai/weeklyPlanWidgetData';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { localizeMealTypeLabel, localizeWeekdayLabel, cleanMealDisplayName } from '@/lib/mealI18n';
import { dismissStalledAuthNavigation } from '@/lib/authCompletion';
import {
  tabPanelExit,
  tabPanelFrom,
  tabPanelTransition,
} from '@/lib/motionPresets';

const TabPanelFallback = () => (
  <div className="min-h-[40vh] animate-pulse rounded-2xl bg-muted/25" aria-hidden />
);
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

const normalizeMeal = (meal: Partial<Meal> | null | undefined, fallbackType: string, defaultMealName: string): Meal => ({
  type: typeof meal?.type === 'string' ? meal.type : fallbackType,
  name: typeof meal?.name === 'string' ? cleanMealDisplayName(meal.name) || meal.name : defaultMealName,
  calories: Number(meal?.calories) || 0,
  protein: Number(meal?.protein) || 0,
  carbs: Number(meal?.carbs) || 0,
  fat: Number(meal?.fat) || 0,
  prepTime: Number(meal?.prepTime) || 20,
  ingredients: Array.isArray(meal?.ingredients) ? meal.ingredients : [],
  instructions: Array.isArray(meal?.instructions) ? meal.instructions : [],
});

const normalizeMealPlan = (value: unknown, defaultMealName: string): DayPlan[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((day): day is Partial<DayPlan> => Boolean(day) && typeof day === 'object')
    .map((day, index) => ({
      day: typeof day.day === 'string' && day.day.trim() ? day.day : `Tag ${index + 1}`,
      meals: Array.isArray(day.meals)
        ? day.meals.map((meal, mealIndex) => normalizeMeal(meal, `${defaultMealName} ${mealIndex + 1}`, defaultMealName))
        : [],
    }));
};

const normalizeShoppingList = (value: unknown, defaultName: string): Ingredient[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Partial<Ingredient> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      name: typeof item.name === 'string' && item.name.trim() ? item.name : defaultName,
      amount: typeof item.amount === 'string' && item.amount.trim() ? item.amount : '—',
      price: Number(item.price) || 0,
    }));
};

const readJsonArray = (key: string): unknown[] => {
  const saved = localStorage.getItem(key);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
};

const MealPlansPage = () => {
  const isMobile = useIsMobile();
  const { user, session, checkSubscription } = useAuth();
  const authed = Boolean(user ?? session?.user);
  const { t, language } = useLanguage();
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
    return normalizeMealPlan(readJsonArray('weeklyMealPlan'), t.defaultMealName);
  });
  const [shoppingList, setShoppingList] = useState<Ingredient[]>(() => {
    return normalizeShoppingList(readJsonArray('weeklyShoppingList'), t.ingredientDefaultName);
  });
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isActivatingSubscription, setIsActivatingSubscription] = useState(false);
  
  // Use centralized tracker settings hook for consistent data
  const { settings: trackerSettings, isConfigured: trackerSetup, loading: trackerLoading, reloadSettings } = useTrackerSettings();
  const pageCopy = {
    mealAddedTitle: `${t.eaten}! ✓`,
    premiumActivatingTitle: t.mealPlanPremiumActivatingTitle,
    premiumActivatingDesc: t.mealPlanPremiumActivatingDesc,
    detectIngredients: t.mealPlanDetectIngredients,
    creating: t.mealPlanCreating,
    createShort: t.mealPlanCreateShort,
    createMealPlan: t.createWeeklyPlan,
    createPlanFirst: t.onboardingFirstWeeklyPlanTitle,
    createPlanDesc: t.onboardingFirstWeeklyPlanDesc,
    shoppingHint: t.mealPlanShoppingHint,
    mealAddedDesc: t.mealPlanMealAddedDesc,
    notGenerated: t.shoppingListNotGenerated,
  };

  // Sync activeTab with URL params
  const rawTab = searchParams.get('tab') || 'meals';
  const activeTab = ['meals', 'shopping', 'reminders'].includes(rawTab) ? rawTab : 'meals';

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

  // Show success dialog only after subscription is confirmed
  useEffect(() => {
    if (searchParams.get("subscription") !== "success") return;

    let cancelled = false;
    setIsActivatingSubscription(true);

    const activatePremium = async () => {
      const maxAttempts = 15;

      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt++) {
        const status = await checkSubscription();
        if (status?.subscribed) {
          setIsActivatingSubscription(false);
          setShowSuccessDialog(true);
          const next = new URLSearchParams(searchParams);
          next.delete("subscription");
          setSearchParams(next, { replace: true });
          return;
        }
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (!cancelled) {
        setIsActivatingSubscription(false);
        const next = new URLSearchParams(searchParams);
        next.delete("subscription");
        setSearchParams(next, { replace: true });
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
  }, [searchParams, setSearchParams, checkSubscription, language]);

  const pendingMealPlanRefreshRef = useRef(false);
  const scrolledToDayRef = useRef<string | null>(null);

  // Sync meal plan and shopping list from global context or localStorage
  useEffect(() => {
    if (globalMealPlan && globalMealPlan.length > 0) {
      setMealPlan(normalizeMealPlan(globalMealPlan, t.defaultMealName));
    } else {
      setMealPlan(normalizeMealPlan(readJsonArray('weeklyMealPlan'), t.defaultMealName));
    }

    if (globalShoppingList && globalShoppingList.length > 0) {
      setShoppingList(normalizeShoppingList(globalShoppingList, t.ingredientDefaultName));
    } else {
      setShoppingList(normalizeShoppingList(readJsonArray('weeklyShoppingList'), t.ingredientDefaultName));
    }
  }, [globalMealPlan, globalShoppingList, t.defaultMealName, t.ingredientDefaultName]);

  // Auto-generate meal plan on login was removed: plans are persisted and should never regenerate automatically.


  // Listen for tracker setup changes - reload settings from DB
  const handleTrackerSetup = () => {
    reloadSettings();
  };

  // Handle tracker reset from chatbot
  const handleResetTracker = () => {
    reloadSettings();
  };

  const generateMealPlan = useCallback(async () => {
    if (!session) {
      toast({ title: t.notLoggedIn, variant: 'destructive' });
      navigate('/auth');
      return;
    }

    // Use tracker settings from database/hook (single source of truth)
    const dailyCalories = trackerSettings?.dailyCalories || 1800;
    const dailyProtein = trackerSettings?.dailyProtein || Math.round(dailyCalories * 0.3 / 4);
    const dailyCarbs = trackerSettings?.dailyCarbs || Math.round(dailyCalories * 0.4 / 4);
    const dailyFat = trackerSettings?.dailyFat || Math.round(dailyCalories * 0.3 / 9);
    const mealsPerDay = trackerSettings?.mealsPerDay || 5;

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
    trackerSettings,
    session,
    navigate,
    globalGenerateMealPlan,
    t,
  ]);

  useEffect(() => {
    const shouldRegenerate = activeTab === 'meals' && searchParams.get('regenerate') === '1';

    if (!shouldRegenerate || pendingMealPlanRefreshRef.current) {
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
  }, [activeTab, generateMealPlan, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeTab !== 'meals' || mealPlan.length === 0) return;

    const dayParam = searchParams.get('day');
    const dayIndex =
      dayParam !== null && dayParam !== ''
        ? Number.parseInt(dayParam, 10)
        : resolveTodayMealPlanDayIndex(mealPlan);

    if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex >= mealPlan.length) return;

    const scrollKey = `${dayIndex}-${mealPlan.length}`;
    if (scrolledToDayRef.current === scrollKey) return;

    const scrollToDay = () => {
      const el = document.getElementById(`meal-plan-day-${dayIndex}`);
      if (!el) return false;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      scrolledToDayRef.current = scrollKey;
      return true;
    };

    if (scrollToDay()) return;

    const t = window.setTimeout(scrollToDay, 120);
    return () => window.clearTimeout(t);
  }, [activeTab, mealPlan, searchParams]);

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
          title: pageCopy.mealAddedTitle,
          description: `${meal.name} - ${calories} kcal ${t.toastProductAdded}`
        });
      } else {
        console.error('[ADD-MEAL-TO-TRACKER] Failed to add meal - result is null');
        toast({
          title: t.error,
          description: t.toastMealAddFailed,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('[ADD-MEAL-TO-TRACKER] Error:', error);
      toast({
        title: t.error,
        description: t.toastMealSaveFailed,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    dismissStalledAuthNavigation();
  }, []);

  useEffect(() => {
    if (authed) {
      dismissStalledAuthNavigation();
    }
  }, [authed]);

  // Show loading screen while activating subscription
  if (isActivatingSubscription) {
    return (
      <div className="min-h-screen bg-[#F2FFF8] flex items-center justify-center">
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
            <h2 className="text-xl font-bold mb-2">{pageCopy.premiumActivatingTitle}</h2>
            <p className="text-muted-foreground text-sm">
              {pageCopy.premiumActivatingDesc}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F2FFF8] safe-area-inset">
      <nav className="sticky top-0 z-[60] bg-[#F2FFF8]/95 border-b border-primary/15 safe-top sm:bg-[#F2FFF8]/90 sm:backdrop-blur-lg">
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
                <span className="rounded-xl bg-primary/10 p-0.5">
                  <img src={frigyMascot} alt="Frigy" className="h-6 w-6 rounded-lg sm:h-7 sm:w-7" />
                </span>
                <h1 className="text-[18px] font-black tracking-[-0.04em] text-foreground sm:text-xl">
                  Frigy
                </h1>
              </div>
            </NavLink>
          </div>
          <div className="flex shrink-0 items-center gap-1.5" />
        </div>
      </nav>

      <div className="container mx-auto px-2.5 min-[360px]:px-3 sm:px-4 py-4 sm:py-6 pb-bottom-nav">
        <motion.div className="min-h-[50vh] space-y-4 sm:space-y-6">
          <AnimatePresence mode="sync" initial={false}>
          {activeTab === 'reminders' && (
            <motion.div
              key="reminders"
              initial={tabPanelFrom(isMobile)}
              animate={{ opacity: 1, y: 0 }}
              exit={tabPanelExit(isMobile)}
              transition={tabPanelTransition(isMobile)}
            >
              <div className="mb-6">
                <h2 className="mb-1 text-2xl font-bold text-foreground">{t.reminderSettings}</h2>
                <p className="text-sm text-muted-foreground">{t.reminderSettings}</p>
              </div>
              <Suspense fallback={<TabPanelFallback />}>
                <ReminderSettings />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'meals' && (
            <motion.div
              key="meals"
              initial={tabPanelFrom(isMobile)}
              animate={{ opacity: 1, y: 0 }}
              exit={tabPanelExit(isMobile)}
              transition={tabPanelTransition(isMobile)}
              className="relative"
            >
                <div className="mb-4 sm:mb-6">
                  {mealPlan.length > 0 && (
                  <div className="flex w-full flex-wrap items-center gap-2 min-h-9">
                    <div className="grid w-full min-w-0 grid-cols-[minmax(72px,auto)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
                      <ExportMealPlan mealPlan={mealPlan} pdfOnly />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11 min-w-0 rounded-2xl border-primary/25 bg-white px-3 text-[11px] font-semibold min-[390px]:text-xs sm:h-10 sm:text-sm"
                        onClick={() => navigate("/scan")}
                      >
                        <Refrigerator className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{pageCopy.detectIngredients}</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-11 min-w-0 rounded-2xl bg-[linear-gradient(135deg,#75FBB2_0%,#39D47F_100%)] px-3 text-[11px] font-semibold text-[#082013] min-[390px]:text-xs sm:h-10 sm:text-sm"
                        onClick={generateMealPlan}
                        disabled={isGenerating}
                      >
                        <span className="truncate">
                          {isGenerating ? (
                            pageCopy.creating
                          ) : (
                            <>
                              <span className="min-[390px]:hidden">{pageCopy.createShort}</span>
                              <span className="hidden min-[390px]:inline">{pageCopy.createMealPlan}</span>
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                  </div>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {mealPlan.length === 0 && !isGenerating && (
                    <Card className="border-primary/20 bg-card/90 p-6 text-center sm:p-8">
                      <Calendar className="mx-auto mb-4 h-12 w-12 text-primary" />
                      <h3 className="text-lg font-bold mb-2">
                        {t.onboardingFirstWeeklyPlanTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                        {t.onboardingFirstWeeklyPlanDesc}
                      </p>
                      <Button
                        type="button"
                        className="rounded-2xl bg-primary"
                        onClick={() => void generateMealPlan()}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t.createWeeklyPlan}
                      </Button>
                    </Card>
                  )}
                  {mealPlan.length > 0 && <AiDisclaimer className="px-1" />}
                  {mealPlan.map((day, dayIndex) => {
                    const isFocusedDay =
                      searchParams.get('day') !== null
                        ? Number.parseInt(searchParams.get('day') ?? '', 10) === dayIndex
                        : dayIndex === resolveTodayMealPlanDayIndex(mealPlan);

                    return (
                    <div
                      key={`${day.day}-${dayIndex}`}
                      id={`meal-plan-day-${dayIndex}`}
                      className="scroll-mt-28"
                    >
                      <Card
                        className={cn(
                          'p-3 sm:p-4 bg-card/90 sm:bg-card/80 sm:backdrop-blur-lg border-primary/20 transition-colors',
                          isFocusedDay && 'ring-2 ring-primary/25 border-primary/35',
                        )}
                      >
                        <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-primary">
                          {localizeWeekdayLabel(day.day, t, language, dayIndex)}
                        </h3>
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {day.meals.map((meal, mealIndex) => (
                            <div
                              key={mealIndex}
                              onClick={() => openMealDetail(meal)}
                              className="min-w-0 p-2 sm:p-3 bg-background/50 rounded-xl cursor-pointer hover:bg-primary/10 transition-all duration-200 active:scale-[0.98] touch-manipulation"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                  {localizeMealTypeLabel(meal.type, t)}
                                </p>
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
                    </div>
                    );
                  })}
                </div>
            </motion.div>
          )}

          {activeTab === 'shopping' && (
            <motion.div
              key="shopping"
              initial={tabPanelFrom(isMobile)}
              animate={{ opacity: 1, y: 0 }}
              exit={tabPanelExit(isMobile)}
              transition={tabPanelTransition(isMobile)}
            >
                {mealPlan.length === 0 && (
                  <Card className="mb-4 p-4 bg-amber-500/10 border-amber-500/30">
                    <p className="text-sm text-amber-700">
                      💡 {pageCopy.shoppingHint}
                    </p>
                  </Card>
                )}
                <ShoppingList mealPlan={mealPlan} />
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </div>

      <MealDetailDialog
        meal={selectedMeal}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onMealLogged={() => {
          // Refresh food entries when meal is logged from dialog
          toast({
            title: pageCopy.mealAddedTitle,
            description: pageCopy.mealAddedDesc
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
