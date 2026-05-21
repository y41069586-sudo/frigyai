import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

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
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
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
        window.setTimeout(resolve, 2000);
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
      return {
        status: "denied",
        message: "Kamera blockiert — erlaube den Zugriff in der Browser-Leiste oder nutze Galerie.",
      };
    }
    if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
      return { status: "fallback", message: "Keine Kamera — nutze Galerie oder „Foto wählen“." };
    }
    if (msg.includes("NotReadable") || msg.includes("TrackStart")) {
      return { status: "error", message: "Kamera ist belegt (andere App schließen)." };
    }
    return {
      status: "fallback",
      message: "Live-Kamera hier nicht möglich (z. B. Cursor-Vorschau). Nutze Galerie unten rechts.",
    };
  };

  const startCamera = useCallback(async () => {
    const generation = ++generationRef.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("fallback");
      setErrorMessage("Live-Kamera nicht unterstützt — Galerie oder Datei-Upload nutzen.");
      return;
    }

    if (!window.isSecureContext) {
      setStatus("fallback");
      setErrorMessage("Kamera braucht localhost/HTTPS — starte mit npm run dev und öffne http://localhost:5173");
      return;
    }

    setStatus("starting");
    setPreviewReady(false);
    setErrorMessage(null);
    stopStream();

    const startTimeout = window.setTimeout(() => {
      if (generation !== generationRef.current) return;
      const video = videoElRef.current;
      if (!video || video.videoWidth < 1) {
        setStatus("fallback");
        setErrorMessage("Kamera startet zu lange — nutze Galerie oder einen anderen Browser.");
      }
    }, 8000);

    try {
      const stream = await requestVideoStream();

      if (generation !== generationRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      let attached = false;
      for (let attempt = 0; attempt < 40 && !attached; attempt += 1) {
        if (generation !== generationRef.current) return;
        attached = await attachStreamToVideo();
        if (!attached) {
          await new Promise<void>((r) => requestAnimationFrame(() => r()));
        }
      }

      window.clearTimeout(startTimeout);

      if (generation !== generationRef.current) return;

      if (!attached && !timedOut) {
        setStatus("fallback");
        setErrorMessage("Vorschau nicht sichtbar — nutze Galerie oder einen anderen Browser.");
      }
    } catch (err) {
      window.clearTimeout(startTimeout);
      if (generation !== generationRef.current) return;
      const mapped = mapMediaError(err);
      setStatus(mapped.status);
      setErrorMessage(mapped.message);
      stopStream();
    }
  }, [attachStreamToVideo, stopStream]);

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
    if (!video || !previewReady || video.videoWidth < 1) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<File | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(new File([blob], `frigy-scan-${Date.now()}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.9,
      );
    });
  }, [previewReady]);

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
