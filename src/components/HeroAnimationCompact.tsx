import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Scan, Sparkles, ChefHat } from "lucide-react";

const HeroAnimationCompact = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setStep(1), 400);
    const timer2 = setTimeout(() => setStep(2), 800);
    const timer3 = setTimeout(() => setStep(3), 1200);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Main Container */}
      <div className="relative flex items-center gap-4">
        {/* Fridge Icon */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 shadow-lg relative overflow-hidden">
            {/* Fridge handle */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-slate-400 dark:bg-slate-500 rounded-full" />
            {/* Fridge line */}
            <div className="absolute left-0 right-0 top-[35%] h-px bg-slate-400/50" />
            
            {/* Food items inside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: step >= 1 ? 1 : 0 }}
              className="absolute inset-2 grid grid-cols-2 gap-1 pt-1"
            >
              <div className="w-4 h-3 bg-orange-400 rounded-sm mx-auto" />
              <div className="w-3 h-3 bg-red-400 rounded-full mx-auto" />
              <div className="w-4 h-3 bg-green-400 rounded-sm mx-auto" />
              <div className="w-3 h-3 bg-yellow-400 rounded-full mx-auto" />
            </motion.div>

            {/* Scan effect */}
            {step >= 1 && step < 3 && (
              <motion.div
                className="absolute inset-0 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Arrow with particles */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: step >= 1 ? 1 : 0, scale: step >= 1 ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <Scan className="w-5 h-5 text-primary" />
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: step >= 2 ? 24 : 0 }}
              className="h-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: step >= 2 ? 1 : 0, scale: step >= 2 ? 1 : 0 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
          </div>
        </motion.div>

        {/* Recipe Card */}
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ 
            opacity: step >= 2 ? 1 : 0, 
            x: step >= 2 ? 0 : 20,
            scale: step >= 2 ? 1 : 0.8
          }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          className="relative"
        >
          <div className="w-20 p-2 bg-card border border-primary/30 rounded-xl shadow-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <ChefHat className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] font-bold truncate">Rezept</span>
            </div>
            <div className="space-y-1">
              <div className="h-1 bg-muted rounded-full w-full" />
              <div className="h-1 bg-muted rounded-full w-3/4" />
            </div>
            <div className="mt-1.5 text-[8px] text-primary font-semibold">
              320 kcal
            </div>
          </div>
          
          {/* Success check */}
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="text-[10px] text-primary-foreground">✓</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: step >= 3 ? 1 : 0, y: step >= 3 ? 0 : 10 }}
        className="absolute bottom-1 left-1/2 -translate-x-1/2"
      >
        <span className="text-[10px] font-medium text-primary/80">
          Scan → Rezepte
        </span>
      </motion.div>
    </div>
  );
};

export default HeroAnimationCompact;
