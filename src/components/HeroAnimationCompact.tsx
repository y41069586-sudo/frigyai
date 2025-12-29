import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const HeroAnimationCompact = () => {
  const [phase, setPhase] = useState<'idle' | 'reaching' | 'opening' | 'scanning' | 'done'>('idle');

  useEffect(() => {
    // Choreographed sequence
    const timers = [
      setTimeout(() => setPhase('reaching'), 600),      // Hand starts moving
      setTimeout(() => setPhase('opening'), 1100),      // Door starts opening (after 0.5s hand movement)
      setTimeout(() => setPhase('scanning'), 2300),     // Scan starts (after door fully open)
      setTimeout(() => setPhase('done'), 4000),         // Recipe appears
    ];
    
    return () => timers.forEach(clearTimeout);
  }, []);

  const isOpening = phase === 'opening' || phase === 'scanning' || phase === 'done';
  const isScanning = phase === 'scanning';
  const isDone = phase === 'done';

  return (
    <div className="relative w-full h-56 flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/20 rounded-2xl" />

      {/* Main Scene */}
      <div className="relative flex items-center justify-center px-4">
        
        <div className="relative" style={{ width: 180, height: 260 }}>
          
          {/* FRIGY HEAD - looks down at door, stops bouncing during action */}
          <motion.div
            animate={{ 
              y: phase === 'idle' ? [0, -3, 0] : 0,
              rotate: isOpening ? 3 : 0, // Slight tilt to watch the door
            }}
            transition={{ 
              y: { repeat: phase === 'idle' ? Infinity : 0, duration: 2, ease: "easeInOut" },
              rotate: { duration: 0.4, ease: "easeOut" }
            }}
            className="absolute left-1/2 -translate-x-1/2 w-[80px] h-[80px] rounded-full z-[5]"
            style={{ 
              top: -14,
              background: "hsl(var(--primary))"
            }}
          >
            {/* Eyes - look toward door when opening */}
            <motion.div 
              className="absolute w-[7px] h-[7px] rounded-full bg-primary-foreground"
              animate={{ 
                x: isOpening ? 2 : 0,
                y: isOpening ? 2 : 0 
              }}
              transition={{ duration: 0.3 }}
              style={{ top: 32, left: 24 }}
            />
            <motion.div 
              className="absolute w-[7px] h-[7px] rounded-full bg-primary-foreground"
              animate={{ 
                x: isOpening ? 2 : 0,
                y: isOpening ? 2 : 0 
              }}
              transition={{ duration: 0.3 }}
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
            {/* FREEZER SECTION WITH EYES */}
            <div
              className="flex items-center justify-center gap-3"
              style={{ 
                height: 56,
                background: "hsl(var(--muted-foreground) / 0.1)"
              }}
            >
              {/* Left eye - looks at door, surprise blink on open */}
              <motion.div
                animate={{ 
                  x: phase === 'reaching' ? 3 : isOpening ? 5 : 0,
                  scaleY: phase === 'opening' ? [1, 0.1, 1, 1] : (phase === 'idle' ? [1, 1, 1, 0.1, 1] : 1),
                  scaleX: phase === 'opening' ? [1, 1.3, 1, 1] : 1,
                }}
                transition={{ 
                  x: { duration: 0.3 },
                  scaleY: phase === 'opening' 
                    ? { duration: 0.4, times: [0, 0.2, 0.4, 1] }
                    : { repeat: phase === 'idle' ? Infinity : 0, duration: 4, times: [0, 0.45, 0.5, 0.55, 1] },
                  scaleX: { duration: 0.3 }
                }}
                className="w-[7px] h-[7px] rounded-full bg-foreground/70"
              />
              {/* Right eye */}
              <motion.div
                animate={{ 
                  x: phase === 'reaching' ? 3 : isOpening ? 5 : 0,
                  scaleY: phase === 'opening' ? [1, 0.1, 1, 1] : (phase === 'idle' ? [1, 1, 1, 0.1, 1] : 1),
                  scaleX: phase === 'opening' ? [1, 1.3, 1, 1] : 1,
                }}
                transition={{ 
                  x: { duration: 0.3 },
                  scaleY: phase === 'opening' 
                    ? { duration: 0.4, times: [0, 0.2, 0.4, 1], delay: 0.05 }
                    : { repeat: phase === 'idle' ? Infinity : 0, duration: 4, times: [0, 0.45, 0.5, 0.55, 1], delay: 0.1 },
                  scaleX: { duration: 0.3, delay: 0.05 }
                }}
                className="w-[7px] h-[7px] rounded-full bg-foreground/70"
              />
            </div>

            {/* Food items inside */}
            <motion.div 
              className="absolute inset-0 pt-14 p-3 flex flex-wrap gap-1.5 items-start justify-center content-start"
              animate={{ opacity: isOpening ? 1 : 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="w-4 h-5 rounded bg-red-400/80" />
              <div className="w-5 h-4 rounded bg-yellow-400/80" />
              <div className="w-3 h-6 rounded bg-green-500/80" />
              <div className="w-4 h-4 rounded-full bg-orange-400/80" />
              <div className="w-4 h-5 rounded bg-blue-300/80" />
              <div className="w-5 h-3 rounded bg-purple-300/80" />
            </motion.div>

            {/* DOOR + ARM - arm moves first, then door follows */}
            <motion.div
              animate={{ 
                rotateY: isOpening ? -70 : 0 
              }}
              transition={{ 
                duration: 1.0,
                ease: [0.4, 0, 0.2, 1], // Slow start, faster end
                delay: isOpening ? 0.25 : 0, // Pause after hand reaches
              }}
              className="absolute bottom-0 w-full"
              style={{
                height: 144,
                background: "hsl(var(--card))",
                transformOrigin: "left center",
                transformStyle: "preserve-3d",
                boxShadow: isOpening ? "8px 0 20px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <div className="absolute inset-1.5 border border-border/40 rounded-lg" />
              
              {/* HANDLE */}
              <div
                className="absolute right-2.5 rounded bg-muted-foreground/50"
                style={{ width: 5, height: 28, top: "40%" }}
              />

              {/* ARM - moves slightly before door opens */}
              <motion.div
                animate={{ 
                  x: phase === 'reaching' ? 4 : 0,
                  rotate: phase === 'reaching' ? -5 : 0,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute rounded-xl"
                style={{
                  left: -12,
                  top: 36,
                  width: 12,
                  height: 70,
                  background: "hsl(var(--primary))",
                  transformOrigin: "top center",
                }}
              />

              {/* HAND - reaches toward handle */}
              <motion.div
                animate={{ 
                  x: phase === 'reaching' ? 8 : 0,
                  y: phase === 'reaching' ? -3 : 0,
                  rotate: phase === 'reaching' ? 10 : 0,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute rounded-full"
                style={{
                  left: -17,
                  top: 95,
                  width: 24,
                  height: 18,
                  background: "hsl(var(--primary))",
                  transformOrigin: "center",
                }}
              />
            </motion.div>

            {/* SCAN LIGHT - single clean sweep, starts after door fully open */}
            {isScanning && (
              <motion.div
                initial={{ y: -144, opacity: 0 }}
                animate={{ y: 144, opacity: [0, 1, 1, 0] }}
                transition={{ 
                  duration: 1.2, 
                  ease: "linear",
                  opacity: { duration: 1.2, times: [0, 0.1, 0.9, 1] }
                }}
                className="absolute bottom-0 w-full h-8 pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.4), transparent)",
                }}
              />
            )}
          </div>
        </div>

        {/* Recipe Card - appears after scan completes */}
        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.9 }}
          animate={{ 
            opacity: isDone ? 1 : 0, 
            x: isDone ? 0 : 30,
            scale: isDone ? 1 : 0.9
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

        {/* AI Sparkles - only after recipe appears */}
        {isDone && (
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