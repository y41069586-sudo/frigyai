import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StepCardProps {
  children: ReactNode;
  step: string;
}

export const StepCard = ({ children, step }: StepCardProps) => (
  <motion.div
    key={step}
    initial={{ opacity: 0, y: 30, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.97 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className="w-full relative"
  >
    {/* Subtle glow effect */}
    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl pointer-events-none" />
    <div className="relative">
      {children}
    </div>
  </motion.div>
);
