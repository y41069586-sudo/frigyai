import { motion } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

// Frig AI Logo - green fridge with scan corners
const FrigLogo = () => (
  <div className="w-32 h-32 relative flex items-center justify-center">
    {/* Green rounded background */}
    <div 
      className="absolute inset-0 rounded-[22%]"
      style={{ 
        background: 'linear-gradient(135deg, #5FD068 0%, #4ABA54 50%, #3DA347 100%)',
        boxShadow: '0 8px 40px rgba(90, 200, 100, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)'
      }}
    />
    
    {/* Inner lighter background */}
    <div 
      className="absolute inset-2.5 rounded-[20%]"
      style={{ 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)'
      }}
    />
    
    {/* Scan corners */}
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
      {/* Top Left Corner */}
      <path 
        d="M 15 30 L 15 15 L 30 15" 
        fill="none" 
        stroke="rgba(255,255,255,0.9)" 
        strokeWidth="3" 
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}
      />
      {/* Top Right Corner */}
      <path 
        d="M 70 15 L 85 15 L 85 30" 
        fill="none" 
        stroke="rgba(255,255,255,0.9)" 
        strokeWidth="3" 
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}
      />
      {/* Bottom Left Corner */}
      <path 
        d="M 15 70 L 15 85 L 30 85" 
        fill="none" 
        stroke="rgba(255,255,255,0.9)" 
        strokeWidth="3" 
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}
      />
      {/* Bottom Right Corner */}
      <path 
        d="M 70 85 L 85 85 L 85 70" 
        fill="none" 
        stroke="rgba(255,255,255,0.9)" 
        strokeWidth="3" 
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}
      />
    </svg>
    
    {/* Fridge Icon */}
    <div 
      className="w-16 h-24 relative z-10"
      style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.6))' }}
    >
      <svg viewBox="0 0 40 56" fill="none" className="w-full h-full">
        {/* Fridge body */}
        <rect x="4" y="4" width="32" height="48" rx="4" 
          stroke="rgba(255,255,255,0.95)" 
          strokeWidth="2.5" 
          fill="none"
        />
        {/* Freezer line */}
        <line x1="4" y1="18" x2="36" y2="18" stroke="rgba(255,255,255,0.95)" strokeWidth="2" />
        {/* Freezer handle */}
        <line x1="28" y1="10" x2="28" y2="14" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Fridge handle */}
        <line x1="28" y1="26" x2="28" y2="34" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
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
        className="absolute w-72 h-72 rounded-full bg-[#5FD068]/20 blur-3xl"
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

      {/* Logo container */}
      <motion.div
        className="relative flex flex-col items-center gap-5"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* New Frig Logo */}
        <motion.div
          animate={{ 
            boxShadow: [
              '0 0 30px rgba(95, 208, 104, 0.3)',
              '0 0 50px rgba(95, 208, 104, 0.5)',
              '0 0 30px rgba(95, 208, 104, 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-[22%]"
        >
          <FrigLogo />
        </motion.div>

        {/* Text */}
        <motion.h1
          className="text-4xl font-bold text-foreground"
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
            className="w-2 h-2 rounded-full bg-[#5FD068]"
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
