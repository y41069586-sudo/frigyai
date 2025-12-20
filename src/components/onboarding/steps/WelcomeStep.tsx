import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { AnimatedFrigyMascot } from "@/components/AnimatedFrigyMascot";
import { useLanguage } from "@/contexts/LanguageContext";

interface WelcomeStepProps {
  goNext: () => void;
}

export const WelcomeStep = ({ goNext }: WelcomeStepProps) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      >
        <AnimatedFrigyMascot size={120} animate={false} />
      </motion.div>
      
      <motion.div
        className="text-center mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t.welcomeToFrigy || "Willkommen bei Frigy!"}
        </h1>
        <p className="text-muted-foreground text-base max-w-xs mx-auto">
          {t.welcomeSubtitle || "Dein smarter Kühlschrank-Assistent"}
        </p>
      </motion.div>
      
      <motion.div
        className="mt-8 w-full max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Button 
          onClick={goNext} 
          className="w-full h-14 text-lg font-semibold rounded-2xl glow-button"
          size="lg"
        >
          {t.letsGo || "Los geht's"} 
          <Sparkles className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};
