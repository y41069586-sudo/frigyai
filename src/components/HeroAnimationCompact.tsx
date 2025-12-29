import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const HeroAnimationCompact = () => {
  const [phase, setPhase] = useState<"fridge" | "scanning" | "glow" | "recipes">("fridge");

  useEffect(() => {
    const runAnimation = async () => {
      setPhase("fridge");
      await new Promise(r => setTimeout(r, 800));
      setPhase("scanning");
      await new Promise(r => setTimeout(r, 1800));
      setPhase("glow");
      await new Promise(r => setTimeout(r, 600));
      setPhase("recipes");
      await new Promise(r => setTimeout(r, 3500));
    };
    
    runAnimation();
    const interval = setInterval(runAnimation, 7500);
    return () => clearInterval(interval);
  }, []);

  const recipes = [
    { title: "Tomaten-Pasta", time: "15 Min", ingredients: ["🍝", "🍅", "🧀"] },
    { title: "Gemüse-Bowl", time: "10 Min", ingredients: ["🥬", "🥕", "🥚"] },
    { title: "Frucht-Smoothie", time: "5 Min", ingredients: ["🍎", "🫐", "🥛"] },
  ];

  const showFridge = phase === "fridge" || phase === "scanning" || phase === "glow";

  return (
    <div className="h-full min-h-[300px] bg-gradient-to-b from-slate-50 to-slate-100/50 flex items-center justify-center rounded-2xl overflow-hidden relative">
      
      <AnimatePresence mode="wait">
        {/* Fridge Phase */}
        {showFridge && (
          <motion.div
            key="fridge"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative"
          >
            {/* Glow Effect */}
            <motion.div
              animate={{
                opacity: phase === "glow" ? 0.7 : 0,
                scale: phase === "glow" ? 1.15 : 1,
              }}
              transition={{ duration: 0.4 }}
              className="absolute -inset-6 bg-primary/25 rounded-3xl blur-2xl"
            />

            {/* Fridge Body */}
            <div className="w-32 h-48 bg-white rounded-2xl shadow-lg relative overflow-hidden border border-slate-200/60">
              
              {/* Freezer Section */}
              <div className="h-12 border-b border-slate-100 p-2 flex items-center justify-center gap-2">
                <span className="text-sm">🧊</span>
                <span className="text-sm">🍦</span>
              </div>
              
              {/* Main Section with Food */}
              <div className="p-2">
                {/* Shelf 1 */}
                <div className="flex justify-around mb-1.5 pb-1.5 border-b border-slate-100/60">
                  <span className="text-base">🥛</span>
                  <span className="text-base">🧀</span>
                  <span className="text-base">🧈</span>
                </div>
                {/* Shelf 2 */}
                <div className="flex justify-around mb-1.5 pb-1.5 border-b border-slate-100/60">
                  <span className="text-base">🥚</span>
                  <span className="text-base">🍅</span>
                  <span className="text-base">🥕</span>
                </div>
                {/* Shelf 3 */}
                <div className="flex justify-around">
                  <span className="text-base">🥬</span>
                  <span className="text-base">🍎</span>
                  <span className="text-base">🫐</span>
                </div>
              </div>

              {/* Scan Line */}
              {phase === "scanning" && (
                <motion.div
                  initial={{ top: 0 }}
                  animate={{ top: "100%" }}
                  transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-b from-primary/80 to-primary/20 shadow-[0_0_16px_4px] shadow-primary/40"
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Recipe Cards Phase */}
        {phase === "recipes" && (
          <motion.div
            key="recipes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-3 w-full max-w-[200px] px-4"
          >
            {recipes.map((recipe, i) => (
              <motion.div
                key={recipe.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: i * 0.2, 
                  duration: 0.5, 
                  ease: [0.25, 0.1, 0.25, 1] 
                }}
                className="bg-white rounded-xl p-3 shadow-md border border-slate-100"
              >
                {/* Title */}
                <h4 className="text-sm font-semibold text-slate-800 mb-2">
                  {recipe.title}
                </h4>
                
                {/* Ingredients & Time */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {recipe.ingredients.map((ing, j) => (
                      <span key={j} className="text-sm">{ing}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{recipe.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroAnimationCompact;
