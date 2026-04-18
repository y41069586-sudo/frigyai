import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Flame, Beef, Wheat, Droplet } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";

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
  expanded?: boolean;
  onToggleExpand?: () => void;
};

function Ring({
  pct,
  size = 108,
  stroke = 7,
  className,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, pct) / 100) * c;
  return (
    <svg width={size} height={size} className={cn("rotate-[-90deg]", className)}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-muted/40"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.35)]"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

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
  expanded,
  onToggleExpand,
}: TrackerWidgetProps) {
  const calPct = targetCalories > 0 ? (caloriesEaten / targetCalories) * 100 : 0;
  const pPct = targetProtein > 0 ? (proteinEaten / targetProtein) * 100 : 0;
  const cPct = targetCarbs > 0 ? (carbsEaten / targetCarbs) * 100 : 0;
  const fPct = targetFat > 0 ? (fatEaten / targetFat) * 100 : 0;

  return (
    <WidgetCard
      delay={delay}
      variant="soft"
      interactive={!!onToggleExpand}
      onClick={onToggleExpand}
      className="w-full rounded-[2rem] rounded-br-3xl rounded-tl-xl"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <Ring pct={calPct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Flame className="mb-1 h-5 w-5 text-primary" />
              <span className="text-xl font-bold tabular-nums leading-none">{Math.round(calPct)}%</span>
              <span className="text-[10px] font-medium text-muted-foreground">vom Ziel</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Heute</p>
            <p className="text-3xl font-bold tabular-nums tracking-tight">
              {Math.round(caloriesEaten)}
              <span className="text-base font-semibold text-muted-foreground"> / {targetCalories} kcal</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex min-h-0 w-full min-w-0 flex-1">
          <MacroBar
            icon={<Beef className="h-4 w-4" />}
            label="Protein"
            current={proteinEaten}
            target={targetProtein}
            pct={pPct}
            color="from-rose-400/90 to-orange-400/80"
          />
        </div>
        <div className="flex min-h-0 w-full min-w-0 flex-1">
          <MacroBar
            icon={<Wheat className="h-4 w-4" />}
            label="Carbs"
            current={carbsEaten}
            target={targetCarbs}
            pct={cPct}
            color="from-amber-400/90 to-yellow-400/70"
          />
        </div>
        <div className="flex min-h-0 w-full min-w-0 flex-1">
          <MacroBar
            icon={<Droplet className="h-4 w-4" />}
            label="Fett"
            current={fatEaten}
            target={targetFat}
            pct={fPct}
            color="from-sky-400/80 to-blue-500/70"
          />
        </div>
      </div>

      {expanded && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 text-xs leading-relaxed text-muted-foreground"
        >
          Werte aus deinen Einträgen von heute.
        </motion.p>
      )}
    </WidgetCard>
  );
}

function MacroBar({
  icon,
  label,
  current,
  target,
  pct,
  color,
}: {
  icon: ReactNode;
  label: string;
  current: number;
  target: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-border/30 bg-background/50 p-3.5 backdrop-blur-sm">
      <div className="mb-2 flex min-h-[2.75rem] items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="shrink-0 self-center text-xs tabular-nums text-foreground">
          {Math.round(current)} / {Math.round(target)} g
        </span>
      </div>
      <div className="mt-auto h-2 shrink-0 overflow-hidden rounded-full bg-muted/80">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", color)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
