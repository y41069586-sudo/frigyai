import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AnimatedFrigyMascot } from "./AnimatedFrigyMascot";

interface MealPlanGeneratingOverlayProps {
  isGenerating: boolean;
  elapsedSeconds: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const motivationalTexts = [
  "Frigy plant deine Woche…",
  "Dein Wochenplan nimmt Form an",
  "Wir machen dir das Denken leicht",
  "Fast geschafft…",
  "Frigy wählt die besten Rezepte",
  "Noch ein kleiner Moment…",
  "Deine Mahlzeiten werden vorbereitet",
];

// Floating ingredient component
const FloatingIngredient = ({ 
  emoji, 
  delay, 
  x, 
  duration 
}: { 
  emoji: string; 
  delay: number; 
  x: number; 
  duration: number;
}) => (
  <motion.div
    className="absolute text-xl pointer-events-none"
    style={{ left: `${x}%` }}
    initial={{ opacity: 0, y: 40, scale: 0.5 }}
    animate={{ 
      opacity: [0, 0.8, 0.8, 0],
      y: [40, 0, -30, -60],
      scale: [0.5, 1, 1, 0.7],
      rotate: [-10, 8, -8, 10]
    }}
    transition={{ 
      duration: duration,
      delay: delay,
      repeat: Infinity,
      repeatDelay: 2,
      ease: "easeOut"
    }}
  >
    {emoji}
  </motion.div>
);

// Mini mascot for minimized state
const MiniFrigyMascot = () => (
  <motion.svg
    width={40}
    height={48}
    viewBox="0 0 200 240"
    animate={{ rotate: [-5, 5, -5] }}
    transition={{ duration: 1, repeat: Infinity }}
  >
    <defs>
      <linearGradient id="miniFridgeBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#86efac" />
        <stop offset="50%" stopColor="#6ee7b7" />
        <stop offset="100%" stopColor="#4ade80" />
      </linearGradient>
      <linearGradient id="miniFreezerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f0fdf4" />
        <stop offset="100%" stopColor="#dcfce7" />
      </linearGradient>
    </defs>
    <rect x="40" y="25" width="120" height="200" rx="12" fill="url(#miniFridgeBodyGrad)" />
    <rect x="50" y="35" width="100" height="75" rx="8" fill="url(#miniFreezerGrad)" />
    <rect x="50" y="120" width="100" height="95" rx="8" fill="url(#miniFreezerGrad)" />
    <ellipse cx="80" cy="65" rx="8" ry="9" fill="#1f2937" />
    <ellipse cx="83" cy="62" rx="3" ry="3" fill="white" />
    <ellipse cx="120" cy="65" rx="8" ry="9" fill="#1f2937" />
    <ellipse cx="123" cy="62" rx="3" ry="3" fill="white" />
    <path d="M75 85 Q100 105 125 85" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" fill="none" />
    <ellipse cx="65" cy="78" rx="10" ry="6" fill="#fca5a5" opacity="0.5" />
    <ellipse cx="135" cy="78" rx="10" ry="6" fill="#fca5a5" opacity="0.5" />
  </motion.svg>
);

export const MealPlanGeneratingOverlay = ({ 
  isGenerating, 
  elapsedSeconds,
  onMinimize,
  isMinimized = false
}: MealPlanGeneratingOverlayProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Simple: show overlay only when actively generating and not minimized
  const showOverlay = isGenerating && !isMinimized;

  useEffect(() => {
    if (!isGenerating) {
      setCurrentTextIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentTextIndex(prev => (prev + 1) % motivationalTexts.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleBackgroundPointerDown = (e: any) => {
    if (!onMinimize) return;

    const target = e?.target as HTMLElement | null;
    if (target?.closest?.('[data-mealplan-overlay-card="true"]')) return;

    const clientX = e?.clientX as number | undefined;
    const clientY = e?.clientY as number | undefined;
    const pointerId = e?.pointerId as number | undefined;
    const pointerType = (e?.pointerType as string | undefined) ?? "touch";

    onMinimize();

    if (typeof clientX !== "number" || typeof clientY !== "number") return;

    // Forward the original tap to the element underneath so navigation works with a single tap.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
        if (!el) return;

        try {
          el.dispatchEvent(
            new PointerEvent("pointerdown", {
              bubbles: true,
              clientX,
              clientY,
              pointerId: pointerId ?? 1,
              pointerType,
              isPrimary: true,
            })
          );
          el.dispatchEvent(
            new PointerEvent("pointerup", {
              bubbles: true,
              clientX,
              clientY,
              pointerId: pointerId ?? 1,
              pointerType,
              isPrimary: true,
            })
          );
          el.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX, clientY }));
        } catch {
          // ignore
        }
      });
    });
  };

  // Minimized floating indicator
  if (isGenerating && isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, y: 100 }}
        className="fixed bottom-24 right-4 z-50"
      >
        <div className="relative">
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(34, 197, 94, 0.4)",
                "0 0 0 15px rgba(34, 197, 94, 0)",
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-14 h-14 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-emerald-200 dark:border-emerald-800 shadow-lg flex items-center justify-center overflow-hidden"
          >
            <MiniFrigyMascot />
          </motion.div>
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
            <motion.div
              className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ pointerEvents: showOverlay ? "auto" : "none" }}
          onPointerDown={handleBackgroundPointerDown}
        >
          {/* Blurred background - shows content behind with blur effect */}
          <div className="absolute inset-0 backdrop-blur-2xl bg-white/60 dark:bg-slate-900/70" />
          
          {/* Very light gradient overlay for modern feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 via-white/20 to-teal-50/40 dark:from-emerald-900/20 dark:via-transparent dark:to-teal-900/20" />

          {/* Zurück (wie vorher das X): minimiert das Overlay */}
          {onMinimize && (
            <motion.button
              data-mealplan-overlay-card="true"
              onClick={onMinimize}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              aria-label="Zurück"
              className="absolute top-4 left-4 p-2 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm
                         border border-slate-200/50 dark:border-slate-700/50
                         hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all shadow-sm z-20"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </motion.button>
          )}

          <div data-mealplan-overlay-card="true" className="relative flex flex-col items-center gap-5 px-6 py-8 text-center z-10">

            {/* Floating ingredients - smaller and more subtle */}
            <div className="absolute inset-x-0 top-0 h-40 pointer-events-none">
              <FloatingIngredient emoji="🥕" delay={0} x={15} duration={3} />
              <FloatingIngredient emoji="🥦" delay={0.6} x={80} duration={3.2} />
              <FloatingIngredient emoji="🍳" delay={1.2} x={25} duration={2.8} />
              <FloatingIngredient emoji="🥗" delay={0.3} x={70} duration={3.1} />
              <FloatingIngredient emoji="🍎" delay={0.9} x={50} duration={3} />
            </div>

            {/* Main Frigy mascot - SMALLER SIZE */}
            <motion.div
              className="relative mt-8"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Soft glow behind mascot */}
              <motion.div 
                className="absolute inset-0 -m-8 bg-emerald-300/20 dark:bg-emerald-400/10 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.08, 1],
                  opacity: [0.5, 0.7, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Mascot with gentle bounce */}
              <motion.div
                animate={{ 
                  y: [0, -8, 0],
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                {/* Smaller mascot size: 120 instead of 200 */}
                <AnimatedFrigyMascot size={120} animate={false} />
              </motion.div>
              
              {/* Landing shadow - more subtle */}
              <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-900/8 dark:bg-white/5 rounded-full blur-sm"
                animate={{
                  scaleX: [1, 1.15, 1],
                  opacity: [0.4, 0.6, 0.4]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Motivational text - cleaner typography */}
            <div className="h-12 flex items-center justify-center mt-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTextIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-lg font-medium text-slate-700 dark:text-slate-200 tracking-tight"
                >
                  {motivationalTexts[currentTextIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Modern breathing dots - smaller */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-500"
                  animate={{ 
                    scale: [1, 1.4, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1.2, 
                    repeat: Infinity, 
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Minimize hint - cleaner */}
            {onMinimize && (
              <motion.p 
                className="text-xs text-slate-400 dark:text-slate-500 mt-4 font-normal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                Du kannst weiterstöbern – Frigy arbeitet im Hintergrund
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
