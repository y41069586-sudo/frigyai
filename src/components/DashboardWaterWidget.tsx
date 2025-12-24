import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Plus, Minus, Check } from "lucide-react";
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
  
  const targetGlasses = 8; // 8 glasses = 2L (250ml each)
  const waterLiters = (waterGlasses * 0.25).toFixed(1);
  const fillPercent = Math.min((waterGlasses / targetGlasses) * 100, 100);
  const isComplete = waterGlasses >= targetGlasses;
  
  const updateWater = async (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    const newGlasses = Math.max(0, waterGlasses + delta);
    if (newGlasses === waterGlasses) return;
    
    // Instant UI update
    onWaterUpdate(newGlasses);
    
    // Show checkmark animation when goal reached
    if (delta > 0 && newGlasses >= targetGlasses && waterGlasses < targetGlasses) {
      setShowCheck(true);
      toast({
        title: "🎉 Wasserziel erreicht!",
        description: "Du hast 2L Wasser getrunken!",
      });
      setTimeout(() => setShowCheck(false), 2000);
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
  
  return (
    <div className="relative flex-shrink-0 w-28 h-[100px] rounded-2xl border border-sky-500/20 overflow-hidden bg-sky-950/20">
      {/* Water Fill Animation */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-500/50 via-sky-400/40 to-sky-300/30"
        animate={{ height: `${fillPercent}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Animated waves */}
        <svg 
          className="absolute -top-2 left-0 w-full h-4" 
          viewBox="0 0 100 10" 
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0 5 Q 12.5 0, 25 5 T 50 5 T 75 5 T 100 5 L 100 10 L 0 10 Z"
            fill="rgba(56, 189, 248, 0.3)"
            animate={{ 
              d: [
                "M0 5 Q 12.5 0, 25 5 T 50 5 T 75 5 T 100 5 L 100 10 L 0 10 Z",
                "M0 5 Q 12.5 10, 25 5 T 50 5 T 75 5 T 100 5 L 100 10 L 0 10 Z",
                "M0 5 Q 12.5 0, 25 5 T 50 5 T 75 5 T 100 5 L 100 10 L 0 10 Z"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
        <svg 
          className="absolute -top-1 left-0 w-full h-3" 
          viewBox="0 0 100 10" 
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0 5 Q 12.5 10, 25 5 T 50 5 T 75 5 T 100 5 L 100 10 L 0 10 Z"
            fill="rgba(14, 165, 233, 0.4)"
            animate={{ 
              d: [
                "M0 5 Q 12.5 10, 25 5 T 50 5 T 75 5 T 100 5 L 100 10 L 0 10 Z",
                "M0 5 Q 12.5 0, 25 5 T 50 5 T 75 5 T 100 5 L 100 10 L 0 10 Z",
                "M0 5 Q 12.5 10, 25 5 T 50 5 T 75 5 T 100 5 L 100 10 L 0 10 Z"
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </svg>
        
        {/* Bubbles */}
        {fillPercent > 10 && (
          <>
            <motion.div
              className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
              style={{ left: '20%', bottom: '20%' }}
              animate={{ y: [-5, -15, -5], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-1 h-1 rounded-full bg-white/20"
              style={{ left: '60%', bottom: '30%' }}
              animate={{ y: [-3, -12, -3], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
              className="absolute w-1 h-1 rounded-full bg-white/25"
              style={{ left: '75%', bottom: '15%' }}
              animate={{ y: [-4, -10, -4], opacity: [0.25, 0.5, 0.25] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
            />
          </>
        )}
      </motion.div>
      
      {/* Content */}
      <div className="relative z-10 p-3 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Droplets className="w-4 h-4 text-sky-400" />
          
          {/* Checkmark Animation */}
          <AnimatePresence>
            {(isComplete || showCheck) && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div>
          <p className="text-lg font-bold text-foreground">{waterLiters}L</p>
          <p className="text-[10px] text-muted-foreground">von 2.0L</p>
        </div>
        
        {/* Control buttons */}
        <div className="flex gap-1.5">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => updateWater(-1, e)}
            className="flex-1 h-6 rounded-md bg-sky-500/20 flex items-center justify-center active:bg-sky-500/30 transition-colors"
            disabled={waterGlasses <= 0}
          >
            <Minus className="w-3 h-3 text-sky-400" strokeWidth={2.5} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => updateWater(1, e)}
            className="flex-1 h-6 rounded-md bg-sky-500/30 flex items-center justify-center active:bg-sky-500/40 transition-colors"
          >
            <Plus className="w-3 h-3 text-sky-400" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
