import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import IngredientsList from "@/components/IngredientsList";

const ManualPage = () => {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const handleGenerateRecipes = () => {
    navigate("/recipes", { state: { ingredients } });
  };

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
            Zutaten <span className="text-neon">eingeben</span>
          </h1>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl p-8 shadow-xl border border-border/50 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">
              Was hast du zu Hause?
            </h2>
            <div className="flex gap-3">
              <Input
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddIngredient()}
                placeholder="z.B. Tomaten, Hähnchen, Joghurt..."
                className="flex-1 rounded-xl"
              />
              <Button
                onClick={handleAddIngredient}
                className="gradient-neon text-black font-semibold glow-button"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Ingredients List */}
          {ingredients.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <IngredientsList
                ingredients={ingredients}
                onIngredientsChange={setIngredients}
              />

              <Button
                onClick={handleGenerateRecipes}
                className="w-full mt-6 gradient-neon text-black font-semibold text-lg py-6 rounded-2xl glow-button"
              >
                Rezepte generieren
              </Button>
            </motion.div>
          )}

          {ingredients.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <p className="text-lg">
                Füge mindestens eine Zutat hinzu, um zu starten
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualPage;
