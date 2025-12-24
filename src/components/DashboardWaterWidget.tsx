import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, Minus, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DashboardWaterWidgetProps {
  waterGlasses: number;
  onWaterUpdate: (glasses: number) => void;
}

export const DashboardWaterWidget = ({ waterGlasses, onWaterUpdate }: DashboardWaterWidgetProps) => {
  const { user } = useAuth();
  const [showCheck, setShowCheck] = useState(false);
  
  const ML_PER_CUP = 200;
  const targetMl = 2000;
  const currentMl = waterGlasses * ML_PER_CUP;
  const waterLiters = (currentMl / 1000).toFixed(1);
  const fillPercent = Math.min((currentMl / targetMl) * 100, 100);
  const isComplete = currentMl >= targetMl;
  
  const updateWater = async (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    const newGlasses = Math.max(0, waterGlasses + delta);
    if (newGlasses === waterGlasses) return;
    
    onWaterUpdate(newGlasses);
    
    if (delta > 0 && newGlasses * ML_PER_CUP >= targetMl && currentMl < targetMl) {
      setShowCheck(true);
      toast({
        title: "🎉 Wasserziel erreicht!",
        description: "Du hast 2L Wasser getrunken!",
      });
      setTimeout(() => setShowCheck(false), 2000);
    }
    
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
  
  return (
    <div className="relative flex-shrink-0 w-28 h-[100px] rounded-2xl border border-sky-500/30 overflow-hidden bg-gradient-to-b from-sky-950/40 to-sky-900/20">
      {/* Water Fill */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-500/60 via-sky-400/40 to-sky-300/20"
        animate={{ height: `${fillPercent}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Wave */}
        <svg className="absolute -top-2 left-0 w-full h-3" viewBox="0 0 100 10" preserveAspectRatio="none">
          <motion.path
            d="M0 5 Q 25 0, 50 5 T 100 5 L 100 10 L 0 10 Z"
            fill="rgba(56, 189, 248, 0.4)"
            animate={{ 
              d: [
                "M0 5 Q 25 0, 50 5 T 100 5 L 100 10 L 0 10 Z",
                "M0 5 Q 25 10, 50 5 T 100 5 L 100 10 L 0 10 Z",
                "M0 5 Q 25 0, 50 5 T 100 5 L 100 10 L 0 10 Z"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Bubbles */}
        {fillPercent > 15 && (
          <>
            <motion.div
              className="absolute w-1 h-1 rounded-full bg-white/40"
              style={{ left: '25%', bottom: '30%' }}
              animate={{ y: [-2, -10, -2], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
              style={{ left: '65%', bottom: '20%' }}
              animate={{ y: [-3, -12, -3], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
      </motion.div>
      
      {/* Content */}
      <div className="relative z-10 p-2.5 h-full flex flex-col justify-between">
        {/* Header: Icon + Add button */}
        <div className="flex items-center justify-between">
          <Droplet className="w-4 h-4 text-sky-400" />
          
          <AnimatePresence mode="wait">
            {(isComplete || showCheck) ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </motion.div>
            ) : (
              <motion.button
                key="add"
                whileTap={{ scale: 0.9 }}
                onClick={(e) => updateWater(1, e)}
                className="w-6 h-6 rounded-full bg-sky-500/40 flex items-center justify-center active:bg-sky-500/60"
              >
                <Plus className="w-3.5 h-3.5 text-sky-200" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* Center: Amount */}
        <div>
          <p className="text-lg font-bold text-foreground leading-none">{waterLiters}L</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">von 2.0L</p>
        </div>
        
        {/* Footer: Minus button */}
        <div className="flex justify-start">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => updateWater(-1, e)}
            disabled={waterGlasses <= 0}
            className="w-5 h-5 rounded-full bg-sky-500/30 flex items-center justify-center active:bg-sky-500/50 disabled:opacity-30"
          >
            <Minus className="w-3 h-3 text-sky-300" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
