import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChefHat, Clock, Zap, RefreshCw, Check, Target, TrendingDown, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MealReplacementDialog from "@/components/MealReplacementDialog";

interface Recipe {
  id: string;
  title: string;
  reason?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  isRecommended?: boolean;
}

interface ClarificationResponse {
  type: "clarification";
  message: string;
  suggestion: string | null;
}

interface RecipesResponse {
  type: "recipes";
  recipes: Recipe[];
  recommendedReason?: string;
  analyse?: {
    gefundene_zutaten: string[];
    beste_kombinationen: string;
    makro_optimierung: string;
  };
  budgetAfterMeal?: {
    remainingCalories: number;
    remainingProtein: number;
    remainingCarbs: number;
    remainingFat: number;
  };
}

type AIResponse = ClarificationResponse | RecipesResponse;

const RecipesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recommendedReason, setRecommendedReason] = useState<string>("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [clarification, setClarification] = useState<ClarificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [budgetAfterMeal, setBudgetAfterMeal] = useState<RecipesResponse['budgetAfterMeal'] | null>(null);
  const [showMealDialog, setShowMealDialog] = useState(false);
  
  // Kontext aus Navigation
  const cookingTime = location.state?.cookingTime || 20;
  const mood = location.state?.mood || 'normal';
  const ingredients = location.state?.ingredients || [];
  const macroBudget = location.state?.macroBudget;
  const userProfile = location.state?.userProfile;
  const mealToReplace = location.state?.mealToReplace;
  
  // Check if user is in onboarding mode
  const isOnboardingMode = !localStorage.getItem('onboardingComplete') || 
    localStorage.getItem('onboardingScanUsed') !== 'true';

  useEffect(() => {
    if (ingredients.length === 0) {
      navigate("/");
      return;
    }
    generateRecipes();
  }, []);

  const generateRecipes = async () => {
    setLoading(true);
    setRecipes([]);
    setRecommendedReason("");
    setSelectedRecipe(null);
    setClarification(null);
    setShowDetail(false);
    setBudgetAfterMeal(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-recipes", {
        body: { 
          ingredients, 
          cookingTime, 
          mood,
          macroBudget,
          userProfile,
          mealToReplace,
          isOnboarding: isOnboardingMode,
        },
      });

      if (error) throw error;

      console.log("Response:", data);

      if (data.type === "clarification") {
        setClarification(data as ClarificationResponse);
        toast({
          title: "Noch nicht ganz...",
          description: "Ein paar Zutaten fehlen noch.",
        });
      } else if (data.type === "recipes" && data.recipes) {
        // Sort so recommended recipe is first
        const sortedRecipes = [...data.recipes].sort((a: Recipe, b: Recipe) => 
          (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0)
        );
        setRecipes(sortedRecipes);
        setRecommendedReason(data.recommendedReason || "");
        setBudgetAfterMeal(data.budgetAfterMeal);
        
        const budgetInfo = macroBudget 
          ? `Passt zu deinem Makro-Budget!` 
          : `FRIGY empfiehlt dir das erste Gericht.`;
        
        toast({
          title: "3 Gerichte gefunden!",
          description: budgetInfo,
        });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error generating recipes:", error);
      toast({
        title: t.error,
        description: t.couldNotAnalyze,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowDetail(true);
    
    // Save to recent dishes history
    try {
      const stored = localStorage.getItem('recentDishes');
      const recentDishes = stored ? JSON.parse(stored) : [];
      const newDish = {
        id: recipe.id,
        title: recipe.title,
        prepTime: recipe.prepTime,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        date: new Date().toISOString(),
      };
      const updated = [newDish, ...recentDishes.filter((d: any) => d.id !== newDish.id)].slice(0, 10);
      localStorage.setItem('recentDishes', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving recent dish:', e);
    }
  };

  const handleAddToMealPlan = () => {
    if (!selectedRecipe) return;
    
    // Onboarding mode: Go to feedback screen instead of meal plan dialog
    if (isOnboardingMode) {
      // Store selected recipe for later use
      localStorage.setItem('onboardingSelectedRecipe', JSON.stringify(selectedRecipe));
      // Navigate back to onboarding with scan-feedback step
      navigate('/', { state: { returnToOnboarding: true, showScanFeedback: true } });
      return;
    }
    
    setShowMealDialog(true);
  };

  const handleMealPlanConfirm = (mealType: string, dayOffset: number) => {
    if (!selectedRecipe) return;
    
    // Berechne das Zieldatum
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    
    // Speichere das Rezept für den Wochenplan
    try {
      const mealPlanUpdate = {
        recipe: selectedRecipe,
        mealType,
        date: targetDate.toISOString().split('T')[0],
      };
      
      const stored = localStorage.getItem('mealPlanUpdates');
      const updates = stored ? JSON.parse(stored) : [];
      updates.push(mealPlanUpdate);
      localStorage.setItem('mealPlanUpdates', JSON.stringify(updates));
      
      // Aktualisiere auch den Wochenplan direkt
      const storedPlan = localStorage.getItem('weeklyMealPlan');
      if (storedPlan) {
        const weeklyPlan = JSON.parse(storedPlan);
        const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        const targetDayName = dayNames[targetDate.getDay()];
        
        const updatedPlan = weeklyPlan.map((day: any) => {
          if (day.day === targetDayName) {
            const updatedMeals = day.meals.map((meal: any) => {
              if (meal.type === mealType) {
                return {
                  ...meal,
                  name: selectedRecipe.title,
                  calories: selectedRecipe.calories,
                  protein: selectedRecipe.protein,
                  carbs: selectedRecipe.carbs,
                  fat: selectedRecipe.fat,
                  prepTime: selectedRecipe.prepTime,
                  ingredients: selectedRecipe.ingredients.map(ing => ({
                    name: ing,
                    amount: '1x',
                    price: 0
                  })),
                  instructions: selectedRecipe.instructions,
                };
              }
              return meal;
            });
            return { ...day, meals: updatedMeals };
          }
          return day;
        });
        
        localStorage.setItem('weeklyMealPlan', JSON.stringify(updatedPlan));
      }
      
      const dayLabel = dayOffset === 0 ? 'heute' : dayOffset === 1 ? 'morgen' : 'übermorgen';
      
      toast({
        title: "Im Wochenplan gespeichert! 📅",
        description: `${selectedRecipe.title} → ${mealType} (${dayLabel})`,
      });
    } catch (e) {
      console.error('Error updating meal plan:', e);
    }
    
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <ChefHat className="h-16 w-16 mx-auto text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">
            FRIGY sucht 3 Gerichte...
          </h2>
          <p className="text-muted-foreground">
            {macroBudget 
              ? "Optimiere für dein Makro-Budget" 
              : "Analysiere Zutaten & finde passende Rezepte"}
          </p>
          {macroBudget && (
            <div className="mt-4 flex justify-center gap-3 text-xs">
              <span className="px-2 py-1 rounded bg-primary/10 text-primary">
                {macroBudget.remainingCalories} kcal übrig
              </span>
              <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-500">
                {macroBudget.remainingProtein}g Protein
              </span>
            </div>
          )}
          <motion.div 
            className="flex justify-center gap-1 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Clarification state
  if (clarification) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-6 safe-bottom max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Fast geschafft!</h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg leading-relaxed">{clarification.message}</p>
              </div>

              {clarification.suggestion && (
                <div className="bg-primary/5 rounded-xl p-4 mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Vorschlag:</p>
                  <span className="font-medium text-primary">{clarification.suggestion}</span>
                </div>
              )}

              <div className="space-y-3">
                <Button onClick={() => navigate("/scan")} className="w-full gradient-neon text-black font-semibold h-12">
                  Nochmal scannen
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="w-full h-12">
                  Zurück zum Start
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Recipe detail view
  if (showDetail && selectedRecipe) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-6 safe-bottom max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 mb-6"
          >
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowDetail(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Dein Gericht</h1>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden bg-card/50 backdrop-blur border-border/50">
              <div className="p-6 pb-4">
                <h2 className="text-2xl font-bold mb-2">{selectedRecipe.title}</h2>
                {selectedRecipe.reason && (
                  <p className="text-muted-foreground text-sm mb-4">{selectedRecipe.reason}</p>
                )}
                <div className="flex gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{selectedRecipe.prepTime} Min</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>{selectedRecipe.calories} kcal</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{selectedRecipe.difficulty}</Badge>
                </div>
              </div>

              <div className="px-6 py-4 bg-muted/30 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-primary">{selectedRecipe.protein}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-500">{selectedRecipe.carbs}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-rose-500">{selectedRecipe.fat}g</p>
                  <p className="text-xs text-muted-foreground">Fett</p>
                </div>
              </div>

              {/* Budget After Meal Info */}
              {budgetAfterMeal && (
                <div className="px-6 py-3 bg-primary/5 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Nach dieser Mahlzeit übrig:</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="px-2 py-1 rounded bg-background/50">
                      {budgetAfterMeal.remainingCalories} kcal
                    </span>
                    <span className="px-2 py-1 rounded bg-background/50">
                      {budgetAfterMeal.remainingProtein}g P
                    </span>
                    <span className="px-2 py-1 rounded bg-background/50">
                      {budgetAfterMeal.remainingCarbs}g C
                    </span>
                    <span className="px-2 py-1 rounded bg-background/50">
                      {budgetAfterMeal.remainingFat}g F
                    </span>
                  </div>
                </div>
              )}

              <div className="p-6 border-t border-border/50">
                <h3 className="font-semibold mb-3">Zutaten</h3>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 border-t border-border/50">
                <h3 className="font-semibold mb-3">Zubereitung</h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted text-xs flex items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      <span className="text-foreground/90 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 space-y-3">
            <Button onClick={handleAddToMealPlan} className="w-full gradient-neon text-black font-semibold h-14 text-lg">
              {isOnboardingMode ? 'Weiter' : 'Los geht\'s! 🍳'}
            </Button>
            {userProfile?.goalMode && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                {userProfile.goalMode === 'lose' ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-primary" />
                    <span>Optimiert für Abnehmen</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    <span>Optimiert für Zunehmen</span>
                  </>
                )}
              </div>
            )}
          </motion.div>

          {/* Meal Replacement Dialog */}
          <MealReplacementDialog
            open={showMealDialog}
            onOpenChange={setShowMealDialog}
            onConfirm={handleMealPlanConfirm}
            recipeName={selectedRecipe?.title || ''}
          />
        </div>
      </div>
    );
  }

  // Recipe selection view (3 choices)
  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-6 safe-bottom max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 mb-6"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Wähle dein Gericht</h1>
              <p className="text-sm text-muted-foreground">
                {macroBudget ? "Passt zu deinen Makros" : "3 passende Optionen"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={generateRecipes}>
            <RefreshCw className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Makro-Budget Anzeige */}
        {macroBudget && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Dein Tagesbudget</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-background/80">{macroBudget.remainingCalories} kcal</span>
              <span className="px-2 py-1 rounded bg-background/80">{macroBudget.remainingProtein}g P</span>
              <span className="px-2 py-1 rounded bg-background/80">{macroBudget.remainingCarbs}g C</span>
              <span className="px-2 py-1 rounded bg-background/80">{macroBudget.remainingFat}g F</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {recipes.map((recipe, index) => {
            const isRecommended = recipe.isRecommended;
            
            return (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden bg-card/50 backdrop-blur transition-all cursor-pointer active:scale-[0.98] ${
                    isRecommended 
                      ? 'border-2 border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                      : 'border-border/50 hover:bg-card/80'
                  }`}
                  onClick={() => handleSelectRecipe(recipe)}
                >
                  {isRecommended && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-semibold py-1.5 px-4 flex items-center gap-2">
                      <span className="text-sm">⭐</span>
                      <span>EMPFOHLEN</span>
                      {recommendedReason && (
                        <span className="text-primary-foreground/80 font-normal ml-1 truncate">
                          — {recommendedReason}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className={`p-4 ${isRecommended ? 'pt-10' : ''}`}>
                    <div className="flex gap-4">
                      <div className={`flex-shrink-0 rounded-xl flex items-center justify-center ${
                        isRecommended ? 'w-14 h-14 bg-primary/20' : 'w-12 h-12 bg-primary/10'
                      }`}>
                        <span className={isRecommended ? 'text-3xl' : 'text-2xl'}>
                          {index === 0 ? '🍳' : index === 1 ? '🥗' : '🍲'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 truncate ${isRecommended ? 'text-xl' : 'text-lg'}`}>
                          {recipe.title}
                        </h3>
                        {recipe.reason && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{recipe.reason}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recipe.prepTime} Min
                          </span>
                          <span>{recipe.calories} kcal</span>
                          <span className="text-primary font-medium">{recipe.protein}g Protein</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className={`rounded-full border-2 flex items-center justify-center ${
                          isRecommended 
                            ? 'w-10 h-10 border-primary bg-primary/10' 
                            : 'w-8 h-8 border-primary/30'
                        }`}>
                          <Check className={`text-primary ${isRecommended ? 'h-5 w-5' : 'h-4 w-4 opacity-50'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {recipes.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Keine Rezepte gefunden.</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Zurück zum Start
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipesPage;
