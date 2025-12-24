import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DashboardWaterWidgetProps {
  waterGlasses: number;
  onWaterUpdate: (glasses: number) => void;
}

export const DashboardWaterWidget = ({ waterGlasses, onWaterUpdate }: DashboardWaterWidgetProps) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  
  const targetGlasses = 8; // 8 glasses = 2L (250ml each)
  const waterLiters = (waterGlasses * 0.25).toFixed(1);
  const fillPercent = Math.min((waterGlasses / targetGlasses) * 100, 100);
  const isComplete = waterGlasses >= targetGlasses;
  
  const addWater = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isUpdating) return;
    
    setIsUpdating(true);
    const today = new Date().toISOString().split('T')[0];
    const newGlasses = waterGlasses + 1;
    
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
      
      onWaterUpdate(newGlasses);
      
      // Show checkmark animation when goal reached
      if (newGlasses >= targetGlasses && waterGlasses < targetGlasses) {
        setShowCheck(true);
        toast({
          title: "🎉 Wasserziel erreicht!",
          description: "Du hast 2L Wasser getrunken!",
        });
        setTimeout(() => setShowCheck(false), 2000);
      }
    } catch (error) {
      console.error('Error updating water:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div 
      className="relative flex-shrink-0 w-28 h-[100px] rounded-2xl border border-sky-500/20 cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
      onClick={addWater}
    >
      {/* Water Fill Animation */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-500/40 via-sky-400/30 to-sky-300/20"
        initial={{ height: 0 }}
        animate={{ height: `${fillPercent}%` }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        {/* Wave effect */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-sky-400/20 via-sky-300/40 to-sky-400/20"
          animate={{ 
            x: [0, 10, 0, -10, 0],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          style={{ 
            borderRadius: "0 0 50% 50% / 0 0 100% 100%",
            transform: "translateY(-50%)" 
          }}
        />
      </motion.div>
      
      {/* Content */}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Droplets className="w-5 h-5 text-sky-500" />
          
          {/* Checkmark Animation */}
          <AnimatePresence>
            {(isComplete || showCheck) && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Plus button when not complete */}
          {!isComplete && !showCheck && (
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center"
            >
              <Plus className="w-3 h-3 text-sky-500" strokeWidth={2.5} />
            </motion.div>
          )}
        </div>
        
        <div>
          <p className="text-lg font-bold text-foreground">{waterLiters}L</p>
          <p className="text-[10px] text-muted-foreground">von 2.0L</p>
        </div>
      </div>
      
      {/* Tap ripple effect */}
      {isUpdating && (
        <motion.div
          className="absolute inset-0 bg-sky-500/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
};
