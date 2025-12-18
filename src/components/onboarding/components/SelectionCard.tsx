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
    initial={{ opacity: 0, y: 15, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${
      selected
        ? "border-primary bg-gradient-to-br from-primary/15 to-primary/5 shadow-[0_8px_30px_rgba(0,0,0,0.08),0_0_20px_hsla(var(--primary),0.15)]"
        : "border-border/60 bg-card/80 hover:border-primary/40 hover:bg-card hover:shadow-lg"
    } ${className}`}
  >
    {/* Subtle inner glow when selected */}
    {selected && (
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-transparent to-primary/10 pointer-events-none" />
    )}
    <div className="relative z-10">
      {children}
    </div>
    {selected && (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md"
      >
        <Check className="w-3.5 h-3.5 text-primary-foreground" />
      </motion.div>
    )}
  </motion.button>
);
