import { motion } from "framer-motion";
import { X } from "lucide-react";

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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[140] flex flex-col bg-[#F4F4F8] text-neutral-950 safe-area-inset"
    >
      <div className="flex shrink-0 items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10"
          aria-label="Schließen"
        >
          <X className="h-6 w-6 text-neutral-900" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-[min(70vw,320px)] w-[min(70vw,320px)] items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.28)]"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(180deg,#FFFFFF_0%,#F1F5F9_100%)]" />
          )}

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.9),transparent_36%)]" />

          <motion.div
            className="pointer-events-none absolute inset-x-[8%] h-[18%] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.72),rgba(255,255,255,0))] blur-sm"
            animate={{ y: ["-120%", "560%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="pointer-events-none absolute left-[9%] right-[9%] h-[3px] rounded-full bg-[linear-gradient(90deg,rgba(117,251,178,0),rgba(117,251,178,1),rgba(117,251,178,0))] shadow-[0_0_20px_rgba(117,251,178,0.9)]"
            animate={{ y: ["-135px", "135px"] }}
            transition={{ duration: 1.55, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/90" />
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
  title = "Frigy sagt",
}: FrigyScanFailureStageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[145] flex flex-col bg-[#ECE8FF] text-neutral-950 safe-area-inset"
    >
      <div className="flex shrink-0 items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10"
          aria-label="Schließen"
        >
          <X className="h-6 w-6 text-neutral-900" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center px-7 pb-[max(1.5rem,env(safe-area-inset-bottom)+1rem)]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center"
        >
          <p className="text-[14px] font-semibold tracking-[-0.02em] text-neutral-400">{title}</p>
          <h2 className="mt-3 text-[22px] font-black leading-[1.04] tracking-[-0.055em] text-neutral-950 min-[390px]:text-[24px]">
            {message}
          </h2>
        </motion.div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={onAction}
          className="mx-auto flex h-14 w-full max-w-[360px] items-center justify-center rounded-full bg-[#171717] px-6 text-[18px] font-semibold text-white shadow-[0_18px_44px_-24px_rgba(0,0,0,0.45)]"
        >
          {actionLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}
