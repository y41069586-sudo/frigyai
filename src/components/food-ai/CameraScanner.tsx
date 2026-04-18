import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type CameraScannerProps = {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  className?: string;
  labels?: { camera: string; gallery: string };
};

/**
 * Gemeinsamer Kamera/Galerie-Trigger (Web + Mobile mit capture).
 */
export function CameraScanner({
  onFileSelected,
  disabled,
  className = "",
  labels = { camera: "Foto aufnehmen", gallery: "Aus Galerie" },
}: CameraScannerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 justify-center ${className}`}>
      <input
        id="food-ai-camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled}
        onChange={handleChange}
      />
      <input
        id="food-ai-gallery-input"
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={handleChange}
      />
      <motion.div whileTap={{ scale: disabled ? 1 : 0.98 }} className="flex-1 sm:flex-none">
        <Button
          type="button"
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 font-semibold"
          disabled={disabled}
          onClick={() => document.getElementById("food-ai-camera-input")?.click()}
        >
          <Camera className="h-5 w-5 mr-2" />
          {labels.camera}
        </Button>
      </motion.div>
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto h-12 rounded-2xl border-primary/30 bg-background/80 backdrop-blur-sm"
        disabled={disabled}
        onClick={() => document.getElementById("food-ai-gallery-input")?.click()}
      >
        <Upload className="h-5 w-5 mr-2" />
        {labels.gallery}
      </Button>
    </div>
  );
}
