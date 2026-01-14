import { motion } from "framer-motion";
import { StepCard } from "../components";
import { StepProps } from "../types";
import { Target, Heart, Dumbbell, PartyPopper, Stethoscope, Footprints, Sparkles, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const MotivationStep = ({ userData, setUserData }: StepProps) => {
  const { language } = useLanguage();
  
  const motivations = [
    { 
      id: "health", 
      label: language === 'de' ? "Gesünder leben" : language === 'fr' ? "Vivre plus sainement" : "Live healthier", 
      icon: Heart, 
      desc: language === 'de' ? "Mehr Energie im Alltag" : language === 'fr' ? "Plus d'énergie au quotidien" : "More daily energy",
      gradient: "from-rose-500 to-pink-500"
    },
    { 
      id: "confidence", 
      label: language === 'de' ? "Selbstbewusster fühlen" : language === 'fr' ? "Plus de confiance" : "Feel more confident", 
      icon: Dumbbell, 
      desc: language === 'de' ? "Wohler im eigenen Körper" : language === 'fr' ? "Bien dans son corps" : "Comfortable in your body",
      gradient: "from-blue-500 to-cyan-500"
    },
    { 
      id: "event", 
      label: language === 'de' ? "Für ein Event" : language === 'fr' ? "Pour un événement" : "For an event", 
      icon: PartyPopper, 
      desc: language === 'de' ? "Hochzeit, Urlaub, etc." : language === 'fr' ? "Mariage, vacances, etc." : "Wedding, vacation, etc.",
      gradient: "from-fuchsia-500 to-purple-500"
    },
    { 
      id: "doctor", 
      label: language === 'de' ? "Arzt empfohlen" : language === 'fr' ? "Recommandé par médecin" : "Doctor recommended", 
      icon: Stethoscope, 
      desc: language === 'de' ? "Medizinischer Rat" : language === 'fr' ? "Conseil médical" : "Medical advice",
      gradient: "from-teal-500 to-emerald-500"
    },
    { 
      id: "fitness", 
      label: language === 'de' ? "Fitness verbessern" : language === 'fr' ? "Améliorer fitness" : "Improve fitness", 
      icon: Footprints, 
      desc: language === 'de' ? "Sportliche Ziele" : language === 'fr' ? "Objectifs sportifs" : "Athletic goals",
      gradient: "from-orange-500 to-amber-500"
    },
    { 
      id: "habit", 
      label: language === 'de' ? "Bessere Gewohnheiten" : language === 'fr' ? "Meilleures habitudes" : "Better habits", 
      icon: Sparkles, 
      desc: language === 'de' ? "Langfristige Änderung" : language === 'fr' ? "Changement durable" : "Long-term change",
      gradient: "from-violet-500 to-indigo-500"
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <StepCard step="motivation">
      <div className="flex flex-col items-center text-center px-4 w-full">
        {/* Header Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.05
          }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 shadow-lg shadow-primary/10"
        >
          <Target className="w-7 h-7 text-primary" />
        </motion.div>
        
        {/* Title */}
        <motion.h1
          className="text-xl font-bold mb-0.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {language === 'de' ? "Was motiviert dich?" : language === 'fr' ? "Qu'est-ce qui te motive?" : "What motivates you?"}
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p
          className="text-muted-foreground/60 text-xs mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {language === 'de' ? "Wähle deinen Hauptgrund" : language === 'fr' ? "Choisis ta raison principale" : "Choose your main reason"}
        </motion.p>
        
        {/* Options List */}
        <motion.div 
          className="flex flex-col gap-2 w-full max-w-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {motivations.map((option) => {
            const IconComponent = option.icon;
            const isSelected = userData.motivation === option.id;
            
            return (
              <motion.button
                key={option.id}
                onClick={() => setUserData({ ...userData, motivation: option.id })}
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                className={`relative w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 overflow-hidden ${
                  isSelected 
                    ? 'border-primary/50 bg-primary/5 shadow-md shadow-primary/5' 
                    : 'border-border/40 bg-card/30 hover:bg-card/60 hover:border-border/60'
                }`}
              >
                {/* Selection glow effect */}
                {isSelected && (
                  <motion.div
                    layoutId="motivation-glow"
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                
                {/* Icon with gradient */}
                <div className={`relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                
                {/* Text content */}
                <div className="relative z-10 flex-1 text-left min-w-0">
                  <span className={`text-sm font-medium block truncate transition-colors ${
                    isSelected ? 'text-foreground' : 'text-foreground/80'
                  }`}>
                    {option.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 block truncate">
                    {option.desc}
                  </span>
                </div>
                
                {/* Checkbox indicator */}
                <div className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  isSelected 
                    ? 'border-primary bg-primary scale-100' 
                    : 'border-muted-foreground/25 scale-90'
                }`}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 400,
                        damping: 15
                      }}
                    >
                      <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </StepCard>
  );
};
