import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ImagePlus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIngredientCamera } from "@/hooks/useIngredientCamera";
import { cn } from "@/lib/utils";
import { useLanguage, formatTranslation } from "@/contexts/LanguageContext";

const VIDEO_HIDE_CSS = `
  .frigy-scan-video::-webkit-media-controls,
  .frigy-scan-video::-webkit-media-controls-panel,
  .frigy-scan-video::-webkit-media-controls-play-button,
  .frigy-scan-video::-webkit-media-controls-start-playback-button,
  .frigy-scan-video::-webkit-media-controls-overlay-play-button,
  .frigy-scan-video::-webkit-media-controls-overlay-enclosure,
  .frigy-scan-video::-internal-media-controls-overlay-cast-button {
    display: none !important;
    opacity: 0 !important;
    -webkit-appearance: none !important;
  }
`;

/** Shared viewport circle — keep in sync with analyzing mask hole. */
export const FRIGY_SCAN_CIRCLE_SIZE = "min(84vw, 360px)";
const FRIGY_SCAN_CIRCLE_MASK_RADIUS = "min(42vw, 180px)";
const FRIGY_SCAN_CIRCLE_CENTER_Y = "42%";

type FrigyLiveCameraCaptureProps = {
  active: boolean;
  onClose: () => void;
  onPhotoFile: (file: File) => void;
  /** When gallery allows multiple selection (ingredient scan queue). */
  onPhotoFiles?: (files: File[]) => void;
  galleryMultiple?: boolean;
  shutterDisabled?: boolean;
  shutterAriaLabel?: string;
  headerEnd?: React.ReactNode;
  overlayTop?: React.ReactNode;
  beforeShutter?: React.ReactNode;
  analyzing?: boolean;
  analyzingPreviewUrl?: string | null;
  analyzingTitle?: string;
  analyzingSubtitle?: string;
  analyzingMessage?: string;
  analyzingProgress?: number;
  analyzingPhotoIndex?: number;
  analyzingPhotoTotal?: number;
};

/**
 * Live camera UI shared by ingredient scan (ScanPage) and meal photo scan (Tracker).
 */
