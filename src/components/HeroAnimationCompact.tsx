import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const HeroAnimationCompact = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full min-h-[280px] bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center rounded-2xl overflow-hidden relative">
      
      {/* Abstract Background Shapes */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r from-primary/10 to-transparent blur-3xl"
      />
      
      {/* Floating Orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            x: [0, i % 2 === 0 ? 10 : -10, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: 20 + i * 15,
            height: 20 + i * 15,
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
        />
      ))}

      {/* Main Frigy Character - Geometric Style */}
      <div className="relative z-10">
        
        {/* Character Container */}
        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          {/* Body - Rounded Rectangle */}
          <motion.div
            animate={{
              scale: phase === 2 ? 1.05 : 1,
            }}
            transition={{ duration: 0.4 }}
            className="w-28 h-36 bg-gradient-to-b from-card to-muted rounded-3xl shadow-2xl relative overflow-hidden border border-border/50"
          >
            {/* Shine Effect */}
            <motion.div
              animate={{
                x: phase === 1 ? ["-100%", "200%"] : "-100%",
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />
            
            {/* Top Section - Freezer */}
            <div className="h-10 bg-muted-foreground/5 border-b border-border/30 flex items-center justify-center">
              <div className="w-8 h-1 bg-border/50 rounded-full" />
            </div>
            
            {/* Face Area */}
            <div className="flex flex-col items-center justify-center h-20 gap-3">
              {/* Eyes */}
              <div className="flex gap-4">
                <motion.div
                  animate={{
                    scaleY: phase === 3 ? [1, 0.1, 1] : 1,
                  }}
                  transition={{ duration: 0.15 }}
                  className="w-3 h-3 rounded-full bg-foreground"
                />
                <motion.div
                  animate={{
                    scaleY: phase === 3 ? [1, 0.1, 1] : 1,
                  }}
                  transition={{ duration: 0.15, delay: 0.05 }}
                  className="w-3 h-3 rounded-full bg-foreground"
                />
              </div>
              
              {/* Mouth */}
              <motion.div
                animate={{
                  width: phase === 2 ? 16 : 10,
                  height: phase === 2 ? 8 : 4,
                }}
                transition={{ duration: 0.3 }}
                className="bg-foreground/80 rounded-full"
              />
            </div>
            
            {/* Handle */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-10 bg-border/60 rounded-full" />
          </motion.div>

          {/* Arms */}
          <motion.div
            animate={{
              rotate: phase === 1 ? -20 : phase === 2 ? 15 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute -left-4 top-16 w-4 h-12 bg-gradient-to-b from-card to-muted rounded-full origin-top border border-border/50"
          />
          <motion.div
            animate={{
              rotate: phase === 1 ? 20 : phase === 2 ? -15 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute -right-4 top-16 w-4 h-12 bg-gradient-to-b from-card to-muted rounded-full origin-top border border-border/50"
          />
          
          {/* Feet */}
          <div className="flex justify-center gap-6 -mt-1">
            <motion.div
              animate={{ y: phase === 0 ? [0, -3, 0] : 0 }}
              transition={{ duration: 0.3 }}
              className="w-6 h-4 bg-gradient-to-b from-card to-muted rounded-b-xl border border-border/50 border-t-0"
            />
            <motion.div
              animate={{ y: phase === 0 ? [0, -3, 0] : 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="w-6 h-4 bg-gradient-to-b from-card to-muted rounded-b-xl border border-border/50 border-t-0"
            />
          </div>
        </motion.div>

        {/* Floating Food Items */}
        <motion.div
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            scale: phase >= 2 ? 1 : 0.5,
            y: phase >= 2 ? 0 : 20,
          }}
          transition={{ duration: 0.4 }}
          className="absolute -top-8 -right-6 text-2xl"
        >
          🥕
        </motion.div>
        <motion.div
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            scale: phase >= 2 ? 1 : 0.5,
            y: phase >= 2 ? 0 : 20,
          }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="absolute -top-4 -left-8 text-2xl"
        >
          🥦
        </motion.div>
        <motion.div
          animate={{
            opacity: phase >= 2 ? 1 : 0,
            scale: phase >= 2 ? 1 : 0.5,
            y: phase >= 2 ? 0 : 20,
          }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="absolute top-4 -right-10 text-xl"
        >
          🍎
        </motion.div>

        {/* Sparkle Effects */}
        {phase === 3 && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5] }}
              transition={{ duration: 0.6 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 text-xl"
            >
              ✨
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5] }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="absolute -top-8 -left-4 text-lg"
            >
              ⭐
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5] }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="absolute -top-6 right-0 text-lg"
            >
              ✨
            </motion.div>
          </>
        )}
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};

export default HeroAnimationCompact;
