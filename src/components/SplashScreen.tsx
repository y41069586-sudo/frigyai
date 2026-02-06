import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimatedFrigyMascot } from './AnimatedFrigyMascot';
import frigLogo from '@/assets/frig-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-green-50 via-white to-green-50 flex flex-col items-center justify-center z-50 w-screen h-screen overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background decoration */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl"
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-green-100/20 rounded-full blur-3xl"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header with Logo */}
      <motion.div
        className="relative mb-4"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      >
        <img
          src={frigLogo}
          alt="Frig Logo"
          className="h-16 w-auto"
        />
      </motion.div>

      {/* App Title */}
      <motion.div
        className="relative text-center mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
          Frigy
        </h1>
        <p className="text-green-600 text-base font-semibold">Dein smarter Kühlschrank-Buddy</p>
      </motion.div>

      {/* Frigy Mascot - Animated */}
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, type: 'spring', stiffness: 100 }}
      >
        <AnimatedFrigyMascot size={220} animate={true} />
      </motion.div>

      {/* Tagline */}
      <motion.div
        className="relative text-center mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <p className="text-gray-600 text-sm font-medium tracking-wide">
          Gesund essen. Besser leben. 🌱
        </p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="relative mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        <div className="flex gap-3">
          <motion.div
            className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <motion.div
            className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
