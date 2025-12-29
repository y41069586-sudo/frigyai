import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const HeroAnimationCompact = () => {
  const [phase, setPhase] = useState<"idle" | "scan" | "recipes">("idle");

  useEffect(() => {
    const cycle = async () => {
      setPhase("idle");
      await new Promise(r => setTimeout(r, 1000));
      setPhase("scan");
      await new Promise(r => setTimeout(r, 2000));
      setPhase("recipes");
      await new Promise(r => setTimeout(r, 2500));
    };
    
    cycle();
    const interval = setInterval(cycle, 6000);
    return () => clearInterval(interval);
  }, []);

  const recipes = [
    { name: "Pasta", emoji: "🍝" },
    { name: "Salat", emoji: "🥗" },
    { name: "Smoothie", emoji: "🥤" },
  ];

  return (
    <div className="h-full min-h-[280px] bg-gradient-to-b from-background to-muted/20 flex items-center justify-center rounded-2xl overflow-hidden relative">
      
      {/* Soft Glow */}
      <motion.div
        animate={{
          opacity: phase === "scan" ? 0.5 : 0.15,
        }}
        transition={{ duration: 0.4 }}
        className="absolute w-56 h-56 bg-primary/20 rounded-full blur-3xl"
      />

      <div className="relative z-10 flex items-center gap-6">
        
        {/* Fridge */}
        <motion.div
          animate={{ 
            scale: phase === "scan" ? 1.02 : 1,
            x: phase === "recipes" ? -20 : 0,
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative"
        >
          {/* Fridge Body */}
          <div className="w-28 h-40 bg-gradient-to-b from-white to-slate-50 dark:from-slate-100 dark:to-slate-200 rounded-2xl shadow-xl relative overflow-hidden">
            
            {/* Subtle Shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent rounded-2xl" />
            
            {/* Freezer */}
            <div className="h-12 border-b border-slate-200/80 p-2 flex items-center justify-center">
              <div className="text-lg">🧊</div>
            </div>
            
            {/* Main Section with Food */}
            <div className="p-2 grid grid-cols-3 gap-1">
              <div className="text-base text-center">🥛</div>
              <div className="text-base text-center">🧀</div>
              <div className="text-base text-center">🥚</div>
              <div className="text-base text-center">🥕</div>
              <div className="text-base text-center">🍅</div>
              <div className="text-base text-center">🥬</div>
              <div className="text-base text-center">🍎</div>
              <div className="text-base text-center">🧈</div>
              <div className="text-base text-center">🫐</div>
            </div>

            {/* Scan Line */}
            <AnimatePresence>
              {phase === "scan" && (
                <motion.div
                  initial={{ top: 0, opacity: 0 }}
                  animate={{ top: "100%", opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_3px] shadow-primary/60"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Scan Frame */}
          <AnimatePresence>
            {phase === "scan" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute -inset-2 pointer-events-none"
              >
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary rounded-tl" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary rounded-tr" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary rounded-bl" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary rounded-br" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Recipe Cards */}
        <AnimatePresence>
          {phase === "recipes" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-2"
            >
              {recipes.map((recipe, i) => (
                <motion.div
                  key={recipe.name}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: i * 0.12, duration: 0.3 }}
                  className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-border/50"
                >
                  <span className="text-lg">{recipe.emoji}</span>
                  <span className="text-xs font-medium text-foreground">{recipe.name}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <motion.div
          animate={{ opacity: phase === "idle" ? 0.5 : 1 }}
          className="flex items-center gap-1.5"
        >
          <motion.div
            animate={{
              scale: phase === "scan" ? [1, 1.3, 1] : 1,
              backgroundColor: phase === "recipes" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            }}
            transition={{ duration: 0.5, repeat: phase === "scan" ? Infinity : 0 }}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
          />
          <span className="text-[10px] text-muted-foreground font-medium">
            {phase === "idle" && "Bereit"}
            {phase === "scan" && "Scanne..."}
            {phase === "recipes" && "3 Rezepte gefunden"}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroAnimationCompact;
