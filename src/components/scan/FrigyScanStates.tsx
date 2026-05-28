import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type FrigyScanAnalyzingStageProps = {
  previewUrl?: string | null;
  title: string;
  subtitle?: string;
  message?: string;
  progress?: number;
  onClose: () => void;
};

export function FrigyScanAnalyzingStage({
  previewUrl,
  title,
  subtitle,
  message,
  progress,
  onClose,
}: FrigyScanAnalyzingStageProps) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[140] flex flex-col overflow-hidden bg-[#F6FFFA] text-neutral-950 safe-area-inset"
    >
      <style>{`
        @keyframes frigy-scan-line-move {
          0% { transform: translateY(0%); opacity: 0.62; }
          50% { transform: translateY(760%); opacity: 1; }
          100% { transform: translateY(0%); opacity: 0.62; }
        }
        @keyframes frigy-scan-sweep-move {
          0% { transform: translateY(0%); opacity: 0.2; }
          50% { transform: translateY(720%); opacity: 0.45; }
          100% { transform: translateY(0%); opacity: 0.2; }
        }
        .frigy-scan-line {
          animation: frigy-scan-line-move 1.5s linear infinite;
          will-change: transform, opacity;
        }
        .frigy-scan-sweep {
          animation: frigy-scan-sweep-move 1.5s linear infinite;
          will-change: transform, opacity;
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
                src={previewUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="h-full w-full bg-[linear-gradient(180deg,#FFFFFF_0%,#EEF7F1_100%)]" />
            )}

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.42),transparent_38%)]" />

            <div className="pointer-events-none absolute inset-x-[7%] h-[18%] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.55),rgba(255,255,255,0))] blur-sm frigy-scan-sweep" />
            <div className="pointer-events-none absolute left-[9%] right-[9%] h-[3px] rounded-full bg-[linear-gradient(90deg,rgba(117,251,178,0),rgba(117,251,178,1),rgba(117,251,178,0))] shadow-[0_0_20px_rgba(117,251,178,0.9)] frigy-scan-line" />
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
          {message ? (
            <p className="mt-6 text-[15px] font-medium leading-relaxed tracking-[-0.02em] text-neutral-500">
              {message}
            </p>
          ) : null}
          {typeof progress === "number" ? (
            <p className="mt-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400">
              {Math.round(progress)}%
            </p>
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
  const { t, language } = useLanguage();
  const resolvedTitle = title ?? (language === "fr" ? "Frigy dit" : language === "en" ? "Frigy says" : "Frigy sagt");
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
