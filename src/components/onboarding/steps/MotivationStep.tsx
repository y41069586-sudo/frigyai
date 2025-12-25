import { motion } from "framer-motion";
import { StepCard, SelectionCard } from "../components";
import { StepProps } from "../types";
import { Target, Heart, Dumbbell, PartyPopper, Stethoscope, Footprints, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const MotivationStep = ({ userData, setUserData }: StepProps) => {
  const { t, language } = useLanguage();
  
  const motivations = [
    { id: "health", label: language === 'de' ? "Gesünder leben" : language === 'fr' ? "Vivre plus sainement" : "Live healthier", icon: Heart, desc: language === 'de' ? "Mehr Energie im Alltag" : language === 'fr' ? "Plus d'énergie au quotidien" : "More daily energy", color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { id: "confidence", label: language === 'de' ? "Selbstbewusster fühlen" : language === 'fr' ? "Plus de confiance" : "Feel more confident", icon: Dumbbell, desc: language === 'de' ? "Wohler im eigenen Körper" : language === 'fr' ? "Bien dans son corps" : "Comfortable in your body", color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
    { id: "event", label: language === 'de' ? "Für ein Event" : language === 'fr' ? "Pour un événement" : "For an event", icon: PartyPopper, desc: language === 'de' ? "Hochzeit, Urlaub, etc." : language === 'fr' ? "Mariage, vacances, etc." : "Wedding, vacation, etc.", color: 'text-pink-500', bgColor: 'bg-pink-500/20' },
    { id: "doctor", label: language === 'de' ? "Arzt empfohlen" : language === 'fr' ? "Recommandé par médecin" : "Doctor recommended", icon: Stethoscope, desc: language === 'de' ? "Medizinischer Rat" : language === 'fr' ? "Conseil médical" : "Medical advice", color: 'text-cyan-500', bgColor: 'bg-cyan-500/20' },
    { id: "fitness", label: language === 'de' ? "Fitness verbessern" : language === 'fr' ? "Améliorer fitness" : "Improve fitness", icon: Footprints, desc: language === 'de' ? "Sportliche Ziele" : language === 'fr' ? "Objectifs sportifs" : "Athletic goals", color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
    { id: "habit", label: language === 'de' ? "Bessere Gewohnheiten" : language === 'fr' ? "Meilleures habitudes" : "Better habits", icon: Sparkles, desc: language === 'de' ? "Langfristige Änderung" : language === 'fr' ? "Changement durable" : "Long-term change", color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
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
          {language === 'de' ? "Was motiviert dich?" : language === 'fr' ? "Qu'est-ce qui te motive?" : "What motivates you?"}
        </motion.h1>
        <motion.p
          className="text-muted-foreground/50 text-xs mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {language === 'de' ? "Hilft uns, dich besser zu unterstützen" : language === 'fr' ? "Nous aide à mieux te soutenir" : "Helps us support you better"}
        </motion.p>
        
        <div className="flex flex-col gap-2.5 w-full max-w-sm">
          {motivations.map((option, i) => {
            const IconComponent = option.icon;
            const isSelected = userData.motivation === option.id;
            return (
              <motion.button
                key={option.id}
                onClick={() => setUserData({ ...userData, motivation: option.id })}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/10 shadow-sm' 
                    : 'border-border/50 bg-card/50 hover:bg-card/80'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${option.bgColor} flex items-center justify-center flex-shrink-0 ${option.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium block">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground/50">{option.desc}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                }`}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-primary-foreground"
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </StepCard>
  );
};