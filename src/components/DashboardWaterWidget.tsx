import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Check, Droplets } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getLocalDateISO } from "@/lib/localDate";
import { ML_PER_WATER_GLASS } from "@/lib/waterUnits";

interface DashboardWaterWidgetProps {
  waterGlasses: number;
  onWaterUpdate: (glasses: number) => void;
}

export const DashboardWaterWidget = ({ waterGlasses, onWaterUpdate }: DashboardWaterWidgetProps) => {
  const { user } = useAuth();
  const [goalReached, setGoalReached] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressInterval = useRef<NodeJS.Timeout | null>(null);
  
  const ML_PER_STEP = ML_PER_WATER_GLASS;
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
        title: "Tagesziel erreicht!",
        description: `Du hast ${targetLiters}L Wasser getrunken.`,
      });
      setTimeout(() => setGoalReached(false), 3000);
    }
    
    // Background save
    const today = getLocalDateISO();
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
    <div className="flex-shrink-0 w-full">
      {/* Compact horizontal water widget */}
      <div className={`
        relative overflow-hidden rounded-2xl p-4
        bg-gradient-to-r from-emerald-50/80 via-white/90 to-emerald-50/80
        dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-emerald-950/40
        border border-emerald-200/40 dark:border-emerald-800/30
        ${isComplete ? 'ring-1 ring-emerald-400/40' : ''}
        transition-all duration-300
      `}>
        {/* Goal glow */}
        <AnimatePresence>
          {(isComplete || goalReached) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-emerald-400/10 to-emerald-400/5 pointer-events-none"
            />
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-4">
          {/* Water glass visual */}
          <div className="relative w-14 h-16 flex-shrink-0">
            {/* Glass container */}
            <div className="absolute inset-0 rounded-b-2xl rounded-t-lg border-2 border-emerald-300/50 dark:border-emerald-600/40 bg-emerald-50/30 dark:bg-emerald-950/30 overflow-hidden">
              {/* Water fill */}
              <motion.div
                className="absolute bottom-0 left-0 right-0"
                animate={{ height: `${fillPercent}%` }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/70 via-emerald-400/50 to-emerald-300/30 dark:from-emerald-500/60 dark:via-emerald-400/40 dark:to-emerald-300/20" />
                
                {/* Wave */}
                <svg className="absolute -top-1.5 left-0 w-full h-3" viewBox="0 0 60 10" preserveAspectRatio="none">
                  <motion.path
                    fill="rgba(16, 185, 129, 0.5)"
                    animate={{
                      d: [
                        "M0 5 Q 15 2, 30 5 T 60 5 L 60 10 L 0 10 Z",
                        "M0 5 Q 15 8, 30 5 T 60 5 L 60 10 L 0 10 Z",
                        "M0 5 Q 15 2, 30 5 T 60 5 L 60 10 L 0 10 Z",
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </svg>
                
                {/* Bubbles */}
                {fillPercent > 15 && (
                  <>
                    <motion.div
                      className="absolute w-1 h-1 rounded-full bg-white/50"
                      style={{ left: '25%', bottom: '20%' }}
                      animate={{ y: [-2, -10, -2], opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute w-1.5 h-1.5 rounded-full bg-white/40"
                      style={{ left: '60%', bottom: '30%' }}
                      animate={{ y: [-3, -12, -3], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    />
                  </>
                )}
              </motion.div>
              
              {/* Glass reflection */}
              <div className="absolute top-1 left-1 w-1.5 h-8 rounded-full bg-gradient-to-b from-white/40 to-transparent rotate-6" />
            </div>
          </div>
          
          {/* Info section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">Wasser</span>
              {isComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
                >
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </motion.div>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span 
                className="text-2xl font-bold text-foreground"
                key={currentLiters}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
              >
                {currentLiters}
              </motion.span>
              <span className="text-sm text-muted-foreground">/ {targetLiters}L</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Heute • {Math.round(fillPercent)}% erreicht
            </p>
          </div>
          
          {/* Control buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
          {/* Minus */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onPointerDown={() => handlePressStart(-1)}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              disabled={waterGlasses <= 0}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800
                         flex items-center justify-center
                         border border-slate-200/50 dark:border-slate-700/50
                         active:bg-slate-200 dark:active:bg-slate-700
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors touch-none"
            >
              <Minus className="w-4 h-4 text-slate-600 dark:text-slate-400" strokeWidth={2.5} />
            </motion.button>
            
            {/* Plus */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onPointerDown={() => handlePressStart(1)}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              className="w-10 h-10 rounded-xl bg-emerald-500 dark:bg-emerald-600
                         flex items-center justify-center
                         active:bg-emerald-600 dark:active:bg-emerald-700
                         transition-colors shadow-sm shadow-emerald-500/30 touch-none"
            >
              <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
            animate={{ width: `${fillPercent}%` }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          />
        </div>
      </div>
    </div>
  );
};
