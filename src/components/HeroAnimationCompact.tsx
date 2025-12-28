import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, ChefHat, Utensils } from "lucide-react";

const HeroAnimationCompact = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-52 flex items-center justify-center">
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Main Container */}
      <div className="relative flex items-center justify-center gap-5 px-4">
        
        {/* Frigy Mascot with animated door */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <motion.svg
            viewBox="0 0 100 130"
            className="w-28 h-36"
            animate={{ 
              rotate: step >= 1 ? [-1, 1, -1] : 0
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <defs>
              <linearGradient id="fridgeBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(158, 64%, 52%)" />
                <stop offset="50%" stopColor="hsl(160, 84%, 39%)" />
                <stop offset="100%" stopColor="hsl(160, 64%, 32%)" />
              </linearGradient>
              <linearGradient id="fridgeDoorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(158, 64%, 58%)" />
                <stop offset="100%" stopColor="hsl(160, 84%, 45%)" />
              </linearGradient>
              <filter id="softShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15"/>
              </filter>
            </defs>

            {/* Main Fridge Body */}
            <rect
              x="15"
              y="10"
              width="70"
              height="95"
              rx="10"
              fill="url(#fridgeBodyGradient)"
              filter="url(#softShadow)"
            />

            {/* Inside of fridge (visible when door opens) */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: step >= 1 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <rect x="18" y="13" width="64" height="89" rx="7" fill="hsl(160, 20%, 96%)" />
              {/* Shelf line - between freezer and fridge */}
              <line x1="20" y1="55" x2="80" y2="55" stroke="hsl(160, 15%, 85%)" strokeWidth="2" />
              {/* Food items inside - Freezer section (top) */}
              <rect x="25" y="20" width="22" height="12" rx="3" fill="hsl(200, 70%, 75%)" /> {/* Ice cream */}
              <rect x="52" y="18" width="18" height="15" rx="2" fill="hsl(40, 50%, 85%)" /> {/* Frozen pizza */}
              <rect x="25" y="38" width="15" height="10" rx="2" fill="hsl(180, 40%, 70%)" /> {/* Frozen peas */}
              <rect x="45" y="40" width="12" height="8" rx="2" fill="hsl(30, 60%, 65%)" /> {/* Nuggets */}
              
              {/* Food items inside - Fridge section (bottom) */}
              <circle cx="32" cy="68" r="7" fill="hsl(25, 95%, 58%)" /> {/* Orange */}
              <circle cx="52" cy="68" r="5" fill="hsl(0, 80%, 55%)" /> {/* Apple */}
              <rect x="62" y="62" width="10" height="14" rx="2" fill="hsl(45, 85%, 55%)" /> {/* Cheese */}
              <rect x="26" y="80" width="14" height="18" rx="3" fill="hsl(200, 65%, 60%)" /> {/* Milk */}
              <circle cx="58" cy="88" r="6" fill="hsl(120, 55%, 50%)" /> {/* Lettuce */}
              <circle cx="72" cy="80" r="5" fill="hsl(50, 85%, 55%)" /> {/* Lemon */}
            </motion.g>

            {/* Fridge Door - animated opening */}
            <motion.g
              style={{ transformOrigin: "85px 57px" }}
              animate={{
                rotateY: step >= 1 ? -75 : 0,
                x: step >= 1 ? -30 : 0,
                scaleX: step >= 1 ? 0.25 : 1
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <rect
                x="15"
                y="10"
                width="70"
                height="95"
                rx="10"
                fill="url(#fridgeDoorGradient)"
              />
              {/* Freezer/Fridge divider line - in the middle */}
              <line x1="18" y1="55" x2="82" y2="55" stroke="hsl(160, 64%, 35%)" strokeWidth="2" />
              
              {/* Door handles */}
              <rect x="75" y="65" width="5" height="16" rx="2.5" fill="hsl(160, 50%, 70%)" />
              <rect x="75" y="28" width="5" height="12" rx="2.5" fill="hsl(160, 50%, 70%)" />

              {/* Frigy's cute face - in the freezer section (top half) */}
              {/* Eyes */}
              <ellipse cx="38" cy="32" rx="7" ry="8" fill="white" />
              <ellipse cx="62" cy="32" rx="7" ry="8" fill="white" />
              <motion.ellipse
                cx="40"
                cy="34"
                rx="3.5"
                ry="4"
                fill="hsl(220, 20%, 20%)"
                animate={{ cx: [40, 41, 40, 39, 40] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.ellipse
                cx="64"
                cy="34"
                rx="3.5"
                ry="4"
                fill="hsl(220, 20%, 20%)"
                animate={{ cx: [64, 65, 64, 63, 64] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <circle cx="43" cy="31" r="1.5" fill="white" />
              <circle cx="67" cy="31" r="1.5" fill="white" />
              
              {/* Smile - bigger when door opens */}
              <motion.path
                d="M 42 46 Q 50 54 58 46"
                fill="none"
                stroke="hsl(220, 20%, 20%)"
                strokeWidth="2.5"
                strokeLinecap="round"
                animate={{
                  d: step >= 1 
                    ? ["M 40 44 Q 50 58 60 44", "M 40 45 Q 50 60 60 45", "M 40 44 Q 50 58 60 44"]
                    : ["M 42 46 Q 50 54 58 46", "M 42 47 Q 50 56 58 47", "M 42 46 Q 50 54 58 46"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Blush */}
              <ellipse cx="30" cy="42" rx="5" ry="2.5" fill="hsl(350, 80%, 80%)" opacity="0.6" />
              <ellipse cx="70" cy="42" rx="5" ry="2.5" fill="hsl(350, 80%, 80%)" opacity="0.6" />
            </motion.g>

            {/* Frigy's arm coming from the left to open door */}
            <motion.g
              animate={{
                x: step >= 1 ? 35 : 0,
                rotate: step >= 1 ? 15 : 0,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ transformOrigin: "-10px 70px" }}
            >
              {/* Upper arm */}
              <ellipse
                cx="-15"
                cy="70"
                rx="18"
                ry="8"
                fill="hsl(160, 84%, 39%)"
              />
              {/* Forearm */}
              <ellipse
                cx="5"
                cy="70"
                rx="14"
                ry="7"
                fill="hsl(160, 84%, 42%)"
              />
              {/* Hand - bigger and rounder */}
              <motion.circle
                cx="18"
                cy="70"
                r="10"
                fill="hsl(160, 84%, 48%)"
                animate={step >= 1 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
              />
              {/* Fingers */}
              <circle cx="26" cy="64" r="3.5" fill="hsl(160, 84%, 48%)" />
              <circle cx="28" cy="70" r="3.5" fill="hsl(160, 84%, 48%)" />
              <circle cx="26" cy="76" r="3.5" fill="hsl(160, 84%, 48%)" />
              <circle cx="22" cy="80" r="3" fill="hsl(160, 84%, 48%)" />
            </motion.g>

            {/* Little feet */}
            <ellipse cx="35" cy="108" rx="10" ry="5" fill="hsl(160, 84%, 32%)" />
            <ellipse cx="65" cy="108" rx="10" ry="5" fill="hsl(160, 84%, 32%)" />
          </motion.svg>

          {/* Scan effect overlay - longer and smoother */}
          {step >= 1 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute w-24 h-1 bg-primary rounded-full"
                animate={{ 
                  y: [-45, 45, -45],
                  opacity: [0.3, 1, 1, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                style={{ boxShadow: "0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary))" }}
              />
            </motion.div>
          )}
          
          {/* Label */}
          <motion.span
            className="block text-center text-[10px] font-medium text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Kühlschrank
          </motion.span>
        </motion.div>

        {/* Arrow/Flow indicator - always visible after first appearance */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="flex flex-col items-center gap-1"
        >
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="flex items-center"
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 24 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="h-0.5 bg-gradient-to-r from-primary to-primary/30 rounded-full"
          />
          <span className="text-[9px] text-primary font-semibold">AI</span>
        </motion.div>

        {/* Recipe Cards - always visible after first appearance */}
        <motion.div
          initial={{ opacity: 0, x: 15, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 1, type: "spring", stiffness: 150 }}
          className="relative"
        >
          {/* Background card */}
          <motion.div
            className="absolute top-1 left-1 w-20 h-24 bg-card/50 border border-border/50 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.2 }}
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
            
            {/* Success badge - pulses */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, delay: 1.5 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
            >
              <motion.span 
                className="text-[10px] text-primary-foreground font-bold"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ✓
              </motion.span>
            </motion.div>
          </div>
          
          {/* Second recipe peek */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="mt-1.5 w-20 p-1.5 bg-card border border-border rounded-lg"
          >
            <div className="flex items-center gap-1">
              <Utensils className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[8px] text-muted-foreground">+2 mehr</span>
            </div>
          </motion.div>
          
          {/* Label */}
          <motion.span
            className="block text-center text-[10px] font-medium text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            Rezepte
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroAnimationCompact;
