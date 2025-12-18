import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StepCardProps {
  children: ReactNode;
  step: string;
}

export const StepCard = ({ children, step }: StepCardProps) => (
  <motion.div
    key={step}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    className="w-full"
  >
    {children}
  </motion.div>
);
