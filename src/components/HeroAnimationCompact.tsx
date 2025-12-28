import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, ChefHat, Utensils } from "lucide-react";

const HeroAnimationCompact = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 300);
    const timer2 = setTimeout(() => setStep(2), 600);
    const timer3 = setTimeout(() => setStep(3), 900);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="relative w-full h-44 flex items-center justify-center">
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Main Container - horizontal flow */}
      <div className="relative flex items-center justify-center gap-3 px-4">
        
        {/* Open Fridge (no door) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <div className="w-20 h-28 rounded-xl bg-gradient-to-b from-white to-slate-100 dark:from-slate-200 dark:to-slate-300 shadow-lg relative overflow-hidden border border-slate-200 dark:border-slate-400">
            {/* Shelves */}
            <div className="absolute left-0 right-0 top-[28%] h-px bg-slate-300" />
            <div className="absolute left-0 right-0 top-[56%] h-px bg-slate-300" />
            <div className="absolute left-0 right-0 top-[84%] h-px bg-slate-300" />
            
            {/* Food items grid */}
            <div className="absolute inset-1.5 grid grid-cols-3 gap-1 p-1">
              {/* Row 1 */}
              <div className="w-4 h-5 bg-white border border-slate-200 rounded-sm mx-auto">
                <div className="w-full h-1.5 bg-blue-400 rounded-t-sm" />
              </div>
              <div className="w-3.5 h-5 bg-orange-400 rounded-sm mx-auto" />
              <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mt-1" />
              
              {/* Row 2 */}
              <div className="w-3 h-4 bg-gradient-to-b from-orange-300 to-orange-500 rounded-b-full mx-auto" />
              <div className="w-3.5 h-3.5 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto" />
              <div className="w-4 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm mx-auto" />
              
              {/* Row 3 */}
              <div className="w-5 h-3 bg-green-100 border border-green-300 rounded mx-auto flex items-center justify-center">
                <div className="w-3 h-1.5 bg-green-500 rounded-sm" />
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto" />
              <div className="w-3 h-3 bg-purple-400 rounded-full mx-auto" />
            </div>

            {/* Scan beam effect */}
            {step >= 1 && step < 3 && (
              <motion.div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-primary to-transparent shadow-[0_0_12px_hsl(var(--primary))]"
                  animate={{ top: ['5%', '95%', '5%'] }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            )}

            {/* Glow when scanning */}
            {step >= 1 && (
              <motion.div
                className="absolute inset-0 rounded-xl ring-2 ring-primary/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          
          {/* Label */}
          <motion.span
            className="block text-center text-[9px] font-medium text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Kühlschrank
          </motion.span>
        </motion.div>

        {/* Arrow/Flow indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: step >= 1 ? 1 : 0, scale: step >= 1 ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-1"
        >
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="flex items-center"
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: step >= 2 ? 20 : 0 }}
            className="h-0.5 bg-gradient-to-r from-primary to-primary/30 rounded-full"
          />
          <span className="text-[8px] text-primary font-medium">AI</span>
        </motion.div>

        {/* Recipe Cards Stack */}
        <motion.div
          initial={{ opacity: 0, x: 15, scale: 0.9 }}
          animate={{ 
            opacity: step >= 2 ? 1 : 0, 
            x: step >= 2 ? 0 : 15,
            scale: step >= 2 ? 1 : 0.9
          }}
          transition={{ duration: 0.25, type: "spring", stiffness: 200 }}
          className="relative"
        >
          {/* Background card */}
          <motion.div
            className="absolute top-1 left-1 w-20 h-24 bg-card/50 border border-border/50 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 2 ? 0.5 : 0 }}
          />
          
          {/* Main recipe card */}
          <div className="relative w-20 p-2.5 bg-card border-2 border-primary/40 rounded-xl shadow-lg">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                <ChefHat className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[9px] font-bold">Rezept</span>
            </div>
            
            {/* Placeholder lines */}
            <div className="space-y-1 mb-2">
              <div className="h-1 bg-muted rounded-full w-full" />
              <div className="h-1 bg-muted rounded-full w-4/5" />
              <div className="h-1 bg-muted rounded-full w-3/5" />
            </div>
            
            {/* Macros */}
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-primary font-bold">380 kcal</span>
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              </div>
            </div>
            
            {/* Success badge */}
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="text-[10px] text-primary-foreground font-bold">✓</span>
              </motion.div>
            )}
          </div>
          
          {/* Second recipe peek */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: step >= 3 ? 1 : 0, y: step >= 3 ? 0 : 5 }}
            className="mt-1.5 w-20 p-1.5 bg-card border border-border rounded-lg"
          >
            <div className="flex items-center gap-1">
              <Utensils className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[8px] text-muted-foreground">+2 mehr</span>
            </div>
          </motion.div>
          
          {/* Label */}
          <motion.span
            className="block text-center text-[9px] font-medium text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 2 ? 1 : 0 }}
            transition={{ delay: 0.1 }}
          >
            Rezepte
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroAnimationCompact;
