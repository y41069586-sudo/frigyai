import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import frigyMascot from "@/assets/frigy-mascot.png";

interface MealPlanGeneratingOverlayProps {
  isGenerating: boolean;
  elapsedSeconds: number;
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
  "Frigy ist fast fertig... ⏳",
  "Noch ein bisschen Geduld... 🙏",
];

export const MealPlanGeneratingOverlay = ({ 
  isGenerating, 
  elapsedSeconds 
}: MealPlanGeneratingOverlayProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Change text every 3 seconds
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

  return (
    <AnimatePresence>
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
        >
          <div className="flex flex-col items-center gap-6 p-8 text-center">
            {/* Animated Frigy mascot */}
            <motion.div
              className="relative"
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Glow effect behind mascot */}
              <motion.div
                className="absolute inset-0 bg-primary/30 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Mascot image */}
              <motion.img
                src={frigyMascot}
                alt="Frigy"
                className="w-32 h-32 object-contain relative z-10"
                animate={{
                  rotate: [-5, 5, -5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Cooking steam effect */}
              <motion.div
                className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0.8, 0],
                  y: [0, -20, -40],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              >
                <span className="text-2xl">♨️</span>
              </motion.div>
            </motion.div>

            {/* Animated funny text */}
            <motion.div className="h-12 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTextIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="text-xl font-semibold text-foreground"
                >
                  {funnyTexts[currentTextIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {/* Loading bar */}
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Elapsed time */}
            <motion.p
              className="text-sm text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {elapsedSeconds}s vergangen...
            </motion.p>

            {/* Fun tip */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5 }}
              className="text-xs text-muted-foreground max-w-xs"
            >
              💡 Tipp: Die KI erstellt gerade einen personalisierten Plan basierend auf deinen Makro-Zielen!
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
