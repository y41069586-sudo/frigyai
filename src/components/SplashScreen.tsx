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
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center z-50 w-screen h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a472a 0%, #2d5a3d 50%, #1a472a 100%)',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background orbs */}
      <motion.div
        className="absolute top-20 left-20 w-80 h-80 bg-green-400/20 rounded-full blur-3xl"
        animate={{
          y: [0, 60, 0],
          x: [0, 40, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-80 h-80 bg-green-300/20 rounded-full blur-3xl"
        animate={{
          y: [0, -60, 0],
          x: [0, -40, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles effect */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-green-400/40"
          initial={{
            x: Math.random() * 400 - 200,
            y: Math.random() * 800,
            opacity: 0
          }}
          animate={{
            y: -800,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "linear"
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: 'spring', stiffness: 60, damping: 10 }}
          className="mb-6"
        >
          <img
            src={frigLogo}
            alt="Frig Logo"
            className="h-20 w-auto drop-shadow-lg"
          />
        </motion.div>

        {/* Title with text animation */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <motion.h1
            className="text-7xl font-black bg-gradient-to-r from-green-300 via-green-200 to-green-300 bg-clip-text text-transparent mb-3"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ delay: 0.5, duration: 2, repeat: Infinity }}
          >
            FRIGY
          </motion.h1>
          <motion.p
            className="text-green-200 text-lg font-bold tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            SMART KITCHEN BUDDY
          </motion.p>
        </motion.div>

        {/* Frigy Mascot - Much larger and better positioned */}
        <motion.div
          className="relative my-8 scale-150"
          initial={{ scale: 0, opacity: 0, rotate: 180 }}
          animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.6, duration: 0.8, type: 'spring', stiffness: 80 }}
        >
          <AnimatedFrigyMascot size={280} animate={true} />
        </motion.div>

        {/* Modern loading animation */}
        <motion.div
          className="relative mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex gap-4 items-center">
            <motion.div
              className="w-4 h-4 rounded-full bg-gradient-to-r from-green-300 to-green-400"
              animate={{
                scale: [1, 1.8, 1],
                boxShadow: ['0 0 0 0px rgba(74, 222, 128, 0.7)', '0 0 0 15px rgba(74, 222, 128, 0)', '0 0 0 0px rgba(74, 222, 128, 0)']
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="w-4 h-4 rounded-full bg-gradient-to-r from-green-300 to-green-400"
              animate={{
                scale: [1, 1.8, 1],
                boxShadow: ['0 0 0 0px rgba(74, 222, 128, 0.7)', '0 0 0 15px rgba(74, 222, 128, 0)', '0 0 0 0px rgba(74, 222, 128, 0)']
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div
              className="w-4 h-4 rounded-full bg-gradient-to-r from-green-300 to-green-400"
              animate={{
                scale: [1, 1.8, 1],
                boxShadow: ['0 0 0 0px rgba(74, 222, 128, 0.7)', '0 0 0 15px rgba(74, 222, 128, 0)', '0 0 0 0px rgba(74, 222, 128, 0)']
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            />
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-green-200/70 text-sm font-medium mt-10 tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Loading your kitchen magic...
        </motion.p>
      </div>
    </motion.div>
  );
};
