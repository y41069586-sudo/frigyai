import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { ONBOARDING_MINT_PALETTE } from "../layout";

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingProgressBar = ({ currentStep, totalSteps }: OnboardingProgressBarProps) => {
  const { language } = useLanguage();
  const progress = Math.round((currentStep / totalSteps) * 100);
  
  const getStepLabel = () => {
    if (language === 'de') return `Schritt ${currentStep} von ${totalSteps}`;
    if (language === 'fr') return `Étape ${currentStep} sur ${totalSteps}`;
    return `Step ${currentStep} of ${totalSteps}`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2 bg-gradient-to-b from-background to-transparent">
      <div className="max-w-md mx-auto">
        {/* Progress bar background */}
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: ONBOARDING_MINT_PALETTE.progressTrack }}
        >
          {/* Animated progress fill */}
          <motion.div
            className="h-full rounded-full"
            style={{ background: ONBOARDING_MINT_PALETTE.progressFill }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1]
            }}
          />
        </div>
      </div>
    </div>
  );
};
