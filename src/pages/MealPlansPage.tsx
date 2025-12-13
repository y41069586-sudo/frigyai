import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Calendar, ChefHat, Sparkles, ShoppingCart, Flame, Loader2, Lock, TrendingDown, Droplets, Settings, XCircle, Check, Bell, User } from 'lucide-react';
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
import { useReminders } from '@/hooks/useReminders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import StreakBadge from '@/components/StreakBadge';
import { AIChatbot } from '@/components/AIChatbot';
import { BottomNavigation } from '@/components/BottomNavigation';
import { PremiumSuccessDialog } from '@/components/PremiumSuccessDialog';

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
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [trackerSetup, setTrackerSetup] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isActivatingSubscription, setIsActivatingSubscription] = useState(false);

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

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (loading) return;
    
    // Don't redirect if coming from successful subscription - wait for status to update
    const subscriptionParam = searchParams.get('subscription');
    if (subscriptionParam === 'success') return;
    
    if (!user) {
      navigate('/auth');
    } else if (subscriptionStatus !== null && !subscriptionStatus.subscribed) {
      navigate('/premium');
    }
  }, [user, subscriptionStatus, loading, navigate, searchParams]);

  // Check tracker setup and load saved meal plan
  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    setTrackerSetup(!!profile);
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (e) {
        console.error('Failed to parse user profile');
      }
    }
    
    const saved = localStorage.getItem('weeklyMealPlan');
    if (saved) {
      try {
        setMealPlan(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved meal plan');
      }
    }
  }, []);

  // Listen for tracker setup changes
  const handleTrackerSetup = () => {
    const profile = localStorage.getItem('userProfile');
    setTrackerSetup(!!profile);
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (e) {
        console.error('Failed to parse user profile');
      }
    }
  };

  // Handle tracker reset from chatbot
  const handleResetTracker = () => {
    setTrackerSetup(false);
    setUserProfile(null);
    setActiveTab('tracker');
  };

  const generateMealPlan = async () => {
    if (!trackerSetup) {
      toast({ 
        title: t.setupTracker, 
        description: t.setupTrackerFirst, 
        variant: 'destructive' 
      });
      setActiveTab('tracker');
      return;
    }

    setIsGenerating(true);
    try {
      // Get user's full macro profile from tracker
      const profileData = localStorage.getItem('userProfile');
      let dailyCalories = 1600;
      let dailyProtein = 120;
      let dailyCarbs = 160;
      let dailyFat = 53;
      
      if (profileData) {
        const profile = JSON.parse(profileData);
        dailyCalories = profile.dailyCalories || 1600;
        dailyProtein = profile.dailyProtein || Math.round(dailyCalories * 0.3 / 4);
        dailyCarbs = profile.dailyCarbs || Math.round(dailyCalories * 0.4 / 4);
        dailyFat = profile.dailyFat || Math.round(dailyCalories * 0.3 / 9);
        
        console.log('[MEAL-PLAN] Using profile targets:', { dailyCalories, dailyProtein, dailyCarbs, dailyFat });
      } else {
        console.log('[MEAL-PLAN] No profile found, using defaults');
      }

      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: { preferences: '', dailyCalories, dailyProtein, dailyCarbs, dailyFat },
      });

      if (error) throw error;

      if (data?.mealPlan) {
        setMealPlan(data.mealPlan);
        localStorage.setItem('weeklyMealPlan', JSON.stringify(data.mealPlan));
        toast({ title: t.newPlanGenerated, description: t.planWithKcal.replace('{kcal}', String(dailyCalories)) });
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({ title: t.error, description: t.couldNotGeneratePlan, variant: 'destructive' });
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

  // Default mock data if no plan generated yet
  const displayPlan = mealPlan.length > 0 ? mealPlan : [
    { day: 'Montag', meals: [
      { type: 'Frühstück', name: 'Griechischer Joghurt Bowl', calories: 320, protein: 25, carbs: 35, fat: 8, prepTime: 5, ingredients: [{ name: 'Griechischer Joghurt 0%', amount: '200g', price: 1.20 }, { name: 'Beeren', amount: '100g', price: 1.50 }], instructions: ['Joghurt in eine Schüssel geben', 'Mit Beeren toppen'] },
      { type: 'Snack', name: 'Mandeln & Apfel', calories: 160, protein: 5, carbs: 15, fat: 10, prepTime: 1, ingredients: [{ name: 'Mandeln', amount: '20g', price: 0.50 }, { name: 'Apfel', amount: '1', price: 0.40 }], instructions: ['Mandeln portionieren', 'Apfel waschen'] },
      { type: 'Mittagessen', name: 'Hähnchen-Salat', calories: 480, protein: 40, carbs: 25, fat: 18, prepTime: 15, ingredients: [{ name: 'Hähnchenbrust', amount: '180g', price: 3.00 }, { name: 'Salat Mix', amount: '150g', price: 1.20 }], instructions: ['Hähnchen braten', 'Mit Salat servieren'] },
      { type: 'Snack', name: 'Magerquark mit Honig', calories: 150, protein: 20, carbs: 12, fat: 1, prepTime: 2, ingredients: [{ name: 'Magerquark', amount: '150g', price: 0.70 }, { name: 'Honig', amount: '10g', price: 0.20 }], instructions: ['Quark in Schüssel geben', 'Mit Honig süßen'] },
      { type: 'Abendessen', name: 'Lachs mit Gemüse', calories: 420, protein: 35, carbs: 20, fat: 22, prepTime: 20, ingredients: [{ name: 'Lachs', amount: '150g', price: 4.50 }, { name: 'Brokkoli', amount: '200g', price: 1.20 }], instructions: ['Lachs braten', 'Gemüse dünsten'] }
    ]},
    { day: 'Dienstag', meals: [
      { type: 'Frühstück', name: 'Protein Pancakes', calories: 350, protein: 28, carbs: 40, fat: 10, prepTime: 10, ingredients: [{ name: 'Proteinpulver', amount: '30g', price: 0.80 }, { name: 'Haferflocken', amount: '50g', price: 0.30 }], instructions: ['Zutaten mischen', 'In der Pfanne braten'] },
      { type: 'Snack', name: 'Hüttenkäse mit Gurke', calories: 120, protein: 15, carbs: 5, fat: 4, prepTime: 2, ingredients: [{ name: 'Hüttenkäse', amount: '100g', price: 0.80 }, { name: 'Gurke', amount: '50g', price: 0.20 }], instructions: ['Hüttenkäse portionieren', 'Mit Gurke servieren'] },
      { type: 'Mittagessen', name: 'Quinoa Bowl', calories: 450, protein: 25, carbs: 50, fat: 16, prepTime: 15, ingredients: [{ name: 'Quinoa', amount: '80g', price: 1.00 }, { name: 'Kichererbsen', amount: '100g', price: 0.70 }], instructions: ['Quinoa kochen', 'Mit Kichererbsen toppen'] },
      { type: 'Snack', name: 'Proteinriegel', calories: 180, protein: 20, carbs: 15, fat: 6, prepTime: 0, ingredients: [{ name: 'Proteinriegel', amount: '1', price: 2.00 }], instructions: ['Auspacken und genießen'] },
      { type: 'Abendessen', name: 'Puten-Wrap', calories: 400, protein: 32, carbs: 38, fat: 14, prepTime: 10, ingredients: [{ name: 'Putenbrust', amount: '150g', price: 2.50 }, { name: 'Wrap', amount: '1 Stück', price: 0.50 }], instructions: ['Pute braten', 'In Wrap wickeln'] }
    ]},
    { day: 'Mittwoch', meals: [
      { type: 'Frühstück', name: 'Avocado Toast', calories: 340, protein: 12, carbs: 30, fat: 20, prepTime: 5, ingredients: [{ name: 'Avocado', amount: '1/2', price: 1.00 }, { name: 'Vollkornbrot', amount: '2 Scheiben', price: 0.40 }], instructions: ['Avocado zerdrücken', 'Auf Toast verteilen'] },
      { type: 'Snack', name: 'Skyr Natur', calories: 100, protein: 12, carbs: 6, fat: 0, prepTime: 1, ingredients: [{ name: 'Skyr', amount: '150g', price: 0.90 }], instructions: ['Skyr in Schüssel geben'] },
      { type: 'Mittagessen', name: 'Thunfisch-Salat', calories: 420, protein: 40, carbs: 18, fat: 18, prepTime: 10, ingredients: [{ name: 'Thunfisch', amount: '180g', price: 2.50 }, { name: 'Gemischter Salat', amount: '150g', price: 1.20 }], instructions: ['Thunfisch abtropfen', 'Mit Salat mischen'] },
      { type: 'Snack', name: 'Gekochtes Ei', calories: 140, protein: 12, carbs: 1, fat: 10, prepTime: 10, ingredients: [{ name: 'Eier', amount: '2', price: 0.60 }], instructions: ['Eier kochen', 'Schälen'] },
      { type: 'Abendessen', name: 'Rindfleisch-Pfanne', calories: 450, protein: 38, carbs: 20, fat: 25, prepTime: 20, ingredients: [{ name: 'Rindfleisch', amount: '150g', price: 4.00 }, { name: 'Paprika', amount: '200g', price: 1.50 }], instructions: ['Rindfleisch anbraten', 'Gemüse hinzufügen'] }
    ]},
    { day: 'Donnerstag', meals: [
      { type: 'Frühstück', name: 'Smoothie Bowl', calories: 300, protein: 20, carbs: 40, fat: 8, prepTime: 5, ingredients: [{ name: 'Gefrorene Beeren', amount: '150g', price: 1.80 }, { name: 'Proteinpulver', amount: '25g', price: 0.70 }], instructions: ['Alles mixen', 'In Schüssel geben'] },
      { type: 'Snack', name: 'Nüsse & Trockenfrüchte', calories: 180, protein: 5, carbs: 18, fat: 11, prepTime: 0, ingredients: [{ name: 'Nussmix', amount: '30g', price: 0.80 }], instructions: ['Portionieren'] },
      { type: 'Mittagessen', name: 'Linsen-Suppe', calories: 400, protein: 25, carbs: 50, fat: 10, prepTime: 15, ingredients: [{ name: 'Rote Linsen', amount: '100g', price: 0.80 }, { name: 'Karotten', amount: '100g', price: 0.40 }], instructions: ['Linsen kochen', 'Gemüse hinzufügen'] },
      { type: 'Snack', name: 'Griechischer Joghurt', calories: 120, protein: 18, carbs: 5, fat: 3, prepTime: 1, ingredients: [{ name: 'Griechischer Joghurt 0%', amount: '170g', price: 1.00 }], instructions: ['In Schüssel geben'] },
      { type: 'Abendessen', name: 'Garnelen mit Reis', calories: 420, protein: 32, carbs: 48, fat: 12, prepTime: 20, ingredients: [{ name: 'Garnelen', amount: '150g', price: 5.00 }, { name: 'Reis', amount: '80g', price: 0.30 }], instructions: ['Garnelen braten', 'Mit Reis servieren'] }
    ]},
    { day: 'Freitag', meals: [
      { type: 'Frühstück', name: 'Eier mit Spinat', calories: 280, protein: 22, carbs: 8, fat: 18, prepTime: 10, ingredients: [{ name: 'Eier', amount: '3', price: 0.90 }, { name: 'Spinat', amount: '100g', price: 1.00 }], instructions: ['Eier verquirlen', 'Mit Spinat braten'] },
      { type: 'Snack', name: 'Mozzarella Sticks', calories: 150, protein: 12, carbs: 2, fat: 11, prepTime: 2, ingredients: [{ name: 'Mini Mozzarella', amount: '50g', price: 1.00 }], instructions: ['Auspacken'] },
      { type: 'Mittagessen', name: 'Buddha Bowl', calories: 450, protein: 22, carbs: 55, fat: 18, prepTime: 15, ingredients: [{ name: 'Süßkartoffel', amount: '150g', price: 0.80 }, { name: 'Hummus', amount: '50g', price: 0.70 }, { name: 'Hähnchen', amount: '100g', price: 1.80 }], instructions: ['Süßkartoffel backen', 'Alles zusammenstellen'] },
      { type: 'Snack', name: 'Edamame', calories: 120, protein: 12, carbs: 9, fat: 5, prepTime: 3, ingredients: [{ name: 'Edamame', amount: '100g', price: 1.50 }], instructions: ['In Salzwasser kochen'] },
      { type: 'Abendessen', name: 'Hähnchen-Curry', calories: 420, protein: 38, carbs: 32, fat: 16, prepTime: 20, ingredients: [{ name: 'Hähnchen', amount: '170g', price: 2.80 }, { name: 'Kokosmilch light', amount: '100ml', price: 0.80 }], instructions: ['Hähnchen anbraten', 'Sauce hinzufügen'] }
    ]},
    { day: 'Samstag', meals: [
      { type: 'Frühstück', name: 'French Toast', calories: 350, protein: 18, carbs: 40, fat: 12, prepTime: 10, ingredients: [{ name: 'Vollkornbrot', amount: '2 Scheiben', price: 0.40 }, { name: 'Ei', amount: '2', price: 0.60 }], instructions: ['Brot in Ei tauchen', 'Golden braten'] },
      { type: 'Snack', name: 'Harzer Käse', calories: 80, protein: 15, carbs: 0, fat: 1, prepTime: 0, ingredients: [{ name: 'Harzer Käse', amount: '50g', price: 0.60 }], instructions: ['In Scheiben schneiden'] },
      { type: 'Mittagessen', name: 'Caesar Salat', calories: 450, protein: 35, carbs: 22, fat: 26, prepTime: 15, ingredients: [{ name: 'Hähnchenbrust', amount: '150g', price: 2.50 }, { name: 'Romana Salat', amount: '150g', price: 1.50 }], instructions: ['Hähnchen braten', 'Mit Salat und Dressing mischen'] },
      { type: 'Snack', name: 'Protein Shake', calories: 150, protein: 25, carbs: 5, fat: 3, prepTime: 2, ingredients: [{ name: 'Proteinpulver', amount: '30g', price: 0.80 }, { name: 'Milch 1.5%', amount: '200ml', price: 0.25 }], instructions: ['Alles shaken'] },
      { type: 'Abendessen', name: 'Steak mit Salat', calories: 480, protein: 42, carbs: 10, fat: 30, prepTime: 15, ingredients: [{ name: 'Rindersteak', amount: '200g', price: 6.00 }, { name: 'Rucola', amount: '100g', price: 1.20 }], instructions: ['Steak braten', 'Mit Salat servieren'] }
    ]},
    { day: 'Sonntag', meals: [
      { type: 'Frühstück', name: 'Omelett', calories: 320, protein: 24, carbs: 5, fat: 22, prepTime: 10, ingredients: [{ name: 'Eier', amount: '3', price: 0.90 }, { name: 'Champignons', amount: '100g', price: 1.00 }], instructions: ['Eier verquirlen', 'Mit Pilzen braten'] },
      { type: 'Snack', name: 'Quark mit Beeren', calories: 140, protein: 18, carbs: 12, fat: 1, prepTime: 2, ingredients: [{ name: 'Magerquark', amount: '150g', price: 0.70 }, { name: 'Beeren', amount: '50g', price: 0.80 }], instructions: ['Quark mit Beeren mischen'] },
      { type: 'Mittagessen', name: 'Poke Bowl', calories: 450, protein: 32, carbs: 45, fat: 16, prepTime: 15, ingredients: [{ name: 'Lachs', amount: '140g', price: 4.20 }, { name: 'Sushi Reis', amount: '80g', price: 0.40 }], instructions: ['Reis kochen', 'Mit Lachs toppen'] },
      { type: 'Snack', name: 'Thunfisch auf Cracker', calories: 130, protein: 18, carbs: 8, fat: 3, prepTime: 3, ingredients: [{ name: 'Thunfisch', amount: '60g', price: 0.80 }, { name: 'Vollkorn Cracker', amount: '2', price: 0.30 }], instructions: ['Thunfisch auf Cracker verteilen'] },
      { type: 'Abendessen', name: 'Lachs Teriyaki', calories: 420, protein: 35, carbs: 28, fat: 20, prepTime: 20, ingredients: [{ name: 'Lachs', amount: '150g', price: 4.50 }, { name: 'Teriyaki Sauce', amount: '30ml', price: 0.50 }], instructions: ['Lachs marinieren', 'Im Ofen backen'] }
    ]}
  ];

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
              onClick={() => navigate('/')}
              className="mr-2 touch-target h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <NavLink to="/">
              <div className="flex items-center gap-2">
                <img src={frigLogo} alt="FriG AI" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
                <h1 className="text-lg sm:text-xl font-bold neon-text hidden sm:block">FriG AI</h1>
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
            <ProgressTracker />
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
                </div>
                <div className="flex items-center justify-between gap-2">
                  <ExportMealPlan mealPlan={displayPlan} />
                  <Button 
                    className="glow-button shrink-0 touch-target text-xs sm:text-sm" 
                    size="sm"
                    onClick={generateMealPlan}
                    disabled={isGenerating || !trackerSetup}
                  >
                    {isGenerating ? (
                      <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> <span className="hidden sm:inline">{t.loading}</span></>
                    ) : (
                      <><Calendar className="mr-1 h-4 w-4" /> <span className="sm:hidden">{t.generateNewPlan.split(' ')[0]}</span><span className="hidden sm:inline">{t.generateNewPlan}</span></>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {displayPlan.map((day, index) => (
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
            <ShoppingList mealPlan={displayPlan} />
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

      {/* Premium Success Dialog */}
      <PremiumSuccessDialog 
        open={showSuccessDialog} 
        onClose={() => setShowSuccessDialog(false)} 
      />

      {/* AI Chatbot */}
      <AIChatbot userProfile={userProfile} onResetTracker={handleResetTracker} />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} trackerSetup={trackerSetup} onTabChange={setActiveTab} />
    </div>
  );
};

export default MealPlansPage;
