import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AnimatedFrigyMascot } from './AnimatedFrigyMascot';

interface SplashScreenProps {
  onComplete: () => void;
}

// SVG Noise texture pattern
const NoiseTexture = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
    <filter id="noise">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.9"
        numOctaves="4"
        seed="2"
        result="noise"
      />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
    </filter>
    <rect width="100%" height="100%" fill="rgba(255,255,255,0.05)" filter="url(#noise)" />
  </svg>
);

// Motion trail effect - subtle blur behind mascot
const MotionTrail = ({ opacity = 0.3 }: { opacity?: number }) => (
  <motion.div
    className="absolute"
    style={{
      width: 120,
      height: 120,
      left: 0,
      top: '50%',
      translateY: '-50%',
      background: 'radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, transparent 70%)',
      filter: 'blur(20px)',
      opacity: opacity,
      pointerEvents: 'none',
    }}
  />
);

// Organic loading indicator
const LoadingIndicator = ({ startDelay }: { startDelay: number }) => {
  const dotVariants = {
    animate: {
      y: [0, -8, 0],
      opacity: [0.4, 1, 0.4],
    },
  };

  return (
    <motion.div
      className="flex gap-2 justify-center items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: startDelay, duration: 0.4 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-gradient-to-b from-green-300 to-green-400"
          variants={dotVariants}
          animate="animate"
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
};

// Mascot idle animations (breathing, blinking, head tilt)
const MascotWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      className="relative"
      animate={{
        y: [0, -3, 0],
        rotateZ: [0, 0.5, 0, -0.5, 0],
      }}
      transition={{
        y: {
          duration: 2.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.2,
        },
        rotateZ: {
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        },
      }}
    >
      {children}
    </motion.div>
  );
};

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // Animation sequence timing
    const totalDuration = 1800; // 1.8 seconds for premium feel
    const timer = setTimeout(() => {
      handleComplete();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [handleComplete]);

  // Mascot entrance animation - smooth slide from left with overshoot and bounce
  const mascotVariants = {
    initial: {
      x: -150,
      opacity: 0,
      scale: 0.9,
    },
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.9,
        ease: [0.25, 0.46, 0.45, 0.94], // ease-in-out-back
        type: 'spring',
        stiffness: 100,
        damping: 12,
        mass: 1.5,
      },
    },
    exit: {
      scale: 1.02,
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  // Logo fade-in with subtle upward motion
  const logoVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.7,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  // Container final zoom before exit
  const containerVariants = {
    initial: { scale: 1, opacity: 1 },
    exit: {
      scale: 1.02,
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        delay: 1.4,
      },
    },
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 w-screen h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0d3d2a 0%, #1a5a3a 40%, #0d3d2a 100%)',
      }}
      variants={containerVariants}
      initial="initial"
      exit="exit"
    >
      {/* Noise texture overlay for premium feel */}
      <NoiseTexture />

      {/* Subtle gradient glow from top-right */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-green-400/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Motion trail effect */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2"
          animate={{
            x: [-100, 20],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 0.9,
            ease: 'easeOut',
          }}
        >
          <MotionTrail opacity={0.3} />
        </motion.div>

        {/* Frigy Mascot with idle animations */}
        <motion.div variants={mascotVariants} initial="initial" animate="animate">
          <MascotWrapper>
            <div className="w-32 h-32 flex items-center justify-center">
              <AnimatedFrigyMascot size={128} animate={true} />
            </div>
          </MascotWrapper>
        </motion.div>

        {/* Logo text - Frigy */}
        <motion.div variants={logoVariants} initial="initial" animate="animate">
          <h1 className="text-5xl font-black bg-gradient-to-b from-green-200 via-green-300 to-green-400 bg-clip-text text-transparent text-center tracking-tight">
            Frigy
          </h1>
        </motion.div>

        {/* Loading indicator with organic timing */}
        <LoadingIndicator startDelay={1.2} />
      </div>

      {/* Subtle vignette for depth */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/20 pointer-events-none" />
    </motion.div>
  );
};
