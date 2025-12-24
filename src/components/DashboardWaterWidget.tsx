import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DashboardWaterWidgetProps {
  waterGlasses: number;
  onWaterUpdate: (glasses: number) => void;
}

export const DashboardWaterWidget = ({ waterGlasses, onWaterUpdate }: DashboardWaterWidgetProps) => {
  const { user } = useAuth();
  const [showRipple, setShowRipple] = useState(false);
  const [goalReached, setGoalReached] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressInterval = useRef<NodeJS.Timeout | null>(null);
  
  const ML_PER_STEP = 250;
  const targetMl = 2500;
  const currentMl = waterGlasses * ML_PER_STEP;
  const currentLiters = (currentMl / 1000).toFixed(1);
  const targetLiters = (targetMl / 1000).toFixed(1);
  const fillPercent = Math.min((currentMl / targetMl) * 100, 100);
  const isComplete = currentMl >= targetMl;
  const percentage = Math.round(fillPercent);
  
  useEffect(() => {
    if (isComplete && !goalReached) {
      setGoalReached(true);
      toast({
        title: "Tagesziel erreicht!",
        description: `Du hast ${targetLiters}L Wasser getrunken.`,
      });
    } else if (!isComplete) {
      setGoalReached(false);
    }
  }, [isComplete, goalReached, targetLiters]);
  
  const updateWater = async (delta: number) => {
    if (!user) return;
    
    const newGlasses = Math.max(0, waterGlasses + delta);
    if (newGlasses === waterGlasses) return;
    
    // Ripple animation on add
    if (delta > 0) {
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);
    }
    
    onWaterUpdate(newGlasses);
    
    // Background save
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data: existing } = await supabase
        .from('water_intake')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from('water_intake')
          .update({ glasses: newGlasses })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('water_intake')
          .insert({ user_id: user.id, glasses: newGlasses, date: today });
      }
    } catch (error) {
      console.error('Error updating water:', error);
    }
  };
  
  const handlePressStart = (delta: number) => {
    updateWater(delta);
    longPressTimer.current = setTimeout(() => {
      longPressInterval.current = setInterval(() => {
        updateWater(delta);
      }, 150);
    }, 400);
  };
  
  const handlePressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (longPressInterval.current) clearInterval(longPressInterval.current);
  };
  
  return (
    <div className="relative w-full max-w-[180px] mx-auto">
      {/* Main Card */}
      <div className={`
        relative overflow-hidden rounded-3xl p-4
        bg-gradient-to-b from-white/90 to-slate-50/80
        dark:from-slate-900/90 dark:to-slate-800/80
        border border-sky-100/50 dark:border-sky-900/30
        shadow-lg shadow-sky-100/20 dark:shadow-sky-900/10
        ${isComplete ? 'ring-2 ring-emerald-400/30' : ''}
        transition-all duration-500
      `}>
        {/* Goal reached glow */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-emerald-400/10 via-transparent to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
        
        {/* Water Glass Container */}
        <div className="relative w-28 h-36 mx-auto mb-3">
          {/* Glass outline */}
          <div className="absolute inset-0 rounded-b-[2rem] rounded-t-xl border-2 border-sky-200/60 dark:border-sky-700/40 bg-gradient-to-b from-sky-50/30 to-white/20 dark:from-sky-950/30 dark:to-slate-900/20 overflow-hidden">
            
            {/* Water fill */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 origin-bottom"
              animate={{ height: `${fillPercent}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            >
              {/* Water gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-sky-500/70 via-cyan-400/50 to-sky-300/40 dark:from-sky-600/70 dark:via-cyan-500/50 dark:to-sky-400/40" />
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
              />
              
              {/* Wave 1 */}
              <svg className="absolute -top-3 left-0 w-full h-6" viewBox="0 0 120 20" preserveAspectRatio="none">
                <motion.path
                  fill="rgba(125, 211, 252, 0.5)"
                  animate={{
                    d: [
                      "M0 10 Q 15 5, 30 10 T 60 10 T 90 10 T 120 10 L 120 20 L 0 20 Z",
                      "M0 10 Q 15 15, 30 10 T 60 10 T 90 10 T 120 10 L 120 20 L 0 20 Z",
                      "M0 10 Q 15 5, 30 10 T 60 10 T 90 10 T 120 10 L 120 20 L 0 20 Z",
                    ]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
              
              {/* Wave 2 */}
              <svg className="absolute -top-2 left-0 w-full h-5" viewBox="0 0 120 20" preserveAspectRatio="none">
                <motion.path
                  fill="rgba(56, 189, 248, 0.4)"
                  animate={{
                    d: [
                      "M0 10 Q 20 15, 40 10 T 80 10 T 120 10 L 120 20 L 0 20 Z",
                      "M0 10 Q 20 5, 40 10 T 80 10 T 120 10 L 120 20 L 0 20 Z",
                      "M0 10 Q 20 15, 40 10 T 80 10 T 120 10 L 120 20 L 0 20 Z",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                />
              </svg>
              
              {/* Ripple on add */}
              <AnimatePresence>
                {showRipple && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-white/60"
                  />
                )}
              </AnimatePresence>
              
              {/* Bubbles */}
              {fillPercent > 10 && (
                <>
                  <motion.div
                    className="absolute w-1.5 h-1.5 rounded-full bg-white/50"
                    style={{ left: '20%', bottom: '15%' }}
                    animate={{ y: [-2, -20, -2], opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute w-2 h-2 rounded-full bg-white/40"
                    style={{ left: '55%', bottom: '25%' }}
                    animate={{ y: [-3, -25, -3], opacity: [0.2, 0.6, 0.2], scale: [1, 1.1, 1] }}
                    transition={{ duration: 3.5, repeat: Infinity, delay: 0.8 }}
                  />
                  <motion.div
                    className="absolute w-1 h-1 rounded-full bg-white/60"
                    style={{ left: '75%', bottom: '10%' }}
                    animate={{ y: [-1, -15, -1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 }}
                  />
                </>
              )}
            </motion.div>
            
            {/* Glass reflection */}
            <div className="absolute top-2 left-2 w-3 h-16 rounded-full bg-gradient-to-b from-white/40 to-transparent rotate-12" />
          </div>
          
          {/* Center text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <motion.span 
              className="text-xl font-bold text-slate-700 dark:text-white drop-shadow-sm"
              key={currentLiters}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {currentLiters} L
            </motion.span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / {targetLiters} L
            </span>
          </div>
        </div>
        
        {/* Today label + percentage */}
        <div className="text-center mb-3">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Heute</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{percentage}%</p>
        </div>
        
        {/* Control buttons */}
        <div className="flex justify-center gap-4">
          {/* Minus button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onMouseDown={() => handlePressStart(-1)}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={() => handlePressStart(-1)}
            onTouchEnd={handlePressEnd}
            disabled={waterGlasses <= 0}
            className="w-11 h-11 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 
                       flex items-center justify-center
                       border border-slate-200/50 dark:border-slate-700/50
                       active:bg-slate-200/80 dark:active:bg-slate-700/60
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-colors shadow-sm"
          >
            <Minus className="w-5 h-5 text-slate-500 dark:text-slate-400" strokeWidth={2} />
          </motion.button>
          
          {/* Plus button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onMouseDown={() => handlePressStart(1)}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={() => handlePressStart(1)}
            onTouchEnd={handlePressEnd}
            className="w-11 h-11 rounded-2xl bg-sky-500/20 dark:bg-sky-500/30
                       flex items-center justify-center
                       border border-sky-300/40 dark:border-sky-600/40
                       active:bg-sky-500/30 dark:active:bg-sky-500/40
                       transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 text-sky-600 dark:text-sky-400" strokeWidth={2} />
          </motion.button>
        </div>
        
        {/* Step indicator */}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2">
          ±250 ml
        </p>
      </div>
    </div>
  );
};
