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
        setTimeout(onComplete, 2200);
      }}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-primary/20 blur-3xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Logo container - slides in from bottom left */}
      <motion.div
        className="relative flex flex-col items-center gap-4"
        initial={{ x: -100, y: 100, opacity: 0, scale: 0.8 }}
        animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Frig Logo with smile animation */}
        <motion.div
          className="relative"
          animate={{ 
            boxShadow: [
              '0 0 30px hsla(160, 100%, 50%, 0.3)',
              '0 0 50px hsla(160, 100%, 50%, 0.5)',
              '0 0 30px hsla(160, 100%, 50%, 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <img 
            src={frigLogo} 
            alt="Frigy Logo" 
            className="w-28 h-28 rounded-[22%]"
          />
          
          {/* Smile overlay that appears briefly */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, times: [0, 0.3, 0.7, 1], delay: 0.5 }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-28 h-28"
              style={{ position: 'absolute' }}
            >
              {/* Cute eyes */}
              <motion.circle
                cx="35"
                cy="42"
                r="4"
                fill="hsl(var(--foreground))"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.6, duration: 0.3 }}
              />
              <motion.circle
                cx="65"
                cy="42"
                r="4"
                fill="hsl(var(--foreground))"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.7, duration: 0.3 }}
              />
              {/* Smile arc */}
              <motion.path
                d="M 30 55 Q 50 75 70 55"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.h1
          className="text-4xl font-bold text-foreground"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Frigy
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-muted-foreground text-sm"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Eat smarter. Not harder.
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        className="absolute bottom-20 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};
