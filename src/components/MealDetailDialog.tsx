import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Flame, Beef, Wheat, Droplets, Check, Loader2, ChefHat, Lightbulb, X } from "lucide-react";
import {
  getDetailedInstructions,
  parseAllCookingSteps,
  sumStepMinutes,
  groupStepsByPhase,
  phaseLabel,
  phaseBadgeClass,
} from "@/lib/cookingInstructions";
import { useFoodEntries } from "@/hooks/useFoodEntries";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  viewportPanelExit,
  viewportPanelFrom,
  viewportPanelTo,
  viewportPanelTransition,
} from "@/lib/motionPresets";
import { cn } from "@/lib/utils";
import { localizeMealTypeLabel } from "@/lib/mealI18n";

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

const LOG_BTN_COPY = {
  de: {
    log: "Gegessen loggen",
    logLong: "Als gegessen markieren",
    logging: "Wird geloggt…",
    done: "Gegessen!",
    close: "Schließen",
  },
  en: {
    log: "Log meal",
    logLong: "Mark as eaten",
    logging: "Logging…",
    done: "Logged!",
    close: "Close",
  },
  fr: {
    log: "Noter repas",
    logLong: "Marquer mangé",
    logging: "Enregistrement…",
    done: "Noté !",
    close: "Fermer",
  },
} as const;

