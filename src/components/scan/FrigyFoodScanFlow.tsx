import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, ImagePlus, Camera } from "lucide-react";
import { useIngredientCamera } from "@/hooks/useIngredientCamera";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { FrigyScanAnalyzingStage, FrigyScanFailureStage } from "./FrigyScanStates";

type Phase = "capture" | "analyzing" | "error";

type FrigyFoodScanFlowProps = {
  open: boolean;
  analyzing: boolean;
  analyzingLabel?: string;
  previewImage?: string | null;
  analysisErrorMessage?: string | null;
  onClose: () => void;
  onCapture: (file: File) => void;
  onRetryAfterError?: () => void;
};

export function FrigyFoodScanFlow({
  open,
  analyzing,
  analyzingLabel = "Essen wird analysiert…",
  previewImage,
  analysisErrorMessage,
  onClose,
  onCapture,
  onRetryAfterError,
}: FrigyFoodScanFlowProps) {
  const { language } = useLanguage();
  const galleryRef = useRef<HTMLInputElement>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState(false);

  const phase: Phase = analysisErrorMessage
    ? "error"
    : analyzing || pendingAnalysis
      ? "analyzing"
      : "capture";

  const { setVideoRef, previewReady, capturePhoto, retry, isLive, errorMessage } =
    useIngredientCamera({ active: open && phase === "capture" });

  if (!open) return null;

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
    if (analyzing) return;
    if (analysisErrorMessage) return;
    if (!pendingAnalysis) return;
    setPendingAnalysis(false);
  }, [analysisErrorMessage, analyzing, pendingAnalysis]);

  const resetCapturedPreview = () => {
    if (capturedPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedPreviewUrl(null);
    setPendingAnalysis(false);
  };

  const beginAnalysis = (file: File) => {
    resetCapturedPreview();
    setCapturedPreviewUrl(URL.createObjectURL(file));
    setPendingAnalysis(true);
    onCapture(file);
  };

  const handleShutter = async () => {
    const file = await capturePhoto();
    if (!file) return;
    beginAnalysis(file);
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) beginAnalysis(file);
    e.target.value = "";
  };

  const analyzingTitle =
    language === "de"
      ? "Teller wird gescannt."
      : language === "fr"
        ? "L'assiette est scannée."
        : "Plate is being scanned.";
  const analyzingSubtitle =
    language === "de" ? "KI-gestützt ✨" : language === "fr" ? "Propulsé par l'IA ✨" : "AI-powered ✨";
  const retryLabel =
    language === "de"
      ? "Anderes Gericht versuchen"
      : language === "fr"
        ? "Essayer un autre plat"
        : "Try another dish";

  const activePreviewImage = previewImage ?? capturedPreviewUrl;

  if (phase === "error" && analysisErrorMessage) {
    return (
      <FrigyScanFailureStage
        message={analysisErrorMessage}
        actionLabel={retryLabel}
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
        title={analyzingTitle}
        subtitle={analyzingSubtitle}
        message={analyzingLabel}
        onClose={onClose}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex flex-col bg-black text-white safe-area-inset"
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
          "frigy-scan-video pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-150",
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

      <motion.div className="absolute inset-0 bg-black/25" animate={{ opacity: 0.35 }} />

      <motion.div className="relative z-20 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-md"
          aria-label="Schließen"
        >
          <X className="h-6 w-6" />
        </button>
      </motion.div>

      <motion.div
        className="relative z-20 flex flex-1 flex-col items-center justify-center px-6"
        animate={{ scale: 1 }}
      >
        <motion.div
          className="relative flex items-center justify-center"
          animate={{ boxShadow: "0 0 32px 8px rgba(110,240,168,0.35)" }}
          transition={{ duration: 0.4 }}
          style={{
            width: "min(72vw, 280px)",
            height: "min(72vw, 280px)",
            borderRadius: "9999px",
            border: "3px solid #75FBB2",
          }}
        >
          {!analyzing && !previewReady && errorMessage ? (
            <p className="absolute -bottom-14 left-1/2 w-[min(90vw,320px)] -translate-x-1/2 text-center text-sm text-white/80">
              {errorMessage}
            </p>
          ) : null}
        </motion.div>
      </motion.div>

      <motion.div className="relative z-20 flex items-center justify-center gap-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-md"
          aria-label="Galerie"
        >
          <ImagePlus className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => void handleShutter()}
          className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-[4px] border-[#75FBB2] bg-white/10 shadow-[0_14px_36px_-18px_rgba(57,212,127,0.42)]"
          aria-label="Foto aufnehmen"
        >
          <Camera className="h-8 w-8 text-[#75FBB2]" />
        </button>
        <button
          type="button"
          onClick={() => retry()}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-md",
            !errorMessage && "opacity-0 pointer-events-none",
          )}
          aria-label="Kamera erneut"
        >
          <Camera className="h-6 w-6" />
        </button>
      </motion.div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleGallery} />
    </motion.div>
  );
}
