import { motion } from "framer-motion";
import { StepCard } from "../components";
import { StepProps } from "../types";
import { Clock, Zap, Utensils, ChefHat, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const CookingTimeStep = ({ userData, setUserData }: StepProps) => {
  const { language } = useLanguage();
  
  const timeOptions = [
    { 
      id: 'quick' as const, 
      label: language === 'de' ? '15 Minuten' : language === 'fr' ? '15 minutes' : '15 minutes', 
      icon: Zap,
      desc: language === 'de' ? 'Schnelle Gerichte' : language === 'fr' ? 'Plats rapides' : 'Quick meals',
      color: 'from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/20'
    },
    { 
      id: 'medium' as const, 
      label: language === 'de' ? '30 Minuten' : language === 'fr' ? '30 minutes' : '30 minutes', 
      icon: Utensils,
      desc: language === 'de' ? 'Normale Rezepte' : language === 'fr' ? 'Recettes normales' : 'Standard recipes',
      color: 'from-yellow-500/20 to-orange-500/20',
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20'
    },
    { 
      id: 'long' as const, 
      label: language === 'de' ? '45+ Minuten' : language === 'fr' ? '45+ minutes' : '45+ minutes', 
      icon: ChefHat,
      desc: language === 'de' ? 'Aufwendige Küche' : language === 'fr' ? 'Cuisine élaborée' : 'Elaborate cooking',
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/20'
    },
  ];

  return (
    <StepCard step="cooking-time">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
        >
          <Clock className="w-8 h-8 text-primary" />
        </motion.div>
        
        <motion.h1
          className="text-2xl font-bold mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {language === 'de' ? 'Wie viel Zeit zum Kochen?' : language === 'fr' ? 'Combien de temps pour cuisiner?' : 'How much time to cook?'}
        </motion.h1>
        <motion.p
          className="text-muted-foreground/50 text-xs mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {language === 'de' ? 'Für passende Rezeptvorschläge' : language === 'fr' ? 'Pour des suggestions adaptées' : 'For matching recipe suggestions'}
        </motion.p>
        
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {timeOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
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
                  <div className={`w-10 h-10 rounded-xl ${option.bgColor} flex items-center justify-center ${option.iconColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
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
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
        
        <motion.p
          className="text-xs text-muted-foreground/40 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {language === 'de' ? 'Du kannst dies später in den Einstellungen ändern' : language === 'fr' ? 'Tu peux changer cela plus tard dans les paramètres' : 'You can change this later in settings'}
        </motion.p>
      </div>
    </StepCard>
  );
};