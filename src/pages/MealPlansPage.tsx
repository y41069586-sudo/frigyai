import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, ChefHat, Sparkles, ShoppingCart, Flame, Loader2, Lock } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MealDetailDialog } from '@/components/MealDetailDialog';
import { ShoppingList } from '@/components/ShoppingList';
import { MacroTracker } from '@/components/MacroTracker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  const { user, subscriptionStatus, loading } = useAuth();
  const navigate = useNavigate();
  const [mealPlan, setMealPlan] = useState<DayPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [trackerSetup, setTrackerSetup] = useState(false);
  const [activeTab, setActiveTab] = useState('tracker');

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
    } else if (subscriptionStatus !== null && !subscriptionStatus.subscribed) {
      navigate('/premium');
    }
  }, [user, subscriptionStatus, loading, navigate]);

  // Check tracker setup and load saved meal plan
  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    setTrackerSetup(!!profile);
    
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
  };

  const generateMealPlan = async () => {
    if (!trackerSetup) {
      toast({ 
        title: 'Tracker einrichten', 
        description: 'Bitte richte zuerst deinen Tracker ein', 
        variant: 'destructive' 
      });
      setActiveTab('tracker');
      return;
    }

    setIsGenerating(true);
    try {
      // Get user's daily calorie target from tracker
      const profileData = localStorage.getItem('userProfile');
      let dailyCalories = 1600;
      if (profileData) {
        const profile = JSON.parse(profileData);
        dailyCalories = profile.dailyCalories || 1600;
      }

      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: { preferences: '', dailyCalories },
      });

      if (error) throw error;

      if (data?.mealPlan) {
        setMealPlan(data.mealPlan);
        localStorage.setItem('weeklyMealPlan', JSON.stringify(data.mealPlan));
        toast({ title: 'Neuer Wochenplan generiert!', description: `Plan mit ${dailyCalories} kcal/Tag erstellt.` });
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({ title: 'Fehler', description: 'Konnte Wochenplan nicht generieren', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const openMealDetail = (meal: Meal) => {
    setSelectedMeal(meal);
    setDialogOpen(true);
  };

  const handleTabChange = (value: string) => {
    if ((value === 'meals' || value === 'shopping') && !trackerSetup) {
      toast({ 
        title: 'Tracker einrichten', 
        description: 'Bitte richte zuerst deinen Tracker ein', 
        variant: 'destructive' 
      });
      return;
    }
    setActiveTab(value);
  };

  // Default mock data if no plan generated yet
  const displayPlan = mealPlan.length > 0 ? mealPlan : [
    { day: 'Montag', meals: [
      { type: 'Frühstück', name: 'Griechischer Joghurt Bowl', calories: 320, protein: 25, carbs: 35, fat: 8, prepTime: 5, ingredients: [{ name: 'Griechischer Joghurt 0%', amount: '200g', price: 1.20 }, { name: 'Beeren', amount: '100g', price: 1.50 }], instructions: ['Joghurt in eine Schüssel geben', 'Mit Beeren toppen'] },
      { type: 'Mittagessen', name: 'Hähnchen-Salat', calories: 380, protein: 35, carbs: 20, fat: 15, prepTime: 15, ingredients: [{ name: 'Hähnchenbrust', amount: '150g', price: 2.50 }, { name: 'Salat Mix', amount: '100g', price: 1.00 }], instructions: ['Hähnchen braten', 'Mit Salat servieren'] },
      { type: 'Abendessen', name: 'Lachs mit Gemüse', calories: 420, protein: 32, carbs: 25, fat: 22, prepTime: 20, ingredients: [{ name: 'Lachs', amount: '150g', price: 4.50 }, { name: 'Brokkoli', amount: '200g', price: 1.20 }], instructions: ['Lachs braten', 'Gemüse dünsten'] }
    ]},
    { day: 'Dienstag', meals: [
      { type: 'Frühstück', name: 'Protein Pancakes', calories: 350, protein: 28, carbs: 40, fat: 10, prepTime: 10, ingredients: [{ name: 'Proteinpulver', amount: '30g', price: 0.80 }, { name: 'Haferflocken', amount: '50g', price: 0.30 }], instructions: ['Zutaten mischen', 'In der Pfanne braten'] },
      { type: 'Mittagessen', name: 'Quinoa Bowl', calories: 400, protein: 22, carbs: 45, fat: 14, prepTime: 15, ingredients: [{ name: 'Quinoa', amount: '80g', price: 1.00 }, { name: 'Kichererbsen', amount: '100g', price: 0.70 }], instructions: ['Quinoa kochen', 'Mit Kichererbsen toppen'] },
      { type: 'Abendessen', name: 'Puten-Wrap', calories: 380, protein: 30, carbs: 35, fat: 12, prepTime: 10, ingredients: [{ name: 'Putenbrust', amount: '120g', price: 2.20 }, { name: 'Wrap', amount: '1 Stück', price: 0.50 }], instructions: ['Pute braten', 'In Wrap wickeln'] }
    ]},
    { day: 'Mittwoch', meals: [
      { type: 'Frühstück', name: 'Avocado Toast', calories: 340, protein: 12, carbs: 30, fat: 20, prepTime: 5, ingredients: [{ name: 'Avocado', amount: '1/2', price: 1.00 }, { name: 'Vollkornbrot', amount: '2 Scheiben', price: 0.40 }], instructions: ['Avocado zerdrücken', 'Auf Toast verteilen'] },
      { type: 'Mittagessen', name: 'Thunfisch-Salat', calories: 320, protein: 35, carbs: 15, fat: 14, prepTime: 10, ingredients: [{ name: 'Thunfisch', amount: '150g', price: 2.00 }, { name: 'Gemischter Salat', amount: '150g', price: 1.20 }], instructions: ['Thunfisch abtropfen', 'Mit Salat mischen'] },
      { type: 'Abendessen', name: 'Rindfleisch-Pfanne', calories: 450, protein: 38, carbs: 20, fat: 25, prepTime: 20, ingredients: [{ name: 'Rindfleisch', amount: '150g', price: 4.00 }, { name: 'Paprika', amount: '200g', price: 1.50 }], instructions: ['Rindfleisch anbraten', 'Gemüse hinzufügen'] }
    ]},
    { day: 'Donnerstag', meals: [
      { type: 'Frühstück', name: 'Smoothie Bowl', calories: 300, protein: 20, carbs: 40, fat: 8, prepTime: 5, ingredients: [{ name: 'Gefrorene Beeren', amount: '150g', price: 1.80 }, { name: 'Banane', amount: '1', price: 0.20 }], instructions: ['Alles mixen', 'In Schüssel geben'] },
      { type: 'Mittagessen', name: 'Linsen-Suppe', calories: 350, protein: 22, carbs: 45, fat: 8, prepTime: 15, ingredients: [{ name: 'Rote Linsen', amount: '100g', price: 0.80 }, { name: 'Karotten', amount: '100g', price: 0.40 }], instructions: ['Linsen kochen', 'Gemüse hinzufügen'] },
      { type: 'Abendessen', name: 'Garnelen mit Reis', calories: 400, protein: 30, carbs: 45, fat: 12, prepTime: 20, ingredients: [{ name: 'Garnelen', amount: '150g', price: 5.00 }, { name: 'Reis', amount: '80g', price: 0.30 }], instructions: ['Garnelen braten', 'Mit Reis servieren'] }
    ]},
    { day: 'Freitag', meals: [
      { type: 'Frühstück', name: 'Eier mit Spinat', calories: 280, protein: 22, carbs: 8, fat: 18, prepTime: 10, ingredients: [{ name: 'Eier', amount: '3', price: 0.90 }, { name: 'Spinat', amount: '100g', price: 1.00 }], instructions: ['Eier verquirlen', 'Mit Spinat braten'] },
      { type: 'Mittagessen', name: 'Buddha Bowl', calories: 420, protein: 18, carbs: 50, fat: 16, prepTime: 15, ingredients: [{ name: 'Süßkartoffel', amount: '150g', price: 0.80 }, { name: 'Hummus', amount: '50g', price: 0.70 }], instructions: ['Süßkartoffel backen', 'Alles zusammenstellen'] },
      { type: 'Abendessen', name: 'Hähnchen-Curry', calories: 400, protein: 35, carbs: 30, fat: 15, prepTime: 20, ingredients: [{ name: 'Hähnchen', amount: '150g', price: 2.50 }, { name: 'Kokosmilch light', amount: '100ml', price: 0.80 }], instructions: ['Hähnchen anbraten', 'Sauce hinzufügen'] }
    ]},
    { day: 'Samstag', meals: [
      { type: 'Frühstück', name: 'French Toast', calories: 350, protein: 18, carbs: 40, fat: 12, prepTime: 10, ingredients: [{ name: 'Vollkornbrot', amount: '2 Scheiben', price: 0.40 }, { name: 'Ei', amount: '2', price: 0.60 }], instructions: ['Brot in Ei tauchen', 'Golden braten'] },
      { type: 'Mittagessen', name: 'Caesar Salat', calories: 380, protein: 28, carbs: 20, fat: 22, prepTime: 15, ingredients: [{ name: 'Romana Salat', amount: '150g', price: 1.50 }, { name: 'Parmesan', amount: '30g', price: 1.00 }], instructions: ['Salat waschen', 'Mit Dressing mischen'] },
      { type: 'Abendessen', name: 'Steak mit Salat', calories: 480, protein: 42, carbs: 10, fat: 30, prepTime: 15, ingredients: [{ name: 'Rindersteak', amount: '200g', price: 6.00 }, { name: 'Rucola', amount: '100g', price: 1.20 }], instructions: ['Steak braten', 'Mit Salat servieren'] }
    ]},
    { day: 'Sonntag', meals: [
      { type: 'Frühstück', name: 'Omelett', calories: 320, protein: 24, carbs: 5, fat: 22, prepTime: 10, ingredients: [{ name: 'Eier', amount: '3', price: 0.90 }, { name: 'Champignons', amount: '100g', price: 1.00 }], instructions: ['Eier verquirlen', 'Mit Pilzen braten'] },
      { type: 'Mittagessen', name: 'Poke Bowl', calories: 400, protein: 30, carbs: 40, fat: 14, prepTime: 15, ingredients: [{ name: 'Lachs', amount: '120g', price: 3.60 }, { name: 'Sushi Reis', amount: '80g', price: 0.40 }], instructions: ['Reis kochen', 'Mit Lachs toppen'] },
      { type: 'Abendessen', name: 'Lachs Teriyaki', calories: 420, protein: 32, carbs: 25, fat: 22, prepTime: 20, ingredients: [{ name: 'Lachs', amount: '150g', price: 4.50 }, { name: 'Teriyaki Sauce', amount: '30ml', price: 0.50 }], instructions: ['Lachs marinieren', 'Im Ofen backen'] }
    ]}
  ];

  return (
    <div className="min-h-screen bg-gradient-primary">
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <NavLink to="/">
            <h1 className="text-2xl font-bold neon-text">Healthy3</h1>
          </NavLink>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-medium">Premium</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-primary/20">
            <TabsTrigger value="tracker" className="data-[state=active]:bg-primary/20">
              <Flame className="h-4 w-4 mr-2" />
              Tracker
            </TabsTrigger>
            <TabsTrigger 
              value="meals" 
              className={`data-[state=active]:bg-primary/20 ${!trackerSetup ? 'opacity-50' : ''}`}
            >
              {!trackerSetup && <Lock className="h-3 w-3 mr-1" />}
              <ChefHat className="h-4 w-4 mr-2" />
              Wochenplan
            </TabsTrigger>
            <TabsTrigger 
              value="shopping" 
              className={`data-[state=active]:bg-primary/20 ${!trackerSetup ? 'opacity-50' : ''}`}
            >
              {!trackerSetup && <Lock className="h-3 w-3 mr-1" />}
              <ShoppingCart className="h-4 w-4 mr-2" />
              Einkaufsliste
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracker">
            <MacroTracker onSetupComplete={handleTrackerSetup} />
          </TabsContent>

          <TabsContent value="meals">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold neon-text mb-1">Dein Wochenplan</h2>
                  <p className="text-sm text-muted-foreground">Klicke auf ein Gericht für Details</p>
                </div>
                <Button 
                  className="glow-button" 
                  onClick={generateMealPlan}
                  disabled={isGenerating || !trackerSetup}
                >
                  {isGenerating ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generiere...</>
                  ) : (
                    <><Calendar className="mr-2 h-5 w-5" /> Neue Woche</>
                  )}
                </Button>
              </div>

              <div className="grid gap-4">
                {displayPlan.map((day, index) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20 hover:shadow-neon transition-all duration-300">
                      <h3 className="text-lg font-bold mb-3 text-primary">{day.day}</h3>
                      <div className="grid md:grid-cols-3 gap-3">
                        {day.meals.map((meal, mealIndex) => (
                          <div
                            key={mealIndex}
                            onClick={() => openMealDetail(meal)}
                            className="p-3 bg-background/50 rounded-xl cursor-pointer hover:bg-primary/10 transition-all duration-200 hover:scale-[1.02]"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-muted-foreground">{meal.type}</p>
                              <span className="text-xs text-primary font-medium">{meal.calories} kcal</span>
                            </div>
                            <p className="font-medium text-sm">{meal.name}</p>
                            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="text-red-400">{meal.protein}g P</span>
                              <span className="text-amber-400">{meal.carbs}g K</span>
                              <span className="text-blue-400">{meal.fat}g F</span>
                            </div>
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
        </Tabs>
      </div>

      <MealDetailDialog 
        meal={selectedMeal} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  );
};

export default MealPlansPage;
