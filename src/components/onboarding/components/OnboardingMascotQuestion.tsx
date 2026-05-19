import { motion } from "framer-motion";
import { shouldSkipMintStepEntrance } from "@/components/onboarding/layout";
import { cn } from "@/lib/utils";

type OnboardingMascotQuestionProps = {
  children: React.ReactNode;
  className?: string;
};

/** Step question headline (no mascot / speech bubble). */
export function OnboardingMascotQuestion({
  children,
  className,
}: OnboardingMascotQuestionProps) {
  const skipEntrance = shouldSkipMintStepEntrance();
  return (
    <motion.div
      initial={skipEntrance ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        skipEntrance
          ? { duration: 0 }
          : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
      }
      className={cn("shrink-0 px-5 pb-3 pt-1", className)}
    >
      {children}
    </motion.div>
  );
}
