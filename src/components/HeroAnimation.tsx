import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Camera, HelpCircle, Utensils, Scale, ChefHat, Apple, Carrot, Egg } from "lucide-react";

const HeroAnimation = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const fridgeOpen = step >= 1;

  return (
    <div className="relative w-full max-w-md mx-auto h-80 md:h-96">
      {/* Fridge Body */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-52 md:w-44 md:h-60"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Fridge back/interior */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-xl border-4 border-border shadow-xl overflow-hidden">
          {/* Fridge shelves */}
          <div className="absolute left-0 right-0 top-[35%] h-0.5 bg-border/50" />
          <div className="absolute left-0 right-0 top-[65%] h-0.5 bg-border/50" />
          
          {/* Food items inside - always visible but revealed when door opens */}
          <AnimatePresence>
            {fridgeOpen && (
              <>
                {/* Top shelf - milk, juice */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-2 left-3 w-5 h-10 bg-white dark:bg-slate-300 rounded-sm border border-border/30"
                >
                  <div className="w-full h-2 bg-blue-400 rounded-t-sm" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute top-3 left-10 w-4 h-8 bg-orange-400 rounded-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-2 right-3"
                >
                  <Egg className="w-5 h-5 text-amber-100 fill-amber-50" />
                </motion.div>
                
                {/* Middle shelf - vegetables */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-[38%] left-3"
                >
                  <Carrot className="w-6 h-6 text-orange-500" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute top-[40%] left-10 w-5 h-5 bg-green-500 rounded-full"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute top-[38%] right-3"
                >
                  <Apple className="w-6 h-6 text-red-500" />
                </motion.div>
                
                {/* Bottom shelf - containers */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute top-[68%] left-3 w-8 h-6 bg-primary/30 rounded border border-primary/50"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute top-[70%] right-4 w-6 h-5 bg-yellow-400/80 rounded-sm"
                />
                
                {/* Bottom drawer */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="absolute bottom-2 left-2 right-2 h-8 bg-green-100 dark:bg-green-900/50 rounded border border-border/30 flex items-center justify-center gap-1 px-1"
                >
                  <div className="w-3 h-3 bg-green-600 rounded-full" />
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Fridge Door */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-muted to-muted/90 rounded-xl border-4 border-border shadow-lg origin-left"
          style={{ transformStyle: "preserve-3d" }}
          animate={{
            rotateY: fridgeOpen ? -110 : 0,
            x: fridgeOpen ? -10 : 0,
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Door handle */}
          <div className="absolute right-2 top-[40%] w-1.5 h-10 bg-border rounded-full" />
          
          {/* Door line (freezer separator) */}
          <div className="absolute left-0 right-0 top-[30%] h-1 bg-border" />
          
          {/* Door shelves (inside of door - visible when open) */}
          <motion.div
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{ 
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-muted/95 to-muted/80" />
            <div className="absolute top-[35%] left-1 right-1 h-6 bg-background/50 rounded flex items-center justify-around px-1">
              <div className="w-3 h-4 bg-red-400 rounded-sm" />
              <div className="w-3 h-4 bg-yellow-400 rounded-sm" />
              <div className="w-3 h-4 bg-green-400 rounded-sm" />
            </div>
          </motion.div>
        </motion.div>
        
        {/* Freezer Door (top section) */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-muted to-muted/90 rounded-t-xl border-4 border-border border-b-0 shadow-lg origin-left"
          animate={{
            rotateY: fridgeOpen ? -100 : 0,
            x: fridgeOpen ? -8 : 0,
          }}
          transition={{ duration: 0.5, ease: "easeInOut", delay: 0.1 }}
        >
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-border rounded-full" />
        </motion.div>
      </motion.div>

      {/* Person/Stickfigure */}
      <motion.div
        className="absolute left-[15%] top-1/2 -translate-y-1/2"
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
            animate={step >= 1 ? { rotate: 45, x: 20 } : { rotate: -30 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="w-10 h-1.5 bg-primary/50 rounded-full origin-left"
            animate={step >= 1 ? { rotate: -45, x: -20 } : { rotate: 30 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Phone/Camera in hand (step 1+) */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, x: 35, y: -20 }}
              className="absolute top-12 right-0"
            >
              <div className="w-8 h-12 bg-card border-2 border-primary rounded-lg flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4 text-primary" />
              </div>
              {/* Scan lines */}
              {step === 1 && (
                <>
                  <motion.div
                    className="absolute -right-20 top-1/2 w-20 h-0.5 bg-gradient-to-r from-primary to-transparent"
                    animate={{ opacity: [1, 0.3, 1], scaleX: [1, 1.1, 1] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -right-16 top-1 w-16 h-0.5 bg-gradient-to-r from-primary/60 to-transparent"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
                  />
                  <motion.div
                    className="absolute -right-18 bottom-1 w-18 h-0.5 bg-gradient-to-r from-primary/60 to-transparent"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.3, repeat: Infinity, delay: 0.2 }}
                  />
                </>
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
              className="absolute left-[8%] top-[20%]"
            >
              <HelpCircle className="w-8 h-8 text-primary/60" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.7 }}
              className="absolute left-[3%] top-[35%]"
            >
              <HelpCircle className="w-6 h-6 text-primary/40" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.9 }}
              className="absolute left-[12%] top-[12%]"
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
            className="absolute right-[3%] top-[12%] flex flex-col gap-2"
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
              <div className="text-[7px] text-primary font-medium">350 kcal</div>
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
              <div className="text-[7px] text-primary font-medium">280 kcal</div>
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
            className="absolute right-[8%] bottom-[15%]"
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
