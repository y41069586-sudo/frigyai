import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, X, Upload, ChefHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UploadRecipeDialog = ({ open, onOpenChange, onSuccess }: UploadRecipeDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [prepTime, setPrepTime] = useState("");

  const addIngredient = () => setIngredients([...ingredients, ""]);
  const addInstruction = () => setInstructions([...instructions, ""]);

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Bitte melde dich an", variant: "destructive" });
      return;
    }

    if (!title.trim()) {
      toast({ title: "Titel ist erforderlich", variant: "destructive" });
      return;
    }

    const validIngredients = ingredients.filter((i) => i.trim());
    const validInstructions = instructions.filter((i) => i.trim());

    if (validIngredients.length === 0) {
      toast({ title: "Mindestens eine Zutat erforderlich", variant: "destructive" });
      return;
    }

    if (validInstructions.length === 0) {
      toast({ title: "Mindestens ein Zubereitungsschritt erforderlich", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("community_recipes").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        ingredients: validIngredients,
        instructions: validInstructions,
        calories: calories ? parseInt(calories) : null,
        protein: protein ? parseInt(protein) : null,
        carbs: carbs ? parseInt(carbs) : null,
        fat: fat ? parseInt(fat) : null,
        prep_time: prepTime ? parseInt(prepTime) : null,
      });

      if (error) throw error;

      toast({ title: "Rezept hochgeladen! 🎉" });
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setTitle("");
      setDescription("");
      setIngredients([""]);
      setInstructions([""]);
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setPrepTime("");
    } catch (error) {
      console.error("Error uploading recipe:", error);
      toast({ title: "Fehler beim Hochladen", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            Rezept teilen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label>Titel *</Label>
            <Input
              placeholder="z.B. Hähnchen-Avocado-Salat"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <Label>Beschreibung</Label>
            <Textarea
              placeholder="Beschreibe dein Rezept..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Ingredients */}
          <div>
            <Label>Zutaten *</Label>
            <AnimatePresence>
              {ingredients.map((ingredient, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-2 mt-2"
                >
                  <Input
                    placeholder={`Zutat ${index + 1}`}
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={addIngredient}
            >
              <Plus className="h-4 w-4 mr-1" /> Zutat hinzufügen
            </Button>
          </div>

          {/* Instructions */}
          <div>
            <Label>Zubereitung *</Label>
            <AnimatePresence>
              {instructions.map((instruction, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-2 mt-2"
                >
                  <div className="shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary mt-2">
                    {index + 1}
                  </div>
                  <Textarea
                    placeholder={`Schritt ${index + 1}`}
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInstruction(index)}
                    disabled={instructions.length === 1}
                    className="mt-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={addInstruction}
            >
              <Plus className="h-4 w-4 mr-1" /> Schritt hinzufügen
            </Button>
          </div>

          {/* Nutrition Info */}
          <div>
            <Label>Nährwerte (optional)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                type="number"
                placeholder="Kalorien"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Protein (g)"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Kohlenhydrate (g)"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Fett (g)"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
            </div>
          </div>

          {/* Prep Time */}
          <div>
            <Label>Zubereitungszeit (Minuten)</Label>
            <Input
              type="number"
              placeholder="z.B. 15"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full gradient-neon text-black font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird hochgeladen...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Rezept teilen
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadRecipeDialog;
