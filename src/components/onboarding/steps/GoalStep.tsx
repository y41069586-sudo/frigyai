import { motion } from "framer-motion";
import { Flame, Scale, Dumbbell, Salad } from "lucide-react";
import { StepCard, SelectionCard } from "../components";
import { StepProps } from "../types";

export const GoalStep = ({ userData, setUserData }: StepProps) => {
  const goalOptions = [
    { id: "lose", label: "Abnehmen", Icon: Flame, desc: "Fett verbrennen" },
    { id: "maintain", label: "Gewicht halten", Icon: Scale, desc: "Balance finden" },
    { id: "gain", label: "Muskeln aufbauen", Icon: Dumbbell, desc: "Masse aufbauen" },
    { id: "healthier", label: "Gesünder essen", Icon: Salad, desc: "Nährstoffe optimieren" },
  ];

  return (
    <StepCard step="goal">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ duration: 0.4 }}
          className="text-5xl mb-4"
        >
          🎯
        </motion.div>
        
        <h1 className="text-2xl font-bold mb-1">Was ist dein Ziel?</h1>
        <p className="text-muted-foreground/60 text-xs mb-6">
          Wähle aus, wir personalisieren alles für dich
        </p>
        
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {goalOptions.map((option, i) => (
            <SelectionCard
              key={option.id}
              selected={userData.goal === option.id}
              onClick={() => setUserData({ ...userData, goal: option.id })}
              delay={i * 0.05}
              className="flex flex-col items-center gap-2 p-5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <option.Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">{option.label}</span>
              <span className="text-[10px] text-muted-foreground/50">{option.desc}</span>
            </SelectionCard>
          ))}
        </div>
      </div>
    </StepCard>
  );
};
