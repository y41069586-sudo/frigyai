import { motion, AnimatePresence } from "framer-motion";
import { Check, Calendar, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { confettiBurst } from "@/lib/mobileEffects";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useLanguage } from "@/contexts/LanguageContext";

interface MealPlanSuccessOverlayProps {
  isVisible: boolean;
  recipeName: string;
  mealType: string;
  dayLabel: string;
  onComplete: () => void;
}

const MealPlanSuccessOverlay = ({
  isVisible,
  recipeName,
  mealType,
  dayLabel,
  onComplete,
}: MealPlanSuccessOverlayProps) => {
  const { playGoalReached } = useSoundEffects();
  const { language } = useLanguage();
  const copy = language === "fr"
    ? {
        perfect: "Parfait !",
        replaced: "Plat remplace",
        updated: "Ton plan hebdomadaire a ete mis a jour",
      }
    : language === "en"
      ? {
          perfect: "Perfect!",
          replaced: "Meal replaced",
          updated: "Your weekly plan has been updated",
        }
      : {
          perfect: "Perfekt!",
          replaced: "Gericht ersetzt",
          updated: "Dein Wochenplan wurde aktualisiert",
        };

  useEffect(() => {
    if (isVisible) {
      // Play success sound
      playGoalReached();

      const colors = ["#22c55e", "#4ade80", "#86efac", "#bbf7d0"];
      confettiBurst({ particleCount: 80, spread: 70, origin: { y: 0.65 }, colors });

      // Auto-close after animation
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete, playGoalReached]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="relative mx-4 max-w-sm w-full"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full" />
            
            {/* Main card */}
            <div className="relative bg-card border border-primary/30 rounded-3xl p-8 shadow-2xl">
              {/* Success icon with animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 10 }}
                className="relative mx-auto w-20 h-20 mb-6"
              >
                {/* Animated rings */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-primary/30"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 rounded-full bg-primary/40"
                />
                
                {/* Check circle */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: "spring", damping: 10 }}
                  >
                    <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-4"
              >
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {copy.perfect}
                  <Sparkles className="h-5 w-5 text-primary" />
                </h2>
                <p className="text-lg text-foreground font-medium">
                  {copy.replaced}
                </p>
              </motion.div>

              {/* Recipe info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-muted/50 rounded-2xl p-4 mb-4"
              >
                <p className="text-center font-semibold text-foreground mb-2 line-clamp-2">
                  {recipeName}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{mealType}</span>
                  <span>•</span>
                  <span className="capitalize">{dayLabel}</span>
                </div>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-sm text-muted-foreground"
              >
                {copy.updated}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MealPlanSuccessOverlay;
