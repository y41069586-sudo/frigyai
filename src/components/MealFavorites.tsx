import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Plus, Trash2, Utensils, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface MealFavorite {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion?: string;
}

interface MealFavoritesProps {
  onAddMeal?: (meal: Omit<MealFavorite, 'id'>) => void;
}

const MealFavorites = ({ onAddMeal }: MealFavoritesProps) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<MealFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    portion: ""
  });

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("meal_favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async () => {
    if (!user || !newMeal.name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib einen Namen ein.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("meal_favorites")
        .insert({
          user_id: user.id,
          name: newMeal.name,
          calories: newMeal.calories,
          protein: newMeal.protein,
          carbs: newMeal.carbs,
          fat: newMeal.fat,
          portion: newMeal.portion || null
        })
        .select()
        .single();

      if (error) throw error;

      setFavorites([data, ...favorites]);
      setShowAddDialog(false);
      setNewMeal({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0, portion: "" });
      
      toast({
        title: "Favorit gespeichert!",
        description: `${newMeal.name} wurde zu deinen Favoriten hinzugefügt.`
      });
    } catch (error) {
      console.error("Error adding favorite:", error);
      toast({
        title: "Fehler",
        description: "Favorit konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const deleteFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from("meal_favorites")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.id !== id));
      toast({
        title: "Favorit gelöscht",
        description: "Der Favorit wurde entfernt."
      });
    } catch (error) {
      console.error("Error deleting favorite:", error);
    }
  };

  const handleQuickAdd = (meal: MealFavorite) => {
    if (onAddMeal) {
      onAddMeal({
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        portion: meal.portion
      });
      toast({
        title: "Mahlzeit hinzugefügt!",
        description: `${meal.name} wurde zum Tracker hinzugefügt.`
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Favoriten</h3>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />
              Neu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Favoriten hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newMeal.name}
                  onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                  placeholder="z.B. Haferflocken mit Banane"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Kalorien</label>
                  <Input
                    type="number"
                    value={newMeal.calories || ""}
                    onChange={(e) => setNewMeal({ ...newMeal, calories: parseInt(e.target.value) || 0 })}
                    placeholder="kcal"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Protein (g)</label>
                  <Input
                    type="number"
                    value={newMeal.protein || ""}
                    onChange={(e) => setNewMeal({ ...newMeal, protein: parseInt(e.target.value) || 0 })}
                    placeholder="g"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Kohlenhydrate (g)</label>
                  <Input
                    type="number"
                    value={newMeal.carbs || ""}
                    onChange={(e) => setNewMeal({ ...newMeal, carbs: parseInt(e.target.value) || 0 })}
                    placeholder="g"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fett (g)</label>
                  <Input
                    type="number"
                    value={newMeal.fat || ""}
                    onChange={(e) => setNewMeal({ ...newMeal, fat: parseInt(e.target.value) || 0 })}
                    placeholder="g"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Portion (optional)</label>
                <Input
                  value={newMeal.portion}
                  onChange={(e) => setNewMeal({ ...newMeal, portion: e.target.value })}
                  placeholder="z.B. 1 Schüssel"
                />
              </div>
              <Button onClick={addFavorite} className="w-full gradient-neon text-primary-foreground">
                Favorit speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Noch keine Favoriten</p>
          <p className="text-xs">Speichere häufige Mahlzeiten für schnelles Logging</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
          <AnimatePresence>
            {favorites.map((meal, index) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleQuickAdd(meal)}
                >
                  <p className="font-medium text-sm">{meal.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {meal.calories} kcal
                    </span>
                    <span>P: {meal.protein}g</span>
                    <span>K: {meal.carbs}g</span>
                    <span>F: {meal.fat}g</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleQuickAdd(meal)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteFavorite(meal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
};

export default MealFavorites;
