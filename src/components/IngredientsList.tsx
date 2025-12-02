import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IngredientsListProps {
  ingredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
}

const IngredientsList = ({ ingredients, onIngredientsChange }: IngredientsListProps) => {
  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    onIngredientsChange(newIngredients);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl p-6 shadow-xl border border-border/50"
    >
      <h3 className="text-lg font-semibold mb-4">
        Erkannte Zutaten ({ingredients.length})
      </h3>
      <div className="flex flex-wrap gap-3">
        {ingredients.map((ingredient, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-2 bg-primary/10 text-foreground px-4 py-2 rounded-full border border-primary/20"
          >
            <span>{ingredient}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeIngredient(index)}
              className="h-5 w-5 rounded-full hover:bg-destructive/20"
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default IngredientsList;
