import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const HeroAnimationCompact = () => {
  const [open, setOpen] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);

  useEffect(() => {
    // Auto-open after delay
    const openTimer = setTimeout(() => setOpen(true), 800);
    // Show recipe after door opens
    const recipeTimer = setTimeout(() => setShowRecipe(true), 2000);
    
    return () => {
      clearTimeout(openTimer);
      clearTimeout(recipeTimer);
    };
  }, []);

  return (
    <div className="relative w-full h-56 flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-background to-muted/30 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Main Scene Container */}
      <div className="relative flex items-end justify-center gap-4 px-4">
        
        {/* Frigy Character with Fridge */}
        <div className="relative w-[180px] h-[220px]">
          
          {/* FRIGY HEAD */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-[80px] rounded-full z-[3]"
            style={{ background: "hsl(var(--primary))" }}
          >
            {/* Eyes */}
            <motion.div 
              className="absolute w-2 h-2 rounded-full bg-primary-foreground"
              style={{ top: 28, left: 22 }}
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1.5 }}
            />
            <motion.div 
              className="absolute w-2 h-2 rounded-full bg-primary-foreground"
              style={{ top: 28, right: 22 }}
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1.5 }}
            />
            {/* Smile - grows when open */}
            <motion.div
              animate={{ 
                scaleX: open ? 1.2 : 0.8,
                scaleY: open ? 1 : 0.6
              }}
              transition={{ duration: 0.4 }}
              className="absolute w-6 h-3 border-b-2 border-primary-foreground rounded-b-full"
              style={{ bottom: 20, left: '50%', transform: 'translateX(-50%)' }}
            />
          </motion.div>

          {/* ARM - attached to body, reaches for handle */}
          <motion.div
            initial={{ rotate: 20, x: -45 }}
            animate={{
              rotate: open ? -30 : 20,
              x: open ? -30 : -45,
              y: open ? 15 : 0,
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute z-[2]"
            style={{
              top: 82,
              left: '50%',
              transformOrigin: "top center",
            }}
          >
            {/* Upper arm */}
            <div 
              className="w-[14px] h-[55px] rounded-xl"
              style={{ background: "hsl(var(--primary))" }}
            />
            {/* Hand */}
            <motion.div
              animate={{ rotate: open ? 25 : 0 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full"
              style={{ background: "hsl(var(--primary))" }}
            />
          </motion.div>

          {/* FRIDGE BODY */}
          <div
            className="absolute bottom-0 w-full h-[140px] rounded-2xl overflow-hidden border-2 border-primary/20"
            style={{ background: "hsl(var(--muted))" }}
          >
            {/* Interior shelves (visible when door opens) */}
            <div className="absolute inset-0 p-2 flex flex-col justify-around">
              <div className="h-[1px] bg-border rounded mt-4" />
              <div className="h-[1px] bg-border rounded" />
              <div className="h-[1px] bg-border rounded mb-4" />
            </div>

            {/* Food items inside */}
            <motion.div 
              className="absolute inset-0 p-3 flex flex-wrap gap-1.5 items-center justify-center"
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <div className="w-4 h-6 rounded bg-red-400" />
              <div className="w-6 h-4 rounded bg-yellow-400" />
              <div className="w-4 h-7 rounded bg-green-500" />
              <div className="w-5 h-5 rounded-full bg-orange-400" />
              <div className="w-5 h-6 rounded bg-blue-300" />
              <div className="w-6 h-4 rounded bg-purple-300" />
            </motion.div>

            {/* DOOR */}
            <motion.div
              onClick={() => setOpen(!open)}
              animate={{ rotateY: open ? -75 : 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute left-0 top-0 w-full h-full cursor-pointer"
              style={{
                background: "hsl(var(--card))",
                transformOrigin: "left center",
                transformStyle: "preserve-3d",
                boxShadow: open ? "8px 0 16px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {/* Door surface */}
              <div className="absolute inset-2 border border-border/50 rounded-lg" />
              
              {/* HANDLE */}
              <div
                className="absolute right-2.5 rounded bg-muted-foreground/40"
                style={{
                  width: 6,
                  height: 28,
                  top: "40%",
                }}
              />
            </motion.div>

            {/* SCAN EFFECT */}
            {open && (
              <motion.div
                initial={{ y: -140 }}
                animate={{ y: 140 }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.8, 
                  ease: "linear",
                  repeatDelay: 0.2
                }}
                className="absolute w-full h-8 pointer-events-none z-10"
                style={{
                  background: "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.4), transparent)",
                }}
              />
            )}
          </div>
        </div>

        {/* Recipe Card - appears after scan */}
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ 
            opacity: showRecipe ? 1 : 0, 
            x: showRecipe ? 0 : 20,
            scale: showRecipe ? 1 : 0.9
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-24 p-2 rounded-xl bg-card border border-border shadow-lg"
        >
          <div className="w-full h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 mb-1.5 flex items-center justify-center">
            <span className="text-lg">🍳</span>
          </div>
          <div className="h-1.5 w-16 bg-muted rounded mb-1" />
          <div className="h-1 w-12 bg-muted/60 rounded" />
          <div className="flex gap-1 mt-1.5">
            <div className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium">AI</div>
            <div className="text-[8px] text-muted-foreground">Rezept</div>
          </div>
        </motion.div>

        {/* AI Sparkles */}
        {showRecipe && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 0 }}
              className="absolute top-8 right-6 text-primary"
            >
              ✦
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 0.8 }}
              className="absolute top-20 right-0 text-sm text-primary/70"
            >
              ✦
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default HeroAnimationCompact;