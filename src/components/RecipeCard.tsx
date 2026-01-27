import { motion } from "framer-motion";
import { Clock, Flame, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setIsFavorite(favorites.includes(recipe.id));
  }, [recipe.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    
    if (isFavorite) {
      const newFavorites = favorites.filter((id: string) => id !== recipe.id);
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(recipe.id);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      
      // Store recipe details
      const recipes = JSON.parse(localStorage.getItem("recipeDetails") || "{}");
      recipes[recipe.id] = recipe;
      localStorage.setItem("recipeDetails", JSON.stringify(recipes));
      
      setIsFavorite(true);
    }
  };

  return (
    <motion.div
      onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
      className="bg-card rounded-2xl overflow-hidden border border-border/30 hover:border-primary/30 transition-all cursor-pointer active:scale-[0.99]"
      whileTap={{ scale: 0.98 }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {recipe.title}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-primary" />
                {recipe.calories} kcal
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {recipe.prepTime} min
              </span>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleFavorite}
            className={`h-8 w-8 shrink-0 ${isFavorite ? "text-red-500" : "text-muted-foreground/50"}`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>

        {/* Macros - Compact Pills */}
        <div className="flex gap-2 mb-3">
          <div className="px-2.5 py-1 bg-red-500/10 rounded-full">
            <span className="text-[10px] font-medium text-red-600">{recipe.protein}g P</span>
          </div>
          <div className="px-2.5 py-1 bg-amber-500/10 rounded-full">
            <span className="text-[10px] font-medium text-amber-600">{recipe.carbs}g K</span>
          </div>
          <div className="px-2.5 py-1 bg-blue-500/10 rounded-full">
            <span className="text-[10px] font-medium text-blue-600">{recipe.fat}g F</span>
          </div>
        </div>

        {/* Ingredients Preview */}
        <div className="flex flex-wrap gap-1.5">
          {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
            <span
              key={index}
              className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-md text-muted-foreground"
            >
              {ingredient}
            </span>
          ))}
          {recipe.ingredients.length > 3 && (
            <span className="text-[10px] text-muted-foreground/70 px-2 py-0.5">
              +{recipe.ingredients.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RecipeCard;
