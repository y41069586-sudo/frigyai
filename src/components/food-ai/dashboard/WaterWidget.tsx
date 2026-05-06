import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { Plus, Minus, Droplet } from "lucide-react";
import confetti from "canvas-confetti";
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
  onToggleExpand,
}: WaterWidgetProps) {
  const safeGoalMl = Math.min(goalMl, 2000);
  const currentMl = waterGlasses * ML_PER_GLASS;
  const canSubtract = currentMl > 0;
  const goalLiters = safeGoalMl / 1000;

  // 0 ml -> 8% baseline (just covers buttons area), full goal -> 96%
  const fillPct = Math.max(0, Math.min(1, currentMl / safeGoalMl));

  // ── Smooth liter counter ────────────────────────────────────────────────
  // Animate the displayed number on its own timeline so it eases up/down
  // independently of the React state, making +/- feel "alive".
  const liters = useMotionValue(currentMl / 1000);
  const litersDisplay = useTransform(liters, (v) => v.toFixed(2).replace(".", ","));
  const [litersText, setLitersText] = useState(litersDisplay.get());

  useEffect(() => {
    const target = currentMl / 1000;
    const controls = animate(liters, target, {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = litersDisplay.on("change", setLitersText);
    return () => {
      controls.stop();
      unsub();
    };
  }, [currentMl, liters, litersDisplay]);

  // Spring-driven height so + / – feels bouncy and smooth instead of linear
  const heightSpring = useSpring(0, { stiffness: 140, damping: 18, mass: 0.9 });
  useEffect(() => {
    heightSpring.set(8 + fillPct * 88);
  }, [fillPct, heightSpring]);
  const heightStyle = useTransform(heightSpring, (v) => `${v}%`);

  // Confetti once when goal is reached
  const wasFullRef = useRef(false);
  useEffect(() => {
    const isFull = currentMl >= safeGoalMl;
    if (isFull && !wasFullRef.current) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#7dd3fc", "#38bdf8", "#0ea5e9", "#bae6fd", "#fff"],
      });
    }
    wasFullRef.current = isFull;
  }, [currentMl, safeGoalMl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onToggleExpand}
      className={cn(
        "relative h-[210px] w-full overflow-hidden rounded-[1.75rem]",
        "border border-sky-200/70",
        "bg-gradient-to-b from-[#f5fbff] via-[#eaf6ff] to-[#dff1ff]",
        "shadow-[0_14px_30px_-12px_rgba(56,189,248,0.45)]",
      )}
    >
      {/* soft top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-sky-300/30 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-2 h-20 w-20 rounded-full bg-cyan-200/40 blur-2xl"
      />

      {/* Water fill — flat single color, straight top edge */}
      <motion.div
        style={{ height: heightStyle }}
        className="absolute inset-x-0 bottom-0 z-[1] bg-[#5cccf9]"
      />

      {/* Foreground */}
      <div className="absolute inset-0 z-[10] flex flex-col justify-between p-4">
        <div className="flex items-center gap-1.5">
          <Droplet className="h-4 w-4 fill-sky-500 text-sky-500" />
          <span className="text-[14px] font-bold tracking-tight text-sky-900">Wasser</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-baseline justify-center gap-1.5 leading-none">
            <motion.span className="text-[34px] font-black tabular-nums text-sky-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {litersText}
            </motion.span>
            <span className="text-[12px] font-semibold text-sky-700/80">
              / {goalLiters.toFixed(1).replace(".", ",")} l
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            disabled={!canSubtract}
            onClick={(e) => { e.stopPropagation(); onSubtract250ml(); }}
            className={cn(
              "flex h-11 items-center justify-center rounded-2xl",
              "bg-white/85 text-sky-700 shadow-[0_6px_14px_-6px_rgba(14,165,233,0.45)] backdrop-blur-sm",
              "border border-white/80",
              "transition-colors hover:bg-white",
              "focus:outline-none focus-visible:ring-0 disabled:opacity-35 disabled:shadow-none",
            )}
            aria-label="Wasser verringern"
          >
            <Minus className="h-[18px] w-[18px]" strokeWidth={2.6} />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onAdd250ml(); }}
            className={cn(
              "flex h-11 items-center justify-center rounded-2xl",
              "bg-white/85 text-sky-700 shadow-[0_6px_14px_-6px_rgba(14,165,233,0.45)] backdrop-blur-sm",
              "border border-white/80",
              "transition-colors hover:bg-white",
              "focus:outline-none focus-visible:ring-0",
            )}
            aria-label="Wasser erhöhen"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.6} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function WaveTop({
  fill,
  duration,
  direction,
  wobble,
  opacity = 1,
  offsetY = 0,
}: {
  fill: string;
  duration: number;
  direction: "left" | "right";
  wobble: ReturnType<typeof useMotionValue<number>>;
  opacity?: number;
  offsetY?: number;
}) {
  const animateX = direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"];

  // small vertical splash on +/- changes
  const yOffset = useTransform(wobble, (w) => -w * 3 + offsetY);

  return (
    <motion.div
      aria-hidden
      style={{ y: yOffset, opacity }}
      animate={{ x: animateX }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      className="absolute -top-3 left-0 h-4 w-[200%]"
    >
      <svg viewBox="0 0 800 16" preserveAspectRatio="none" className="h-full w-full">
        <path
          fill={fill}
          d="M0 8 Q 100 0 200 8 T 400 8 T 600 8 T 800 8 V 16 H 0 Z"
        />
      </svg>
    </motion.div>
  );
}
