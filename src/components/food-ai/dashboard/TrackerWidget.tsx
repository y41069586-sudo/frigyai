import { motion } from "framer-motion";
import { Beef, Check, Droplet, Plus, Wheat } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";
import type { MealFocusKey } from "@/lib/mealFocus";

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
  expanded?: boolean;
  onToggleExpand?: () => void;
};

const MEAL_SLOTS: { key: MealFocusKey; label: string; icon: string }[] = [
  { key: "breakfast", label: "Frühstück", icon: "🍳" },
  { key: "lunch", label: "Mittag", icon: "🥗" },
  { key: "dinner", label: "Abend", icon: "🍝" },
  { key: "snack", label: "Snack", icon: "🍎" },
];

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
}: TrackerWidgetProps) {
  const caloriesRemaining = Math.max(0, Math.round(targetCalories - caloriesEaten));
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
        className="-mx-1 w-[calc(100%+0.5rem)] rounded-[2rem] border border-slate-200/85 bg-white/82 p-5 shadow-[0_18px_44px_-32px_rgba(22,101,52,0.36)] sm:mx-0 sm:w-full sm:bg-white/78 sm:p-6 sm:shadow-[0_26px_70px_-34px_rgba(22,101,52,0.45)]"
      >
        <div className="space-y-7 text-foreground">
          <div className="space-y-1.5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary/75">Heute</p>
            <button
              type="button"
              onClick={onOpenTracker}
              className="block text-left text-[34px] font-black leading-none tracking-[-0.04em] tabular-nums text-foreground active:scale-[0.99] sm:text-[38px]"
            >
              {caloriesRemaining.toLocaleString("de-DE")} kcal
            </button>
            <p className="text-[13px] font-medium text-muted-foreground">übrig von {targetCalories.toLocaleString("de-DE")} kcal</p>
          </div>

          <div className="space-y-3">
            <div className="h-3 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                className="h-full origin-left rounded-full bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: calPct / 100 }}
                transition={{ duration: 0.85, delay: delay + 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="flex items-center justify-between text-[12px] font-medium text-muted-foreground">
              <span>{Math.round(caloriesEaten).toLocaleString("de-DE")} gegessen</span>
              <span>{Math.round(calPct)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <InlineStat icon={Beef} colorClass="text-rose-500 bg-rose-50" ringColor="#fb7185" label="Protein" value={proteinText} progress={proteinPct} />
            <InlineStat icon={Wheat} colorClass="text-amber-500 bg-amber-50" ringColor="#fbbf24" label="Carbs" value={carbsText} progress={carbsPct} />
            <InlineStat icon={Droplet} colorClass="text-sky-500 bg-sky-50" ringColor="#38bdf8" label="Fett" value={fatText} progress={fatPct} />
          </div>
        </div>
      </WidgetCard>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-[24px] font-bold tracking-[-0.03em] text-foreground">Heute</h2>
          <span className="text-[12px] font-medium text-muted-foreground">Schnell eintragen</span>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {MEAL_SLOTS.map((slot, index) => {
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
                  "flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-[1.35rem] border bg-white/82 px-1.5 text-center shadow-[0_8px_20px_-18px_rgba(15,23,42,0.2)] transition-colors sm:bg-white/72 sm:backdrop-blur-xl sm:shadow-[0_10px_28px_-22px_rgba(15,23,42,0.24)]",
                  logged
                    ? "border-slate-300/90 bg-primary/12 text-primary"
                    : "border-slate-200/85 text-foreground hover:bg-primary/8",
                )}
                aria-label={`${slot.label} hinzufügen`}
              >
                <span className="text-[24px]" aria-hidden>{slot.icon}</span>
                <span className="text-[11px] font-bold leading-tight">{slot.label}</span>
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", logged ? "bg-primary" : "bg-primary/12")}>
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
          background: `conic-gradient(${ringColor} ${progress * 3.6}deg, rgba(148,163,184,0.22) 0deg)`,
        }}
      />
      <div className="pointer-events-none absolute inset-[2px] rounded-[0.9rem] bg-[#f6f8f6]" />
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
