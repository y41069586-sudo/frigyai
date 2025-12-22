import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, ChefHat, Clock, Zap, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

interface ClarificationResponse {
  type: "clarification";
  message: string;
  suggestion: string | null;
}

interface RecipeResponse {
  type: "recipe";
  recipe: Recipe;
}

type AIResponse = ClarificationResponse | RecipeResponse;

const RecipesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [clarification, setClarification] = useState<ClarificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cookingTime] = useState(location.state?.cookingTime || 20);
  const [mood] = useState(location.state?.mood || 'normal');
  const ingredients = location.state?.ingredients || [];

  useEffect(() => {
    if (ingredients.length === 0) {
      navigate("/");
      return;
    }
    generateRecipe();
  }, []);

  const generateRecipe = async () => {
    setLoading(true);
    setRecipe(null);
    setClarification(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-recipes", {
        body: { ingredients, cookingTime, mood },
      });

      if (error) throw error;

      console.log("Response:", data);

      if (data.type === "clarification") {
        setClarification(data as ClarificationResponse);
        toast({
          title: "Noch nicht ganz...",
          description: "Ein paar Zutaten fehlen noch für ein Gericht.",
        });
      } else if (data.type === "recipe" && data.recipe) {
        setRecipe(data.recipe);
        
        // Save to recent dishes history
        try {
          const stored = localStorage.getItem('recentDishes');
          const recentDishes = stored ? JSON.parse(stored) : [];
          const newDish = {
            id: data.recipe.id,
            title: data.recipe.title,
            prepTime: data.recipe.prepTime,
            calories: data.recipe.calories,
            date: new Date().toISOString(),
          };
          // Add to beginning, remove duplicates, keep max 10
          const updated = [newDish, ...recentDishes.filter((d: any) => d.id !== newDish.id)].slice(0, 10);
          localStorage.setItem('recentDishes', JSON.stringify(updated));
        } catch (e) {
          console.error('Error saving recent dish:', e);
        }
        
        toast({
          title: "Perfekt!",
          description: `${data.recipe.title} ist bereit zum Kochen.`,
        });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast({
        title: t.error,
        description: t.couldNotAnalyze,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCooking = () => {
    if (recipe) {
      navigate(`/recipe/${recipe.id}`, { state: { recipe } });
    }
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
            FRIGY denkt nach...
          </h2>
          <p className="text-muted-foreground">
            Analysiere Zutaten & finde das perfekte Gericht
          </p>
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

  // Clarification state - ingredients not sufficient
  if (clarification) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-6 safe-bottom max-w-lg">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Fast geschafft!</h1>
          </motion.div>

          {/* Clarification Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg leading-relaxed text-foreground/90">
                  {clarification.message}
                </p>
              </div>

              {clarification.suggestion && (
                <div className="bg-primary/5 rounded-xl p-4 mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Vorschlag:</p>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">{clarification.suggestion}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/scan")}
                  className="w-full gradient-neon text-black font-semibold h-12"
                >
                  Nochmal scannen
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full h-12"
                >
                  Zurück zum Start
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Current ingredients */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <p className="text-sm text-muted-foreground mb-2">Erkannte Zutaten:</p>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {ing}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Recipe found!
  if (recipe) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-6 safe-bottom max-w-lg">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 mb-6"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Dein Gericht</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={generateRecipe}
              className="shrink-0"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Recipe Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden bg-card/50 backdrop-blur border-border/50">
              {/* Header Section */}
              <div className="p-6 pb-4">
                <motion.h2 
                  className="text-2xl font-bold mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {recipe.title}
                </motion.h2>
                {recipe.reason && (
                  <p className="text-muted-foreground text-sm mb-4">
                    {recipe.reason}
                  </p>
                )}
                
                {/* Quick Stats */}
                <div className="flex gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{recipe.prepTime} Min</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>{recipe.calories} kcal</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {recipe.difficulty}
                  </Badge>
                </div>
              </div>

              {/* Macros */}
              <div className="px-6 py-4 bg-muted/30 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-primary">{recipe.protein}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-500">{recipe.carbs}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-rose-500">{recipe.fat}g</p>
                  <p className="text-xs text-muted-foreground">Fett</p>
                </div>
              </div>

              {/* Ingredients */}
              <div className="p-6 border-t border-border/50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">1</span>
                  Zutaten
                </h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      {ing}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div className="p-6 border-t border-border/50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">2</span>
                  Zubereitung
                </h3>
                <ol className="space-y-3">
                  {recipe.instructions.map((step, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="flex gap-3 text-sm"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted text-xs flex items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      <span className="text-foreground/90 leading-relaxed">{step}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </Card>
          </motion.div>

          {/* Start Cooking Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <Button
              onClick={() => navigate("/")}
              className="w-full gradient-neon text-black font-semibold h-14 text-lg"
            >
              Los geht's! 🍳
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Fallback - no recipe, no clarification
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-lg text-muted-foreground mb-4">
          Etwas ist schiefgelaufen.
        </p>
        <Button onClick={() => navigate("/")} variant="outline">
          Zurück zum Start
        </Button>
      </div>
    </div>
  );
};

export default RecipesPage;
