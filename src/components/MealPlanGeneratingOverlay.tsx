import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { VectorFrigyMascot } from "./VectorFrigyMascot";

interface MealPlanGeneratingOverlayProps {
  isGenerating: boolean;
  elapsedSeconds: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const motivationalTexts = [
  "Frigy plant deine Woche…",
  "Dein Wochenplan nimmt Form an",
  "Wir machen dir das Denken leicht",
  "Fast geschafft…",
  "Frigy wählt die besten Rezepte",
  "Noch ein kleiner Moment…",
  "Deine Mahlzeiten werden vorbereitet",
];

// Floating vector ingredient component
const FloatingIngredient = ({ 
  emoji, 
  delay, 
  x, 
  duration 
}: { 
  emoji: string; 
  delay: number; 
  x: number; 
  duration: number;
}) => (
  <motion.div
    className="absolute text-2xl pointer-events-none"
    style={{ left: `${x}%` }}
    initial={{ opacity: 0, y: 50, scale: 0.5 }}
    animate={{ 
      opacity: [0, 1, 1, 0],
      y: [50, -20, -60, -100],
      scale: [0.5, 1, 1, 0.8],
      rotate: [-10, 10, -10, 10]
    }}
    transition={{ 
      duration: duration,
      delay: delay,
      repeat: Infinity,
      repeatDelay: 2,
      ease: "easeOut"
    }}
  >
    {emoji}
  </motion.div>
);

// Vector-based mini Frigy for minimized state
const MiniFrigyVector = () => (
  <motion.svg
    width={48}
    height={48}
    viewBox="0 0 100 100"
    animate={{ rotate: [-5, 5, -5] }}
    transition={{ duration: 1, repeat: Infinity }}
  >
    <defs>
      <linearGradient id="miniFridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(160, 84%, 39%)" />
        <stop offset="100%" stopColor="hsl(158, 64%, 52%)" />
      </linearGradient>
    </defs>
    <rect x="20" y="10" width="60" height="80" rx="8" fill="url(#miniFridgeGrad)" />
    <rect x="24" y="14" width="52" height="20" rx="4" fill="hsl(160, 84%, 32%)" />
    <rect x="24" y="38" width="52" height="48" rx="4" fill="hsl(160, 84%, 32%)" />
    <ellipse cx="40" cy="55" rx="6" ry="7" fill="white" />
    <ellipse cx="41" cy="56" rx="3" ry="3.5" fill="hsl(220, 20%, 20%)" />
    <ellipse cx="60" cy="55" rx="6" ry="7" fill="white" />
    <ellipse cx="61" cy="56" rx="3" ry="3.5" fill="hsl(220, 20%, 20%)" />
    <path d="M 42 68 Q 50 76 58 68" fill="none" stroke="hsl(220, 20%, 20%)" strokeWidth="2.5" strokeLinecap="round" />
  </motion.svg>
);

export const MealPlanGeneratingOverlay = ({ 
  isGenerating, 
  elapsedSeconds,
  onMinimize,
  isMinimized = false
}: MealPlanGeneratingOverlayProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const minDisplayTime = 1000; // Minimum 1 second display

  // Handle minimum display time
  useEffect(() => {
    if (isGenerating && !isMinimized) {
      startTimeRef.current = Date.now();
      setShowOverlay(true);
    } else if (!isGenerating && showOverlay) {
      const elapsed = Date.now() - (startTimeRef.current || Date.now());
      const remaining = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        setShowOverlay(false);
        startTimeRef.current = null;
      }, remaining);
    }
  }, [isGenerating, isMinimized]);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentTextIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentTextIndex(prev => (prev + 1) % motivationalTexts.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Minimized floating indicator with vector mascot
  if (isGenerating && isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, y: 100 }}
        className="fixed bottom-24 right-4 z-50"
      >
        <div className="relative">
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(34, 197, 94, 0.4)",
                "0 0 0 15px rgba(34, 197, 94, 0)",
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-card border-2 border-emerald-500 shadow-xl flex items-center justify-center overflow-hidden"
          >
            <MiniFrigyVector />
          </motion.div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
            <motion.div
              className="w-2 h-2 bg-white rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {showOverlay && !isMinimized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        >
          {/* Premium gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-emerald-50/30 to-white dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-950" />
          
          {/* Subtle ambient light */}
          <motion.div 
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Minimize button */}
          {onMinimize && (
            <motion.button
              onClick={onMinimize}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 
                         border border-slate-200/50 dark:border-slate-700/50
                         hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <X className="w-4 h-4 text-slate-500" />
            </motion.button>
          )}

          <div className="relative flex flex-col items-center gap-10 p-8 text-center max-w-sm z-10">
            
            {/* Floating ingredients around mascot */}
            <div className="absolute inset-0 -top-20">
              <FloatingIngredient emoji="🥕" delay={0} x={15} duration={3} />
              <FloatingIngredient emoji="🥦" delay={1} x={75} duration={3.5} />
              <FloatingIngredient emoji="🍳" delay={2} x={25} duration={3.2} />
              <FloatingIngredient emoji="🥗" delay={1.5} x={70} duration={3.3} />
              <FloatingIngredient emoji="🍎" delay={2.5} x={40} duration={3.1} />
            </div>

            {/* Main Frigy mascot - PURE VECTOR, NO IMAGE */}
            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Soft glow behind mascot */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-b from-emerald-400/30 to-teal-400/20 rounded-full blur-2xl scale-150"
                animate={{ 
                  scale: [1.5, 1.7, 1.5],
                  opacity: [0.4, 0.6, 0.4]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Mascot with bounce animation */}
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <VectorFrigyMascot size={144} animate={true} />
                
                {/* Floating ingredient Frigy "holds" */}
                <motion.div
                  className="absolute -top-6 -right-4 text-3xl"
                  animate={{
                    y: [0, -8, 0],
                    rotate: [-10, 15, -10],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                >
                  🥕
                </motion.div>
              </motion.div>
              
              {/* Landing squish effect / shadow */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900/10 dark:bg-white/5 rounded-full blur-sm"
                animate={{
                  scaleX: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Motivational text with smooth transitions */}
            <div className="h-14 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTextIndex}
                  initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-lg font-medium text-slate-700 dark:text-slate-200 leading-relaxed"
                >
                  {motivationalTexts[currentTextIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Subtle breathing dots - minimal, not intrusive */}
            <div className="flex gap-2.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-emerald-500/60"
                  animate={{ 
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 0.9, 0.4]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.25,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Minimize hint - very subtle */}
            {onMinimize && (
              <motion.p 
                className="text-xs text-slate-400 dark:text-slate-500 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                Du kannst weiterstöbern – Frigy arbeitet im Hintergrund
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
