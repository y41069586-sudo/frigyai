import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatedFrigyMascot } from "./AnimatedFrigyMascot";

interface OnboardingFlowProps {
  onComplete: () => void;
}

type SimpleStep = "intro" | "message" | "action" | "feedback";

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<SimpleStep>("intro");
  const [actionTaken, setActionTaken] = useState<"scan" | "manual" | null>(null);

  // Auto-advance intro after 1 second
  useEffect(() => {
    if (currentStep === "intro") {
      const timer = setTimeout(() => {
        setCurrentStep("message");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // After feedback, complete onboarding
  useEffect(() => {
    if (currentStep === "feedback") {
      const timer = setTimeout(() => {
        onComplete();
        // Navigate based on action
        if (actionTaken === "scan") {
          navigate("/scan");
        } else {
          navigate("/manual");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, actionTaken, onComplete, navigate]);

  const handleAction = (action: "scan" | "manual") => {
    setActionTaken(action);
    setCurrentStep("feedback");
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {/* SCREEN 1 - Frigy Animation Only (1 sec) */}
        {currentStep === "intro" && (
          <motion.div
            key="intro"
            className="h-full flex items-end justify-center pb-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial={{ y: 300, scale: 0.8 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.34, 1.56, 0.64, 1] // Bounce effect
              }}
            >
              <AnimatedFrigyMascot size={280} animate={true} />
            </motion.div>
          </motion.div>
        )}

        {/* SCREEN 2 - One Sentence + Button */}
        {currentStep === "message" && (
          <motion.div
            key="message"
            className="h-full flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Frigy stays visible, smaller */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-8"
            >
              <AnimatedFrigyMascot size={140} animate={false} />
            </motion.div>

            {/* Single sentence */}
            <motion.p
              className="text-xl sm:text-2xl font-medium text-foreground text-center max-w-xs leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Ich helfe dir, Lebensmittel nicht zu vergessen.
            </motion.p>

            {/* Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-10"
            >
              <Button
                size="lg"
                onClick={() => setCurrentStep("action")}
                className="text-lg px-10 py-6 rounded-full font-semibold shadow-lg"
              >
                Los geht's
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* SCREEN 3 - Action Screen */}
        {currentStep === "action" && (
          <motion.div
            key="action"
            className="h-full flex flex-col px-6 pt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Frigy slides to corner */}
            <motion.div
              className="absolute bottom-4 left-4"
              initial={{ x: 100, y: 100, scale: 0.5, opacity: 0 }}
              animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <AnimatedFrigyMascot size={80} animate={false} />
            </motion.div>

            {/* Main action buttons */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              {/* Primary: Scan */}
              <motion.button
                onClick={() => handleAction("scan")}
                className="w-full max-w-sm p-6 rounded-2xl bg-primary text-primary-foreground flex items-center gap-4 shadow-xl hover:shadow-2xl transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold">Kühlschrank scannen</p>
                  <p className="text-sm opacity-80">Foto aufnehmen</p>
                </div>
              </motion.button>

              {/* Secondary: Manual */}
              <motion.button
                onClick={() => handleAction("manual")}
                className="w-full max-w-sm p-5 rounded-2xl border-2 border-border bg-card text-foreground flex items-center gap-4 hover:border-primary/50 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Manuell hinzufügen</p>
                  <p className="text-sm text-muted-foreground">Produkte eintippen</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 4 - Micro Feedback */}
        {currentStep === "feedback" && (
          <motion.div
            key="feedback"
            className="h-full flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Frigy reacts */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="mb-6"
            >
              <AnimatedFrigyMascot size={160} animate={true} />
            </motion.div>

            {/* Feedback message */}
            <motion.p
              className="text-2xl font-semibold text-foreground text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Nice 😄
            </motion.p>
            <motion.p
              className="text-lg text-muted-foreground text-center mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              Ich merk mir das.
            </motion.p>

            {/* Loading indicator */}
            <motion.div
              className="mt-8 flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    delay: i * 0.15 
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
