import { motion } from "framer-motion";
import { Check, Flame, X } from "lucide-react";
import { useLanguage, formatTranslation } from "@/contexts/LanguageContext";
import { confettiBurst } from "@/lib/mobileEffects";
import { AiDisclaimer } from "@/components/AiDisclaimer";

type FrigyScanAnalyzingStageProps = {
  previewUrl?: string | null;
  title: string;
  subtitle?: string;
  message?: string;
  progress?: number;
  photoIndex?: number;
  photoTotal?: number;
  onClose: () => void;
};

export function FrigyScanAnalyzingStage({
  previewUrl,
  title,
  subtitle,
  message,
  progress,
  photoIndex,
  photoTotal,
  onClose,
}: FrigyScanAnalyzingStageProps) {
  const { t } = useLanguage();
  const showPhotoCounter =
    typeof photoIndex === "number" &&
    typeof photoTotal === "number" &&
    photoTotal > 0;
  const photoCounterLabel = showPhotoCounter
    ? formatTranslation(t.scanPhotoCounter, { current: photoIndex!, total: photoTotal! })
    : "";
  const progressValue = typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[140] flex flex-col overflow-hidden bg-[#F6FFFA] text-neutral-950 safe-area-inset"
    >
      <style>{`
        @keyframes frigy-scan-line-move {
          0%, 100% { top: 12%; opacity: 0.62; }
          50% { top: 84%; opacity: 1; }
        }
        @keyframes frigy-scan-sweep-move {
          0%, 100% { top: 12%; opacity: 0.2; }
          50% { top: 84%; opacity: 0.45; }
        }
        .frigy-scan-line {
          position: absolute;
          left: 9%;
          right: 9%;
          height: 3px;
          border-radius: 9999px;
          animation: frigy-scan-line-move 1.5s ease-in-out infinite;
          will-change: top, opacity;
        }
        .frigy-scan-sweep {
          position: absolute;
          left: 7%;
          right: 7%;
          height: 18%;
          border-radius: 9999px;
          animation: frigy-scan-sweep-move 1.5s ease-in-out infinite;
          will-change: top, opacity;
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(117,251,178,0.18),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F6FFFA_45%,#EEF9F2_100%)]" />
      <div className="flex shrink-0 items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10"
          aria-label={t.close}
        >
          <X className="h-6 w-6 text-neutral-900" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-[min(74vw,340px)] w-[min(74vw,340px)] items-center justify-center rounded-full border border-[#D8FCE8] bg-white/85 shadow-[0_32px_90px_-48px_rgba(34,197,94,0.34)]"
        >
          <div className="absolute inset-[8%] overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.95)]">
            {previewUrl ? (
              <img
                key={previewUrl}
                src={previewUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="h-full w-full bg-[linear-gradient(180deg,#FFFFFF_0%,#EEF7F1_100%)]" />
            )}

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.42),transparent_38%)]" />

            <div className="pointer-events-none absolute inset-x-[7%] frigy-scan-sweep rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.55),rgba(255,255,255,0))] blur-sm" />
            <div className="pointer-events-none absolute frigy-scan-line bg-[linear-gradient(90deg,rgba(117,251,178,0),rgba(117,251,178,1),rgba(117,251,178,0))] shadow-[0_0_20px_rgba(117,251,178,0.9)]" />
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/90" />
          <div className="pointer-events-none absolute inset-[4%] rounded-full ring-1 ring-[#75FBB2]/35" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mt-10 flex max-w-[320px] flex-col items-center text-center"
        >
          <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-neutral-950 min-[390px]:text-[19px]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 text-[14px] font-semibold tracking-[-0.02em] text-neutral-400">
              {subtitle}
            </p>
          ) : null}
          {showPhotoCounter ? (
            <p className="mt-4 text-[13px] font-bold tracking-[0.06em] text-[#39D47F]">
              {photoCounterLabel}
            </p>
          ) : null}
          {message ? (
            <p className="mt-6 text-[15px] font-medium leading-relaxed tracking-[-0.02em] text-neutral-500">
              {message}
            </p>
          ) : null}
          {progressValue != null ? (
            <div className="mt-5 w-full max-w-[240px]">
              <p className="mb-2 text-[12px] font-semibold tracking-[0.08em] text-neutral-400">
                {Math.round(progressValue)}%
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#D8FCE8]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#75FBB2,#39D47F)] transition-[width] duration-300 ease-out"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </motion.div>
  );
}

type FrigyScanFailureStageProps = {
  message: string;
  actionLabel: string;
  onAction: () => void;
  onClose: () => void;
  title?: string;
};

export function FrigyScanFailureStage({
  message,
  actionLabel,
  onAction,
  onClose,
  title,
}: FrigyScanFailureStageProps) {
  const { t } = useLanguage();
  const resolvedTitle = title ?? t.frigySays;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[145] flex flex-col overflow-hidden bg-[#F4FFF9] text-neutral-950 safe-area-inset"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(117,251,178,0.25),transparent_24%),linear-gradient(180deg,#FFFFFF_0%,#F4FFF9_48%,#ECFAF2_100%)]" />
      <div className="flex shrink-0 items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10"
          aria-label={t.close}
        >
          <X className="h-6 w-6 text-neutral-900" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-center px-7 pb-[max(1.5rem,env(safe-area-inset-bottom)+1rem)]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center"
        >
          <div className="mb-6 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(117,251,178,0.45)_0%,rgba(117,251,178,0.16)_45%,rgba(117,251,178,0)_74%)]" />
          <p className="text-[14px] font-semibold tracking-[-0.02em] text-[#4A7C63]">{resolvedTitle}</p>
          <h2 className="mt-3 text-[22px] font-black leading-[1.04] tracking-[-0.055em] text-neutral-950 min-[390px]:text-[24px]">
            {message}
          </h2>
        </motion.div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={onAction}
          className="mx-auto flex h-14 w-full max-w-[360px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#75FBB2_0%,#39D47F_100%)] px-6 text-[18px] font-semibold text-[#082013] shadow-[0_18px_44px_-24px_rgba(57,212,127,0.45)]"
        >
          {actionLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}

export type FrigyScanSuccessData = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type FrigyScanSuccessStageProps = {
  result: FrigyScanSuccessData;
  onConfirm: () => void;
  onCancel: () => void;
  onScanAnother?: () => void;
};

/** Erfolg nach Essens-Scan — Nutzer bestätigt explizit oder bricht mit X ab. */
export function FrigyScanSuccessStage({
  result,
  onConfirm,
  onCancel,
  onScanAnother,
}: FrigyScanSuccessStageProps) {
  const { t } = useLanguage();
  const copy = {
    success: t.foodScanRecognized,
    protein: t.protein,
    carbs: t.carbs,
    fat: t.fat,
    continue: t.foodScanContinue,
    scanAnother: t.foodScanScanAnother,
  };

  const handleConfirm = () => {
    void confettiBurst({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.55 },
      colors: ["#75FBB2", "#39D47F", "#86efac", "#ffffff"],
    });
    onConfirm();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[145] flex flex-col overflow-hidden bg-[#F6FFFA] text-neutral-950 safe-area-inset"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(117,251,178,0.22),transparent_30%),linear-gradient(180deg,#FFFFFF_0%,#F6FFFA_50%,#EEF9F2_100%)]" />
      <div className="relative z-10 flex shrink-0 items-center justify-end px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10"
          aria-label={t.close}
        >
          <X className="h-6 w-6 text-neutral-900" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom)+1rem)]">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 16, stiffness: 220 }}
          className="w-full max-w-[360px] rounded-[28px] border border-[#D8FCE8] bg-white/90 p-6 shadow-[0_28px_70px_-40px_rgba(57,212,127,0.45)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#75FBB2]/25 ring-2 ring-[#75FBB2]/50">
              <Check className="h-9 w-9 text-[#2EB56D]" strokeWidth={3} />
            </div>
          </div>
          <h2 className="text-center text-[20px] font-black tracking-[-0.04em] text-neutral-950">{result.name}</h2>
          <p className="mt-1 text-center text-[14px] font-semibold text-[#39D47F]">{copy.success}</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Flame className="h-6 w-6 text-orange-400" />
            <span className="text-[32px] font-black tabular-nums">{Math.round(result.calories)}</span>
            <span className="text-[15px] font-medium text-neutral-500">kcal</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#F4FFF9] px-2 py-2.5 text-center">
              <p className="text-[17px] font-bold text-red-500">{Math.round(result.protein)}g</p>
              <p className="text-[10px] font-medium text-neutral-500">{copy.protein}</p>
            </div>
            <div className="rounded-xl bg-[#F4FFF9] px-2 py-2.5 text-center">
              <p className="text-[17px] font-bold text-amber-500">{Math.round(result.carbs)}g</p>
              <p className="text-[10px] font-medium text-neutral-500">{copy.carbs}</p>
            </div>
            <div className="rounded-xl bg-[#F4FFF9] px-2 py-2.5 text-center">
              <p className="text-[17px] font-bold text-blue-500">{Math.round(result.fat)}g</p>
              <p className="text-[10px] font-medium text-neutral-500">{copy.fat}</p>
            </div>
          </div>
        </motion.div>
        <AiDisclaimer className="mt-4 w-full max-w-[360px] text-center" compact />
        <div className="mt-4 flex w-full max-w-[360px] flex-col gap-2.5">
          {onScanAnother ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onScanAnother();
              }}
              className="flex h-14 w-full items-center justify-center rounded-full border-2 border-[#75FBB2] bg-white text-[17px] font-semibold text-[#082013]"
            >
              {copy.scanAnother}
            </motion.button>
          ) : null}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            className="flex h-14 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#75FBB2_0%,#39D47F_100%)] text-[17px] font-semibold text-[#082013] shadow-[0_16px_40px_-22px_rgba(57,212,127,0.5)]"
          >
            {copy.continue}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
