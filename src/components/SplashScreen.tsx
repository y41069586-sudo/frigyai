import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimatedFrigyMascot } from './AnimatedFrigyMascot';
import frigLogo from '@/assets/frig-logo.png';

// Force cache bust with timestamp
const SPLASH_DURATION = 10000; // 10 seconds

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    console.log('🎬 Splash Screen started - will show for 10 seconds');

    const timer = setTimeout(() => {
      console.log('🎬 Splash Screen ending after 10 seconds');
      onComplete();
    }, SPLASH_DURATION);

    return () => {
      clearTimeout(timer);
      console.log('🎬 Splash Screen cleanup');
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center z-50 w-screen h-screen overflow-hidden bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-green-50/30 opacity-60" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
          className="mb-4"
        >
          <img
            src={frigLogo}
            alt="Frig Logo"
            className="h-16 w-auto"
          />
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
            Frigy
          </h1>
          <p className="text-green-600 text-sm font-medium">Dein smarter Kühlschrank-Buddy</p>
        </motion.div>

        {/* Frigy Mascot */}
        <motion.div
          className="relative my-6"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, type: 'spring', stiffness: 100 }}
        >
          <AnimatedFrigyMascot size={200} animate={true} />
        </motion.div>

        {/* Loading dots */}
        <motion.div
          className="relative mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex gap-3">
            <motion.div
              className="w-3 h-3 rounded-full bg-green-500"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.div
              className="w-3 h-3 rounded-full bg-green-500"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-3 h-3 rounded-full bg-green-500"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
