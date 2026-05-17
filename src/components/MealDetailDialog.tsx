import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

function getDetailedInstructions(meal: Meal): string[] {
  if (Array.isArray(meal.instructions) && meal.instructions.length > 0) {
    return meal.instructions.filter((step) => step.trim().length > 0);
  }

  const ingredientNames = meal.ingredients
    .map((ingredient) => ingredient.name)
    .filter(Boolean)
    .join(", ");

  return [
    ingredientNames ? `Bereite die Zutaten vor: ${ingredientNames}.` : "Bereite alle Zutaten passend vor.",
    "Koche oder brate die Zutaten nach Bedarf, bis alles gar ist.",
    "Richte die Mahlzeit an und schmecke sie nach Wunsch ab.",
  ];
}

export const MealDetailDialog = ({ meal, open, onOpenChange, onMealLogged }: MealDetailDialogProps) => {
  const { t } = useLanguage();
  const { addEntry } = useFoodEntries();
  const [isLogging, setIsLogging] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const dragStartRef = useRef<{ y: number; time: number } | null>(null);

  const handleSheetHandlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragStartRef.current = { y: event.clientY, time: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetHandlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (!start) return;

    const deltaY = event.clientY - start.y;
    const elapsed = Math.max(1, performance.now() - start.time);
    const velocityY = deltaY / elapsed;

    if (deltaY > 42 || velocityY > 0.35) {
      onOpenChange(false);
    }
  };

  const handleLogMeal = async () => {
    if (!meal) return;

    setIsLogging(true);
    try {
      // Ensure all values are numbers and handle potential undefined values
      const prepTime = meal.prepTime || 20;

      const result = await addEntry({
        name: meal.name,
        calories: Number(meal.calories) || 0,
        protein: Number(meal.protein) || 0,
        carbs: Number(meal.carbs) || 0,
        fat: Number(meal.fat) || 0,
        portion: `${prepTime}min`,
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
      console.error('[MealDetailDialog] Error logging meal:', error);
      toast({
        title: 'Fehler',
        description: 'Konnte Mahlzeit nicht speichern',
        variant: 'destructive',
      });
    } finally {
      setIsLogging(false);
    }
  };

  // Early return before hooks - hooks must run before any conditionals
  if (!meal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg rounded-3xl">
          <p className="text-center text-muted-foreground">Keine Mahlzeit ausgewählt</p>
        </DialogContent>
      </Dialog>
    );
  }

  const detailedInstructions = getDetailedInstructions(meal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 top-auto bottom-0 max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-t-[2rem] border-primary/20 bg-[#F7FAF7] p-0 shadow-[0_-24px_70px_-34px_rgba(15,23,42,0.55)] data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-left-0 data-[state=closed]:slide-out-to-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:max-h-[88vh] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-3xl">
        <button
          type="button"
          aria-label="Essensdetail nach unten ziehen zum Schließen"
          onPointerDown={handleSheetHandlePointerDown}
          onPointerUp={handleSheetHandlePointerUp}
          onPointerCancel={() => {
            dragStartRef.current = null;
          }}
          className="mx-auto mt-2 flex h-10 w-28 cursor-grab touch-none items-center justify-center rounded-full active:cursor-grabbing sm:hidden"
        >
          <span className="h-1.5 w-16 rounded-full bg-slate-300/90" />
        </button>
        <div className="max-h-[92dvh] overflow-y-auto px-5 pb-28 pt-4 sm:max-h-[88vh] sm:px-6 sm:pb-24">
        <DialogHeader className="text-left">
          <Badge className="w-fit rounded-full bg-primary/10 text-primary border-primary/20 mb-2" variant="secondary">{meal.type}</Badge>
          <DialogTitle className="pr-8 text-[24px] font-black leading-tight tracking-[-0.04em] text-foreground">{meal.name}</DialogTitle>
        </DialogHeader>

        {/* Macros */}
        <div className="my-4 grid grid-cols-4 gap-2">
          <MacroCard icon={Flame} iconClass="text-orange-500 bg-orange-50" value={Math.round(meal.calories)} label="kcal" />
          <MacroCard icon={Beef} iconClass="text-rose-500 bg-rose-50" value={Math.round(meal.protein)} label="Protein" unit="g" />
          <MacroCard icon={Wheat} iconClass="text-amber-500 bg-amber-50" value={Math.round(meal.carbs)} label="Carbs" unit="g" />
          <MacroCard icon={Droplets} iconClass="text-sky-500 bg-sky-50" value={Math.round(meal.fat)} label="Fett" unit="g" />
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{meal.prepTime} Minuten Zubereitung</span>
        </div>

        {/* Ingredients */}
        <section className="mb-5 rounded-3xl border border-slate-200/85 bg-white/72 p-4">
          <h4 className="mb-3 text-[17px] font-bold tracking-[-0.02em] text-foreground">Zutaten</h4>
          <ul className="space-y-2">
            {meal.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/35 px-3 py-2.5">
                <span className="min-w-0 text-sm font-medium text-foreground">
                  <span className="text-muted-foreground">{ing.amount}</span> {ing.name}
                </span>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">€{(Number(ing.price) || 0).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-200/80 pt-3 text-sm font-semibold">
            <span>Gesamt</span>
            <span className="text-primary">
              €{meal.ingredients.reduce((sum, ing) => sum + (Number(ing.price) || 0), 0).toFixed(2)}
            </span>
          </div>
        </section>

        {/* Instructions */}
        <section className="mb-6 rounded-3xl border border-slate-200/85 bg-white/72 p-4">
          <h4 className="mb-3 text-[17px] font-bold tracking-[-0.02em] text-foreground">Zubereitung</h4>
          <ol className="space-y-3">
            {detailedInstructions.map((step, idx) => (
              <li key={idx} className="flex gap-3 rounded-2xl bg-muted/30 p-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {idx + 1}
                </span>
                <span className="text-sm leading-relaxed text-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </section>
        </div>

        {/* Log as eaten button */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex gap-2 border-t border-slate-200/80 bg-white/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 backdrop-blur-xl">
          <Button
            onClick={handleLogMeal}
            disabled={isLogging || isLogged}
            className="h-12 min-w-0 flex-1 rounded-2xl bg-primary px-3 text-xs font-bold hover:bg-primary/90 min-[380px]:text-sm"
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
            className="h-12 w-24 shrink-0 rounded-2xl px-2 text-xs font-bold min-[380px]:w-28 min-[380px]:text-sm"
          >
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function MacroCard({
  icon: Icon,
  iconClass,
  value,
  label,
  unit = "",
}: {
  icon: typeof Flame;
  iconClass: string;
  value: number;
  label: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/75 bg-white/75 px-1.5 py-2.5 text-center">
      <span className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-[14px] font-black leading-none tabular-nums text-foreground">
        {value}{unit}
      </p>
      <p className="mt-1 text-[9px] font-semibold leading-none text-muted-foreground">{label}</p>
    </div>
  );
}
