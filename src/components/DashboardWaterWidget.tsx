import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Check, Droplets, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DashboardWaterWidgetProps {
  waterGlasses: number;
  onWaterUpdate: (glasses: number) => void;
}

export const DashboardWaterWidget = ({ waterGlasses, onWaterUpdate }: DashboardWaterWidgetProps) => {
  const { user } = useAuth();
  const [goalReached, setGoalReached] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressInterval = useRef<NodeJS.Timeout | null>(null);
  
  const ML_PER_STEP = 200;
  const targetMl = 2000;
  const currentMl = waterGlasses * ML_PER_STEP;
  const currentLiters = (currentMl / 1000).toFixed(1);
  const targetLiters = (targetMl / 1000).toFixed(1);
  const fillPercent = Math.min((currentMl / targetMl) * 100, 100);
  const isComplete = currentMl >= targetMl;
  
  const updateWater = async (delta: number) => {
    if (!user) return;
    
    const newGlasses = Math.max(0, waterGlasses + delta);
    if (newGlasses === waterGlasses) return;
    
    onWaterUpdate(newGlasses);
    
    // Goal reached notification
    if (delta > 0 && newGlasses * ML_PER_STEP >= targetMl && currentMl < targetMl) {
      setGoalReached(true);
      toast({
        title: "🎉 Tagesziel erreicht!",
        description: `Du hast ${targetLiters}L Wasser getrunken.`,
      });
      setTimeout(() => setGoalReached(false), 3000);
    }
    
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
      }, 120);
    }, 300);
  };
  
  const handlePressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (longPressInterval.current) clearInterval(longPressInterval.current);
  };
  
  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Main widget */}
      <div className={`
        relative overflow-hidden rounded-3xl
        bg-gradient-to-br from-cyan-50/80 via-sky-50/60 to-blue-50/80
        dark:from-cyan-950/30 dark:via-sky-950/40 dark:to-blue-950/30
        border border-cyan-200/40 dark:border-cyan-800/30
        shadow-sm
        ${isComplete ? 'ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/10' : ''}
        transition-all duration-300
      `}>
        {/* Animated background glow */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-emerald-400/10 to-emerald-400/5 pointer-events-none"
            />
          )}
        </AnimatePresence>
        
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-cyan-500/15 rounded-xl">
                <Droplets className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-bold text-foreground">Wasser</p>
                <p className="text-xs text-muted-foreground">Hydriert bleiben</p>
              </div>
            </div>
            {isComplete && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </div>
          
          {/* Interactive glass + stats */}
          <div className="flex items-center gap-5">
            {/* Animated Water Glass */}
            <div className="relative w-16 h-20 flex-shrink-0">
              {/* Glass outline */}
              <div className="absolute inset-0 rounded-b-3xl rounded-t-lg border-2.5 border-cyan-300/50 dark:border-cyan-600/40 bg-cyan-50/20 dark:bg-cyan-950/20 overflow-hidden backdrop-blur-sm">
                {/* Water fill with gradient */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0"
                  animate={{ height: `${fillPercent}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 25 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/75 via-sky-400/60 to-cyan-300/40 dark:from-cyan-500/70 dark:via-sky-400/50 dark:to-cyan-300/30" />
                  
                  {/* Animated wave */}
                  <svg 
                    className="absolute -top-0.5 left-0 w-full h-2" 
                    viewBox="0 0 64 8" 
                    preserveAspectRatio="none"
                  >
                    <motion.path
                      fill="rgba(34, 211, 238, 0.6)"
                      animate={{
                        d: [
                          "M0 4 Q 16 1, 32 4 T 64 4 L 64 8 L 0 8 Z",
                          "M0 4 Q 16 7, 32 4 T 64 4 L 64 8 L 0 8 Z",
                          "M0 4 Q 16 1, 32 4 T 64 4 L 64 8 L 0 8 Z",
                        ]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </svg>
                  
                  {/* Floating bubbles */}
                  {fillPercent > 20 && (
                    <>
                      <motion.div
                        className="absolute w-1.5 h-1.5 rounded-full bg-white/50"
                        style={{ left: '20%', bottom: '30%' }}
                        animate={{ y: [-2, -12, -2], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="absolute w-1 h-1 rounded-full bg-white/40"
                        style={{ left: '65%', bottom: '40%' }}
                        animate={{ y: [-1, -10, -1], opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
                      />
                    </>
                  )}
                </motion.div>
                
                {/* Glass shine */}
                <div className="absolute top-0.5 left-1 w-1 h-10 rounded-full bg-gradient-to-b from-white/50 to-transparent opacity-70" />
              </div>
            </div>
            
            {/* Stats Section */}
            <div className="flex-1 space-y-2">
              {/* Volume */}
              <div>
                <div className="flex items-baseline gap-1.5">
                  <motion.span 
                    className="text-3xl font-black text-foreground"
                    key={currentLiters}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentLiters}
                  </motion.span>
                  <span className="text-xs font-semibold text-muted-foreground">/ {targetLiters}L</span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-2 bg-cyan-200/30 dark:bg-cyan-800/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 rounded-full shadow-lg shadow-cyan-500/30"
                  animate={{ width: `${fillPercent}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
              
              {/* Info text */}
              <p className="text-xs text-muted-foreground font-medium">
                {isComplete ? (
                  <span className="text-emerald-600 dark:text-emerald-400">✓ Ziel erreicht!</span>
                ) : (
                  <>Noch {(targetMl - currentMl)} ml</>
                )}
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onPointerDown={() => handlePressStart(-1)}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              disabled={waterGlasses <= 0}
              className="flex-1 h-11 rounded-xl bg-slate-200/60 dark:bg-slate-700/40
                         flex items-center justify-center gap-2
                         border border-slate-300/50 dark:border-slate-600/40
                         hover:bg-slate-200/80 dark:hover:bg-slate-700/60
                         active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all touch-none font-medium text-sm"
            >
              <Minus className="w-4 h-4" strokeWidth={2.5} />
              Weniger
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.88 }}
              onPointerDown={() => handlePressStart(1)}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500
                         dark:from-cyan-600 dark:to-sky-600
                         flex items-center justify-center gap-2
                         border border-cyan-600/50 dark:border-cyan-600/40
                         hover:from-cyan-600 hover:to-sky-600
                         dark:hover:from-cyan-700 dark:hover:to-sky-700
                         active:scale-95 shadow-lg shadow-cyan-500/20
                         transition-all touch-none font-semibold text-sm text-white"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Mehr Wasser
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
