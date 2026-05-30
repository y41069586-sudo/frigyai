import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, ImagePlus, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIngredientCamera } from "@/hooks/useIngredientCamera";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FrigyScanAnalyzingStage,
  FrigyScanFailureStage,
  FrigyScanSuccessStage,
  type FrigyScanSuccessData,
} from "./FrigyScanStates";

type Phase = "capture" | "analyzing" | "error" | "success";

type FrigyFoodScanFlowProps = {
  open: boolean;
  analyzing: boolean;
  analyzingLabel?: string;
  previewImage?: string | null;
  analysisErrorMessage?: string | null;
  successResult?: FrigyScanSuccessData | null;
  onClose: () => void;
  onCapture: (file: File) => void;
  onRetryAfterError?: () => void;
  onSuccessDismiss?: () => void;
};

export function FrigyFoodScanFlow({
  open,
  analyzing,
  analyzingLabel,
  previewImage,
  analysisErrorMessage,
  successResult,
  onClose,
  onCapture,
  onRetryAfterError,
  onSuccessDismiss,
}: FrigyFoodScanFlowProps) {
  const { language, t } = useLanguage();
  const galleryRef = useRef<HTMLInputElement>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState(false);
  const wasAnalyzingRef = useRef(false);

  const copy =
    language === "fr"
      ? {
          analyzingLabel: "Analyse de votre nourriture...",
          analyzingTitle: "L'assiette est scannée.",
          analyzingSubtitle: "Propulsé par l'IA ✨",
          errorTitle: "Frigy dit",
          retryLabel: "Essayer un autre plat",
          openDevApp: "Ouvre l'app avec ",
          localhostJoin: " sur ",
          orGallery: " - ou utilise la galerie en bas.",
          retry: "Reessayer",
          gallery: "Galerie",
          capture: "Prendre une photo",
          captureSr: "Capture",
        }
      : language === "en"
        ? {
            analyzingLabel: "Analyzing your food...",
            analyzingTitle: "Plate is being scanned.",
            analyzingSubtitle: "AI-powered ✨",
            errorTitle: "Frigy says",
            retryLabel: "Try another dish",
            openDevApp: "Open the app with ",
            localhostJoin: " at ",
            orGallery: " - or use the gallery below.",
            retry: "Retry",
            gallery: "Gallery",
            capture: "Take photo",
            captureSr: "Capture",
          }
        : {
            analyzingLabel: "Essen wird analysiert…",
            analyzingTitle: "Teller wird gescannt.",
            analyzingSubtitle: "KI-gestützt ✨",
            errorTitle: "Frigy sagt",
            retryLabel: "Anderes Gericht versuchen",
            openDevApp: "Öffne die App mit ",
            localhostJoin: " unter ",
            orGallery: " — oder Galerie unten.",
            retry: "Erneut",
            gallery: "Galerie",
            capture: "Foto aufnehmen",
            captureSr: "Aufnahme",
          };

  const phase: Phase = successResult
    ? "success"
    : analysisErrorMessage
      ? "error"
      : analyzing || pendingAnalysis
        ? "analyzing"
        : "capture";

  const {
    setVideoRef,
    status: cameraStatus,
    previewReady,
    errorMessage: cameraError,
    capturePhoto,
    retry: retryCamera,
    isLive,
  } = useIngredientCamera({ active: open && phase === "capture" });

  const showCameraHint =
    !previewReady &&
    (cameraStatus === "error" || cameraStatus === "denied" || cameraStatus === "fallback");

  useEffect(() => {
    if (!open) {
      setPendingAnalysis(false);
      if (capturedPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
      setCapturedPreviewUrl(null);
    }
  }, [capturedPreviewUrl, open]);

  useEffect(() => {
    if (wasAnalyzingRef.current && !analyzing) {
      setPendingAnalysis(false);
    }
    wasAnalyzingRef.current = analyzing;
  }, [analyzing]);

  useEffect(() => {
    return () => {
      if (capturedPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  if (!open) return null;

  const resetCapturedPreview = () => {
    if (capturedPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedPreviewUrl(null);
    setPendingAnalysis(false);
  };

  const beginAnalysis = (file: File) => {
    if (capturedPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedPreviewUrl(URL.createObjectURL(file));
    setPendingAnalysis(true);
    onCapture(file);
  };

  const handleShutterPress = async () => {
    if (isLive) {
      const file = await capturePhoto();
      if (file) {
        beginAnalysis(file);
        return;
      }
    }
    await retryCamera();
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) beginAnalysis(file);
    e.target.value = "";
  };

  const activePreviewImage = previewImage ?? capturedPreviewUrl;

  if (phase === "success" && successResult) {
    return (
      <FrigyScanSuccessStage
        result={successResult}
        onDismiss={() => onSuccessDismiss?.()}
      />
    );
  }

  if (phase === "error" && analysisErrorMessage) {
    return (
      <FrigyScanFailureStage
        title={copy.errorTitle}
        message={analysisErrorMessage}
        actionLabel={copy.retryLabel}
        onAction={() => {
          resetCapturedPreview();
          onRetryAfterError?.();
        }}
        onClose={onClose}
      />
    );
  }

  if (phase === "analyzing") {
    return (
      <FrigyScanAnalyzingStage
        previewUrl={activePreviewImage}
        title={copy.analyzingTitle}
        subtitle={copy.analyzingSubtitle}
        message={analyzingLabel ?? copy.analyzingLabel}
        onClose={onClose}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex flex-col overflow-hidden bg-black text-white safe-area-inset"
    >
      <style>{`
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
      `}</style>
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
        <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center px-6 text-center">
          <div className="pointer-events-auto max-w-sm rounded-2xl border border-white/10 bg-black/55 px-5 py-4 backdrop-blur-md">
            <Camera className="mx-auto mb-3 h-8 w-8 text-[#75FBB2]" />
            <p className="text-sm font-medium text-white/90">{cameraError}</p>
            <p className="mt-2 text-xs text-white/55">
              {copy.openDevApp}
              <span className="text-[#75FBB2]">npm run dev</span>
              {copy.localhostJoin}
              <span className="text-[#75FBB2]">http://localhost:8080</span>
              {copy.orGallery}
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
                {copy.retry}
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-[#75FBB2] text-[#0a1f14]"
                onClick={() => galleryRef.current?.click()}
              >
                {copy.gallery}
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

      <header className="relative z-10 flex shrink-0 items-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
          aria-label={t.close}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="pointer-events-none relative z-10 mx-4 flex min-h-0 flex-1 items-center justify-center">
        <div
          className="rounded-full border-[3px] border-[#75FBB2] bg-transparent"
          style={{ width: "min(72vw, 280px)", height: "min(72vw, 280px)" }}
        />
      </div>

      <div className="relative z-20 mt-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom)+0.5rem)] pt-4">
        <div className="relative flex items-end justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => void handleShutterPress()}
            className={cn(
              "relative z-10 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white shadow-[0_8px_32px_rgba(110,240,168,0.45)]",
              "ring-[3px] ring-[#75FBB2] ring-offset-4 ring-offset-black/80",
            )}
            aria-label={copy.capture}
          >
            <span className="sr-only">{copy.captureSr}</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => galleryRef.current?.click()}
            className="absolute bottom-1 right-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-md"
            aria-label={copy.gallery}
          >
            <ImagePlus className="h-6 w-6 text-[#75FBB2]" />
          </motion.button>
        </div>
      </div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleGallery} />
    </motion.div>
  );
}
