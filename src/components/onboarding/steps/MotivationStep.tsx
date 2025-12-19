import { motion } from "framer-motion";
import { StepCard, SelectionCard } from "../components";
import { StepProps } from "../types";
import { Target, Heart, Dumbbell, PartyPopper, Stethoscope, Footprints, Sparkles } from "lucide-react";

export const MotivationStep = ({ userData, setUserData }: StepProps) => {
  const motivations = [
    { id: "health", label: "Gesünder leben", icon: Heart, desc: "Mehr Energie im Alltag", color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { id: "confidence", label: "Selbstbewusster fühlen", icon: Dumbbell, desc: "Wohler im eigenen Körper", color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
    { id: "event", label: "Für ein Event", icon: PartyPopper, desc: "Hochzeit, Urlaub, etc.", color: 'text-pink-500', bgColor: 'bg-pink-500/20' },
    { id: "doctor", label: "Arzt empfohlen", icon: Stethoscope, desc: "Medizinischer Rat", color: 'text-cyan-500', bgColor: 'bg-cyan-500/20' },
    { id: "fitness", label: "Fitness verbessern", icon: Footprints, desc: "Sportliche Ziele", color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
    { id: "habit", label: "Bessere Gewohnheiten", icon: Sparkles, desc: "Langfristige Änderung", color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
  ];

  return (
    <StepCard step="motivation">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
        >
          <Target className="w-8 h-8 text-primary" />
        </motion.div>
        
        <motion.h1
          className="text-2xl font-bold mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          Was motiviert dich?
        </motion.h1>
        <motion.p
          className="text-muted-foreground/50 text-xs mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Hilft uns, dich besser zu unterstützen
        </motion.p>
        
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {motivations.map((option, i) => {
            const IconComponent = option.icon;
            return (
              <SelectionCard
                key={option.id}
                selected={userData.motivation === option.id}
                onClick={() => setUserData({ ...userData, motivation: option.id })}
                delay={0.1 + i * 0.05}
                className="flex flex-col items-center gap-2 p-4"
              >
                <div className={`w-10 h-10 rounded-xl ${option.bgColor} flex items-center justify-center ${option.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-[10px] text-muted-foreground/50">{option.desc}</span>
              </SelectionCard>
            );
          })}
        </div>
      </div>
    </StepCard>
  );
};