import { AnimatePresence, motion } from "framer-motion";
import { Droplet } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

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
};

export const WaterWidget = memo(function WaterWidget({
  waterGlasses,
  goalMl = 2000,
  delay = 0,
  onAdd250ml,
  onSubtract250ml,
  onToggleExpand,
}: WaterWidgetProps) {
  const { language } = useLanguage();
  const safeGoalMl = Math.max(ML_PER_GLASS, goalMl);
  const currentMl = waterGlasses * ML_PER_GLASS;
  const goalLiters = safeGoalMl / 1000;
  const litersText = (currentMl / 1000).toFixed(2);
  const waterFillPct = safeGoalMl > 0 ? Math.min(100, (currentMl / safeGoalMl) * 100) : 0;
  const copy = language === "fr"
    ? {
        title: "Eau",
        empty: "Encore soif ?\nCommence avec\nun verre d'eau",
        today: "Aujourd'hui",
        addGlass: "Ajouter un verre",
      }
    : language === "en"
      ? {
          title: "Water",
          empty: "Still thirsty?\nStart with\none glass of water",
          today: "Today",
          addGlass: "Add glass",
        }
      : {
          title: "Wasser",
          empty: "Noch durstig? Fang\nmit einem Glas\nWasser an",
          today: "Heute",
          addGlass: "Glas hinzufügen",
        };
  const emptyLines = copy.empty.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, delay: Math.min(delay, 0.08), ease: [0.22, 1, 0.36, 1] }}
      onClick={onToggleExpand}
      className={cn(
        "relative min-h-[158px] min-[360px]:min-h-[172px] sm:min-h-[185px] min-w-0 w-full overflow-hidden rounded-[1.85rem]",
        "border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-sky-100/70",
        "touch-manipulation",
      )}
    >
      {currentMl > 0 && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: Math.max(0.12, waterFillPct / 100) }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-full origin-bottom rounded-b-[1.85rem] bg-gradient-to-t from-sky-500/65 to-sky-300/35"
        />
      )}
      <div className="pointer-events-none absolute inset-x-5 top-10 hidden h-20 rounded-full bg-sky-300/55 blur-2xl sm:block" />

      <div className="relative z-[10] grid min-h-[185px] grid-rows-[auto_1fr_auto] justify-items-center p-4">
        <div className="justify-self-start flex items-center gap-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Droplet className="h-4 w-4 fill-sky-500 text-sky-500" />
          </span>
          <h3 className="min-w-0 text-[14px] font-semibold tracking-[-0.03em] text-foreground">{copy.title}</h3>
        </div>

        <div className="flex w-full items-center justify-center px-1 py-1 text-center">
          <AnimatePresence mode="wait">
            {currentMl === 0 ? (
              <motion.p
                key="water-empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="w-full text-center text-[11px] font-semibold leading-snug tracking-[-0.04em] text-foreground"
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-[11px] font-medium text-muted-foreground">{copy.today}</p>
                <p className="mt-1 text-[22px] font-semibold leading-none tracking-[-0.04em] text-foreground">
                  {litersText} <span className="text-[15px] text-muted-foreground">/ {goalLiters.toFixed(1)} l</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {currentMl === 0 ? (
            <motion.button
              key="add-glass"
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.stopPropagation();
                onAdd250ml();
              }}
              className="mx-auto flex h-9 w-full min-w-0 items-center justify-center rounded-2xl border-2 border-sky-300 bg-white/45 px-1 text-[9px] font-medium leading-none whitespace-nowrap text-sky-900 transition-colors active:bg-sky-50"
            >
              <span className="whitespace-nowrap">{copy.addGlass}</span>
            </motion.button>
          ) : (
            <motion.div
              key="water-controls"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="grid w-full grid-cols-2 gap-3"
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSubtract250ml();
                }}
                className="flex h-10 min-w-0 items-center justify-center rounded-2xl border-2 border-sky-300 bg-white/55 text-[18px] font-medium text-sky-900"
              >
                -
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd250ml();
                }}
                className="flex h-10 min-w-0 items-center justify-center rounded-2xl border-2 border-sky-300 bg-white/55 text-[18px] font-medium text-sky-900"
              >
                +
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
