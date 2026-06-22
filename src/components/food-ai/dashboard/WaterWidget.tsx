import { AnimatePresence, motion } from "framer-motion";
import { Droplet } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { dashboardScrollTransition, dashboardScrollViewport } from "@/lib/motionPresets";
import { dashboardWaterShadow } from "./dashboardCardStyles";

import { ML_PER_WATER_GLASS } from "@/lib/waterUnits";

const ML_PER_GLASS = ML_PER_WATER_GLASS;

type WaterWidgetProps = {
  waterGlasses: number;
  goalMl?: number;
  delay?: number;
  onAdd250ml: () => void;
  onSubtract250ml: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
};

export const WaterWidget = memo(function WaterWidget({
  waterGlasses,
  goalMl = 2000,
  delay = 0,
  onAdd250ml,
  onSubtract250ml,
  onToggleExpand,
  className,
}: WaterWidgetProps) {
  const { t } = useLanguage();
  const safeGoalMl = Math.min(goalMl, 2000);
  const currentMl = waterGlasses * ML_PER_GLASS;
  const goalLiters = safeGoalMl / 1000;
  const litersText = (currentMl / 1000).toFixed(2);
  const waterFillPct = safeGoalMl > 0 ? Math.min(100, (currentMl / safeGoalMl) * 100) : 0;
  const emptyLines = t.dashboardWaterEmpty.split("\n");

  const isGoalReached = waterFillPct >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={dashboardScrollViewport}
      transition={dashboardScrollTransition(false, delay)}
      {...(onToggleExpand ? { onClick: onToggleExpand } : {})}
      className={cn(
        "dashboard-touch-scroll relative min-w-0 w-full overflow-hidden rounded-[1.85rem]",
        "border border-sky-200/85 bg-gradient-to-br from-sky-50 via-white to-sky-100/70",
        dashboardWaterShadow,
        className,
      )}
    >
      <div className="relative z-[10] p-4 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Droplet className="h-4 w-4 fill-sky-500 text-sky-500" />
            </span>
            <h3 className="min-w-0 text-[14px] font-semibold tracking-[-0.03em] text-foreground">{t.water}</h3>
          </div>
          {isGoalReached && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="text-[18px]"
              aria-label="Goal reached"
            >
              ✅
            </motion.span>
          )}
        </div>

        {/* Amount display */}
        <AnimatePresence mode="wait">
          {currentMl === 0 ? (
            <motion.p
              key="water-empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="text-[13px] font-medium leading-snug text-muted-foreground"
            >
              {emptyLines.map((line, index) => (
                <span key={line}>
                  {line}
                  {index < emptyLines.length - 1 && <br />}
                </span>
              ))}
            </motion.p>
          ) : (
            <motion.div
              key="water-filled"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-baseline gap-2"
            >
              <p className="text-[28px] font-bold leading-none tracking-[-0.04em] text-foreground tabular-nums">
                {litersText}<span className="ml-1 text-[16px] font-semibold text-muted-foreground">l</span>
              </p>
              <p className="text-[13px] font-semibold text-sky-500">{Math.round(waterFillPct)}%</p>
              <p className="text-[12px] text-muted-foreground">/ {goalLiters.toFixed(1)} l</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Horizontal progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-sky-100/80">
          <motion.div
            className="h-full origin-left rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.max(0, waterFillPct / 100) }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Controls */}
        <AnimatePresence mode="wait">
          {currentMl === 0 ? (
            <motion.button
              key="add-glass"
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation();
                onAdd250ml();
              }}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-sky-300 bg-white/55 text-[13px] font-semibold text-sky-700 transition-colors active:bg-sky-50"
            >
              <span className="text-[16px]">+</span>
              <span>{t.addGlass}</span>
            </motion.button>
          ) : (
            <motion.div
              key="water-controls"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="grid w-full grid-cols-[1fr_2fr] gap-2"
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSubtract250ml();
                }}
                className="flex h-10 min-w-0 items-center justify-center rounded-2xl border-2 border-sky-200 bg-white/65 text-[20px] font-medium text-sky-700 transition-colors active:bg-sky-50"
              >
                −
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd250ml();
                }}
                className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(56,189,248,0.35)] transition-all active:scale-[0.97]"
              >
                <span className="text-[16px] font-bold leading-none">+</span>
                <span>250 ml</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
