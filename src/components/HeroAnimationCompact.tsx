import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const HeroAnimationCompact = () => {
  const [phase, setPhase] = useState<"idle" | "peek" | "open" | "scan" | "done">("idle");

  useEffect(() => {
    const sequence = async () => {
      await new Promise(r => setTimeout(r, 800));
      setPhase("peek");
      await new Promise(r => setTimeout(r, 600));
      setPhase("open");
      await new Promise(r => setTimeout(r, 900));
      setPhase("scan");
      await new Promise(r => setTimeout(r, 2000));
      setPhase("done");
      await new Promise(r => setTimeout(r, 2000));
      setPhase("idle");
    };
    
    sequence();
    const interval = setInterval(sequence, 7000);
    return () => clearInterval(interval);
  }, []);

  const isOpen = phase === "open" || phase === "scan" || phase === "done";

  return (
    <div className="h-full min-h-[280px] bg-gradient-to-b from-background to-muted/30 flex items-center justify-center rounded-2xl overflow-hidden">
      <div className="relative w-[180px] h-[260px]">
        
        {/* Frigy Head - peeks from behind */}
        <motion.div
          animate={{
            y: phase === "idle" ? 10 : 0,
            scale: phase === "done" ? 1.05 : 1,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-20 h-20 rounded-full bg-primary relative">
            {/* Eyes */}
            <motion.div
              animate={{
                scaleY: phase === "scan" ? [1, 0.1, 1] : 1,
                x: isOpen ? 2 : 0,
              }}
              transition={{ duration: 0.15, repeat: phase === "scan" ? 2 : 0, repeatDelay: 0.8 }}
              className="absolute top-8 left-5 w-2.5 h-2.5 rounded-full bg-primary-foreground"
            />
            <motion.div
              animate={{
                scaleY: phase === "scan" ? [1, 0.1, 1] : 1,
                x: isOpen ? 2 : 0,
              }}
              transition={{ duration: 0.15, delay: 0.05, repeat: phase === "scan" ? 2 : 0, repeatDelay: 0.8 }}
              className="absolute top-8 right-5 w-2.5 h-2.5 rounded-full bg-primary-foreground"
            />
            {/* Happy expression when done */}
            <AnimatePresence>
              {phase === "done" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-3 border-b-2 border-primary-foreground rounded-b-full"
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Fridge Body */}
        <div className="absolute bottom-0 w-full h-[200px] bg-muted rounded-xl overflow-hidden shadow-lg">
          
          {/* Freezer Section */}
          <div className="h-14 bg-muted-foreground/10 border-b border-border/50 flex items-center justify-center">
            <div className="w-12 h-1.5 bg-border/60 rounded-full" />
          </div>

          {/* Fridge Interior (visible when open) */}
          <div className="relative h-[144px] bg-muted-foreground/5">
            {/* Shelves */}
            <div className="absolute top-10 w-full h-0.5 bg-border/40" />
            <div className="absolute top-20 w-full h-0.5 bg-border/40" />
            
            {/* Food Items */}
            <AnimatePresence>
              {isOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-2 left-3 w-6 h-8 bg-orange-400 rounded-md"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-2 right-4 w-5 h-7 bg-green-400 rounded-full"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ delay: 0.4 }}
                    className="absolute top-12 left-6 w-8 h-5 bg-yellow-300 rounded-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ delay: 0.35 }}
                    className="absolute top-12 right-3 w-4 h-6 bg-red-400 rounded-md"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ delay: 0.45 }}
                    className="absolute top-[88px] left-4 w-7 h-4 bg-blue-300 rounded-sm"
                  />
                </>
              )}
            </AnimatePresence>

            {/* Scan Line */}
            <AnimatePresence>
              {phase === "scan" && (
                <motion.div
                  initial={{ top: 0 }}
                  animate={{ top: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute left-0 w-full h-8 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent pointer-events-none"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Door */}
          <motion.div
            animate={{
              rotateY: isOpen ? -70 : phase === "peek" ? -8 : 0,
            }}
            transition={{
              duration: phase === "peek" ? 0.3 : 0.7,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
            className="absolute top-14 left-0 w-full h-[144px] bg-card rounded-b-xl shadow-md"
          >
            {/* Handle */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-border rounded-full" />
            
            {/* Frigy Arm on door */}
            <motion.div
              animate={{
                x: phase === "peek" ? -3 : 0,
                rotate: isOpen ? -15 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="absolute -left-3 top-8 w-3 h-16 bg-primary rounded-lg origin-top"
            >
              {/* Hand */}
              <div className="absolute -bottom-2 -left-1 w-5 h-4 bg-primary rounded-full" />
            </motion.div>
          </motion.div>
        </div>

        {/* Success Sparkles */}
        <AnimatePresence>
          {phase === "done" && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5], y: -20 }}
                transition={{ duration: 0.8 }}
                className="absolute -top-10 left-4 text-lg"
              >
                ✨
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5], y: -15 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute -top-8 right-6 text-lg"
              >
                ✨
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HeroAnimationCompact;
