import { motion } from "framer-motion";
import { PersonStanding, Scale, Calendar } from "lucide-react";
import { StepCard } from "../components";
import { WheelPicker } from "@/components/WheelPicker";
import { StepProps } from "../types";

export const BodyBasicsStep = ({ userData, setUserData }: StepProps) => {
  return (
    <StepCard step="body-basics">
      <div className="flex flex-col items-center text-center px-4 w-full">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ duration: 0.4 }} 
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3 shadow-lg"
        >
          <PersonStanding className="w-7 h-7 text-primary-foreground" />
        </motion.div>
        
        <h1 className="text-xl font-bold mb-1">Deine Körperdaten</h1>
        <p className="text-muted-foreground/40 text-xs mb-4">Scrolle um Werte einzustellen</p>
        
        {/* Three wheel pickers side by side */}
        <div className="w-full max-w-md grid grid-cols-3 gap-2">
          {/* Height Picker */}
          <motion.div 
            className="rounded-2xl bg-card border-2 border-border overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
              <PersonStanding className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Größe</span>
            </div>
            <WheelPicker
              value={userData.height}
              onChange={(val) => setUserData({ ...userData, height: val })}
              min={60}
              max={220}
              step={1}
              unit="cm"
            />
          </motion.div>
          
          {/* Weight Picker */}
          <motion.div 
            className="rounded-2xl bg-card border-2 border-border overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
              <Scale className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Gewicht</span>
            </div>
            <WheelPicker
              value={userData.weight}
              onChange={(val) => setUserData({ ...userData, weight: val })}
              min={10}
              max={250}
              step={1}
              unit="kg"
            />
          </motion.div>
          
          {/* Age Picker */}
          <motion.div 
            className="rounded-2xl bg-card border-2 border-border overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Alter</span>
            </div>
            <WheelPicker
              value={userData.age}
              onChange={(val) => setUserData({ ...userData, age: val })}
              min={10}
              max={100}
              step={1}
              unit="J."
            />
          </motion.div>
        </div>
        
        <motion.div
          className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-primary/5 border border-primary/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <span className="text-sm">🔒</span>
          <span className="text-xs text-muted-foreground/60">100% privat</span>
        </motion.div>
      </div>
    </StepCard>
  );
};
