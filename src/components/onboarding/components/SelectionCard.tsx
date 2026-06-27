import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ReactNode } from "react";
import {
  mintStepChildInitial,
  mintStepChildTransition,
  shouldSkipMintStepEntrance,
} from "@/components/onboarding/layout";

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
    initial={mintStepChildInitial(12)}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      ...mintStepChildTransition(),
      ...(shouldSkipMintStepEntrance() ? {} : { delay }),
    }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
      selected
        ? "border-primary bg-primary/10"
        : "border-border bg-card hover:border-primary/50"
    } ${className}`}
  >
    {children}
    {selected && (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
      >
        <Check className="w-3 h-3 text-primary-foreground" />
      </motion.div>
    )}
  </motion.button>
);
