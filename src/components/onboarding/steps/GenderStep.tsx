import { motion } from "framer-motion";
import { User, Check } from "lucide-react";
import { StepCard } from "../components";
import { StepProps } from "../types";

export const GenderStep = ({ userData, setUserData }: StepProps) => {
  const genderOptions = [
    { id: 'male' as const, label: 'Männlich', color: 'from-blue-500/20 to-cyan-500/20' },
    { id: 'female' as const, label: 'Weiblich', color: 'from-pink-500/20 to-rose-500/20' },
  ];

  return (
    <StepCard step="gender">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ duration: 0.4 }} 
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg"
        >
          <User className="w-8 h-8 text-primary-foreground" />
        </motion.div>
        
        <h1 className="text-2xl font-bold mb-1">Dein Geschlecht</h1>
        <p className="text-muted-foreground/40 text-xs mb-6">Wichtig für genaue Kalorien-Berechnung</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {genderOptions.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserData({ ...userData, gender: option.id })}
              className={`relative p-6 rounded-2xl border-2 transition-all overflow-hidden ${
                userData.gender === option.id
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-50`} />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-card/80 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium">{option.label}</span>
              </div>
              {userData.gender === option.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
        
        <motion.p 
          className="text-xs text-muted-foreground/40 mt-6" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          ~166 kcal Unterschied zwischen Männern & Frauen
        </motion.p>
      </div>
    </StepCard>
  );
};
