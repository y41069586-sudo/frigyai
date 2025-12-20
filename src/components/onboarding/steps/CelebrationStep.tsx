import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedFrigyMascot } from "@/components/AnimatedFrigyMascot";

interface CelebrationStepProps {
  goNext: () => void;
}

export const CelebrationStep = ({ goNext }: CelebrationStepProps) => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Text at top */}
      <motion.div
        className="absolute top-[12%] text-center z-10 px-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
      >
        <motion.h1 
          className="text-4xl sm:text-5xl font-bold text-primary tracking-tight"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 1, duration: 0.4 }}
        >
          Du hast es geschafft! 🎉
        </motion.h1>
        <motion.p
          className="text-lg text-muted-foreground mt-4 max-w-xs mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.4 }}
        >
          Frigy ist bereit für dich!
        </motion.p>
      </motion.div>

      {/* Animated Frigy mascot - pops up from bottom */}
      <motion.div 
        className="absolute bottom-0 flex items-end justify-center w-full"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
          duration: 1
        }}
      >
        <AnimatedFrigyMascot 
          size={340} 
          animate={false}
        />
      </motion.div>

      {/* Continue button at bottom */}
      <motion.div 
        className="absolute bottom-8 left-0 right-0 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4 }}
      >
        <Button
          onClick={goNext}
          className="w-full max-w-sm mx-auto h-12 rounded-xl flex items-center justify-center"
        >
          Weiter geht&apos;s!
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </motion.div>
    </div>
  );
};
