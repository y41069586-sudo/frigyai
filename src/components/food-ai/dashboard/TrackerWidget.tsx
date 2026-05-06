import { motion } from "framer-motion";
import { CalendarDays, Flame, Pencil, Plus } from "lucide-react";
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
  onAddMeal?: (slot: MealFocusKey) => void;
  onOpenTracker?: () => void;
  onOpenMealPlanner?: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

const MEAL_SLOTS: { key: MealFocusKey; label: string }[] = [
  { key: "breakfast", label: "Frühstück" },
  { key: "lunch", label: "Mittagessen" },
  { key: "dinner", label: "Abendessen" },
  { key: "snack", label: "Snacks" },
];

// Arc geometry: semicircle from left → top → right
const ARC_R = 78;
const ARC_CX = 100;
const ARC_CY = 100;
const ARC_HALF = Math.PI * ARC_R; // half circumference ≈ 245

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
  onOpenMealPlanner,
  expanded,
  onToggleExpand,
}: TrackerWidgetProps) {
  const caloriesRemaining = Math.max(0, Math.round(targetCalories - caloriesEaten));
  const calPct = targetCalories > 0 ? Math.min(1, caloriesEaten / targetCalories) : 0;
  const pPct = targetProtein > 0 ? (proteinEaten / targetProtein) * 100 : 0;
  const cPct = targetCarbs > 0 ? (carbsEaten / targetCarbs) * 100 : 0;
  const fPct = targetFat > 0 ? (fatEaten / targetFat) * 100 : 0;

  return (
    <WidgetCard
      delay={delay}
      variant="gradient"
      interactive={!!onToggleExpand}
      onClick={onToggleExpand}
      className="w-full rounded-[1.4rem] sm:rounded-[1.8rem]"
    >
      <div className="space-y-3 text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <h3 className="text-lg font-semibold">Kalorien</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenMealPlanner?.(); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60"
              aria-label="Wochenplan öffnen"
            >
              <CalendarDays className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenTracker?.(); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60"
              aria-label="Tracker bearbeiten"
            >
              <Pencil className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Arc gauge + calorie stats */}
        <div className="relative h-[130px]">
          {/* Semicircular SVG arc */}
          <svg
            viewBox="0 0 200 130"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            {/* Track (full semicircle) */}
            <circle
              cx={ARC_CX}
              cy={ARC_CY}
              r={ARC_R}
              fill="none"
              stroke="hsl(148 42% 88%)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${ARC_HALF} ${ARC_HALF * 2}`}
              transform={`rotate(180, ${ARC_CX}, ${ARC_CY})`}
            />
            {/* Progress arc */}
            <motion.circle
              cx={ARC_CX}
              cy={ARC_CY}
              r={ARC_R}
              fill="none"
              stroke="hsl(150 100% 46%)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${ARC_HALF} ${ARC_HALF * 2}`}
              transform={`rotate(180, ${ARC_CX}, ${ARC_CY})`}
              initial={{ strokeDashoffset: ARC_HALF }}
              animate={{ strokeDashoffset: ARC_HALF * (1 - calPct) }}
              transition={{ duration: 0.9, ease: "easeOut", delay }}
            />
          </svg>

          {/* Calorie numbers overlaid at bottom of arc */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between pb-2 text-center">
            <div className="text-center">
              <p className="text-lg font-semibold tabular-nums leading-tight">{Math.round(caloriesEaten)}</p>
              <p className="text-[11px] text-muted-foreground">Gegessen</p>
            </div>
            <div className="text-center">
              <p className="text-[1.7rem] font-bold tabular-nums leading-tight">{caloriesRemaining.toLocaleString("de-DE")}</p>
              <p className="text-[11px] text-muted-foreground">kcal Übrig</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold tabular-nums leading-tight">0</p>
              <p className="text-[11px] text-muted-foreground">Verbrannt</p>
            </div>
          </div>
        </div>

        {/* Macro stats */}
        <div className="grid grid-cols-3 gap-3">
          <MacroStat label="Carbs" current={carbsEaten} target={targetCarbs} pct={cPct} />
          <MacroStat label="Eiweiß" current={proteinEaten} target={targetProtein} pct={pPct} />
          <MacroStat label="Fett" current={fatEaten} target={targetFat} pct={fPct} />
        </div>

        {/* Meal slots */}
        <div className="grid grid-cols-2 gap-2">
          {MEAL_SLOTS.map((slot) => (
            <div
              key={slot.key}
              className="flex items-center justify-between rounded-xl border border-border/40 bg-card/65 px-2.5 py-2"
            >
              <span className="text-sm">{slot.label}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAddMeal?.(slot.key); }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400 text-emerald-950",
                  "transition-transform active:scale-95",
                )}
                aria-label={`${slot.label} hinzufügen`}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {expanded && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-xs text-muted-foreground"
          >
            Werte aus deinen heutigen Einträgen.
          </motion.p>
        )}
      </div>
    </WidgetCard>
  );
}

function MacroStat({
  label,
  current,
  target,
  pct,
}: {
  label: string;
  current: number;
  target: number;
  pct: number;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-center text-xs text-muted-foreground">{label}</p>
      <div className="h-[3px] rounded-full bg-muted/80">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="text-center text-sm font-medium tabular-nums leading-tight">
        {Math.round(current)}/{Math.round(target)} g
      </p>
    </div>
  );
}