export const MealDetailDialog = ({ meal, open, onOpenChange, onMealLogged }: MealDetailDialogProps) => {
  const { t, language } = useLanguage();
  const lng = (["de", "en", "fr"] as const).includes(language as "de" | "en" | "fr")
    ? (language as "de" | "en" | "fr")
    : "de";
  const btn = LOG_BTN_COPY[lng];
  const copy = {
    de: {
      loggedTitle: "✅ Gegessen geloggt",
      loggedDesc: "zu deinem Tracker hinzugefuegt",
      errorTitle: "Fehler",
      errorDesc: "Konnte Mahlzeit nicht speichern",
      kcal: "kcal",
      protein: "Protein",
      carbs: "Carbs",
      fat: "Fett",
      totalTime: "ca.",
      totalDuration: "Min Gesamtzeit",
      timedSteps: "Min in den Schritten",
      ingredients: "Zutaten",
      total: "Gesamt",
      cookingHint: "Schritt fuer Schritt nachkochen - Zeit, Phase und genaue Handgriffe in jedem Schritt.",
      instructions: "Zubereitung",
      steps: "Schritte",
    },
    en: {
      loggedTitle: "✅ Meal logged",
      loggedDesc: "added to your tracker",
      errorTitle: "Error",
      errorDesc: "Could not save meal",
      kcal: "kcal",
      protein: "Protein",
      carbs: "Carbs",
      fat: "Fat",
      totalTime: "approx.",
      totalDuration: "min total time",
      timedSteps: "min in steps",
      ingredients: "Ingredients",
      total: "Total",
      cookingHint: "Cook it step by step - each step includes time, phase, and exact actions.",
      instructions: "Preparation",
      steps: "steps",
    },
    fr: {
      loggedTitle: "✅ Repas enregistre",
      loggedDesc: "ajoute a ton suivi",
      errorTitle: "Erreur",
      errorDesc: "Impossible d enregistrer le repas",
      kcal: "kcal",
      protein: "Proteines",
      carbs: "Glucides",
      fat: "Lipides",
      totalTime: "env.",
      totalDuration: "min au total",
      timedSteps: "min dans les etapes",
      ingredients: "Ingredients",
      total: "Total",
      cookingHint: "Cuisine pas a pas - temps, phase et gestes precis dans chaque etape.",
      instructions: "Preparation",
      steps: "etapes",
    },
  } as const;
  const ui = copy[lng];
  const { addEntry } = useFoodEntries();
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [displayMeal, setDisplayMeal] = useState<Meal | null>(null);

  useEffect(() => {
    if (open && meal) setDisplayMeal(meal);
  }, [open, meal]);

  const activeMeal = displayMeal ?? meal;

  const handleLogMeal = async () => {
    if (!activeMeal) return;

    setIsLogging(true);
    try {
      const prepTime = activeMeal.prepTime || 20;

      const result = await addEntry({
        name: activeMeal.name,
        calories: Number(activeMeal.calories) || 0,
        protein: Number(activeMeal.protein) || 0,
        carbs: Number(activeMeal.carbs) || 0,
        fat: Number(activeMeal.fat) || 0,
        portion: `${prepTime}min`,
        meal_type: activeMeal.type,
      });

      if (result) {
        setIsLogged(true);
        toast({
          title: ui.loggedTitle,
          description: `${activeMeal.name} ${ui.loggedDesc}`,
        });
        onMealLogged?.();
        setTimeout(() => {
          onOpenChange(false);
          setIsLogged(false);
        }, 1000);
      }
    } catch (error) {
      console.error("[MealDetailDialog] Error logging meal:", error);
      toast({
        title: ui.errorTitle,
        description: ui.errorDesc,
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  const detailedInstructions = activeMeal ? getDetailedInstructions(activeMeal) : [];
  const parsedSteps = activeMeal ? parseAllCookingSteps(detailedInstructions) : [];
  const timedMinutes = sumStepMinutes(parsedSteps);
  const phaseGroups = groupStepsByPhase(parsedSteps);

  return (
    <AnimatePresence onExitComplete={() => { if (!open) setDisplayMeal(null); }}>
      {open && activeMeal && (
        <>
          <motion.button
            type="button"
            aria-label={btn.close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[60] bg-black/45"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="meal-detail-title"
            initial={viewportPanelFrom(isMobile)}
            animate={viewportPanelTo()}
            exit={viewportPanelExit(isMobile)}
            transition={viewportPanelTransition(isMobile)}
            className={cn(
              "fixed z-[61] flex flex-col overflow-hidden bg-[#F7FAF7] shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]",
              !isMobile && "gpu-smooth",
              isMobile
                ? "left-3 right-3 top-[max(4.5rem,env(safe-area-inset-top,0px)+3rem)] bottom-[max(0.75rem,env(safe-area-inset-bottom,0px)+0.5rem)] rounded-[1.75rem] border border-primary/15"
                : "left-1/2 top-1/2 max-h-[88vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-primary/20",
            )}
          >
            <div className={cn("shrink-0", !isMobile && "pt-2")}>
              <div className={cn("flex items-start gap-2 px-5", isMobile ? "pb-2 pt-3" : "px-6 pt-4")}>
                <div className="min-w-0 flex-1">
                  <Badge
                    className="mb-2 w-fit rounded-full border-primary/20 bg-primary/10 text-primary"
                    variant="secondary"
                  >
                    {localizeMealTypeLabel(activeMeal.type, t)}
                  </Badge>
                  <h2
                    id="meal-detail-title"
                    className="pr-2 text-[22px] font-black leading-tight tracking-[-0.04em] text-foreground sm:text-[24px]"
                  >
                    {activeMeal.name}
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-9 w-9 shrink-0 rounded-full"
                  aria-label={btn.close}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div
              ref={scrollRef}
              data-sheet-scroll
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-28 pt-1 sm:px-6 sm:pb-24"
            >
              <div className="my-3 grid grid-cols-4 gap-2">
                <MacroCard icon={Flame} iconClass="text-orange-500 bg-orange-50" value={Math.round(activeMeal.calories)} label={ui.kcal} />
                <MacroCard icon={Beef} iconClass="text-rose-500 bg-rose-50" value={Math.round(activeMeal.protein)} label={ui.protein} unit="g" />
                <MacroCard icon={Wheat} iconClass="text-amber-500 bg-amber-50" value={Math.round(activeMeal.carbs)} label={ui.carbs} unit="g" />
                <MacroCard icon={Droplets} iconClass="text-sky-500 bg-sky-50" value={Math.round(activeMeal.fat)} label={ui.fat} unit="g" />
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2.5 text-sm">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium text-foreground">{ui.totalTime} {activeMeal.prepTime} {ui.totalDuration}</span>
                {timedMinutes > 0 && (
                  <span className="text-xs text-muted-foreground">· {timedMinutes} {ui.timedSteps}</span>
                )}
              </div>

              <section className="mb-5 rounded-3xl border border-slate-200/85 bg-white/72 p-4">
                <h4 className="mb-3 text-[17px] font-bold tracking-[-0.02em] text-foreground">{ui.ingredients}</h4>
                <ul className="space-y-2">
                  {activeMeal.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/35 px-3 py-2.5">
                      <span className="min-w-0 text-sm font-medium text-foreground">
                        <span className="text-muted-foreground">{ing.amount}</span> {ing.name}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                        €{(Number(ing.price) || 0).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t border-slate-200/80 pt-3 text-sm font-semibold">
                  <span>{ui.total}</span>
                  <span className="text-primary">
                    €{activeMeal.ingredients.reduce((sum, ing) => sum + (Number(ing.price) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </section>

              <section className="mb-6 rounded-3xl border border-slate-200/85 bg-white/72 p-4">
                <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2.5">
                  <ChefHat className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {ui.cookingHint}
                  </p>
                </div>
                <h4 className="mb-3 text-[17px] font-bold tracking-[-0.02em] text-foreground">
                  {ui.instructions} ({parsedSteps.length} {ui.steps})
                </h4>
                <div className="space-y-5">
                  {phaseGroups.map(({ phase, steps }) => (
                    <div key={phase}>
                      <p
                        className={`mb-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${phaseBadgeClass[phase]}`}
                      >
                        {phaseLabel[phase]}
                      </p>
                      <ol className="space-y-3">
                        {steps.map((step) => (
                          <li key={step.index} className="rounded-2xl border border-slate-200/70 bg-muted/25 p-3.5">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                                {step.index + 1}
                              </span>
                              {step.minutes != null && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-slate-200/80">
                                  <Clock className="h-3 w-3 text-primary" />
                                  {step.minutes} min
                                </span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">{step.text}</p>
                            {step.tip && (
                              <p className="mt-2.5 flex gap-2 rounded-xl bg-amber-50/90 px-2.5 py-2 text-xs leading-relaxed text-amber-900">
                                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{step.tip}</span>
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 flex gap-2 border-t border-slate-200/80 bg-white/95 px-3 pb-[max(1rem,env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 backdrop-blur-xl sm:px-4">
              <Button
                onClick={handleLogMeal}
                disabled={isLogging || isLogged}
                className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-2xl bg-primary px-2 text-[11px] font-bold leading-tight hover:bg-primary/90 whitespace-normal sm:h-12 sm:px-3 sm:text-xs"
              >
                {isLogged ? (
                  <>
                    <Check className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                    <span className="truncate">{t.toastFoodLogged || btn.done}</span>
                  </>
                ) : isLogging ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin sm:h-4 sm:w-4" aria-hidden />
                    <span className="truncate">{btn.logging}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                    <span className="truncate">{isMobile ? btn.log : btn.logLong}</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="h-11 w-[4.75rem] shrink-0 rounded-2xl px-2 text-[11px] font-bold sm:h-12 sm:w-24 sm:text-xs"
              >
                {btn.close}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
        {value}
        {unit}
      </p>
      <p className="mt-1 text-[9px] font-semibold leading-none text-muted-foreground">{label}</p>
    </div>
  );
}
