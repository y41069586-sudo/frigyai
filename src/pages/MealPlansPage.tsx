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

// Demo meal plan to show when no plan is generated yet
const DEMO_MEAL_PLAN: DayPlan[] = [
  {
    day: "Montag",
    meals: [
      { type: "Frühstück", name: "Haferflocken mit Beeren", calories: 350, protein: 12, carbs: 55, fat: 8, prepTime: 10, ingredients: [{ name: "Haferflocken", amount: "60g", price: 0.30 }, { name: "Beeren", amount: "100g", price: 1.50 }, { name: "Milch", amount: "200ml", price: 0.40 }], instructions: ["Haferflocken mit Milch kochen", "Mit Beeren toppen"] },
      { type: "Snack", name: "Griechischer Joghurt", calories: 150, protein: 15, carbs: 8, fat: 6, prepTime: 2, ingredients: [{ name: "Griechischer Joghurt", amount: "150g", price: 1.20 }], instructions: ["Joghurt in eine Schüssel geben"] },
      { type: "Mittagessen", name: "Hähnchen-Salat", calories: 450, protein: 35, carbs: 20, fat: 25, prepTime: 20, ingredients: [{ name: "Hähnchenbrust", amount: "150g", price: 2.50 }, { name: "Salat-Mix", amount: "100g", price: 1.00 }, { name: "Olivenöl", amount: "2 EL", price: 0.30 }], instructions: ["Hähnchen braten", "Mit Salat servieren"] },
      { type: "Snack", name: "Apfel mit Mandeln", calories: 180, protein: 5, carbs: 22, fat: 9, prepTime: 2, ingredients: [{ name: "Apfel", amount: "1 Stück", price: 0.50 }, { name: "Mandeln", amount: "20g", price: 0.80 }], instructions: ["Apfel waschen und mit Mandeln genießen"] },
      { type: "Abendessen", name: "Lachs mit Gemüse", calories: 500, protein: 38, carbs: 25, fat: 28, prepTime: 30, ingredients: [{ name: "Lachsfilet", amount: "150g", price: 4.00 }, { name: "Brokkoli", amount: "150g", price: 1.00 }, { name: "Reis", amount: "80g", price: 0.20 }], instructions: ["Lachs im Ofen backen", "Gemüse dünsten", "Mit Reis servieren"] }
    ]
  },
  {
    day: "Dienstag",
    meals: [
      { type: "Frühstück", name: "Rührei mit Toast", calories: 380, protein: 20, carbs: 30, fat: 20, prepTime: 15, ingredients: [{ name: "Eier", amount: "3 Stück", price: 0.90 }, { name: "Vollkorntoast", amount: "2 Scheiben", price: 0.40 }], instructions: ["Eier verrühren und braten", "Mit Toast servieren"] },
      { type: "Snack", name: "Banane", calories: 100, protein: 1, carbs: 25, fat: 0, prepTime: 1, ingredients: [{ name: "Banane", amount: "1 Stück", price: 0.30 }], instructions: ["Banane schälen und genießen"] },
      { type: "Mittagessen", name: "Thunfisch-Wrap", calories: 420, protein: 30, carbs: 40, fat: 15, prepTime: 10, ingredients: [{ name: "Thunfisch", amount: "100g", price: 1.80 }, { name: "Tortilla", amount: "1 Stück", price: 0.50 }, { name: "Salat", amount: "50g", price: 0.50 }], instructions: ["Thunfisch abtropfen", "In Tortilla wickeln mit Salat"] },
      { type: "Snack", name: "Proteinriegel", calories: 200, protein: 20, carbs: 18, fat: 8, prepTime: 0, ingredients: [{ name: "Proteinriegel", amount: "1 Stück", price: 2.00 }], instructions: ["Auspacken und genießen"] },
      { type: "Abendessen", name: "Pasta mit Pesto", calories: 520, protein: 18, carbs: 65, fat: 22, prepTime: 20, ingredients: [{ name: "Pasta", amount: "100g", price: 0.40 }, { name: "Pesto", amount: "2 EL", price: 1.00 }, { name: "Parmesan", amount: "20g", price: 0.80 }], instructions: ["Pasta kochen", "Mit Pesto und Parmesan mischen"] }
    ]
  },
  {
    day: "Mittwoch",
    meals: [
      { type: "Frühstück", name: "Smoothie Bowl", calories: 320, protein: 10, carbs: 50, fat: 10, prepTime: 10, ingredients: [{ name: "Gefrorene Beeren", amount: "150g", price: 1.50 }, { name: "Banane", amount: "1 Stück", price: 0.30 }, { name: "Granola", amount: "30g", price: 0.60 }], instructions: ["Beeren und Banane mixen", "Mit Granola toppen"] },
      { type: "Snack", name: "Hüttenkäse", calories: 120, protein: 14, carbs: 4, fat: 5, prepTime: 2, ingredients: [{ name: "Hüttenkäse", amount: "150g", price: 1.00 }], instructions: ["In Schüssel geben"] },
      { type: "Mittagessen", name: "Buddha Bowl", calories: 480, protein: 22, carbs: 55, fat: 20, prepTime: 25, ingredients: [{ name: "Quinoa", amount: "80g", price: 0.80 }, { name: "Kichererbsen", amount: "100g", price: 0.60 }, { name: "Avocado", amount: "0.5 Stück", price: 1.00 }], instructions: ["Quinoa kochen", "Alles in einer Bowl anrichten"] },
      { type: "Snack", name: "Karotten mit Hummus", calories: 150, protein: 5, carbs: 18, fat: 7, prepTime: 5, ingredients: [{ name: "Karotten", amount: "100g", price: 0.30 }, { name: "Hummus", amount: "50g", price: 0.80 }], instructions: ["Karotten schneiden", "Mit Hummus dippen"] },
      { type: "Abendessen", name: "Rindfleisch-Pfanne", calories: 550, protein: 40, carbs: 30, fat: 30, prepTime: 25, ingredients: [{ name: "Rindfleisch", amount: "150g", price: 4.50 }, { name: "Paprika", amount: "100g", price: 0.80 }, { name: "Zwiebeln", amount: "50g", price: 0.20 }], instructions: ["Rindfleisch anbraten", "Gemüse hinzufügen und braten"] }
    ]
  },
  {
    day: "Donnerstag",
    meals: [
      { type: "Frühstück", name: "Vollkornbrot mit Avocado", calories: 340, protein: 10, carbs: 35, fat: 18, prepTime: 8, ingredients: [{ name: "Vollkornbrot", amount: "2 Scheiben", price: 0.50 }, { name: "Avocado", amount: "0.5 Stück", price: 1.00 }], instructions: ["Avocado zerdrücken", "Auf Brot verteilen"] },
      { type: "Snack", name: "Nüsse-Mix", calories: 180, protein: 6, carbs: 8, fat: 16, prepTime: 0, ingredients: [{ name: "Gemischte Nüsse", amount: "30g", price: 1.00 }], instructions: ["Genießen"] },
      { type: "Mittagessen", name: "Gemüsesuppe mit Brot", calories: 380, protein: 12, carbs: 50, fat: 14, prepTime: 30, ingredients: [{ name: "Gemüse-Mix", amount: "300g", price: 2.00 }, { name: "Brühe", amount: "500ml", price: 0.50 }, { name: "Baguette", amount: "50g", price: 0.40 }], instructions: ["Gemüse in Brühe kochen", "Mit Brot servieren"] },
      { type: "Snack", name: "Quark mit Honig", calories: 140, protein: 12, carbs: 15, fat: 3, prepTime: 3, ingredients: [{ name: "Magerquark", amount: "150g", price: 0.80 }, { name: "Honig", amount: "1 TL", price: 0.20 }], instructions: ["Quark mit Honig mischen"] },
      { type: "Abendessen", name: "Putengeschnetzeltes", calories: 480, protein: 42, carbs: 35, fat: 18, prepTime: 25, ingredients: [{ name: "Putenbrust", amount: "150g", price: 2.50 }, { name: "Champignons", amount: "100g", price: 1.00 }, { name: "Sahne", amount: "50ml", price: 0.30 }], instructions: ["Pute anbraten", "Champignons und Sahne hinzufügen"] }
    ]
  },
  {
    day: "Freitag",
    meals: [
      { type: "Frühstück", name: "Müsli mit Milch", calories: 360, protein: 12, carbs: 55, fat: 10, prepTime: 5, ingredients: [{ name: "Müsli", amount: "60g", price: 0.60 }, { name: "Milch", amount: "200ml", price: 0.40 }], instructions: ["Müsli mit Milch übergießen"] },
      { type: "Snack", name: "Erdbeeren", calories: 50, protein: 1, carbs: 12, fat: 0, prepTime: 2, ingredients: [{ name: "Erdbeeren", amount: "150g", price: 2.00 }], instructions: ["Waschen und genießen"] },
      { type: "Mittagessen", name: "Falafel-Teller", calories: 520, protein: 18, carbs: 60, fat: 24, prepTime: 15, ingredients: [{ name: "Falafel", amount: "6 Stück", price: 2.50 }, { name: "Hummus", amount: "80g", price: 1.20 }, { name: "Pita", amount: "1 Stück", price: 0.50 }], instructions: ["Falafel aufwärmen", "Mit Hummus und Pita servieren"] },
      { type: "Snack", name: "Reiswaffeln", calories: 80, protein: 2, carbs: 16, fat: 1, prepTime: 0, ingredients: [{ name: "Reiswaffeln", amount: "3 Stück", price: 0.30 }], instructions: ["Genießen"] },
      { type: "Abendessen", name: "Pizza Margherita", calories: 600, protein: 24, carbs: 70, fat: 25, prepTime: 20, ingredients: [{ name: "Pizzateig", amount: "1 Stück", price: 1.50 }, { name: "Tomatensauce", amount: "100g", price: 0.60 }, { name: "Mozzarella", amount: "100g", price: 1.50 }], instructions: ["Teig ausrollen", "Mit Sauce und Käse belegen", "Im Ofen backen"] }
    ]
  },
  {
    day: "Samstag",
    meals: [
      { type: "Frühstück", name: "Pancakes", calories: 420, protein: 12, carbs: 55, fat: 18, prepTime: 20, ingredients: [{ name: "Mehl", amount: "100g", price: 0.20 }, { name: "Eier", amount: "2 Stück", price: 0.60 }, { name: "Ahornsirup", amount: "2 EL", price: 0.80 }], instructions: ["Teig anrühren", "Pancakes braten", "Mit Sirup servieren"] },
      { type: "Snack", name: "Orangensaft", calories: 110, protein: 2, carbs: 25, fat: 0, prepTime: 3, ingredients: [{ name: "Orangen", amount: "3 Stück", price: 1.50 }], instructions: ["Orangen auspressen"] },
      { type: "Mittagessen", name: "Burger mit Süßkartoffeln", calories: 650, protein: 35, carbs: 60, fat: 30, prepTime: 30, ingredients: [{ name: "Rindfleisch-Patty", amount: "150g", price: 3.00 }, { name: "Burger-Brötchen", amount: "1 Stück", price: 0.60 }, { name: "Süßkartoffeln", amount: "150g", price: 1.00 }], instructions: ["Patty braten", "Süßkartoffeln backen", "Burger zusammenbauen"] },
      { type: "Snack", name: "Schokolade (dunkel)", calories: 150, protein: 2, carbs: 14, fat: 10, prepTime: 0, ingredients: [{ name: "Dunkle Schokolade", amount: "30g", price: 0.80 }], instructions: ["Genießen"] },
      { type: "Abendessen", name: "Sushi-Platte", calories: 480, protein: 22, carbs: 65, fat: 12, prepTime: 10, ingredients: [{ name: "Sushi-Set", amount: "1 Portion", price: 12.00 }], instructions: ["Sushi servieren mit Sojasauce"] }
    ]
  },
  {
    day: "Sonntag",
    meals: [
      { type: "Frühstück", name: "Eggs Benedict", calories: 480, protein: 22, carbs: 30, fat: 32, prepTime: 25, ingredients: [{ name: "Eier", amount: "2 Stück", price: 0.60 }, { name: "English Muffin", amount: "1 Stück", price: 0.80 }, { name: "Schinken", amount: "50g", price: 1.00 }], instructions: ["Eier pochieren", "Mit Schinken auf Muffin servieren"] },
      { type: "Snack", name: "Smoothie", calories: 180, protein: 5, carbs: 35, fat: 3, prepTime: 5, ingredients: [{ name: "Banane", amount: "1 Stück", price: 0.30 }, { name: "Beeren", amount: "100g", price: 1.50 }, { name: "Milch", amount: "150ml", price: 0.30 }], instructions: ["Alles mixen"] },
      { type: "Mittagessen", name: "Braten mit Knödeln", calories: 680, protein: 40, carbs: 55, fat: 35, prepTime: 60, ingredients: [{ name: "Schweinebraten", amount: "200g", price: 4.00 }, { name: "Knödel", amount: "3 Stück", price: 1.50 }, { name: "Soße", amount: "100ml", price: 0.50 }], instructions: ["Braten im Ofen garen", "Knödel kochen", "Mit Soße servieren"] },
      { type: "Snack", name: "Obstsalat", calories: 120, protein: 2, carbs: 28, fat: 1, prepTime: 10, ingredients: [{ name: "Gemischtes Obst", amount: "200g", price: 2.00 }], instructions: ["Obst schneiden und mischen"] },
      { type: "Abendessen", name: "Leichte Gemüsepfanne", calories: 320, protein: 12, carbs: 40, fat: 12, prepTime: 20, ingredients: [{ name: "Zucchini", amount: "100g", price: 0.80 }, { name: "Paprika", amount: "100g", price: 0.80 }, { name: "Tofu", amount: "100g", price: 1.50 }], instructions: ["Gemüse und Tofu anbraten", "Mit Sojasauce würzen"] }
    ]
  }
];

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

  // Load saved meal plan on mount or show demo
  useEffect(() => {
    const saved = localStorage.getItem('weeklyMealPlan');
    if (saved) {
      try {
        setMealPlan(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved meal plan');
        // Show demo plan on error
        setMealPlan(DEMO_MEAL_PLAN);
      }
    } else {
      // No saved plan - show demo plan
      setMealPlan(DEMO_MEAL_PLAN);
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
      navigate('/premium-pricing');
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
      
      // Handle plan limit exceeded specifically
      if (message.includes('plan_limit_exceeded') || message.includes('wöchentlichen Wochenplan')) {
        toast({
          title: "Limit erreicht",
          description: "Du hast dein wöchentliches Limit erreicht. Upgrade auf Premium für unbegrenzte Pläne!",
          variant: 'destructive',
        });
        navigate('/premium-pricing');
      } else {
        toast({
          title: t.error,
          description: message ? `${t.couldNotGeneratePlan} (${message})` : t.couldNotGeneratePlan,
          variant: 'destructive',
        });
      }
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
                      disabled={isGenerating || !canGenerateMealPlan}
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
                  description="Upgrade auf Premium um diese Funktion zu sehen"
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
    </>
  );
};

export default MealPlansPage;
