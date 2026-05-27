import { motion } from "framer-motion";
import { Beef, Check, Droplet, Plus, Wheat } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { dashboardTileBorder, dashboardWidgetBorder } from "./dashboardStyles";
import { cn } from "@/lib/utils";
import type { MealFocusKey } from "@/lib/mealFocus";
import { useLanguage } from "@/contexts/LanguageContext";

type TrackerWidgetProps = {
  delay?: number;
  caloriesEaten: number;
  targetCalories: number;
  proteinEaten: number;
  targetProtein: number;
  carbsEaten: number;
  targetCarbs: number;
  fatEaten: number;
  targetFat: number;
  waterMl?: number;
  waterGoalMl?: number;
  steps?: number;
  onAddMeal?: (slot: MealFocusKey) => void;
  onOpenTracker?: () => void;
  onOpenMealPlanner?: () => void;
  loggedMealTypes?: MealFocusKey[];
  showQuickLog?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

export function TrackerWidget({
  delay = 0,
  caloriesEaten,
  targetCalories,
  proteinEaten,
  targetProtein,
  carbsEaten,
  targetCarbs,
  fatEaten,
  targetFat,
  onAddMeal,
  onOpenTracker,
  loggedMealTypes = [],
  showQuickLog = true,
}: TrackerWidgetProps) {
  const { language } = useLanguage();
  const locale = language === "fr" ? "fr-FR" : language === "en" ? "en-US" : "de-DE";
  const copy = language === "fr"
    ? {
        today: "Aujourd hui",
        overGoal: "au-dessus de l objectif",
        remaining: "restants",
        eaten: "manges",
        protein: "Proteines",
        carbs: "Glucides",
        fat: "Lipides",
        quickLog: "Ajout rapide",
        breakfast: "Petit dej",
        lunch: "Midi",
        dinner: "Soir",
        snack: "Snack",
        addMeal: "Ajouter",
      }
    : language === "en"
      ? {
          today: "Today",
          overGoal: "over goal",
          remaining: "left",
          eaten: "eaten",
          protein: "Protein",
          carbs: "Carbs",
          fat: "Fat",
          quickLog: "Quick add",
          breakfast: "Breakfast",
          lunch: "Lunch",
          dinner: "Dinner",
          snack: "Snack",
          addMeal: "Add",
        }
      : {
          today: "Heute",
          overGoal: "ueber dem Ziel",
          remaining: "uebrig",
          eaten: "gegessen",
          protein: "Protein",
          carbs: "Carbs",
          fat: "Fett",
          quickLog: "Schnell eintragen",
          breakfast: "Fruehstueck",
          lunch: "Mittag",
          dinner: "Abend",
          snack: "Snack",
          addMeal: "Hinzufuegen",
        };
  const mealSlots: { key: MealFocusKey; label: string; icon: string }[] = [
    { key: "breakfast", label: copy.breakfast, icon: "🍳" },
    { key: "lunch", label: copy.lunch, icon: "🥗" },
    { key: "dinner", label: copy.dinner, icon: "🍝" },
    { key: "snack", label: copy.snack, icon: "🍎" },
  ];
  const roundedTargetCalories = Math.round(targetCalories);
  const roundedCaloriesEaten = Math.round(caloriesEaten);
  const rawCalorieDelta = roundedTargetCalories - roundedCaloriesEaten;
  const caloriesOver = rawCalorieDelta < -1 ? Math.abs(rawCalorieDelta) : 0;
  const caloriesRemaining = rawCalorieDelta > 1 ? rawCalorieDelta : 0;
  const isOverGoal = caloriesOver > 0;
  const calPct = targetCalories > 0 ? Math.min(100, (caloriesEaten / targetCalories) * 100) : 0;
  const proteinText = `${Math.round(proteinEaten)} / ${Math.round(targetProtein)}g`;
  const carbsText = `${Math.round(carbsEaten)} / ${Math.round(targetCarbs)}g`;
  const fatText = `${Math.round(fatEaten)} / ${Math.round(targetFat)}g`;
  const proteinPct = targetProtein > 0 ? Math.min(100, (proteinEaten / targetProtein) * 100) : 0;
  const carbsPct = targetCarbs > 0 ? Math.min(100, (carbsEaten / targetCarbs) * 100) : 0;
  const fatPct = targetFat > 0 ? Math.min(100, (fatEaten / targetFat) * 100) : 0;

  return (
    <div className="space-y-6">
      <WidgetCard
        delay={delay}
        variant="glass"
        interactive={false}
        className="-mx-1 w-[calc(100%+0.5rem)] rounded-[2rem] border border-transparent bg-white/88 p-5 shadow-[0_18px_44px_-32px_rgba(22,101,52,0.24)] sm:mx-0 sm:w-full sm:border-slate-200/70 sm:bg-white/78 sm:p-6 sm:shadow-[0_26px_70px_-34px_rgba(22,101,52,0.38)]"
      >
        <div className="space-y-7 text-foreground">
          <div className="space-y-1.5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary/75">{copy.today}</p>
            <button
              type="button"
              onClick={onOpenTracker}
              className={cn(
                "block text-left text-[34px] font-black leading-none tracking-[-0.04em] tabular-nums active:scale-[0.99] sm:text-[38px]",
                isOverGoal ? "text-rose-600" : "text-foreground",
              )}
            >
              {(isOverGoal ? caloriesOver : caloriesRemaining).toLocaleString(locale)} kcal
            </button>
            <p className={cn("text-[13px] font-medium", isOverGoal ? "text-rose-500" : "text-muted-foreground")}>
              {isOverGoal ? copy.overGoal : copy.remaining} von {roundedTargetCalories.toLocaleString(locale)} kcal
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-3 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                className={cn("h-full origin-left rounded-full", isOverGoal ? "bg-rose-500" : "bg-primary")}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: calPct / 100 }}
                transition={{ duration: 0.85, delay: delay + 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="flex items-center justify-between text-[12px] font-medium text-muted-foreground">
              <span className={cn(isOverGoal && "text-rose-500")}>
                {roundedCaloriesEaten.toLocaleString(locale)} {copy.eaten}
              </span>
              <span className={cn(isOverGoal && "text-rose-500")}>{Math.round(calPct)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <InlineStat icon={Beef} colorClass="text-rose-500 bg-rose-50" ringColor="#fb7185" label={copy.protein} value={proteinText} progress={proteinPct} />
            <InlineStat icon={Wheat} colorClass="text-amber-500 bg-amber-50" ringColor="#fbbf24" label={copy.carbs} value={carbsText} progress={carbsPct} />
            <InlineStat icon={Droplet} colorClass="text-sky-500 bg-sky-50" ringColor="#38bdf8" label={copy.fat} value={fatText} progress={fatPct} />
          </div>
        </div>
      </WidgetCard>

      {showQuickLog && (
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-[24px] font-bold tracking-[-0.03em] text-foreground">{copy.today}</h2>
          <span className="text-[12px] font-medium text-muted-foreground">{copy.quickLog}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {mealSlots.map((slot, index) => {
            const logged = loggedMealTypes.includes(slot.key);
            return (
              <motion.button
                key={slot.key}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.08 + index * 0.03, duration: 0.28 }}
                whileTap={{ scale: 0.92, y: 2 }}
                onClick={() => onAddMeal?.(slot.key)}
                className={cn(
                  "flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-[1.15rem] bg-white px-1.5 py-2 text-center shadow-[0_6px_16px_-14px_rgba(15,23,42,0.1)] transition-colors sm:min-h-[78px] sm:bg-white/95 sm:backdrop-blur-xl",
                  logged
                    ? "border border-primary/35 bg-primary/10 text-primary"
                    : cn(dashboardTileBorder, "text-foreground hover:bg-primary/6"),
                )}
                aria-label={`${copy.addMeal} ${slot.label}`}
              >
                <span className="text-[23px] sm:text-[24px]" aria-hidden>{slot.icon}</span>
                <span className="text-[10px] font-bold leading-tight sm:text-[11px]">
                  {slot.label}
                </span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full sm:h-5.5 sm:w-5.5",
                    logged ? "bg-primary" : "bg-primary/12",
                  )}
                >
                  {logged ? (
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  ) : (
                    <Plus className="h-3 w-3 text-primary" strokeWidth={3} />
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>
      )}
    </div>
  );
}

function InlineStat({
  icon: Icon,
  colorClass,
  ringColor,
  label,
  value,
  progress,
}: {
  icon: typeof Beef;
  colorClass: string;
  ringColor: string;
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div className="relative rounded-2xl px-2.5 py-3 text-center">
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `conic-gradient(${ringColor} ${progress * 3.6}deg, rgba(100,116,139,0.34) 0deg)`,
        }}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-[3px] rounded-[0.82rem] bg-[#f9fbf9]/98",
          dashboardTileBorder,
        )}
      />
      <div className="relative z-[1]">
        <span className={cn("mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full", colorClass)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-[10px] font-bold leading-none tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}
