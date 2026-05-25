import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, Check, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIngredientCamera } from "@/hooks/useIngredientCamera";
import { useLanguage } from "@/contexts/LanguageContext";
import { FrigyScanAnalyzingStage, FrigyScanFailureStage } from "./FrigyScanStates";

export type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type Phase = "capture" | "analyzing" | "results" | "error";

type FrigyIngredientScanFlowProps = {
  ingredients: string[];
  missingIngredients: { name: string; amount: string }[];
  analyzing: boolean;
  analysisErrorMessage?: string | null;
  scanProgress: number;
  captureMode: boolean;
  onAddPhotos: (files: File[]) => void;
  onQueueChange?: (files: File[]) => void;
  onConfirmAnalyze: () => void;
  onClose: () => void;
  onCreateShoppingList: () => void;
  onAddMorePhotos: () => void;
  onRetryAfterError?: () => void;
  labels?: {
    analyzingTitle?: string;
    analyzingSubtitle?: string;
    present?: string;
    missing?: string;
    createList?: string;
    addPhoto?: string;
    finishScan?: string;
    tapShutter?: string;
    errorTitle?: string;
    errorAction?: string;
  };
};

export function FrigyIngredientScanFlow({
  ingredients,
  missingIngredients,
  analyzing,
  analysisErrorMessage,
  scanProgress,
  captureMode,
  onAddPhotos,
  onQueueChange,
  onConfirmAnalyze,
  onClose,
  onCreateShoppingList,
  onAddMorePhotos,
  onRetryAfterError,
  labels = {},
}: FrigyIngredientScanFlowProps) {
  const { language } = useLanguage();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [analysisPreviewUrl, setAnalysisPreviewUrl] = useState<string | null>(null);

  const hasResults = ingredients.length > 0 || missingIngredients.length > 0;
  const phase: Phase = analysisErrorMessage
    ? "error"
    : analyzing
      ? "analyzing"
    : captureMode || !hasResults
      ? "capture"
      : "results";

  const {
    setVideoRef,
    status: cameraStatus,
    previewReady,
    errorMessage: cameraError,
    capturePhoto,
    retry: retryCamera,
    isLive,
  } = useIngredientCamera({ active: phase === "capture" });

  const showCameraHint =
    !previewReady &&
    (cameraStatus === "error" || cameraStatus === "denied" || cameraStatus === "fallback");

  const L = {
    analyzingTitle: labels.analyzingTitle ?? "Zutaten werden analysiert",
    analyzingSubtitle: labels.analyzingSubtitle ?? "Frigy erkennt deine Vorräte…",
    present: labels.present ?? "Vorhanden",
    missing: labels.missing ?? "Fehlend",
    createList: labels.createList ?? "Einkaufsliste erstellen",
    addPhoto: labels.addPhoto ?? "Foto hinzufügen",
    finishScan: labels.finishScan ?? "Fertig",
    tapShutter: labels.tapShutter ?? "Foto aufnehmen oder Galerie",
    errorTitle: labels.errorTitle ?? "Frigy sagt",
    errorAction:
      labels.errorAction ??
      (language === "de" ? "Nochmal versuchen" : language === "fr" ? "Reessayer" : "Try again"),
  };

  useEffect(() => {
    return () => {
      if (analysisPreviewUrl && analysisPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(analysisPreviewUrl);
      }
    };
  }, [analysisPreviewUrl]);

  useEffect(() => {
    if (analyzing) return;
    if (phase === "capture") return;
    if (pendingPhotos.length === 0) return;

    setPendingPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    syncQueue([]);
  }, [analyzing, pendingPhotos.length, phase]);

  const syncQueue = (photos: PendingPhoto[]) => {
    onQueueChange?.(photos.map((p) => p.file));
  };

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    const next = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingPhotos((prev) => {
      const merged = [...prev, ...next];
      syncQueue(merged);
      return merged;
    });
    onAddPhotos(files);
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) addFiles(files);
  };

  const removePhoto = (id: string) => {
    setPendingPhotos((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      const next = prev.filter((p) => p.id !== id);
      syncQueue(next);
      return next;
    });
  };

  const clearPendingPhotos = () => {
    setPendingPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    syncQueue([]);
  };

  const handleShutterPress = async () => {
    if (isLive) {
      const file = await capturePhoto();
      if (file) {
        addFiles([file]);
        return;
      }
    }
    await retryCamera();
  };

  const handleConfirm = () => {
    if (pendingPhotos.length === 0) {
      void handleShutterPress();
      return;
    }
    setAnalysisPreviewUrl(pendingPhotos[pendingPhotos.length - 1]?.previewUrl ?? null);
    onConfirmAnalyze();
  };

  if (phase === "analyzing") {
    return (
      <FrigyScanAnalyzingStage
        previewUrl={analysisPreviewUrl}
        title={L.analyzingTitle}
        subtitle={language === "de" ? "KI-gestützt ✨" : language === "fr" ? "Propulsé par l'IA ✨" : "AI-powered ✨"}
        message={L.analyzingSubtitle}
        progress={scanProgress}
        onClose={onClose}
      />
    );
  }

  if (phase === "error" && analysisErrorMessage) {
    return (
      <FrigyScanFailureStage
        title={L.errorTitle}
        message={analysisErrorMessage}
        actionLabel={L.errorAction}
        onAction={() => {
          setAnalysisPreviewUrl(null);
          clearPendingPhotos();
          onRetryAfterError?.();
        }}
        onClose={onClose}
      />
    );
  }

  if (phase === "results") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background safe-area-inset">
        <header className="flex shrink-0 items-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/80"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
          <Card className="p-4 border-[#75FBB2]/25 bg-[#75FBB2]/5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">{L.present}</h2>
              <span className="rounded-full bg-[#75FBB2]/20 px-2.5 py-0.5 text-xs font-semibold text-[#2d8a5c]">
                {ingredients.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 rounded-full bg-[#75FBB2]/15 px-3 py-1.5 text-sm font-medium text-[#1a5c3a]"
                >
                  <Check className="h-3.5 w-3.5" />
                  {item}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-4 border-amber-500/25 bg-amber-500/5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">{L.missing}</h2>
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {missingIngredients.length}
              </span>
            </div>
            {missingIngredients.length > 0 ? (
              <div className="space-y-2">
                {missingIngredients.map((item) => (
                  <div
                    key={`${item.name}-${item.amount}`}
                    className="flex justify-between gap-3 rounded-xl bg-amber-500/8 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground text-xs">{item.amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Alles vorhanden – nichts fehlt.</p>
            )}
          </Card>
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-border/60 bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
          <div className="mx-auto flex max-w-lg gap-3">
            <Button variant="outline" className="h-12 flex-1 rounded-2xl" onClick={onAddMorePhotos}>
              <ImagePlus className="mr-2 h-4 w-4" />
              {L.addPhoto}
            </Button>
            <Button
              className="h-12 flex-1 rounded-2xl bg-gradient-to-r from-[#75FBB2] to-[#39D47F] text-[#0a1f14] font-semibold"
              onClick={onCreateShoppingList}
            >
              {L.createList}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white safe-area-inset overflow-hidden">
      <video
        ref={setVideoRef}
        className="absolute inset-0 h-full w-full object-cover z-0"
        autoPlay
        muted
        playsInline
      />

      {showCameraHint && (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center px-6 text-center pointer-events-none">
          <div className="max-w-sm rounded-2xl bg-black/55 px-5 py-4 backdrop-blur-md border border-white/10 pointer-events-auto">
            <Camera className="mx-auto mb-3 h-8 w-8 text-[#75FBB2]" />
            <p className="text-sm font-medium text-white/90">{cameraError}</p>
            <p className="mt-2 text-xs text-white/55">
              Öffne die App mit <span className="text-[#75FBB2]">npm run dev</span> unter{" "}
              <span className="text-[#75FBB2]">http://localhost:5173</span> — oder Galerie unten.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={() => void retryCamera()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Erneut
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-[#75FBB2] text-[#0a1f14]"
                onClick={() => galleryInputRef.current?.click()}
              >
                Galerie
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
          aria-label="Schließen"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="relative z-10 mx-4 flex flex-1 min-h-0 items-center justify-center pointer-events-none">
        <div
          className="rounded-full border-[3px] border-[#75FBB2] bg-transparent"
          style={{ width: "min(72vw, 280px)", height: "min(72vw, 280px)" }}
        />
      </div>

      <AnimatePresence>
        {pendingPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-4 right-4 top-[max(3.25rem,env(safe-area-inset-top)+2rem)] z-10 flex gap-2 overflow-x-auto pb-1"
          >
            {pendingPhotos.map((photo) => (
              <div key={photo.id} className="relative shrink-0">
                <img
                  src={photo.previewUrl}
                  alt=""
                  className="h-14 w-14 rounded-xl object-cover ring-2 ring-[#75FBB2]/50"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 mt-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom)+0.5rem)] pt-4">
        {pendingPhotos.length > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleConfirm}
            className="mb-4 w-full rounded-2xl bg-[#75FBB2]/20 py-3 text-center text-sm font-semibold text-[#75FBB2] ring-1 ring-[#75FBB2]/40"
          >
            {L.finishScan} ({pendingPhotos.length})
          </motion.button>
        )}

        <div className="relative flex items-end justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => void handleShutterPress()}
            className={cn(
              "relative z-10 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white shadow-[0_8px_32px_rgba(110,240,168,0.45)]",
              "ring-[3px] ring-[#75FBB2] ring-offset-4 ring-offset-black/80",
            )}
            aria-label="Foto aufnehmen"
          >
            <span className="sr-only">Aufnahme</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => galleryInputRef.current?.click()}
            className="absolute right-0 bottom-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 backdrop-blur-md ring-1 ring-white/20"
            aria-label="Galerie"
          >
            <ImagePlus className="h-6 w-6 text-[#75FBB2]" />
          </motion.button>
        </div>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleGallery}
      />
    </div>
  );
}
