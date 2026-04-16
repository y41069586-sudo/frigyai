import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StepCardProps {
  children: ReactNode;
  step: string;
}

export const StepCard = ({ children, step }: StepCardProps) => (
  <motion.div
    key={step}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] // Smooth cubic-bezier easing
    }}
    className="w-full"
  >
    {children}
  </motion.div>
);
