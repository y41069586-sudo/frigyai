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
const ARC_R = 64;
const ARC_CX = 100;
const ARC_CY = 100;
const ARC_HALF = Math.PI * ARC_R;

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
      className="w-full rounded-xl sm:rounded-2xl"
    >
      <div className="space-y-2 text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <h3 className="text-[15px] font-semibold">Kalorien</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenMealPlanner?.(); }}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted/60"
              aria-label="Wochenplan öffnen"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenTracker?.(); }}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted/60"
              aria-label="Tracker bearbeiten"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Arc gauge + calorie stats */}
        <div className="relative h-[96px] min-[360px]:h-[104px]">
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
              strokeWidth="9"
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
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${ARC_HALF} ${ARC_HALF * 2}`}
              transform={`rotate(180, ${ARC_CX}, ${ARC_CY})`}
              initial={{ strokeDashoffset: ARC_HALF }}
              animate={{ strokeDashoffset: ARC_HALF * (1 - calPct) }}
              transition={{ duration: 0.9, ease: "easeOut", delay }}
            />
          </svg>

          {/* Calorie numbers overlaid at bottom of arc */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-0.5 pb-1 text-center">
            <div className="text-center">
              <p className="text-sm font-semibold tabular-nums leading-tight">{Math.round(caloriesEaten)}</p>
              <p className="text-[10px] text-muted-foreground">Gegessen</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold tabular-nums leading-tight min-[360px]:text-2xl">{caloriesRemaining.toLocaleString("de-DE")}</p>
              <p className="text-[10px] text-muted-foreground">kcal Übrig</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold tabular-nums leading-tight">0</p>
              <p className="text-[10px] text-muted-foreground">Verbrannt</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MacroStat label="Carbs" current={carbsEaten} target={targetCarbs} pct={cPct} />
          <MacroStat label="Eiweiß" current={proteinEaten} target={targetProtein} pct={pPct} />
          <MacroStat label="Fett" current={fatEaten} target={targetFat} pct={fPct} />
        </div>

        {/* Meal slots */}
        <div className="grid grid-cols-2 gap-1.5">
          {MEAL_SLOTS.map((slot) => (
            <motion.div
              key={slot.key}
              className="flex items-center justify-between rounded-lg border border-border/40 bg-card/65 px-2 py-1.5"
            >
              <span className="text-xs font-medium">{slot.label}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAddMeal?.(slot.key); }}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#DCF5EA]",
                  "transition-transform active:scale-95",
                )}
                aria-label={`${slot.label} hinzufügen`}
              >
                <Plus className="h-3.5 w-3.5 text-[#1ED78A]" strokeWidth={2.5} />
              </button>
            </motion.div>
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
    <div className="space-y-1">
      <p className="text-center text-[10px] text-muted-foreground">{label}</p>
      <div className="h-[2px] rounded-full bg-muted/80">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="text-center text-[11px] font-medium tabular-nums leading-tight">
        {Math.round(current)}/{Math.round(target)} g
      </p>
    </div>
  );
}
