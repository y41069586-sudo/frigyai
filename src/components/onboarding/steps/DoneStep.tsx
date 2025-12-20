import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepCard } from "../components";

interface DoneStepProps {
  onComplete: () => void;
}

export const DoneStep = ({ onComplete }: DoneStepProps) => {
  return (
    <StepCard step="done">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div
          className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.span
            className="text-5xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ✨
          </motion.span>
        </motion.div>
        
        <motion.h1 
          className="text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          Dein System ist bereit.
        </motion.h1>
        
        <motion.p 
          className="text-muted-foreground/40 text-sm mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          Makros. Struktur. Weniger nachdenken.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Button onClick={onComplete} className="w-full max-w-xs h-12 rounded-xl">
            Zum Dashboard
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>
      </div>
    </StepCard>
  );
};