export function FrigyLiveCameraCapture({
  active,
  onClose,
  onPhotoFile,
  onPhotoFiles,
  galleryMultiple = false,
  shutterDisabled = false,
  shutterAriaLabel,
  headerEnd,
  overlayTop,
  beforeShutter,
  analyzing = false,
  analyzingPreviewUrl,
  analyzingTitle,
  analyzingSubtitle,
  analyzingMessage,
  analyzingProgress,
  analyzingPhotoIndex,
  analyzingPhotoTotal,
}: FrigyLiveCameraCaptureProps) {
  const { t } = useLanguage();
  const galleryRef = useRef<HTMLInputElement>(null);
  const captureLockRef = useRef(false);

  const {
    setVideoRef,
    status: cameraStatus,
    previewReady,
    errorMessage: cameraError,
    capturePhoto,
    retry: retryCamera,
    isLive,
  } = useIngredientCamera({ active: active && !analyzing });

  const showCameraHint =
    !analyzing &&
    !previewReady &&
    (cameraStatus === "error" || cameraStatus === "denied" || cameraStatus === "fallback");

  const progressValue =
    typeof analyzingProgress === "number" ? Math.min(100, Math.max(0, analyzingProgress)) : null;
  const showPhotoCounter =
    analyzing &&
    typeof analyzingPhotoIndex === "number" &&
    typeof analyzingPhotoTotal === "number" &&
    analyzingPhotoTotal > 0;
  const photoCounterLabel = showPhotoCounter
    ? formatTranslation(t.scanPhotoCounter, {
        current: analyzingPhotoIndex!,
        total: analyzingPhotoTotal!,
      })
    : "";

  const handleShutterPress = async () => {
    if (captureLockRef.current || shutterDisabled || cameraStatus === "starting" || analyzing) return;

    captureLockRef.current = true;
    try {
      if (!isLive) {
        await retryCamera();
        return;
      }

      const file = await capturePhoto();
      if (file) {
        onPhotoFile(file);
        return;
      }

      galleryRef.current?.click();
    } finally {
      captureLockRef.current = false;
    }
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length || shutterDisabled || analyzing) return;
    if (galleryMultiple && onPhotoFiles && files.length > 1) {
      onPhotoFiles(files);
      return;
    }
    onPhotoFile(files[0]!);
  };

  if (!active) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[120] flex flex-col safe-area-inset",
        analyzing ? "bg-[#F6FFFA] text-neutral-950" : "bg-black text-white",
      )}
    >
      <style>{VIDEO_HIDE_CSS}</style>
      <style>{`
        @keyframes frigy-wind-sweep {
          0% { top: -42%; opacity: 0; }
          8% { opacity: 0.85; }
          92% { opacity: 0.7; }
          100% { top: 108%; opacity: 0; }
        }
        @keyframes frigy-wind-sweep-fast {
          0% { top: -48%; opacity: 0; }
          10% { opacity: 0.95; }
          90% { opacity: 0.55; }
          100% { top: 112%; opacity: 0; }
        }
        .frigy-analyze-wind {
          position: absolute;
          pointer-events: none;
          will-change: top, opacity;
        }
        .frigy-analyze-wind-soft {
          left: -18%;
          right: -18%;
          height: 38%;
          border-radius: 42% 58% 45% 55% / 48% 42% 58% 52%;
          background: linear-gradient(
            118deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.08) 16%,
            rgba(255, 255, 255, 0.28) 38%,
            rgba(255, 255, 255, 0.42) 50%,
            rgba(255, 255, 255, 0.24) 62%,
            rgba(255, 255, 255, 0.06) 84%,
            rgba(255, 255, 255, 0) 100%
          );
          filter: blur(14px);
          transform: rotate(-7deg);
          animation: frigy-wind-sweep 2.8s cubic-bezier(0.42, 0.02, 0.58, 0.98) infinite;
        }
        .frigy-analyze-wind-core {
          left: -8%;
          right: -8%;
          height: 20%;
          border-radius: 38% 62% 35% 65% / 52% 38% 62% 48%;
          background: linear-gradient(
            112deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.35) 22%,
            rgba(255, 255, 255, 0.92) 48%,
            rgba(255, 255, 255, 0.88) 52%,
            rgba(255, 255, 255, 0.32) 78%,
            rgba(255, 255, 255, 0) 100%
          );
          filter: blur(4px);
          box-shadow: 0 0 28px 8px rgba(255, 255, 255, 0.22);
          transform: rotate(4deg);
          animation: frigy-wind-sweep-fast 2.1s cubic-bezier(0.38, 0.04, 0.62, 0.96) infinite;
          animation-delay: -0.65s;
        }
        .frigy-analyze-wind-trail {
          left: 4%;
          right: 4%;
          height: 14%;
          border-radius: 55% 45% 50% 50% / 60% 40% 60% 40%;
          background: linear-gradient(
            105deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.18) 30%,
            rgba(255, 255, 255, 0.55) 50%,
            rgba(255, 255, 255, 0.14) 72%,
            rgba(255, 255, 255, 0) 100%
          );
          filter: blur(7px);
          transform: rotate(-3deg) skewX(-8deg);
          animation: frigy-wind-sweep 2.45s cubic-bezier(0.44, 0.03, 0.56, 0.97) infinite;
          animation-delay: -1.35s;
        }
        @media (prefers-reduced-motion: reduce) {
          .frigy-analyze-wind-soft,
          .frigy-analyze-wind-core,
          .frigy-analyze-wind-trail {
            animation-duration: 4.5s;
          }
        }
      `}</style>

      <video
        ref={setVideoRef}
        className={cn(
          "frigy-scan-video pointer-events-none absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-300",
          !analyzing && previewReady ? "opacity-100" : "opacity-0",
        )}
        autoPlay
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noplaybackrate"
      />

      {showCameraHint && (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center px-6 text-center pointer-events-none">
          <div className="max-w-sm rounded-2xl border border-white/10 bg-black/55 px-5 py-4 backdrop-blur-md pointer-events-auto">
            <Camera className="mx-auto mb-3 h-8 w-8 text-[#75FBB2]" />
            <p className="text-sm font-medium text-white/90">{cameraError}</p>
            <p className="mt-2 text-xs text-white/55">
              {t.cameraOpenDevHint}
              <span className="text-[#75FBB2]">npm run dev</span>
              {t.cameraLocalhostHint}
              <span className="text-[#75FBB2]">http://localhost:4137</span>
              {t.cameraGalleryHint}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={() => void retryCamera()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.tryAgain}
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-[#75FBB2] text-[#0a1f14]"
                onClick={() => galleryRef.current?.click()}
              >
                {t.gallery}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!analyzing ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-[2]"
            style={{
              background: `radial-gradient(ellipse 82% 72% at 50% ${FRIGY_SCAN_CIRCLE_CENTER_Y}, transparent 0%, transparent 44%, rgba(0,0,0,0.45) 100%)`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/40 via-transparent to-black/65" />
        </>
      ) : (
        <motion.div
          initial={{
            opacity: 0,
            scale: 1.08,
            WebkitMaskImage: `radial-gradient(circle at 50% ${FRIGY_SCAN_CIRCLE_CENTER_Y}, transparent 0, transparent 120vmax, black 120vmax)`,
            maskImage: `radial-gradient(circle at 50% ${FRIGY_SCAN_CIRCLE_CENTER_Y}, transparent 0, transparent 120vmax, black 120vmax)`,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            WebkitMaskImage: `radial-gradient(circle at 50% ${FRIGY_SCAN_CIRCLE_CENTER_Y}, transparent 0, transparent ${FRIGY_SCAN_CIRCLE_MASK_RADIUS}, black calc(${FRIGY_SCAN_CIRCLE_MASK_RADIUS} + 1px))`,
            maskImage: `radial-gradient(circle at 50% ${FRIGY_SCAN_CIRCLE_CENTER_Y}, transparent 0, transparent ${FRIGY_SCAN_CIRCLE_MASK_RADIUS}, black calc(${FRIGY_SCAN_CIRCLE_MASK_RADIUS} + 1px))`,
          }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-0 z-[2] bg-[#F6FFFA]"
        />
      )}

      {analyzing ? (
        <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_50%_28%,rgba(117,251,178,0.14),transparent_30%)]" />
      ) : null}

      <header
        className={cn(
          "relative z-10 flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]",
          analyzing && "pt-[max(1rem,env(safe-area-inset-top))]",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm",
            analyzing ? "bg-black/5 hover:bg-black/10" : "bg-black/50",
          )}
          aria-label={t.close}
        >
          <X className={cn("h-5 w-5", analyzing && "text-neutral-900")} />
        </button>
        {analyzing ? <span className="w-10" aria-hidden /> : (headerEnd ?? <span className="w-10" aria-hidden />)}
      </header>

      {!analyzing ? overlayTop : null}

      <div className="pointer-events-none relative z-10 mx-4 flex min-h-0 flex-1 flex-col items-center justify-center">
        <div
          className={cn(
            "relative overflow-hidden rounded-full bg-transparent transition-[box-shadow,border-color] duration-500",
            analyzing ? "border-0 shadow-none" : "border-[3px] border-[#75FBB2]",
          )}
          style={{ width: FRIGY_SCAN_CIRCLE_SIZE, height: FRIGY_SCAN_CIRCLE_SIZE }}
        >
          {analyzing ? (
            <div className="absolute inset-0 overflow-hidden rounded-full bg-white">
              {analyzingPreviewUrl ? (
                <img
                  key={analyzingPreviewUrl}
                  src={analyzingPreviewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="h-full w-full bg-[linear-gradient(180deg,#FFFFFF_0%,#EEF7F1_100%)]" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.28),transparent_42%)]" />
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                <div className="frigy-analyze-wind frigy-analyze-wind-soft" aria-hidden />
                <div className="frigy-analyze-wind frigy-analyze-wind-core" aria-hidden />
                <div className="frigy-analyze-wind frigy-analyze-wind-trail" aria-hidden />
              </div>
            </div>
          ) : null}
        </div>

        <AnimatePresence>
          {analyzing ? (
            <motion.div
              key="analyzing-copy"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex max-w-[320px] flex-col items-center px-2 text-center"
            >
              {analyzingTitle ? (
                <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-neutral-950 min-[390px]:text-[19px]">
                  {analyzingTitle}
                </h2>
              ) : null}
              {analyzingSubtitle ? (
                <p className="mt-2 text-[14px] font-semibold tracking-[-0.02em] text-neutral-400">
                  {analyzingSubtitle}
                </p>
              ) : null}
              {showPhotoCounter ? (
                <p className="mt-4 text-[13px] font-bold tracking-[0.06em] text-[#39D47F]">
                  {photoCounterLabel}
                </p>
              ) : null}
              {analyzingMessage ? (
                <p className="mt-6 text-[15px] font-medium leading-relaxed tracking-[-0.02em] text-neutral-500">
                  {analyzingMessage}
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
          ) : null}
        </AnimatePresence>
      </div>

      {!analyzing ? (
        <div className="relative z-20 mt-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom)+0.5rem)] pt-4">
          {beforeShutter}

          <div className="relative flex items-end justify-center">
            <motion.button
              type="button"
              whileTap={{ scale: shutterDisabled ? 1 : 0.94 }}
              onClick={() => void handleShutterPress()}
              disabled={shutterDisabled}
              className={cn(
                "relative z-10 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white shadow-[0_8px_32px_rgba(110,240,168,0.45)]",
                "ring-[3px] ring-[#75FBB2] ring-offset-4 ring-offset-black/80",
                shutterDisabled && "opacity-60",
              )}
              aria-label={shutterAriaLabel ?? t.foodScanPlateTitle}
            >
              <span className="sr-only">{shutterAriaLabel ?? t.foodScanPlateTitle}</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => galleryRef.current?.click()}
              disabled={shutterDisabled}
              className="absolute bottom-1 right-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-md disabled:opacity-60"
              aria-label={t.gallery}
            >
              <ImagePlus className="h-6 w-6 text-[#75FBB2]" />
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom)+0.5rem)]" aria-hidden />
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple={galleryMultiple}
        className="hidden"
        onChange={handleGallery}
      />
    </div>
  );
}
