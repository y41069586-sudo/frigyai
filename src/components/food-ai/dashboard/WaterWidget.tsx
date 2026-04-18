import { motion } from "framer-motion";
import { Plus, Minus, Droplets } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";

const ML_PER_GLASS = 200;

type WaterWidgetProps = {
  waterGlasses: number;
  goalMl?: number;
  delay?: number;
  onAdd250ml: () => void;
  onSubtract250ml: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

export function WaterWidget({
  waterGlasses,
  goalMl = 2000,
  delay = 0,
  onAdd250ml,
  onSubtract250ml,
  expanded,
  onToggleExpand,
}: WaterWidgetProps) {
  const currentMl = waterGlasses * ML_PER_GLASS;
  const pct = Math.min(100, (currentMl / goalMl) * 100);
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const canSubtract = currentMl > 0;

  return (
    <WidgetCard
      delay={delay}
      variant="glass"
      interactive={!!onToggleExpand}
      onClick={onToggleExpand}
      className="w-full rounded-[1.85rem] rounded-bl-[2.5rem] rounded-tr-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="relative h-[92px] w-[92px] shrink-0">
            <svg width={92} height={92} className="rotate-[-90deg]">
              <circle
                cx={46}
                cy={46}
                r={r}
                fill="none"
                className="stroke-cyan-500/15"
                strokeWidth={8}
              />
              <motion.circle
                cx={46}
                cy={46}
                r={r}
                fill="none"
                className="stroke-cyan-500/90 drop-shadow-[0_0_10px_rgba(6,182,212,0.35)]"
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={c}
                initial={false}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Droplets className="mb-0.5 h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-base font-bold tabular-nums text-foreground">
                {(currentMl / 1000).toFixed(1)}
              </span>
              <span className="text-[9px] font-medium text-muted-foreground">Liter</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Hydration</p>
            <p className="text-lg font-semibold tracking-tight">Wasser</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ziel {(goalMl / 1000).toFixed(1)} L · {Math.round(pct)}%
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            disabled={!canSubtract}
            onClick={(e) => {
              e.stopPropagation();
              onSubtract250ml();
            }}
            className={cn(
              "flex h-14 w-14 flex-col items-center justify-center rounded-2xl rounded-br-md",
              "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30",
              "transition-transform hover:brightness-105 active:scale-95",
              "disabled:pointer-events-none disabled:opacity-35",
            )}
            aria-label="250 Milliliter abziehen"
          >
            <Minus className="h-6 w-6 stroke-[2.5]" />
            <span className="mt-0.5 text-[9px] font-bold">250 ml</span>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={(e) => {
              e.stopPropagation();
              onAdd250ml();
            }}
            className={cn(
              "flex h-14 w-14 flex-col items-center justify-center rounded-2xl rounded-tl-md",
              "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30",
              "transition-transform hover:brightness-105 active:scale-95",
            )}
            aria-label="250 Milliliter hinzufügen"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
            <span className="mt-0.5 text-[9px] font-bold">250 ml</span>
          </motion.button>
        </div>
      </div>

      {expanded && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-xs leading-relaxed text-muted-foreground"
        >
          Plus und Minus ändern deinen Stand in 250 ml-Schritten (auf Gläser gerundet, 200 ml pro Glas in der App).
        </motion.p>
      )}
    </WidgetCard>
  );
}
