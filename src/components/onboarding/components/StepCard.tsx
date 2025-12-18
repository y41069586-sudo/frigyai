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
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="w-full"
  >
    {children}
  </motion.div>
);
