import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Calendar, ChefHat, Sparkles, ShoppingCart, Flame, Loader2, Lock, TrendingDown, Droplets, Settings, XCircle, Check, Bell, User, BarChart3, Crown } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MealDetailDialog } from '@/components/MealDetailDialog';
import frigLogo from '@/assets/frig-logo.png';
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
import { AIChatbot } from '@/components/AIChatbot';
import { BottomNavigation } from '@/components/BottomNavigation';
import { PremiumSuccessDialog } from '@/components/PremiumSuccessDialog';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';

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

const MealPlansPage = () => {
  const { user, session, subscriptionStatus, loading, checkSubscription } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mealPlan, setMealPlan] = useState<DayPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSeconds, setGenerationSeconds] = useState(0);
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

  // Check if user is premium
  const isPremium = subscriptionStatus?.subscribed || false;

  // Get meal plan generation count for free users
  const [mealPlanGenerationCount, setMealPlanGenerationCount] = useState(0);
  
  useEffect(() => {
    const count = parseInt(localStorage.getItem('mealPlanGenerationCount') || '0', 10);
    setMealPlanGenerationCount(count);
  }, []);

  // Free users: can generate meal plan once (initial + 1 regeneration = 2 total)
  const maxFreeGenerations = 2;
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

  // Load saved meal plan on mount
  useEffect(() => {
    const saved = localStorage.getItem('weeklyMealPlan');
    if (saved) {
      try {
        setMealPlan(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved meal plan');
      }
    }
  }, []);

  // Track elapsed time during meal plan generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setGenerationSeconds(0);
      interval = setInterval(() => {
        setGenerationSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

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
      navigate('/premium');
      return;
    }

    setIsGenerating(true);
    try {
      // Use tracker settings from database/hook (single source of truth)
      const dailyCalories = trackerSettings.dailyCalories || 1600;
      const dailyProtein = trackerSettings.dailyProtein || Math.round(dailyCalories * 0.3 / 4);
      const dailyCarbs = trackerSettings.dailyCarbs || Math.round(dailyCalories * 0.4 / 4);
      const dailyFat = trackerSettings.dailyFat || Math.round(dailyCalories * 0.3 / 9);

      console.log('[MEAL-PLAN] Using tracker settings:', { dailyCalories, dailyProtein, dailyCarbs, dailyFat });

      // Prefer invoke (handles base URL). We also pass the session token explicitly for reliability.
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { preferences: '', dailyCalories, dailyProtein, dailyCarbs, dailyFat },
      });

      console.log('[MEAL-PLAN] Function response:', {
        hasMealPlan: Boolean((data as any)?.mealPlan),
        days: Array.isArray((data as any)?.mealPlan) ? (data as any).mealPlan.length : null,
      });

      if (error) {
        // Try to extract the function's JSON error for a helpful message
        let details = (error as any)?.message ? String((error as any).message) : String(error);

        const resp: Response | undefined = (error as any)?.context;
        if (resp && typeof (resp as any).text === 'function') {
          try {
            const text = await resp.text();
            if (text) {
              try {
                const parsed = JSON.parse(text);
                details = parsed?.error || parsed?.message || details;
              } catch {
                details = text;
              }
            }
          } catch {
            // ignore
          }
        }

        throw new Error(details);
      }

      if (Array.isArray((data as any)?.mealPlan) && (data as any).mealPlan.length > 0) {
        setMealPlan((data as any).mealPlan);
        localStorage.setItem('weeklyMealPlan', JSON.stringify((data as any).mealPlan));
        
        // Track generation count for free users
        if (!isPremium) {
          const newCount = mealPlanGenerationCount + 1;
          setMealPlanGenerationCount(newCount);
          localStorage.setItem('mealPlanGenerationCount', String(newCount));
        }
        
        toast({ title: t.newPlanGenerated, description: t.planWithKcal.replace('{kcal}', String(dailyCalories)) });
      } else {
        throw new Error('Leerer Wochenplan erhalten');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error generating meal plan:', message);
      toast({
        title: t.error,
        description: message ? `${t.couldNotGeneratePlan} (${message})` : t.couldNotGeneratePlan,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
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
    if ((value === 'meals' || value === 'shopping' || value === 'water' || value === 'progress') && !trackerSetup) {
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

  const hasGeneratedPlan = mealPlan.length > 0;

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
    <div className="min-h-screen bg-gradient-primary safe-area-inset">
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20 safe-top">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
              className="mr-2 touch-target h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <NavLink to="/">
              <div className="flex items-center gap-2">
                <img src={frigLogo} alt="FrigBuddy" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
                <h1 className="text-lg sm:text-xl font-bold neon-text hidden sm:block">FrigBuddy</h1>
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
                  description="Upgrade auf Premium für detaillierte Statistiken und Makro-Tracking"
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold neon-text mb-1">{t.weeklyPlan}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t.tip}</p>
                  {!hasGeneratedPlan && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hinweis: Du siehst gerade einen Demo-Plan. Klicke auf „{t.generateNewPlan}", um deinen echten Plan zu laden.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <ExportMealPlan mealPlan={mealPlan} />
                  <div className="flex items-center gap-2">
                    {!isPremium && (
                      <span className="text-xs text-muted-foreground">
                        {mealPlanGenerationCount}/{maxFreeGenerations} Generierungen
                      </span>
                    )}
                    <Button 
                      className="glow-button shrink-0 touch-target text-xs sm:text-sm" 
                      size="sm"
                      onClick={generateMealPlan}
                      disabled={isGenerating || !trackerSetup || !canGenerateMealPlan}
                    >
                      {isGenerating ? (() => {
                        const expectedSeconds = 40;
                        const remaining = Math.max(5, expectedSeconds - generationSeconds);
                        const label = generationSeconds < expectedSeconds
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
                            onClick={() => openMealDetail(meal)}
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
          </TabsContent>

          <TabsContent value="shopping">
            <div className="relative">
              {!isPremium && (
                <PremiumLockOverlay 
                  title="Einkaufsliste"
                  description="Upgrade auf Premium für automatische Einkaufslisten"
                />
              )}
              <div className={!isPremium ? "pointer-events-none" : ""}>
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

      {/* AI Chatbot */}
      <AIChatbot userProfile={trackerSettings} onResetTracker={handleResetTracker} />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} trackerSetup={trackerSetup} trackerLoading={trackerLoading} onTabChange={setActiveTab} />
    </div>
  );
};

export default MealPlansPage;
