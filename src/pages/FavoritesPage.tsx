import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import RecipeCard from "@/components/RecipeCard";

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-8"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">
            Meine <span className="text-neon">Favoriten</span>
          </h1>
        </motion.div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            className="text-center py-20"
          >
            <Heart className="h-24 w-24 mx-auto mb-6 text-muted-foreground opacity-20" />
            <h2 className="text-2xl font-semibold mb-4">
              Noch keine Favoriten
            </h2>
            <p className="text-muted-foreground mb-8">
              Speichere deine Lieblingsrezepte, um sie später wiederzufinden
            </p>
            <Button
              onClick={() => navigate("/")}
              className="gradient-neon text-black font-semibold glow-button"
            >
              Rezepte entdecken
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
