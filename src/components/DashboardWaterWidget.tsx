import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DashboardWaterWidgetProps {
  waterGlasses: number;
  onWaterUpdate: (glasses: number) => void;
}

// Cup icon component
const CupIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" x2="6" y1="2" y2="4" />
    <line x1="10" x2="10" y1="2" y2="4" />
    <line x1="14" x2="14" y1="2" y2="4" />
  </svg>
);

export const DashboardWaterWidget = ({ waterGlasses, onWaterUpdate }: DashboardWaterWidgetProps) => {
  const { user } = useAuth();
  const [showCheck, setShowCheck] = useState(false);
  
  const ML_PER_CUP = 200;
  const targetMl = 2000; // 2L goal
  const targetCups = targetMl / ML_PER_CUP; // 10 cups
  const currentMl = waterGlasses * ML_PER_CUP;
  const waterLiters = (currentMl / 1000).toFixed(1);
  const fillPercent = Math.min((currentMl / targetMl) * 100, 100);
  const isComplete = currentMl >= targetMl;
  
  const updateWater = async (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    const newGlasses = Math.max(0, waterGlasses + delta);
    if (newGlasses === waterGlasses) return;
    
    // Instant UI update
    onWaterUpdate(newGlasses);
    
    // Show checkmark animation when goal reached
    if (delta > 0 && newGlasses * ML_PER_CUP >= targetMl && currentMl < targetMl) {
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
          </>
        )}
      </motion.div>
      
      {/* Content */}
      <div className="relative z-10 p-3 h-full flex flex-col">
        {/* Top row: Droplet left, Cup/Check right */}
        <div className="flex items-start justify-between">
          <CupIcon className="w-4 h-4 text-sky-400" />
          
          {/* Cup button (top right) or Checkmark */}
          <AnimatePresence mode="wait">
            {(isComplete || showCheck) ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </motion.div>
            ) : (
              <motion.button
                key="add"
                whileTap={{ scale: 0.85 }}
                onClick={(e) => updateWater(1, e)}
                className="w-6 h-6 rounded-full bg-sky-500/30 flex items-center justify-center active:bg-sky-500/50 transition-colors"
              >
                <CupIcon className="w-3.5 h-3.5 text-sky-300" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* Middle: Water amount */}
        <div className="flex-1 flex items-center">
          <div>
            <p className="text-lg font-bold text-foreground">{waterLiters}L</p>
            <p className="text-[10px] text-muted-foreground">von 2.0L</p>
          </div>
        </div>
        
        {/* Bottom left: Minus button */}
        <div className="flex justify-start">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => updateWater(-1, e)}
            className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center active:bg-sky-500/30 transition-colors"
            disabled={waterGlasses <= 0}
          >
            <Minus className="w-3 h-3 text-sky-400" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
