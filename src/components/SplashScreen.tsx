import { motion } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

// Neon white fridge icon component
const FridgeIcon = () => (
  <div className="relative w-12 h-16">
    {/* Fridge body - neon white outline */}
    <div className="absolute inset-0 border-2 border-white rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.8),0_0_30px_rgba(255,255,255,0.4)]">
      {/* Freezer line */}
      <div className="absolute left-2 right-2 top-[30%] h-0.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
      {/* Freezer handle */}
      <div className="absolute right-2 top-[14%] w-1 h-3 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
      {/* Main handle */}
      <div className="absolute right-2 top-[50%] w-1 h-5 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
    </div>
  </div>
);

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 1800);
      }}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-white/10 blur-3xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Logo container */}
      <motion.div
        className="relative flex flex-col items-center gap-4"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Icon */}
        <motion.div
          className="relative"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
        >
          <div className="w-20 h-20 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <FridgeIcon />
          </div>
          
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-white/60"
            animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.div>

        {/* Text */}
        <motion.h1
          className="text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Frig AI
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-muted-foreground text-sm"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Leichter abnehmen
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        className="absolute bottom-20 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
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
