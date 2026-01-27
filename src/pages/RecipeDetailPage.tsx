import { motion } from "framer-motion";
import { ArrowLeft, Clock, Flame, Heart, CheckCircle2, Share2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import ShareRecipeDialog from "@/components/ShareRecipeDialog";
import OrderIngredientsDialog from "@/components/OrderIngredientsDialog";
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

const RecipeDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  useEffect(() => {
    // Try to get recipe from navigation state first
    let recipeData = location.state?.recipe;

    // If not in state, try to get from localStorage
    if (!recipeData && id) {
      const recipes = safeJsonParse<Record<string, Recipe>>(localStorage.getItem("recipeDetails"), {});
      if (typeof recipes === "object" && recipes !== null) {
        recipeData = recipes[id];
      }
    }

    if (recipeData) {
      setRecipe(recipeData);
      const favorites = safeJsonParse<string[]>(localStorage.getItem("favorites"), []);
      setIsFavorite(Array.isArray(favorites) && favorites.includes(recipeData.id));
    } else {
      navigate("/");
    }
  }, [id, location.state, navigate]);

  const toggleFavorite = () => {
    if (!recipe) return;

    const favorites = safeJsonParse<string[]>(localStorage.getItem("favorites"), []);

    if (!Array.isArray(favorites)) {
      console.warn("Favorites data is corrupted, resetting to empty array");
      return;
    }

    if (isFavorite) {
      const newFavorites = favorites.filter((favId: string) => favId !== recipe.id);
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(recipe.id);
      localStorage.setItem("favorites", JSON.stringify(favorites));

      // Store recipe details
      const recipes = safeJsonParse<Record<string, Recipe>>(localStorage.getItem("recipeDetails"), {});
      if (typeof recipes === "object" && recipes !== null) {
        (recipes as any)[recipe.id] = recipe;
        localStorage.setItem("recipeDetails", JSON.stringify(recipes));
      }

      setIsFavorite(true);
    }
  };

  if (!recipe) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">{recipe.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShareDialogOpen(true)}
              className="glow-button"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setOrderDialogOpen(true)}
              className="glow-button"
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              onClick={toggleFavorite}
              className={`glow-button ${isFavorite ? "gradient-neon text-black" : "bg-card"}`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl p-8 shadow-xl border border-border/50"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Flame className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{recipe.calories}</div>
                <div className="text-sm text-muted-foreground">Kalorien</div>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{recipe.prepTime} min</div>
                <div className="text-sm text-muted-foreground">Zubereitung</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{recipe.protein}g</div>
                <div className="text-sm text-muted-foreground">Eiweiß</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{recipe.difficulty}</div>
                <div className="text-sm text-muted-foreground">Schwierigkeit</div>
              </div>
            </div>
          </motion.div>

          {/* Ingredients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl p-8 shadow-xl border border-border/50"
          >
            <h2 className="text-2xl font-bold mb-6">Zutaten</h2>
            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-3xl p-8 shadow-xl border border-border/50"
          >
            <h2 className="text-2xl font-bold mb-6">Zubereitung</h2>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                    {index + 1}
                  </div>
                  <p className="pt-1">{instruction}</p>
                </li>
              ))}
            </ol>
          </motion.div>

          {/* Healthier Alternatives */}
          {recipe.healthierAlternatives && recipe.healthierAlternatives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-primary/10 rounded-3xl p-8 border border-primary/20"
            >
              <h2 className="text-2xl font-bold mb-4 text-neon">
                💡 Gesündere Alternativen
              </h2>
              <ul className="space-y-2">
                {recipe.healthierAlternatives.map((alternative, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{alternative}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Macros Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-3xl p-8 shadow-xl border border-border/50"
          >
            <h2 className="text-2xl font-bold mb-6">Nährwerte</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-6 bg-primary/10 rounded-2xl border border-primary/20">
                <div className="text-3xl font-bold text-primary mb-2">{recipe.protein}g</div>
                <div className="text-sm text-muted-foreground">Eiweiß</div>
              </div>
              <div className="text-center p-6 bg-primary/10 rounded-2xl border border-primary/20">
                <div className="text-3xl font-bold text-primary mb-2">{recipe.carbs}g</div>
                <div className="text-sm text-muted-foreground">Kohlenhydrate</div>
              </div>
              <div className="text-center p-6 bg-primary/10 rounded-2xl border border-primary/20">
                <div className="text-3xl font-bold text-primary mb-2">{recipe.fat}g</div>
                <div className="text-sm text-muted-foreground">Fett</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Dialogs */}
      <ShareRecipeDialog
        recipe={recipe}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
      <OrderIngredientsDialog
        ingredients={recipe.ingredients}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
      />
    </div>
  );
};

export default RecipeDetailPage;
