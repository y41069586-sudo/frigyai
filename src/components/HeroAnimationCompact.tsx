import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, ChefHat, Utensils } from "lucide-react";

const HeroAnimationCompact = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Main Container */}
      <div className="relative flex items-center justify-center gap-4 px-4">
        
        {/* Frigy Mascot with animated door */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <motion.svg
            viewBox="0 0 100 130"
            className="w-24 h-32"
            animate={{ 
              rotate: step === 1 ? [-1, 1, -1] : 0
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
              {/* Shelf lines */}
              <line x1="20" y1="40" x2="80" y2="40" stroke="hsl(160, 15%, 85%)" strokeWidth="1.5" />
              <line x1="20" y1="68" x2="80" y2="68" stroke="hsl(160, 15%, 85%)" strokeWidth="1.5" />
              {/* Food items inside */}
              <circle cx="32" cy="26" r="7" fill="hsl(25, 95%, 58%)" /> {/* Orange */}
              <circle cx="50" cy="26" r="5" fill="hsl(0, 80%, 55%)" /> {/* Apple */}
              <rect x="62" y="20" width="10" height="14" rx="2" fill="hsl(45, 85%, 55%)" /> {/* Cheese */}
              <rect x="26" y="46" width="14" height="18" rx="3" fill="hsl(200, 65%, 60%)" /> {/* Milk */}
              <circle cx="58" cy="54" r="6" fill="hsl(120, 55%, 50%)" /> {/* Lettuce */}
              <rect x="32" y="74" width="12" height="10" rx="2" fill="hsl(30, 75%, 50%)" /> {/* Bread */}
              <circle cx="58" cy="80" r="7" fill="hsl(50, 85%, 55%)" /> {/* Lemon */}
              <circle cx="72" cy="54" r="4" fill="hsl(350, 70%, 55%)" /> {/* Tomato */}
            </motion.g>

            {/* Fridge Door - animated opening */}
            <motion.g
              style={{ transformOrigin: "85px 57px" }}
              animate={{
                rotateY: step >= 1 ? -75 : 0,
                x: step >= 1 ? -30 : 0,
                scaleX: step >= 1 ? 0.25 : 1
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <rect
                x="15"
                y="10"
                width="70"
                height="95"
                rx="10"
                fill="url(#fridgeDoorGradient)"
              />
              {/* Freezer section line */}
              <line x1="18" y1="38" x2="82" y2="38" stroke="hsl(160, 64%, 35%)" strokeWidth="1.5" />
              {/* Door handles */}
              <rect x="75" y="48" width="5" height="16" rx="2.5" fill="hsl(160, 50%, 70%)" />
              <rect x="75" y="20" width="5" height="10" rx="2.5" fill="hsl(160, 50%, 70%)" />

              {/* Frigy's cute face on the door */}
              {/* Eyes */}
              <ellipse cx="38" cy="60" rx="7" ry="8" fill="white" />
              <ellipse cx="62" cy="60" rx="7" ry="8" fill="white" />
              <motion.ellipse
                cx="40"
                cy="62"
                rx="3.5"
                ry="4"
                fill="hsl(220, 20%, 20%)"
                animate={{ cx: [40, 41, 40, 39, 40] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.ellipse
                cx="64"
                cy="62"
                rx="3.5"
                ry="4"
                fill="hsl(220, 20%, 20%)"
                animate={{ cx: [64, 65, 64, 63, 64] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <circle cx="43" cy="59" r="1.5" fill="white" />
              <circle cx="67" cy="59" r="1.5" fill="white" />
              
              {/* Smile */}
              <motion.path
                d="M 42 78 Q 50 88 58 78"
                fill="none"
                stroke="hsl(220, 20%, 20%)"
                strokeWidth="2.5"
                strokeLinecap="round"
                animate={{
                  d: ["M 42 78 Q 50 88 58 78", "M 42 79 Q 50 90 58 79", "M 42 78 Q 50 88 58 78"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Blush */}
              <ellipse cx="30" cy="72" rx="5" ry="2.5" fill="hsl(350, 80%, 80%)" opacity="0.6" />
              <ellipse cx="70" cy="72" rx="5" ry="2.5" fill="hsl(350, 80%, 80%)" opacity="0.6" />
            </motion.g>

            {/* Frigy's arm opening the door */}
            <motion.g
              animate={{
                rotate: step >= 1 ? -25 : 0,
                x: step >= 1 ? -8 : 0,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ transformOrigin: "15px 60px" }}
            >
              {/* Arm */}
              <ellipse
                cx="6"
                cy="60"
                rx="10"
                ry="6"
                fill="hsl(160, 84%, 39%)"
              />
              {/* Hand */}
              <motion.circle
                cx="0"
                cy="60"
                r="7"
                fill="hsl(160, 84%, 48%)"
                animate={step >= 1 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
              {/* Fingers */}
              <circle cx="-4" cy="56" r="2.5" fill="hsl(160, 84%, 48%)" />
              <circle cx="-5" cy="60" r="2.5" fill="hsl(160, 84%, 48%)" />
              <circle cx="-4" cy="64" r="2.5" fill="hsl(160, 84%, 48%)" />
            </motion.g>

            {/* Little feet */}
            <ellipse cx="35" cy="108" rx="10" ry="5" fill="hsl(160, 84%, 32%)" />
            <ellipse cx="65" cy="108" rx="10" ry="5" fill="hsl(160, 84%, 32%)" />
          </motion.svg>

          {/* Scan effect overlay */}
          <AnimatePresence>
            {step === 2 && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute w-20 h-0.5 bg-primary rounded-full"
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: [-30, 30], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 0.6, ease: "linear" }}
                  style={{ boxShadow: "0 0 15px hsl(var(--primary))" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
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

        {/* Recipe Cards */}
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
            <AnimatePresence>
              {step >= 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-[10px] text-primary-foreground font-bold">✓</span>
                </motion.div>
              )}
            </AnimatePresence>
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
