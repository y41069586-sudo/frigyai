import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, ImagePlus, Camera } from "lucide-react";
import { useIngredientCamera } from "@/hooks/useIngredientCamera";
import { cn } from "@/lib/utils";

type FrigyFoodScanFlowProps = {
  open: boolean;
  analyzing: boolean;
  analyzingLabel?: string;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function FrigyFoodScanFlow({
  open,
  analyzing,
  analyzingLabel = "Essen wird analysiert…",
  onClose,
  onCapture,
}: FrigyFoodScanFlowProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const [flash, setFlash] = useState(false);

  const { setVideoRef, previewReady, capturePhoto, retry, isLive, errorMessage } =
    useIngredientCamera({ active: open && !analyzing });

  if (!open) return null;

  const handleShutter = async () => {
    const file = await capturePhoto();
    if (!file) return;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
    onCapture(file);
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
    e.target.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex flex-col bg-black text-white safe-area-inset"
    >
      <video
        ref={setVideoRef}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        playsInline
      />

      {flash && <motion.div className="absolute inset-0 z-10 bg-white/70" initial={{ opacity: 1 }} animate={{ opacity: 0 }} />}

      <motion.div
        className="absolute inset-0 bg-black/25"
        animate={analyzing ? { opacity: 0.55 } : { opacity: 0.35 }}
      />

      <div className="relative z-20 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
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
        animate={analyzing ? { scale: 0.96 } : { scale: 1 }}
      >
        <motion.div
          className="relative flex items-center justify-center"
          animate={
            analyzing
              ? {
                  boxShadow: [
                    "0 0 0 0 rgba(110,240,168,0.35)",
                    "0 0 48px 12px rgba(110,240,168,0.55)",
                    "0 0 0 0 rgba(110,240,168,0.35)",
                  ],
                }
              : {
                  boxShadow: "0 0 32px 8px rgba(110,240,168,0.35)",
                }
          }
          transition={{ duration: analyzing ? 1.6 : 0.4, repeat: analyzing ? Infinity : 0 }}
          style={{
            width: "min(72vw, 280px)",
            height: "min(72vw, 280px)",
            borderRadius: "9999px",
            border: "3px solid #6EF0A8",
          }}
        >
          {!analyzing && !previewReady && (
            <p className="absolute -bottom-14 left-1/2 w-[min(90vw,320px)] -translate-x-1/2 text-center text-sm text-white/80">
              {errorMessage || (isLive ? "Kamera bereit" : "Kamera wird geladen…")}
            </p>
          )}
          {analyzing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <p className="px-6 text-center text-base font-semibold text-[#6EF0A8] drop-shadow-[0_0_18px_rgba(110,240,168,0.8)]">
                {analyzingLabel}
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {!analyzing && (
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
            className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-[4px] border-[#6EF0A8] bg-white/10 shadow-[0_0_28px_rgba(110,240,168,0.45)]"
            aria-label="Foto aufnehmen"
          >
            <Camera className="h-8 w-8 text-[#6EF0A8]" />
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
      )}

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleGallery} />
    </motion.div>
  );
}
