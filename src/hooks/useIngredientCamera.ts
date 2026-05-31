import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export type IngredientCameraStatus = "idle" | "starting" | "live" | "error" | "denied" | "fallback";

type UseIngredientCameraOptions = {
  active: boolean;
};

async function requestVideoStream(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    { audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { audio: false, video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } },
    { audio: false, video: true },
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export function useIngredientCamera({ active }: UseIngredientCameraOptions) {
  const { t } = useLanguage();
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generationRef = useRef(0);
  const [status, setStatus] = useState<IngredientCameraStatus>("idle");
  const [previewReady, setPreviewReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoElRef.current;
    if (video) {
      video.srcObject = null;
    }
    setPreviewReady(false);
  }, []);

  const attachStreamToVideo = useCallback(async (): Promise<boolean> => {
    const video = videoElRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return false;

    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("muted", "true");
    video.setAttribute("autoplay", "true");
    video.setAttribute("disablePictureInPicture", "true");
    video.setAttribute("disableRemotePlayback", "true");
    video.setAttribute("controlsList", "nodownload nofullscreen noplaybackrate");
    video.controls = false;
    video.removeAttribute("controls");
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.srcObject = stream;

    try {
      await video.play();
      await new Promise<void>((resolve) => {
        if (video.videoWidth > 0) {
          resolve();
          return;
        }
        const done = () => {
          video.removeEventListener("loadeddata", done);
          video.removeEventListener("playing", done);
          resolve();
        };
        video.addEventListener("loadeddata", done);
        video.addEventListener("playing", done);
        window.setTimeout(resolve, 450);
      });
      const ok = video.videoWidth > 0;
      if (ok) {
        setPreviewReady(true);
        setStatus("live");
      }
      return ok;
    } catch (err) {
      console.warn("[useIngredientCamera] video.play failed:", err);
      return false;
    }
  }, []);

  const setVideoRef: RefCallback<HTMLVideoElement> = useCallback(
    (node) => {
      videoElRef.current = node;
      if (node && streamRef.current) {
        void attachStreamToVideo();
      }
    },
    [attachStreamToVideo],
  );

  useEffect(() => {
    const video = videoElRef.current;
    if (!video || !active) return;

    const markReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setPreviewReady(true);
        setStatus("live");
        setErrorMessage(null);
      }
    };

    video.addEventListener("loadedmetadata", markReady);
    video.addEventListener("loadeddata", markReady);
    video.addEventListener("playing", markReady);
    return () => {
      video.removeEventListener("loadedmetadata", markReady);
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("playing", markReady);
    };
  }, [active, status]);

  const mapMediaError = (err: unknown): { status: IngredientCameraStatus; message: string } => {
    const msg = `${(err as Error)?.name ?? ""} ${(err as Error)?.message ?? ""}`;
    if (msg.includes("NotAllowed") || msg.includes("PermissionDenied")) {
      return { status: "denied", message: t.cameraBlockedHint };
    }
    if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
      return { status: "fallback", message: t.cameraNoDeviceGallery };
    }
    if (msg.includes("NotReadable") || msg.includes("TrackStart")) {
      return { status: "error", message: t.cameraInUseHint };
    }
    return { status: "fallback", message: t.cameraLiveUnavailableHint };
  };

  const startCamera = useCallback(async () => {
    const generation = ++generationRef.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("fallback");
      setErrorMessage(t.cameraUnsupportedHint);
      return;
    }

    if (!window.isSecureContext) {
      setStatus("fallback");
      setErrorMessage(t.cameraHttpsHint);
      return;
    }

    setStatus("starting");
    setPreviewReady(false);
    setErrorMessage(null);
    stopStream();

    let timedOut = false;
    const startTimeout = window.setTimeout(() => {
      if (generation !== generationRef.current) return;
      timedOut = true;
      const video = videoElRef.current;
      if (!video || video.videoWidth < 1) {
        setStatus("fallback");
        setErrorMessage(t.cameraStartSlowHint);
      }
    }, 5500);

    try {
      const stream = await requestVideoStream();

      if (generation !== generationRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      let attached = false;
      for (let attempt = 0; attempt < 12 && !attached; attempt += 1) {
        if (generation !== generationRef.current) return;
        attached = await attachStreamToVideo();
        if (!attached) {
          await new Promise<void>((r) => window.setTimeout(r, 40));
        }
      }

      window.clearTimeout(startTimeout);

      if (generation !== generationRef.current) return;

      if (!attached && !timedOut) {
        setStatus("fallback");
        setErrorMessage(t.cameraPreviewHint);
      }
    } catch (err) {
      window.clearTimeout(startTimeout);
      if (generation !== generationRef.current) return;
      const mapped = mapMediaError(err);
      setStatus(mapped.status);
      setErrorMessage(mapped.message);
      stopStream();
    }
  }, [attachStreamToVideo, stopStream, t]);

  useEffect(() => {
    if (!active) {
      generationRef.current += 1;
      stopStream();
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    void startCamera();

    return () => {
      generationRef.current += 1;
      stopStream();
    };
  }, [active, startCamera, stopStream]);

  const capturePhoto = useCallback(async (): Promise<File | null> => {
    const video = videoElRef.current;
    if (!video || video.videoWidth < 1) return null;

    const maxEdge = 1280;
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.82);
    });
    if (!blob) return null;

    return new File([blob], `frigy-scan-${Date.now()}.jpg`, { type: "image/jpeg" });
  }, []);

  return {
    setVideoRef,
    status,
    previewReady,
    errorMessage,
    capturePhoto,
    retry: startCamera,
    isLive: previewReady,
  };
}
