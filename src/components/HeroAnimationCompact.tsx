import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Camera, Utensils, ChefHat } from "lucide-react";

const HeroAnimationCompact = () => {
  const [step, setStep] = useState(1); // Start at step 1 immediately (fridge open)

  useEffect(() => {
    // Fast progression: 600ms between steps
    const timer1 = setTimeout(() => setStep(2), 600);
    const timer2 = setTimeout(() => setStep(3), 1200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="relative w-full h-36 flex items-center justify-center">
      {/* Person/Stickfigure - LEFT */}
      <motion.div
        className="absolute left-[8%] top-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="relative scale-[0.5] origin-center">
          {/* Head */}
          <div className="w-8 h-8 bg-primary/30 rounded-full border-2 border-primary flex items-center justify-center">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-foreground rounded-full" />
              <div className="w-1 h-1 bg-foreground rounded-full" />
            </div>
          </div>
          {/* Body */}
          <div className="w-0.5 h-10 bg-primary/50 mx-auto rounded-full" />
          {/* Arms holding phone */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex">
            <motion.div
              className="w-6 h-0.5 bg-primary/50 rounded-full origin-right"
              animate={{ rotate: 45, x: 10 }}
              transition={{ duration: 0.15 }}
            />
            <motion.div
              className="w-6 h-0.5 bg-primary/50 rounded-full origin-left"
              animate={{ rotate: -45, x: -10 }}
              transition={{ duration: 0.15 }}
            />
          </div>
          {/* Phone */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="absolute top-6 left-1/2 -translate-x-1/2"
          >
            <div className="w-4 h-6 bg-card border border-primary rounded flex items-center justify-center shadow">
              <Camera className="w-2 h-2 text-primary" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* FRIDGE - CENTER */}
      <motion.div
        className="relative w-20 h-28"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
      >
        {/* Fridge Interior */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-100 rounded-lg shadow-inner overflow-hidden">
          {/* Shelves */}
          <div className="absolute left-0 right-0 top-[25%] h-px bg-slate-200" />
          <div className="absolute left-0 right-0 top-[50%] h-px bg-slate-200" />
          <div className="absolute left-0 right-0 top-[75%] h-px bg-slate-200" />
          
          {/* Food Items - All visible immediately */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="absolute inset-1 grid grid-cols-3 gap-0.5 p-1"
          >
            {/* Top row */}
            <div className="w-4 h-6 bg-white border border-slate-200 rounded-sm mx-auto">
              <div className="w-full h-1.5 bg-blue-400 rounded-t-sm" />
            </div>
            <div className="w-3 h-5 bg-orange-400 rounded-sm mx-auto" />
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mt-1" />
            
            {/* Middle row */}
            <div className="w-2 h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-b-full mx-auto" />
            <div className="w-3 h-3 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto" />
            <div className="w-4 h-3 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-sm mx-auto" />
            
            {/* Bottom row */}
            <div className="w-5 h-3 bg-primary/20 rounded border border-primary/30 mx-auto" />
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto" />
            <div className="w-3 h-3 bg-green-400 rounded-full mx-auto" />
          </motion.div>
        </div>

        {/* Scan beam */}
        {step === 1 && (
          <motion.div
            className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-primary to-transparent shadow-[0_0_10px_hsl(var(--primary))]"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}

        {/* Fridge Door - Already open */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 rounded-lg border border-slate-300 shadow-lg origin-right"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="absolute left-1.5 top-[45%] w-1 h-6 bg-slate-400 rounded-full" />
          <div className="absolute left-0 right-0 top-[25%] h-px bg-slate-300" />
        </motion.div>
      </motion.div>

      {/* Recipe Cards - RIGHT */}
      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute right-[8%] top-1/2 -translate-y-1/2 flex flex-col gap-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="w-16 p-1.5 bg-card border border-primary/50 rounded-lg shadow"
            >
              <div className="flex items-center gap-1">
                <Utensils className="w-2.5 h-2.5 text-primary" />
                <span className="text-[7px] font-bold">Rezept 1</span>
              </div>
              <span className="text-[6px] text-primary font-semibold">350 kcal</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-16 p-1.5 bg-card border border-primary/50 rounded-lg shadow"
            >
              <div className="flex items-center gap-1">
                <ChefHat className="w-2.5 h-2.5 text-primary" />
                <span className="text-[7px] font-bold">Rezept 2</span>
              </div>
              <span className="text-[6px] text-primary font-semibold">280 kcal</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Badge - Bottom center */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "backOut" }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
          >
            <div className="flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded-full border border-primary/50 shadow">
              <span className="text-[10px] font-bold text-primary">✓ Fertig!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroAnimationCompact;