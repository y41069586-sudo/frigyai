import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { AnimatedFrigyMascot } from "./AnimatedFrigyMascot";

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

// Floating ingredient component
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
    className="absolute text-3xl pointer-events-none drop-shadow-lg"
    style={{ left: `${x}%` }}
    initial={{ opacity: 0, y: 80, scale: 0.5 }}
    animate={{ 
      opacity: [0, 1, 1, 0],
      y: [80, 0, -40, -100],
      scale: [0.5, 1.1, 1, 0.8],
      rotate: [-15, 10, -10, 15]
    }}
    transition={{ 
      duration: duration,
      delay: delay,
      repeat: Infinity,
      repeatDelay: 1.5,
      ease: "easeOut"
    }}
  >
    {emoji}
  </motion.div>
);

// Mini mascot for minimized state
const MiniFrigyMascot = () => (
  <motion.svg
    width={48}
    height={48}
    viewBox="0 0 200 240"
    animate={{ rotate: [-5, 5, -5] }}
    transition={{ duration: 1, repeat: Infinity }}
  >
    <defs>
      <linearGradient id="miniFridgeBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#86efac" />
        <stop offset="50%" stopColor="#6ee7b7" />
        <stop offset="100%" stopColor="#4ade80" />
      </linearGradient>
      <linearGradient id="miniFreezerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f0fdf4" />
        <stop offset="100%" stopColor="#dcfce7" />
      </linearGradient>
    </defs>
    <rect x="40" y="25" width="120" height="200" rx="12" fill="url(#miniFridgeBodyGrad)" />
    <rect x="50" y="35" width="100" height="75" rx="8" fill="url(#miniFreezerGrad)" />
    <rect x="50" y="120" width="100" height="95" rx="8" fill="url(#miniFreezerGrad)" />
    <ellipse cx="80" cy="65" rx="8" ry="9" fill="#1f2937" />
    <ellipse cx="83" cy="62" rx="3" ry="3" fill="white" />
    <ellipse cx="120" cy="65" rx="8" ry="9" fill="#1f2937" />
    <ellipse cx="123" cy="62" rx="3" ry="3" fill="white" />
    <path d="M75 85 Q100 105 125 85" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" fill="none" />
    <ellipse cx="65" cy="78" rx="10" ry="6" fill="#fca5a5" opacity="0.5" />
    <ellipse cx="135" cy="78" rx="10" ry="6" fill="#fca5a5" opacity="0.5" />
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
  const minDisplayTime = 1000;

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

  // Minimized floating indicator
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
            <MiniFrigyMascot />
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
          {/* Heavy blur background overlay */}
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-950/95 backdrop-blur-xl" />
          
          {/* Very subtle gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/40 via-transparent to-emerald-50/30 dark:from-emerald-950/30 dark:via-transparent dark:to-emerald-950/20" />
          
          {/* Soft ambient glow - very subtle */}
          <motion.div 
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-300/20 dark:bg-emerald-500/10 blur-3xl"
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.6, 0.4]
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
                         hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm z-20"
            >
              <X className="w-4 h-4 text-slate-500" />
            </motion.button>
          )}

          <div className="relative flex flex-col items-center gap-6 p-8 text-center max-w-md z-10">
            
            {/* Floating ingredients around mascot */}
            <div className="absolute inset-0 -top-32 pointer-events-none">
              <FloatingIngredient emoji="🥕" delay={0} x={10} duration={3} />
              <FloatingIngredient emoji="🥦" delay={0.8} x={80} duration={3.5} />
              <FloatingIngredient emoji="🍳" delay={1.6} x={20} duration={3.2} />
              <FloatingIngredient emoji="🥗" delay={0.4} x={75} duration={3.3} />
              <FloatingIngredient emoji="🍎" delay={1.2} x={50} duration={3.1} />
              <FloatingIngredient emoji="🧀" delay={2} x={5} duration={2.9} />
              <FloatingIngredient emoji="🍞" delay={2.4} x={90} duration={3.4} />
            </div>

            {/* Main Frigy mascot from Onboarding - centered and prominent */}
            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Soft glow behind mascot */}
              <motion.div 
                className="absolute inset-0 -inset-x-8 -inset-y-8 bg-gradient-radial from-emerald-300/40 to-transparent rounded-full blur-2xl"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.7, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Mascot with bounce animation */}
              <motion.div
                animate={{ 
                  y: [0, -12, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <AnimatedFrigyMascot size={200} animate={false} />
              </motion.div>
              
              {/* Landing shadow */}
              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900/10 dark:bg-white/5 rounded-full blur-md"
                animate={{
                  scaleX: [1, 1.2, 1],
                  opacity: [0.4, 0.6, 0.4]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Motivational text - more prominent */}
            <div className="h-16 flex items-center justify-center mt-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTextIndex}
                  initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-relaxed"
                >
                  {motivationalTexts[currentTextIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Breathing dots */}
            <div className="flex gap-3 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Minimize hint */}
            {onMinimize && (
              <motion.p 
                className="text-sm text-slate-500 dark:text-slate-400 mt-6"
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
