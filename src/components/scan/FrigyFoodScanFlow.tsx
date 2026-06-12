import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FrigyScanFailureStage,
  FrigyScanSuccessStage,
  type FrigyScanSuccessData,
} from "./FrigyScanStates";
import { FrigyLiveCameraCapture } from "./FrigyLiveCameraCapture";

export type FoodScanPhase = "capture" | "analyzing" | "error" | "success";

type FrigyFoodScanFlowProps = {
  open: boolean;
  phase: FoodScanPhase;
  analyzing: boolean;
  analyzingLabel?: string;
  analyzingProgress?: number;
  previewImage?: string | null;
  analysisErrorMessage?: string | null;
  successResult?: FrigyScanSuccessData | null;
  onClose: () => void;
  onCapture: (file: File) => void;
  onRetryAfterError?: () => void;
  onSuccessDismiss?: () => void;
  onScanAnotherAfterSuccess?: () => void;
};

export function FrigyFoodScanFlow({
  open,
  phase,
  analyzing,
  analyzingLabel,
  analyzingProgress,
  previewImage,
  analysisErrorMessage,
  successResult,
  onClose,
  onCapture,
  onRetryAfterError,
  onSuccessDismiss,
  onScanAnotherAfterSuccess,
}: FrigyFoodScanFlowProps) {
  const { t } = useLanguage();
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);

  const resolvedPhase: FoodScanPhase = useMemo(
    () =>
      analysisErrorMessage
        ? "error"
        : successResult
          ? "success"
          : analyzing || phase === "analyzing"
            ? "analyzing"
            : phase,
    [analysisErrorMessage, successResult, analyzing, phase],
  );

  useEffect(() => {
    if (!open) {
      if (capturedPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
      setCapturedPreviewUrl(null);
    }
  }, [capturedPreviewUrl, open]);

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
  };

  const beginAnalysis = (file: File) => {
    if (capturedPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedPreviewUrl(URL.createObjectURL(file));
    onCapture(file);
  };

  const activePreviewImage = previewImage ?? capturedPreviewUrl;

  if (resolvedPhase === "success" && successResult) {
    return (
      <FrigyScanSuccessStage
        result={successResult}
        onDismiss={() => onSuccessDismiss?.()}
        onScanAnother={onScanAnotherAfterSuccess}
      />
    );
  }

  if (resolvedPhase === "error" && analysisErrorMessage) {
    return (
      <FrigyScanFailureStage
        title={t.frigySays}
        message={analysisErrorMessage}
        actionLabel={t.foodScanTryAnotherDish}
        onAction={() => {
          resetCapturedPreview();
          onRetryAfterError?.();
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <FrigyLiveCameraCapture
      active={open && (resolvedPhase === "capture" || resolvedPhase === "analyzing")}
      analyzing={resolvedPhase === "analyzing"}
      analyzingPreviewUrl={activePreviewImage}
      analyzingTitle={t.foodScanPlateTitle}
      analyzingSubtitle={t.foodScanAiPowered}
      analyzingMessage={analyzingLabel ?? t.analyzingFood}
      analyzingProgress={analyzingProgress}
      onClose={onClose}
      onPhotoFile={beginAnalysis}
      shutterDisabled={analyzing}
      shutterAriaLabel={t.foodScanPlateTitle}
    />
  );
}
