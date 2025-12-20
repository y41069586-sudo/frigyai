import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Leaf, Clock, Check } from "lucide-react";
import { AnimatedFrigyMascot } from "@/components/AnimatedFrigyMascot";
import { useLanguage } from "@/contexts/LanguageContext";

interface WelcomeStepProps {
  goNext: () => void;
}

export const WelcomeStep = ({ goNext }: WelcomeStepProps) => {
  const { t } = useLanguage();

  const benefits = [
    { icon: Leaf, text: "Weniger Lebensmittelverschwendung", color: "text-green-500" },
    { icon: Clock, text: "Mehr Zeit durch smarte Planung", color: "text-blue-500" },
    { icon: Check, text: "Deine Makros immer im Blick", color: "text-primary" },
  ];

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Mascot with glow effect */}
        <motion.div
          initial={{ scale: 0, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
          className="relative"
        >
          {/* Glow background */}
          <motion.div 
            className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150"
            animate={{ 
              scale: [1.5, 1.7, 1.5],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <AnimatedFrigyMascot size={120} animate={false} />
        </motion.div>
        
        {/* Title & Value Proposition */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Nie wieder Essen verschwenden
          </h1>
          <p className="text-muted-foreground text-base max-w-xs mx-auto">
            Scanne deinen Kühlschrank, erhalte Rezepte & plane deine Woche in Sekunden
          </p>
        </motion.div>
        
        {/* Benefits List */}
        <motion.div
          className="mt-10 space-y-3 w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm"
            >
              <div className={`w-8 h-8 rounded-lg bg-background flex items-center justify-center ${benefit.color}`}>
                <benefit.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{benefit.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Social proof badge */}
        <motion.div
          className="mt-8 flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <div className="flex -space-x-2">
            {["🧑‍🍳", "👩‍🍳", "👨‍🍳", "👩"].map((emoji, i) => (
              <div 
                key={i} 
                className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-sm"
              >
                {emoji}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">50.000+</span> Nutzer sparen bereits
          </span>
        </motion.div>
      </div>
      
      {/* Bottom CTA */}
      <motion.div
        className="px-6 pb-8 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
      >
        <Button 
          onClick={goNext} 
          className="w-full h-14 text-lg font-semibold rounded-2xl glow-button"
          size="lg"
        >
          {t.letsGo || "Los geht's"} 
          <Sparkles className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-center text-xs text-muted-foreground/60 mt-3">
          Keine Kreditkarte erforderlich
        </p>
      </motion.div>
    </div>
  );
};
