import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MealPlanGeneratingOverlayProps {
  isGenerating: boolean;
  elapsedSeconds: number;
  onMinimize?: () => void;
  onBack?: () => void;
  isMinimized?: boolean;
  progressPercent?: number;
  /** Full-screen lock: no back/minimize, show stay-on-tab warning */
  locked?: boolean;
  stayOnTabMessage?: string;
}

export const MealPlanGeneratingOverlay = ({ 
  isGenerating, 
  elapsedSeconds,
  onMinimize,
  onBack,
  isMinimized = false,
  progressPercent,
  locked = false,
  stayOnTabMessage,
}: MealPlanGeneratingOverlayProps) => {
  const { t, language } = useLanguage();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const copy = {
    de: {
      title: "Wochenplan wird erstellt",
      background: "Du kannst die App weiter benutzen. Frigy arbeitet im Hintergrund weiter.",
    },
    en: {
      title: "Weekly plan is being created",
      background: "You can keep using the app. Frigy continues in the background.",
    },
    fr: {
      title: "Le plan hebdomadaire est en cours de creation",
      background: "Tu peux continuer a utiliser l app. Frigy continue en arriere-plan.",
    },
  } as const;
  const currentCopy = copy[(language as "de" | "en" | "fr") ?? "de"] ?? copy.de;
  const effectiveProgress = progressPercent && progressPercent > 0
    ? progressPercent
    : Math.max(8, Math.min(96, 12 + elapsedSeconds * 4));

  const motivationalTexts = [
    t.mealPlanGenerating1,
    t.mealPlanGenerating2,
    t.mealPlanGenerating3,
    t.mealPlanGenerating4,
    t.mealPlanGenerating5,
    t.mealPlanGenerating6,
    t.mealPlanGenerating7,
  ];

  const showOverlay = isGenerating && (!isMinimized || locked);

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
            <span className="text-[11px] font-bold text-emerald-600">{effectiveProgress}%</span>
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
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FFFB_58%,#F1FBF5_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(117,251,178,0.16),transparent_28%)]" />

          {!locked && (onBack || onMinimize) && (
            <motion.button
              data-mealplan-overlay-card="true"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                (onBack ?? onMinimize)?.();
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              aria-label={t.back}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm
                         border border-slate-200/50 dark:border-slate-700/50
                         hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all shadow-sm z-20"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </motion.button>
          )}

          <div data-mealplan-overlay-card="true" className="relative z-10 flex w-full max-w-md flex-col items-center gap-5 px-6 py-8 text-center">
            <div className="relative mt-6 flex h-28 w-28 items-center justify-center rounded-full border border-[#D8FCE8] bg-white shadow-[0_18px_48px_-28px_rgba(34,197,94,0.28)]">
              <div className="absolute inset-[10px] rounded-full border-[3px] border-[#75FBB2]/20 border-t-[#39D47F] animate-spin" />
              <Loader2 className="h-7 w-7 text-[#39D47F]" />
            </div>

            <div className="h-12 flex items-center justify-center mt-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTextIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-lg font-medium tracking-tight text-slate-700"
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
                  className="h-2 w-2 rounded-full bg-emerald-400"
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

            <div className="mt-2 w-full max-w-xs rounded-[28px] border border-[#D8FCE8] bg-white/92 px-4 py-4 shadow-[0_20px_48px_-30px_rgba(34,197,94,0.24)]">
              <div className="mb-2 flex items-center justify-between text-[12px] font-semibold tracking-[0.01em] text-slate-600">
                <span>{currentCopy.title}</span>
                <span>{effectiveProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#E8F7EE]">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#75FBB2_0%,#39D47F_100%)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${effectiveProgress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">{currentCopy.background}</p>
            </div>

            {locked && stayOnTabMessage && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-2 max-w-xs rounded-2xl border border-amber-300/60 bg-amber-50/90 px-4 py-3"
              >
                <p className="text-sm font-medium text-amber-900">
                  {stayOnTabMessage}
                </p>
              </motion.div>
            )}

            {!locked && onMinimize && (
              <motion.p 
                className="mt-4 text-xs font-normal text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {t.mealPlanBackgroundHint}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
