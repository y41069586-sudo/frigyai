import { motion } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

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
        className="absolute w-64 h-64 rounded-full bg-[#90EE90]/20 blur-3xl"
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
        className="relative flex flex-col items-center gap-4"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Fridge Icon */}
        <motion.div className="relative">
          <div className="w-20 h-24 bg-gradient-to-b from-white to-gray-100 rounded-xl border border-gray-200 shadow-xl overflow-hidden">
            {/* Freezer section */}
            <div className="h-7 border-b border-gray-200 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-gray-300 rounded-full" />
            </div>
            {/* Main section */}
            <div className="h-14 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-gray-300 rounded-full" />
            </div>
            {/* Handle */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-gray-300 rounded-full" />
          </div>
          
          {/* Green glow border */}
          <motion.div
            className="absolute -inset-1 rounded-2xl border-2 border-[#90EE90] pointer-events-none"
            style={{ boxShadow: '0 0 20px rgba(144,238,144,0.5), 0 0 40px rgba(144,238,144,0.2)' }}
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(144,238,144,0.5), 0 0 40px rgba(144,238,144,0.2)',
                '0 0 30px rgba(144,238,144,0.8), 0 0 60px rgba(144,238,144,0.4)',
                '0 0 20px rgba(144,238,144,0.5), 0 0 40px rgba(144,238,144,0.2)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
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
            className="w-2 h-2 rounded-full bg-[#90EE90]"
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
