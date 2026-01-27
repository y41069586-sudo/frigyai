import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import RecipeCard from "@/components/RecipeCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { safeJsonParse } from "@/lib/utils";

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

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState<Recipe[]>([]);

  useEffect(() => {
    const favoriteIds = JSON.parse(localStorage.getItem("favorites") || "[]");
    const recipeDetails = JSON.parse(localStorage.getItem("recipeDetails") || "{}");
    
    const favoriteRecipes = favoriteIds
      .map((id: string) => recipeDetails[id])
      .filter((recipe: Recipe | undefined) => recipe !== undefined);
    
    setFavorites(favoriteRecipes);
  }, []);

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 safe-bottom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-4 sm:mb-8"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className="mr-2 sm:mr-4 shrink-0 touch-target h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold truncate">
            {t.myFavorites.split(' ')[0]} <span className="text-neon">{t.myFavorites.split(' ').slice(1).join(' ')}</span>
          </h1>
        </motion.div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {favorites.map((recipe, index) => (
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
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 sm:py-20 px-4"
          >
            <Heart className="h-16 w-16 sm:h-24 sm:w-24 mx-auto mb-4 sm:mb-6 text-muted-foreground opacity-20" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
              {t.noFavoritesYet}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
              {t.saveFavoriteRecipes}
            </p>
            <Button
              onClick={() => navigate("/")}
              className="gradient-neon text-black font-semibold glow-button touch-target"
            >
              {t.discoverRecipes}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
