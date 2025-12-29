import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const HeroAnimationCompact = () => {
  const [open, setOpen] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);

  useEffect(() => {
    // Auto-open after delay
    const openTimer = setTimeout(() => setOpen(true), 1000);
    // Show recipe after door opens
    const recipeTimer = setTimeout(() => setShowRecipe(true), 2500);
    
    return () => {
      clearTimeout(openTimer);
      clearTimeout(recipeTimer);
    };
  }, []);

  return (
    <div className="relative w-full h-56 flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/20 rounded-2xl" />

      {/* Main Scene Container */}
      <div className="relative flex items-center justify-center px-4">
        
        {/* SCENE */}
        <div className="relative" style={{ width: 180, height: 260 }}>
          
          {/* FRIGY HEAD - on top with subtle bounce */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute left-1/2 -translate-x-1/2 w-[80px] h-[80px] rounded-full z-[5]"
            style={{ 
              top: -14,
              background: "hsl(var(--primary))"
            }}
          >
            {/* Eyes on head */}
            <div 
              className="absolute w-[7px] h-[7px] rounded-full bg-primary-foreground"
              style={{ top: 32, left: 24 }}
            />
            <div 
              className="absolute w-[7px] h-[7px] rounded-full bg-primary-foreground"
              style={{ top: 32, right: 24 }}
            />
            {/* Smile */}
            <div
              className="absolute w-5 h-2.5 border-b-2 border-primary-foreground rounded-b-full"
              style={{ bottom: 18, left: '50%', transform: 'translateX(-50%)' }}
            />
          </motion.div>

          {/* FRIDGE BODY */}
          <div
            className="absolute bottom-0 w-full rounded-[16px] overflow-hidden"
            style={{ 
              height: 200,
              background: "hsl(var(--muted))"
            }}
          >
            {/* FREEZER SECTION WITH BLINKING EYES */}
            <div
              className="flex items-center justify-center gap-3"
              style={{ 
                height: 56,
                background: "hsl(var(--muted-foreground) / 0.1)"
              }}
            >
              <motion.div
                animate={{ scaleY: [1, 0.15, 1] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="w-[7px] h-[7px] rounded-full bg-foreground/70"
              />
              <motion.div
                animate={{ scaleY: [1, 0.15, 1] }}
                transition={{ repeat: Infinity, duration: 4, delay: 0.15 }}
                className="w-[7px] h-[7px] rounded-full bg-foreground/70"
              />
            </div>

            {/* Food items inside (visible when open) */}
            <motion.div 
              className="absolute inset-0 pt-14 p-3 flex flex-wrap gap-1.5 items-start justify-center content-start"
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="w-4 h-5 rounded bg-red-400/80" />
              <div className="w-5 h-4 rounded bg-yellow-400/80" />
              <div className="w-3 h-6 rounded bg-green-500/80" />
              <div className="w-4 h-4 rounded-full bg-orange-400/80" />
              <div className="w-4 h-5 rounded bg-blue-300/80" />
              <div className="w-5 h-3 rounded bg-purple-300/80" />
              <div className="w-3 h-4 rounded bg-pink-300/80" />
              <div className="w-4 h-3 rounded bg-amber-400/80" />
            </motion.div>

            {/* DOOR + ARM GROUP - arm attached to door */}
            <motion.div
              onClick={() => setOpen(!open)}
              animate={{ rotateY: open ? -70 : 0 }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
              className="absolute bottom-0 w-full cursor-pointer"
              style={{
                height: 144,
                background: "hsl(var(--card))",
                transformOrigin: "left center",
                transformStyle: "preserve-3d",
                boxShadow: open ? "8px 0 20px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {/* Door border detail */}
              <div className="absolute inset-1.5 border border-border/40 rounded-lg" />
              
              {/* HANDLE */}
              <div
                className="absolute right-2.5 rounded bg-muted-foreground/50"
                style={{
                  width: 5,
                  height: 28,
                  top: "40%",
                }}
              />

              {/* ARM ATTACHED TO DOOR - moves with door */}
              <div
                className="absolute rounded-xl"
                style={{
                  left: -12,
                  top: 36,
                  width: 12,
                  height: 70,
                  background: "hsl(var(--primary))",
                }}
              />

              {/* HAND */}
              <div
                className="absolute rounded-full"
                style={{
                  left: -17,
                  top: 95,
                  width: 24,
                  height: 18,
                  background: "hsl(var(--primary))",
                }}
              />
            </motion.div>

            {/* SCAN LIGHT */}
            {open && (
              <motion.div
                initial={{ y: -144 }}
                animate={{ y: 144 }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5, 
                  ease: "linear" 
                }}
                className="absolute bottom-0 w-full h-8 pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.35), transparent)",
                }}
              />
            )}
          </div>
        </div>

        {/* Recipe Card - appears after scan */}
        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.9 }}
          animate={{ 
            opacity: showRecipe ? 1 : 0, 
            x: showRecipe ? 0 : 30,
            scale: showRecipe ? 1 : 0.9
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-20 p-2 rounded-xl bg-card border border-border shadow-lg"
        >
          <div className="w-full h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 mb-1.5 flex items-center justify-center">
            <span className="text-sm">🍳</span>
          </div>
          <div className="h-1.5 w-12 bg-muted rounded mb-1" />
          <div className="h-1 w-10 bg-muted/60 rounded" />
          <div className="flex gap-1 mt-1.5">
            <div className="text-[7px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium">AI</div>
          </div>
        </motion.div>

        {/* AI Sparkles */}
        {showRecipe && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute top-6 right-4 text-primary text-sm"
            >
              ✦
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 0.7 }}
              className="absolute top-16 right-0 text-xs text-primary/60"
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