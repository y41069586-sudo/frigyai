import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type GenerationStage = "preparing" | "requesting" | "waiting_ai" | "processing" | "saving" | "finalizing";

interface MealPlanGeneratingOverlayProps {
  isGenerating: boolean;
  elapsedSeconds: number;
  onMinimize?: () => void;
  onBack?: () => void;
  isMinimized?: boolean;
  progressPercent?: number;
  stageKey?: GenerationStage;
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
  stageKey = "preparing",
  locked = false,
  stayOnTabMessage,
}: MealPlanGeneratingOverlayProps) => {
  const { t, language } = useLanguage();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const copy = {
    de: {
      title: "Dein Wochenplan entsteht",
      elapsed: "Laufzeit",
      stageTitles: {
        preparing: "Deine Ziele werden vorbereitet",
        requesting: "Die Anfrage wird gesendet",
        waiting_ai: "Rezepte und Struktur werden geplant",
        processing: "Makros und Tage werden abgestimmt",
        saving: "Einkaufsliste und Plan werden gespeichert",
        finalizing: "Fast fertig",
      },
    },
    en: {
      title: "Your weekly plan is coming together",
      elapsed: "Elapsed",
      stageTitles: {
        preparing: "Preparing your targets",
        requesting: "Sending the request",
        waiting_ai: "Planning recipes and structure",
        processing: "Aligning macros and days",
        saving: "Saving plan and shopping list",
        finalizing: "Almost done",
      },
    },
    fr: {
      title: "Ton plan hebdomadaire prend forme",
      elapsed: "Duree",
      stageTitles: {
        preparing: "Preparation de tes objectifs",
        requesting: "Envoi de la demande",
        waiting_ai: "Planification des recettes",
        processing: "Ajustement des macros et des jours",
        saving: "Enregistrement du plan et de la liste",
        finalizing: "Presque termine",
      },
    },
  } as const;
  const currentCopy = copy[(language as "de" | "en" | "fr") ?? "de"] ?? copy.de;
  const effectiveProgress = typeof progressPercent === "number"
    ? Math.max(0, Math.min(100, Math.round(progressPercent)))
    : Math.max(0, Math.min(96, 8 + elapsedSeconds * 4));

  const motivationalTexts = [
    t.mealPlanGenerating1,
    t.mealPlanGenerating2,
    t.mealPlanGenerating3,
    t.mealPlanGenerating4,
    t.mealPlanGenerating5,
    t.mealPlanGenerating6,
    t.mealPlanGenerating7,
  ];

  const formattedElapsed = `${Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(elapsedSeconds % 60).toString().padStart(2, "0")}`;

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

  const handleBackgroundTap = (e: any) => {
    if (!onMinimize) return;

    const target = e?.target as HTMLElement | null;
    if (target?.closest?.('[data-mealplan-overlay-card="true"]')) return;

    const clientX = e?.clientX as number | undefined;
    const clientY = e?.clientY as number | undefined;
    const pointerId = e?.pointerId as number | undefined;
    const pointerType = (e?.pointerType as string | undefined) ?? "touch";

    onMinimize();

    if (typeof clientX !== "number" || typeof clientY !== "number") return;

    // Forward the tap after the full-screen layer disappears so one tap can also navigate.
    window.setTimeout(() => {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      const interactiveTarget =
        el?.closest?.('button, a, [role="button"], [role="tab"], [data-radix-collection-item]') as
          | HTMLElement
          | null;
      const nextTarget = interactiveTarget ?? el;
      if (!nextTarget) return;

      try {
        nextTarget.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            clientX,
            clientY,
            pointerId: pointerId ?? 1,
            pointerType,
            isPrimary: true,
          }),
        );
        nextTarget.dispatchEvent(
          new PointerEvent("pointerup", {
            bubbles: true,
            clientX,
            clientY,
            pointerId: pointerId ?? 1,
            pointerType,
            isPrimary: true,
          }),
        );
        if (typeof (nextTarget as HTMLButtonElement).click === "function") {
          (nextTarget as HTMLButtonElement).click();
        } else {
          nextTarget.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX, clientY }));
        }
      } catch {
        // ignore
      }
    }, 34);
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
            className="flex min-w-[4.25rem] items-center justify-center rounded-[999px] border border-emerald-200 bg-white/92 px-3 py-3 shadow-lg backdrop-blur-md dark:border-emerald-800 dark:bg-slate-800/90"
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
          onClick={handleBackgroundTap}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#FCFFFD_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(117,251,178,0.12),transparent_24%)]" />

          {!locked && (onBack || onMinimize) && (
            <motion.button
              data-mealplan-overlay-card="true"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                (onBack ?? onMinimize)?.();
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              aria-label={t.back}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-sm
                         border border-slate-200/50 dark:border-slate-700/50
                         hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all shadow-sm z-20"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </motion.button>
          )}

          <div data-mealplan-overlay-card="true" className="relative z-10 flex w-full max-w-sm flex-col items-center px-5 py-8 text-center sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full overflow-hidden rounded-[28px] border border-transparent bg-white/92 px-5 py-6 shadow-[0_18px_54px_-30px_rgba(34,197,94,0.16)] backdrop-blur-xl"
            >
              <div className="flex flex-col items-center">
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-emerald-100 bg-emerald-50/60" />
                  <div className="absolute inset-[9px] rounded-full border-[3px] border-emerald-100 border-t-[#39D47F] animate-spin" />
                  <div className="relative text-center">
                    <div className="text-[28px] font-black leading-none tracking-[-0.06em] text-slate-950">
                      {effectiveProgress}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      %
                    </div>
                  </div>
                </div>

                <h2 className="mt-6 text-[26px] font-black leading-[1.04] tracking-[-0.055em] text-slate-950">
                  {currentCopy.title}
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  {currentCopy.stageTitles[stageKey]}
                </p>
              </div>

              <div className="mt-6 overflow-hidden rounded-full bg-slate-100/90">
                <motion.div
                  className="relative h-2.5 rounded-full bg-[linear-gradient(90deg,#75FBB2_0%,#4BE08E_55%,#39D47F_100%)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${effectiveProgress}%` }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="absolute inset-y-0 right-0 w-12 bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.6),rgba(255,255,255,0))]" />
                </motion.div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTextIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="min-h-[2.5rem] flex-1 text-left text-sm font-medium text-slate-600"
                  >
                    {motivationalTexts[currentTextIndex]}
                  </motion.p>
                </AnimatePresence>
                <div className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  {currentCopy.elapsed} {formattedElapsed}
                </div>
              </div>
            </motion.div>

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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
