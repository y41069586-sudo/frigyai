import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ReactNode } from "react";

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const SelectionCard = ({ 
  selected, 
  onClick, 
  children, 
  className = "",
  delay = 0
}: SelectionCardProps) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3, ease: "easeOut" }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
      selected
        ? "border-primary bg-primary/10 shadow-md"
        : "border-border bg-card hover:border-primary/30"
    } ${className}`}
  >
    {children}
    {selected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
      >
        <Check className="w-3 h-3 text-primary-foreground" />
      </motion.div>
    )}
  </motion.button>
);
