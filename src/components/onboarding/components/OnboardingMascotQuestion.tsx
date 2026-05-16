import { motion } from "framer-motion";
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn("shrink-0 px-5 pb-3 pt-1", className)}
    >
      {children}
    </motion.div>
  );
}
