import { motion } from "framer-motion";
import { Clock, Flame, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

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
      whileHover={{ scale: 1.02 }}
      onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
      className="bg-card rounded-3xl overflow-hidden shadow-xl border border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold flex-1 group-hover:text-neon transition-colors">
            {recipe.title}
          </h3>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleFavorite}
            className={`shrink-0 ${isFavorite ? "text-red-500" : ""}`}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-primary" />
            <span>{recipe.calories} kcal</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-primary" />
            <span>{recipe.prepTime} min</span>
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Eiweiß</div>
            <div className="font-semibold">{recipe.protein}g</div>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Kohlenhydrate</div>
            <div className="font-semibold">{recipe.carbs}g</div>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Fett</div>
            <div className="font-semibold">{recipe.fat}g</div>
          </div>
        </div>

        {/* Ingredients Preview */}
        <div className="flex flex-wrap gap-2">
          {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
            <span
              key={index}
              className="text-xs bg-muted px-3 py-1 rounded-full"
            >
              {ingredient}
            </span>
          ))}
          {recipe.ingredients.length > 3 && (
            <span className="text-xs text-muted-foreground px-3 py-1">
              +{recipe.ingredients.length - 3} mehr
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RecipeCard;
