import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const HeroAnimationCompact = () => {
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setScanning(true);
      setTimeout(() => setScanning(false), 2000);
    };
    
    cycle();
    const interval = setInterval(cycle, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full min-h-[280px] bg-gradient-to-b from-muted/50 to-background flex items-center justify-center rounded-2xl overflow-hidden relative">
      
      {/* Ambient Glow */}
      <motion.div
        animate={{
          opacity: scanning ? 0.6 : 0.2,
          scale: scanning ? 1.1 : 1,
        }}
        transition={{ duration: 0.5 }}
        className="absolute w-48 h-48 bg-primary/30 rounded-full blur-3xl"
      />

      {/* Fridge Container */}
      <div className="relative z-10">
        
        {/* Modern Fridge */}
        <motion.div
          animate={{ scale: scanning ? 1.02 : 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Fridge Body */}
          <div className="w-32 h-48 bg-gradient-to-b from-card via-card to-muted/80 rounded-2xl shadow-2xl border border-border/50 overflow-hidden relative">
            
            {/* Glass Reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl" />
            
            {/* Freezer Section */}
            <div className="h-14 border-b border-border/40 relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-border/60 rounded-full" />
              {/* Freezer Vent Lines */}
              <div className="absolute left-4 top-4 flex flex-col gap-1">
                <div className="w-8 h-0.5 bg-border/30 rounded-full" />
                <div className="w-6 h-0.5 bg-border/30 rounded-full" />
                <div className="w-7 h-0.5 bg-border/30 rounded-full" />
              </div>
            </div>
            
            {/* Main Section */}
            <div className="h-[132px] relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-12 bg-border/60 rounded-full" />
              
              {/* Food Items Inside (visible through glass effect) */}
              <div className="absolute inset-3 flex flex-wrap gap-1.5 opacity-40">
                <div className="w-4 h-6 bg-orange-400/60 rounded-sm" />
                <div className="w-5 h-4 bg-green-400/60 rounded-sm" />
                <div className="w-3 h-5 bg-yellow-400/60 rounded-sm" />
                <div className="w-4 h-3 bg-red-400/60 rounded-sm" />
                <div className="w-6 h-4 bg-blue-300/60 rounded-sm" />
              </div>
            </div>

            {/* Scan Line */}
            {scanning && (
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-b from-primary via-primary to-transparent shadow-[0_0_20px_4px] shadow-primary/50"
              />
            )}
          </div>

          {/* Scan Frame Corners */}
          <motion.div
            animate={{ opacity: scanning ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute -inset-3 pointer-events-none"
          >
            {/* Top Left */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            {/* Top Right */}
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            {/* Bottom Left */}
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            {/* Bottom Right */}
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
          </motion.div>

          {/* Scan Pulse Ring */}
          {scanning && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 1.5, repeat: 1 }}
              className="absolute -inset-4 border-2 border-primary/50 rounded-3xl"
            />
          )}
        </motion.div>

        {/* Status Indicator */}
        <motion.div
          animate={{
            opacity: scanning ? 1 : 0.6,
          }}
          className="mt-4 flex items-center justify-center gap-2"
        >
          <motion.div
            animate={{
              scale: scanning ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.6, repeat: scanning ? Infinity : 0 }}
            className="w-2 h-2 rounded-full bg-primary"
          />
          <span className="text-xs text-muted-foreground font-medium tracking-wide">
            {scanning ? "Scanning..." : "Ready"}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroAnimationCompact;
