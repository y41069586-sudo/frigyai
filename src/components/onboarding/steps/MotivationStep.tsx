import { motion } from "framer-motion";
import { StepCard, SelectionCard } from "../components";
import { StepProps } from "../types";

export const MotivationStep = ({ userData, setUserData }: StepProps) => {
  const motivations = [
    { id: "health", label: "Gesünder leben", emoji: "❤️", desc: "Mehr Energie im Alltag" },
    { id: "confidence", label: "Selbstbewusster fühlen", emoji: "💪", desc: "Wohler im eigenen Körper" },
    { id: "event", label: "Für ein Event", emoji: "🎉", desc: "Hochzeit, Urlaub, etc." },
    { id: "doctor", label: "Arzt empfohlen", emoji: "🩺", desc: "Medizinischer Rat" },
    { id: "fitness", label: "Fitness verbessern", emoji: "🏃", desc: "Sportliche Ziele" },
    { id: "habit", label: "Bessere Gewohnheiten", emoji: "✨", desc: "Langfristige Änderung" },
  ];

  return (
    <StepCard step="motivation">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-5xl mb-4"
        >
          🎯
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
          {motivations.map((option, i) => (
            <SelectionCard
              key={option.id}
              selected={userData.motivation === option.id}
              onClick={() => setUserData({ ...userData, motivation: option.id })}
              delay={0.1 + i * 0.05}
              className="flex flex-col items-center gap-2 p-4"
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-[10px] text-muted-foreground/50">{option.desc}</span>
            </SelectionCard>
          ))}
        </div>
      </div>
    </StepCard>
  );
};
