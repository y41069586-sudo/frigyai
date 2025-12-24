import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import frigyMascot from "@/assets/frigy-mascot.png";

interface MealPlanGeneratingOverlayProps {
  isGenerating: boolean;
  elapsedSeconds: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const funnyTexts = [
  "Frigy kocht für dich... 👨‍🍳",
  "Frigy wälzt Kochbücher... 📚",
  "Frigy probiert Rezepte... 🍝",
  "Frigy schnippelt Gemüse... 🥕",
  "Frigy rührt den Topf... 🥄",
  "Frigy zählt Kalorien... 🔢",
  "Frigy plant deine Woche... 📅",
  "Frigy mischt Gewürze... 🧂",
  "Frigy checkt den Kühlschrank... 🧊",
  "Frigy macht's lecker... 😋",
];

export const MealPlanGeneratingOverlay = ({ 
  isGenerating, 
  elapsedSeconds,
  onMinimize,
  isMinimized = false
}: MealPlanGeneratingOverlayProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentTextIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentTextIndex(prev => (prev + 1) % funnyTexts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Minimized floating indicator
  if (isGenerating && isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, y: 100 }}
        className="fixed bottom-24 right-4 z-50"
      >
        <div className="relative">
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(var(--primary-rgb), 0.4)",
                "0 0 0 15px rgba(var(--primary-rgb), 0)",
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-card border-2 border-primary shadow-xl flex items-center justify-center overflow-hidden"
          >
            <motion.img
              src={frigyMascot}
              alt="Frigy"
              className="w-12 h-12 object-contain"
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <motion.div
              className="w-2 h-2 bg-white rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isGenerating && !isMinimized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
        >
          {/* Minimize button */}
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}

          <div className="flex flex-col items-center gap-8 p-8 text-center max-w-sm">
            {/* Animated Frigy mascot */}
            <motion.div
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.img
                src={frigyMascot}
                alt="Frigy"
                className="w-28 h-28 object-contain drop-shadow-2xl"
                animate={{ rotate: [-3, 3, -3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl -z-10 scale-150" />
            </motion.div>

            {/* Animated text */}
            <div className="h-8">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTextIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg font-medium text-foreground"
                >
                  {funnyTexts[currentTextIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Clean progress dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                />
              ))}
            </div>

            {/* Time */}
            <p className="text-sm text-muted-foreground">
              {elapsedSeconds}s
            </p>

            {/* Minimize hint */}
            {onMinimize && (
              <p className="text-xs text-muted-foreground">
                Tippe X um im Hintergrund weiterzumachen
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
