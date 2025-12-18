import { motion } from "framer-motion";
import { StepCard, SelectionCard } from "../components";
import { StepProps } from "../types";
import { Clock } from "lucide-react";

export const CookingTimeStep = ({ userData, setUserData }: StepProps) => {
  const timeOptions = [
    { 
      id: 'quick' as const, 
      label: '15 Minuten', 
      emoji: '⚡', 
      desc: 'Schnelle Gerichte',
      color: 'from-green-500/20 to-emerald-500/20'
    },
    { 
      id: 'medium' as const, 
      label: '30 Minuten', 
      emoji: '🍳', 
      desc: 'Normale Rezepte',
      color: 'from-yellow-500/20 to-orange-500/20'
    },
    { 
      id: 'long' as const, 
      label: '45+ Minuten', 
      emoji: '👨‍🍳', 
      desc: 'Aufwendige Küche',
      color: 'from-purple-500/20 to-pink-500/20'
    },
  ];

  return (
    <StepCard step="cooking-time">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        >
          <Clock className="w-8 h-8 text-primary" />
        </motion.div>
        
        <motion.h1
          className="text-2xl font-bold mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          Wie viel Zeit zum Kochen?
        </motion.h1>
        <motion.p
          className="text-muted-foreground/50 text-xs mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Für passende Rezeptvorschläge
        </motion.p>
        
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {timeOptions.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08, duration: 0.3, ease: "easeOut" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserData({ ...userData, cookingTime: option.id })}
              className={`relative p-4 rounded-xl border-2 transition-all overflow-hidden ${
                userData.cookingTime === option.id
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${option.color} opacity-50`} />
              <div className="relative z-10 flex items-center gap-4">
                <span className="text-3xl">{option.emoji}</span>
                <div className="text-left flex-1">
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-xs text-muted-foreground/60">{option.desc}</p>
                </div>
                {userData.cookingTime === option.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
        
        <motion.p
          className="text-xs text-muted-foreground/40 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          Du kannst dies später in den Einstellungen ändern
        </motion.p>
      </div>
    </StepCard>
  );
};
