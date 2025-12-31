import { motion } from "framer-motion";
import frigLogo from "@/assets/frig-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 1800);
      }}
    >
      {/* Subtle ambient glow */}
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Logo container */}
      <motion.div
        className="relative flex flex-col items-center gap-6"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo with subtle shadow */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <img 
            src={frigLogo} 
            alt="Frigy Logo" 
            className="w-24 h-24 rounded-[22%] shadow-lg"
          />
        </motion.div>

        {/* App name with elegant typography */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Frigy
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Eat smarter. Not harder.
          </p>
        </motion.div>
      </motion.div>

      {/* Modern progress bar at bottom */}
      <motion.div
        className="absolute bottom-24 w-32"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 1.3,
              delay: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
