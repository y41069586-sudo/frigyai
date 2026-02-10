import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Flame, Beef, Wheat, Droplets, Check, Loader2 } from 'lucide-react';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface Ingredient {
  name: string;
  amount: string;
  price: number;
}

interface Meal {
  type: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  ingredients: Ingredient[];
  instructions: string[];
}

interface MealDetailDialogProps {
  meal: Meal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMealLogged?: () => void;
}

export const MealDetailDialog = ({ meal, open, onOpenChange, onMealLogged }: MealDetailDialogProps) => {
  const { t } = useLanguage();
  const { addEntry } = useFoodEntries();
  const [isLogging, setIsLogging] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const handleLogMeal = async () => {
    if (!meal) return;

    setIsLogging(true);
    try {
      const result = await addEntry({
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        portion: `${meal.prepTime}min`,
        meal_type: meal.type,
      });

      if (result) {
        setIsLogged(true);
        toast({
          title: '✅ Gegessen geloggt',
          description: `${meal.name} zu deinem Tracker hinzugefügt`,
        });
        onMealLogged?.();
        setTimeout(() => {
          onOpenChange(false);
          setIsLogged(false);
        }, 1000);
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Konnte Mahlzeit nicht speichern',
        variant: 'destructive',
      });
    } finally {
      setIsLogging(false);
    }
  };

  if (!meal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-primary/20">
        <DialogHeader>
          <Badge className="w-fit mb-2" variant="secondary">{meal.type}</Badge>
          <DialogTitle className="text-2xl neon-text">{meal.name}</DialogTitle>
        </DialogHeader>

        {/* Macros */}
        <div className="grid grid-cols-4 gap-3 my-4">
          <div className="text-center p-3 bg-background/50 rounded-xl">
            <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-lg font-bold">{meal.calories}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-xl">
            <Beef className="h-5 w-5 mx-auto text-red-500 mb-1" />
            <p className="text-lg font-bold">{meal.protein}g</p>
            <p className="text-xs text-muted-foreground">Protein</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-xl">
            <Wheat className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold">{meal.carbs}g</p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-xl">
            <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">{meal.fat}g</p>
            <p className="text-xs text-muted-foreground">Fett</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock className="h-4 w-4" />
          <span>{meal.prepTime} Minuten Zubereitung</span>
        </div>

        {/* Ingredients */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-primary">Zutaten</h4>
          <ul className="space-y-2">
            {meal.ingredients.map((ing, idx) => (
              <li key={idx} className="flex justify-between items-center p-2 bg-background/30 rounded-lg">
                <span>{ing.amount} {ing.name}</span>
                <span className="text-muted-foreground">€{ing.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 pt-2 border-t border-primary/20 flex justify-between font-semibold">
            <span>Gesamt</span>
            <span className="text-primary">
              €{meal.ingredients.reduce((sum, ing) => sum + ing.price, 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2 text-primary">Zubereitung</h4>
          <ol className="space-y-3">
            {meal.instructions.map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Log as eaten button */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-primary/20">
          <Button
            onClick={handleLogMeal}
            disabled={isLogging || isLogged}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isLogged ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t.toastFoodLogged || 'Gegessen!'}
              </>
            ) : isLogging ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird geloggt...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Als gegessen markieren
              </>
            )}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
          >
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
