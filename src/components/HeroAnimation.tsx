import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Camera, HelpCircle, Utensils, Scale, ChefHat } from "lucide-react";

const HeroAnimation = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto h-80 md:h-96">
      {/* Fridge */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-48 md:w-40 md:h-56 bg-gradient-to-b from-muted to-muted/80 rounded-xl border-4 border-border shadow-xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Fridge handle */}
        <div className="absolute right-2 top-1/3 w-1.5 h-12 bg-border rounded-full" />
        {/* Fridge line */}
        <div className="absolute left-0 right-0 top-1/3 h-1 bg-border" />
        
        {/* Food items inside (visible after scan) */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-2 top-[40%] flex flex-wrap gap-1 p-2"
            >
              <div className="w-4 h-4 bg-primary/60 rounded" />
              <div className="w-3 h-5 bg-primary/40 rounded" />
              <div className="w-5 h-3 bg-primary/50 rounded" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Person/Stickfigure */}
      <motion.div
        className="absolute left-[20%] top-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Head */}
        <motion.div
          className="w-12 h-12 md:w-14 md:h-14 bg-primary/30 rounded-full border-3 border-primary flex items-center justify-center relative"
          animate={step === 0 ? { rotate: [0, -10, 10, -5, 0] } : {}}
          transition={{ duration: 1, repeat: step === 0 ? Infinity : 0, repeatDelay: 0.5 }}
        >
          {/* Eyes */}
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-foreground rounded-full" />
            <div className="w-2 h-2 bg-foreground rounded-full" />
          </div>
          
          {/* Scratching hand (step 0) */}
          <AnimatePresence>
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, rotate: [0, 15, -15, 10, 0] }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { duration: 0.8, repeat: Infinity } }}
                className="absolute -top-3 -right-2 w-6 h-6 bg-primary/40 rounded-full"
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Body */}
        <div className="w-1.5 h-16 md:h-20 bg-primary/50 mx-auto rounded-full" />
        
        {/* Arms */}
        <div className="absolute top-14 md:top-16 left-1/2 -translate-x-1/2 flex">
          <motion.div
            className="w-10 h-1.5 bg-primary/50 rounded-full origin-right"
            animate={step === 1 ? { rotate: 45, x: 20 } : { rotate: -30 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="w-10 h-1.5 bg-primary/50 rounded-full origin-left"
            animate={step === 1 ? { rotate: -45, x: -20 } : { rotate: 30 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Phone/Camera in hand (step 1) */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, x: 30, y: -20 }}
              className="absolute top-12 right-0"
            >
              <div className="w-8 h-12 bg-card border-2 border-primary rounded-lg flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary" />
              </div>
              {/* Scan lines */}
              {step === 1 && (
                <motion.div
                  className="absolute -right-16 top-1/2 w-16 h-0.5 bg-primary"
                  animate={{ opacity: [1, 0.3, 1], scaleX: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Question marks (step 0) */}
      <AnimatePresence>
        {step === 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute left-[10%] top-[20%]"
            >
              <HelpCircle className="w-8 h-8 text-primary/60" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.7 }}
              className="absolute left-[5%] top-[35%]"
            >
              <HelpCircle className="w-6 h-6 text-primary/40" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.9 }}
              className="absolute left-[15%] top-[15%]"
            >
              <HelpCircle className="w-5 h-5 text-primary/50" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Recipe cards appearing (step 2-3) */}
      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: 100, rotate: 10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            className="absolute right-[5%] top-[15%] flex flex-col gap-2"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-20 md:w-24 h-14 md:h-16 bg-card border-2 border-primary/50 rounded-lg p-2 shadow-lg"
            >
              <div className="flex items-center gap-1 mb-1">
                <Utensils className="w-3 h-3 text-primary" />
                <div className="text-[8px] font-bold text-foreground">Rezept 1</div>
              </div>
              <div className="text-[7px] text-primary">350 kcal</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-20 md:w-24 h-14 md:h-16 bg-card border-2 border-primary/50 rounded-lg p-2 shadow-lg"
            >
              <div className="flex items-center gap-1 mb-1">
                <ChefHat className="w-3 h-3 text-primary" />
                <div className="text-[8px] font-bold text-foreground">Rezept 2</div>
              </div>
              <div className="text-[7px] text-primary">280 kcal</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scale icon for weight loss (step 3) */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-[10%] bottom-[10%]"
          >
            <div className="flex items-center gap-2 bg-primary/20 px-3 py-2 rounded-full border border-primary/50">
              <Scale className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-primary">-3kg</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicator text */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 text-center"
      >
        <p className="text-sm text-muted-foreground">
          {step === 0 && "Was soll ich heute kochen...? 🤔"}
          {step === 1 && "Kühlschrank scannen! 📸"}
          {step === 2 && "Abnehm-Rezepte erhalten! 🥗"}
          {step === 3 && "Leichter abnehmen! 💪"}
        </p>
      </motion.div>
    </div>
  );
};

export default HeroAnimation;
