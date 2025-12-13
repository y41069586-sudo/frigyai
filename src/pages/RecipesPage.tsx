import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RecipeCard from "@/components/RecipeCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface Recipe {
  id: string;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  healthierAlternatives?: string[];
}

const RecipesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const ingredients = location.state?.ingredients || [];

  useEffect(() => {
    if (ingredients.length === 0) {
      navigate("/");
      return;
    }

    generateRecipes();
  }, []);

  const generateRecipes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-recipes",
        {
          body: { ingredients },
        }
      );

      if (error) throw error;

      setRecipes(data.recipes || []);
      toast({
        title: t.recipesGenerated,
        description: `${data.recipes?.length || 0} ${t.healthyRecipesFound}`,
      });
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

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">
            {t.aiCreatingRecipes.split(' ').slice(0, 2).join(' ')} <span className="text-neon">{t.aiCreatingRecipes.split(' ').slice(2).join(' ')}</span>
          </h2>
          <p className="text-muted-foreground">
            {t.momentPlease}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 safe-bottom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4 sm:mb-8 gap-2"
        >
          <div className="flex items-center min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
              className="mr-2 sm:mr-4 shrink-0 touch-target h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-3xl font-bold truncate">
              {t.yourRecipes.split(' ')[0]} <span className="text-neon">{t.yourRecipes.split(' ').slice(1).join(' ')}</span>
            </h1>
          </div>
          <Button
            onClick={generateRecipes}
            variant="outline"
            size="sm"
            className="border-primary hover:bg-primary/10 shrink-0 text-xs sm:text-sm touch-target"
          >
            {t.regenerate}
          </Button>
        </motion.div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {recipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <RecipeCard recipe={recipe} />
            </motion.div>
          ))}
        </div>

        {recipes.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              {t.noRecipesFound}
            </p>
            <Button
              onClick={() => navigate("/")}
              className="mt-4 gradient-neon text-black font-semibold touch-target"
            >
              {t.backToStart}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipesPage;