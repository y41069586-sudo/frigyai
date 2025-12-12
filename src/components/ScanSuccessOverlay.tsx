import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame } from 'lucide-react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ScanSuccessOverlayProps {
  isVisible: boolean;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  onComplete: () => void;
}

export const ScanSuccessOverlay = ({
  isVisible,
  foodName,
  calories,
  protein,
  carbs,
  fat,
  onComplete,
}: ScanSuccessOverlayProps) => {
  useEffect(() => {
    if (isVisible) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#4ade80', '#86efac', '#ffffff'],
      });

      // Auto-close after animation
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onComplete}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="relative mx-4 p-6 rounded-3xl bg-gradient-to-b from-card to-card/90 border border-primary/30"
            style={{
              boxShadow: '0 0 60px rgba(34, 197, 94, 0.4), 0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              className="flex justify-center mb-4"
            >
              <div
                className="p-4 rounded-full bg-primary/20"
                style={{ boxShadow: '0 0 30px rgba(34, 197, 94, 0.6)' }}
              >
                <motion.div
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Check className="h-10 w-10 text-primary" strokeWidth={3} />
                </motion.div>
              </div>
            </motion.div>

            {/* Food Name */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold text-center text-foreground mb-2"
            >
              {foodName}
            </motion.h2>

            {/* Erkannt text */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-primary text-center mb-4"
              style={{ textShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
            >
              Erfolgreich erkannt!
            </motion.p>

            {/* Calories */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <Flame className="h-6 w-6 text-orange-400" />
              <span className="text-3xl font-bold text-foreground">{calories}</span>
              <span className="text-muted-foreground">kcal</span>
            </motion.div>

            {/* Macros Grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-3 gap-3"
            >
              <div className="text-center p-3 bg-background/50 rounded-xl">
                <p className="text-lg font-bold text-red-400">{protein}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-xl">
                <p className="text-lg font-bold text-amber-400">{carbs}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-xl">
                <p className="text-lg font-bold text-blue-400">{fat}g</p>
                <p className="text-xs text-muted-foreground">Fett</p>
              </div>
            </motion.div>

            {/* Tap to continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 1.5, duration: 1.5, repeat: Infinity }}
              className="text-xs text-muted-foreground text-center mt-4"
            >
              Tippen zum Schließen
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
