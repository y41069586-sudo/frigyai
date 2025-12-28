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

  // step 0: closed, arm at side
  // step 1: arm reaches to handle
  // step 2: door opens, scan starts
  // step 3: recipes visible

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
        
        {/* Frigy Mascot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <svg
            viewBox="0 0 110 130"
            className="w-28 h-36"
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
              <linearGradient id="freezerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(158, 64%, 55%)" />
                <stop offset="100%" stopColor="hsl(160, 84%, 42%)" />
              </linearGradient>
              <filter id="softShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15"/>
              </filter>
            </defs>

            {/* Main Fridge Body */}
            <rect
              x="25"
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
              animate={{ opacity: step >= 2 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <rect x="28" y="40" width="64" height="62" rx="6" fill="hsl(160, 20%, 96%)" />
              {/* Shelf line */}
              <line x1="30" y1="70" x2="90" y2="70" stroke="hsl(160, 15%, 85%)" strokeWidth="2" />
              
              {/* Food items inside fridge */}
              <circle cx="40" cy="52" r="6" fill="hsl(25, 95%, 58%)" /> {/* Orange */}
              <circle cx="58" cy="52" r="5" fill="hsl(0, 80%, 55%)" /> {/* Apple */}
              <rect x="70" y="46" width="10" height="14" rx="2" fill="hsl(45, 85%, 55%)" /> {/* Cheese */}
              <rect x="34" y="76" width="12" height="18" rx="3" fill="hsl(200, 65%, 60%)" /> {/* Milk */}
              <circle cx="60" cy="82" r="5" fill="hsl(120, 55%, 50%)" /> {/* Lettuce */}
              <circle cx="76" cy="85" r="6" fill="hsl(50, 85%, 55%)" /> {/* Lemon */}
            </motion.g>

            {/* Freezer door (top) - stays closed */}
            <rect
              x="25"
              y="10"
              width="70"
              height="28"
              rx="10"
              fill="url(#freezerGradient)"
            />
            {/* Fix bottom corners of freezer */}
            <rect x="25" y="28" width="70" height="10" fill="url(#freezerGradient)" />
            {/* Freezer handle */}
            <rect x="85" y="18" width="5" height="10" rx="2.5" fill="hsl(160, 50%, 70%)" />

            {/* Fridge Door (bottom) - animated opening */}
            <motion.g
              style={{ transformOrigin: "95px 70px" }}
              animate={{
                rotateY: step >= 2 ? -70 : 0,
                x: step >= 2 ? -28 : 0,
                scaleX: step >= 2 ? 0.3 : 1
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <rect
                x="25"
                y="38"
                width="70"
                height="67"
                rx="10"
                fill="url(#fridgeDoorGradient)"
              />
              {/* Fix top corners */}
              <rect x="25" y="38" width="70" height="10" fill="url(#fridgeDoorGradient)" />
              
              {/* Door handle */}
              <rect x="85" y="60" width="5" height="18" rx="2.5" fill="hsl(160, 50%, 70%)" />

              {/* Frigy's cute face on the fridge door */}
              {/* Eyes */}
              <ellipse cx="48" cy="58" rx="7" ry="8" fill="white" />
              <ellipse cx="72" cy="58" rx="7" ry="8" fill="white" />
              <motion.ellipse
                cx="50"
                cy="60"
                rx="3.5"
                ry="4"
                fill="hsl(220, 20%, 20%)"
                animate={{ cx: [50, 51, 50, 49, 50] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.ellipse
                cx="74"
                cy="60"
                rx="3.5"
                ry="4"
                fill="hsl(220, 20%, 20%)"
                animate={{ cx: [74, 75, 74, 73, 74] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <circle cx="53" cy="57" r="1.5" fill="white" />
              <circle cx="77" cy="57" r="1.5" fill="white" />
              
              {/* Smile - bigger when door opens */}
              <motion.path
                d="M 52 75 Q 60 84 68 75"
                fill="none"
                stroke="hsl(220, 20%, 20%)"
                strokeWidth="2.5"
                strokeLinecap="round"
                animate={{
                  d: step >= 2 
                    ? ["M 50 73 Q 60 88 70 73", "M 50 74 Q 60 90 70 74", "M 50 73 Q 60 88 70 73"]
                    : ["M 52 75 Q 60 84 68 75", "M 52 76 Q 60 86 68 76", "M 52 75 Q 60 84 68 75"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Blush */}
              <ellipse cx="40" cy="70" rx="5" ry="2.5" fill="hsl(350, 80%, 80%)" opacity="0.6" />
              <ellipse cx="80" cy="70" rx="5" ry="2.5" fill="hsl(350, 80%, 80%)" opacity="0.6" />
            </motion.g>

            {/* Arm attached to the left side of fridge body */}
            <motion.g
              style={{ transformOrigin: "25px 65px" }}
              animate={{
                rotate: step === 0 ? 0 : step === 1 ? 25 : 45,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Shoulder connection to fridge */}
              <ellipse
                cx="22"
                cy="65"
                rx="8"
                ry="10"
                fill="hsl(160, 84%, 39%)"
              />
              
              {/* Upper arm */}
              <motion.ellipse
                cx="12"
                cy="68"
                rx="10"
                ry="6"
                fill="hsl(160, 84%, 42%)"
                animate={{
                  cx: step === 0 ? 12 : step === 1 ? 18 : 22,
                  cy: step === 0 ? 68 : step === 1 ? 62 : 55,
                }}
                transition={{ duration: 0.4 }}
              />
              
              {/* Hand */}
              <motion.g
                animate={{
                  x: step === 0 ? 0 : step === 1 ? 55 : 60,
                  y: step === 0 ? 0 : step === 1 ? -8 : -12,
                }}
                transition={{ duration: 0.4 }}
              >
                <circle
                  cx="5"
                  cy="68"
                  r="8"
                  fill="hsl(160, 84%, 48%)"
                />
                {/* Fingers - curl around handle when grabbing */}
                <motion.g
                  animate={{
                    rotate: step >= 1 ? -30 : 0,
                  }}
                  style={{ transformOrigin: "5px 68px" }}
                  transition={{ duration: 0.3 }}
                >
                  <circle cx="11" cy="63" r="3" fill="hsl(160, 84%, 48%)" />
                  <circle cx="13" cy="68" r="3" fill="hsl(160, 84%, 48%)" />
                  <circle cx="11" cy="73" r="3" fill="hsl(160, 84%, 48%)" />
                </motion.g>
              </motion.g>
            </motion.g>

            {/* Little feet */}
            <ellipse cx="45" cy="108" rx="10" ry="5" fill="hsl(160, 84%, 32%)" />
            <ellipse cx="75" cy="108" rx="10" ry="5" fill="hsl(160, 84%, 32%)" />
          </svg>

          {/* Scan effect overlay */}
          {step >= 2 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute w-20 h-1 bg-primary rounded-full"
                style={{ left: '25%' }}
                animate={{ 
                  y: [-20, 40, -20],
                  opacity: [0.4, 1, 1, 0.4]
                }}
                transition={{ 
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                initial={{ boxShadow: "0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary))" }}
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

        {/* Arrow/Flow indicator - always visible */}
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

        {/* Recipe Cards - always visible */}
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
            
            {/* Success badge */}
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
