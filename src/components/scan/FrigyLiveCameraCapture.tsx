import { useRef } from "react";
import { motion } from "framer-motion";
import { Camera, ImagePlus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIngredientCamera } from "@/hooks/useIngredientCamera";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

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
  } = useIngredientCamera({ active });

  const showCameraHint =
    !previewReady &&
    (cameraStatus === "error" || cameraStatus === "denied" || cameraStatus === "fallback");

  const handleShutterPress = async () => {
    if (captureLockRef.current || shutterDisabled || cameraStatus === "starting") return;

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
    if (!files.length || shutterDisabled) return;
    if (galleryMultiple && onPhotoFiles && files.length > 1) {
      onPhotoFiles(files);
      return;
    }
    onPhotoFile(files[0]!);
  };

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-black text-white safe-area-inset">
      <style>{VIDEO_HIDE_CSS}</style>
      <video
        ref={setVideoRef}
        className={cn(
          "frigy-scan-video pointer-events-none absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-150",
          previewReady ? "opacity-100" : "opacity-0",
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

      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(ellipse 75% 65% at 50% 42%, transparent 0%, transparent 42%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/40 via-transparent to-black/65" />

      <header className="relative z-10 flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
          aria-label={t.close}
        >
          <X className="h-5 w-5" />
        </button>
        {headerEnd ?? <span className="w-10" aria-hidden />}
      </header>

      {overlayTop}

      <div className="pointer-events-none relative z-10 mx-4 flex min-h-0 flex-1 items-center justify-center">
        <div
          className="rounded-full border-[3px] border-[#75FBB2] bg-transparent"
          style={{ width: "min(72vw, 280px)", height: "min(72vw, 280px)" }}
        />
      </div>

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
