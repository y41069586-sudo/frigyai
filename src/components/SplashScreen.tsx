import { motion } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

// Neon green fridge with scan corners
const FridgeScanIcon = () => (
  <div className="relative w-20 h-20">
    {/* Light background */}
    <div className="absolute inset-0 bg-white rounded-2xl" />
    
    {/* Scan corners - neon green */}
    {/* Top left */}
    <div className="absolute top-2 left-2 w-4 h-4 border-l-3 border-t-3 border-[#39FF14] rounded-tl-sm shadow-[0_0_12px_rgba(57,255,20,0.9)]" />
    {/* Top right */}
    <div className="absolute top-2 right-2 w-4 h-4 border-r-3 border-t-3 border-[#39FF14] rounded-tr-sm shadow-[0_0_12px_rgba(57,255,20,0.9)]" />
    {/* Bottom left */}
    <div className="absolute bottom-2 left-2 w-4 h-4 border-l-3 border-t-3 border-[#39FF14] rounded-bl-sm shadow-[0_0_12px_rgba(57,255,20,0.9)]" />
    {/* Bottom right */}
    <div className="absolute bottom-2 right-2 w-4 h-4 border-r-3 border-b-3 border-[#39FF14] rounded-br-sm shadow-[0_0_12px_rgba(57,255,20,0.9)]" />
    
    {/* Fridge in center */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-8 h-11">
        {/* Fridge body - neon green with glow */}
        <div className="absolute inset-0 bg-[#39FF14] rounded-md shadow-[0_0_20px_rgba(57,255,20,0.9),0_0_40px_rgba(57,255,20,0.5)]">
          {/* Freezer line */}
          <div className="absolute left-1 right-1 top-[28%] h-0.5 bg-white/50" />
          {/* Freezer handle */}
          <div className="absolute right-1.5 top-[12%] w-0.5 h-2 bg-white/60 rounded-full" />
          {/* Main handle */}
          <div className="absolute right-1.5 top-[45%] w-0.5 h-3 bg-white/60 rounded-full" />
        </div>
      </div>
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
      {/* Animated background glow - neon green */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-[#39FF14]/20 blur-3xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.5, 0.3],
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
          <div className="flex items-center justify-center">
            <FridgeScanIcon />
          </div>
          
          {/* Pulse ring - neon green */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-[#39FF14]/60"
            animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.div>

        {/* Text - neon green */}
        <motion.h1
          className="text-4xl font-bold text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.8)]"
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

      {/* Loading dots - neon green */}
      <motion.div
        className="absolute bottom-20 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.9)]"
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
