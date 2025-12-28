import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Camera, Utensils, ChefHat } from "lucide-react";

const HeroAnimationCompact = () => {
  const [step, setStep] = useState(1); // Start at step 1 immediately (fridge open)

  useEffect(() => {
    // Fast progression: 800ms between steps
    const timer1 = setTimeout(() => setStep(2), 800);
    const timer2 = setTimeout(() => setStep(3), 1600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const fridgeOpen = step >= 1;

  return (
    <div className="relative w-full max-w-xs mx-auto h-44">
      {/* Person/Stickfigure - LEFT SIDE - Compact */}
      <motion.div
        className="absolute left-[5%] top-1/2 -translate-y-1/2 scale-[0.55] origin-left"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Head */}
        <div className="w-10 h-10 bg-primary/30 rounded-full border-2 border-primary flex items-center justify-center relative">
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-foreground rounded-full" />
            <div className="w-1.5 h-1.5 bg-foreground rounded-full" />
          </div>
        </div>

        <div className="w-1 h-12 bg-primary/50 mx-auto rounded-full" />
        
        <div className="absolute top-10 left-1/2 -translate-x-1/2 flex">
          <motion.div
            className="w-7 h-1 bg-primary/50 rounded-full origin-right"
            animate={{ rotate: 50, x: 12 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="w-7 h-1 bg-primary/50 rounded-full origin-left"
            animate={{ rotate: -50, x: -12 }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1, x: 22, y: -16 }}
          transition={{ duration: 0.2 }}
          className="absolute top-8 right-0"
        >
          <div className="w-5 h-8 bg-card border-2 border-primary rounded-md flex items-center justify-center shadow-lg">
            <Camera className="w-2.5 h-2.5 text-primary" />
          </div>
        </motion.div>
      </motion.div>

      {/* FRIDGE - CENTER - Compact */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-32"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Fridge Interior */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-100 rounded-lg shadow-inner overflow-hidden">
          {/* Shelves */}
          <div className="absolute left-0 right-0 top-[25%] h-[1px] bg-slate-300" />
          <div className="absolute left-0 right-0 top-[50%] h-[1px] bg-slate-300" />
          <div className="absolute left-0 right-0 top-[75%] h-[1px] bg-slate-300" />
          
          {/* Food Items - Fast appearance */}
          <AnimatePresence>
            {fridgeOpen && (
              <>
                {/* Top Shelf */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.15 }}
                  className="absolute top-[4%] left-[10%] w-5 h-9 rounded-sm shadow-sm overflow-hidden"
                >
                  <div className="w-full h-full bg-white border border-slate-200">
                    <div className="w-full h-2 bg-blue-400 rounded-t-sm" />
                    <div className="flex justify-center mt-0.5">
                      <div className="w-2 h-3 bg-blue-100 rounded-sm" />
                    </div>
                  </div>
                </motion.div>
                
                {/* Orange juice */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.15 }}
                  className="absolute top-[5%] left-[40%] w-4 h-8 rounded-sm shadow-sm overflow-hidden"
                >
                  <div className="w-full h-full bg-orange-400">
                    <div className="w-full h-1.5 bg-orange-600 rounded-t-sm" />
                  </div>
                </motion.div>

                {/* Apple */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.15 }}
                  className="absolute top-[8%] right-[15%] w-4 h-4"
                >
                  <div className="w-full h-full bg-red-500 rounded-full shadow-sm" />
                </motion.div>

                {/* Second Shelf */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.15 }}
                  className="absolute top-[30%] left-[12%] w-3 h-6 bg-gradient-to-b from-orange-400 to-orange-500 rounded-b-full shadow-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.15 }}
                  className="absolute top-[32%] left-[35%] w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35, duration: 0.15 }}
                  className="absolute top-[30%] right-[15%] w-5 h-4 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-sm shadow-sm"
                />

                {/* Third Shelf */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.15 }}
                  className="absolute top-[55%] left-[10%] w-8 h-5 bg-primary/20 rounded border border-primary/40 shadow-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45, duration: 0.15 }}
                  className="absolute top-[56%] right-[15%] w-5 h-5 relative"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full absolute top-0 left-0" />
                  <div className="w-3 h-3 bg-green-500 rounded-full absolute top-0 right-0" />
                  <div className="w-2 h-2 bg-green-700 rounded-sm absolute bottom-0 left-1/2 -translate-x-1/2" />
                </motion.div>

                {/* Bottom Drawer */}
                <motion.div
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.15 }}
                  className="absolute bottom-[3%] left-[5%] right-[5%] h-6 bg-gradient-to-b from-green-50 to-green-100 rounded border border-slate-200 flex items-center justify-around px-1"
                >
                  <div className="w-3 h-3 bg-gradient-to-br from-green-300 to-green-500 rounded-full" />
                  <div className="w-2 h-4 bg-gradient-to-b from-red-400 to-red-600 rounded-b-full rounded-t-sm" />
                  <div className="w-2 h-4 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
                  <div className="w-3 h-2 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full" />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Scan beam - Fast */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div
              className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <motion.div
                className="absolute left-0 right-0 h-1.5 bg-gradient-to-b from-transparent via-primary to-transparent shadow-[0_0_15px_hsl(var(--primary))]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-primary/20"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fridge Door - Already open */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 rounded-lg border-2 border-slate-300 shadow-xl origin-right"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 100 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="absolute left-2 top-[45%] w-1.5 h-8 bg-slate-400 rounded-full shadow-inner" />
          <div className="absolute left-0 right-0 top-[25%] h-[2px] bg-slate-300" />
        </motion.div>
      </motion.div>

      {/* Recipe Cards - RIGHT SIDE - Compact */}
      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute right-[3%] top-[15%] flex flex-col gap-1.5 scale-[0.65] origin-right"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.15 }}
              className="w-20 p-1.5 bg-card border-2 border-primary/50 rounded-lg shadow-lg"
            >
              <div className="flex items-center gap-1 mb-0.5">
                <Utensils className="w-2.5 h-2.5 text-primary" />
                <span className="text-[8px] font-bold">Rezept 1</span>
              </div>
              <span className="text-[7px] text-primary font-semibold">350 kcal</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.15 }}
              className="w-20 p-1.5 bg-card border-2 border-primary/50 rounded-lg shadow-lg"
            >
              <div className="flex items-center gap-1 mb-0.5">
                <ChefHat className="w-2.5 h-2.5 text-primary" />
                <span className="text-[8px] font-bold">Rezept 2</span>
              </div>
              <span className="text-[7px] text-primary font-semibold">280 kcal</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Badge */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: "backOut" }}
            className="absolute left-[18%] bottom-[5%]"
          >
            <div className="flex items-center gap-1 bg-primary/20 px-2 py-1 rounded-full border border-primary/50 shadow-lg">
              <span className="text-xs font-bold text-primary">✓ Fertig!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroAnimationCompact;