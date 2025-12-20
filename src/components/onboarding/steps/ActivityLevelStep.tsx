import { motion } from "framer-motion";
import { Activity, Armchair, Footprints, Flame, Check } from "lucide-react";
import { StepCard } from "../components";
import { StepProps } from "../types";

export const ActivityLevelStep = ({ userData, setUserData }: StepProps) => {
  const activityLevels = [
    { id: "low", label: "Wenig aktiv", icon: Armchair, desc: "Bürojob, wenig Bewegung", color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
    { id: "medium", label: "Aktiv", icon: Footprints, desc: "Regelmäßige Workouts", color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
    { id: "high", label: "Sehr aktiv", icon: Flame, desc: "Intensives Training", color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
  ];

  return (
    <StepCard step="planning-setup">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ duration: 0.4 }} 
          className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"
        >
          <Activity className="w-8 h-8 text-primary" />
        </motion.div>
        
        <h1 className="text-2xl font-bold mb-1">Aktivitätslevel</h1>
        <p className="text-muted-foreground/40 text-xs mb-6">Wie aktiv bist du?</p>
        
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {activityLevels.map((level, i) => {
            const IconComponent = level.icon;
            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUserData({ ...userData, activityLevel: level.id })}
                className={`relative w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  userData.activityLevel === level.id
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${level.bgColor} flex items-center justify-center ${level.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-bold block">{level.label}</span>
                  <span className="text-xs text-muted-foreground/60">{level.desc}</span>
                </div>
                {userData.activityLevel === level.id && (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ duration: 0.2 }} 
                    className="w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </StepCard>
  );
};
