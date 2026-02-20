import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedFrigyMascot } from './AnimatedFrigyMascot';

interface SplashScreenProps {
  onComplete: () => void;
}

// Animated background grain texture
const GrainTexture = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
    <defs>
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="4"
          seed="3"
          result="noise"
        />
        <feColorMatrix in="noise" type="saturate" values="0" />
        <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="rgba(255,255,255,0.05)" filter="url(#grain)" />
  </svg>
);

// Ambient background movement - very slow and subtle
const AmbientBackground = () => {
  return (
    <>
      {/* Main gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a2818 0%, #155a3a 35%, #0d3d2a 70%, #051f15 100%)',
        }}
      />

      {/* Subtle animated glow from top-right */}
      <motion.div
        className="absolute -top-64 -right-64 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Subtle animated glow from bottom-left */}
      <motion.div
        className="absolute -bottom-48 -left-48 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Grain overlay */}
      <GrainTexture />

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/10 pointer-events-none" />
    </>
  );
};

// Motion blur effect during movement
const MotionBlur = () => (
  <motion.div
    className="absolute"
    style={{
      width: 100,
      height: 100,
      background: 'linear-gradient(90deg, rgba(74, 222, 128, 0.3) 0%, transparent 100%)',
      filter: 'blur(24px)',
      pointerEvents: 'none',
    }}
    animate={{
      opacity: [0, 0.4, 0.2, 0],
    }}
    transition={{
      duration: 2.2,
      ease: 'easeOut',
      times: [0, 0.3, 0.7, 1],
    }}
  />
);

// Minimal loading indicator - thin animated line
const LoadingIndicator = ({ startDelay }: { startDelay: number }) => {
  return (
    <motion.div
      className="w-16 h-0.5 bg-gradient-to-r from-transparent via-green-300 to-transparent rounded-full"
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{
        delay: startDelay,
        duration: 0.8,
        ease: 'easeOut',
      }}
    >
      {/* Animated flow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400 to-transparent"
        animate={{
          x: ['-100%', '100%'],
          opacity: [0, 0.6, 0],
        }}
        transition={{
          delay: startDelay + 0.2,
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
};

// Logo letters - fade in one by one
const LogoLetters = ({ startDelay }: { startDelay: number }) => {
  const letters = 'Frigy'.split('');

  return (
    <motion.div className="flex justify-center gap-0">
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-green-100 via-green-200 to-green-300 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: startDelay + i * 0.08,
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1], // easeOutBack
          }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const mascotSize = isMobile ? 120 : 160;

  // Calculate responsive animation positions based on screen size
  const getMascotVariants = () => {
    const startX = isMobile ? -150 : -200;
    const endX = isMobile ? 100 : 180;
    const startY = isMobile ? 40 : 60;
    const endY = isMobile ? -20 : -30;

    return {
      initial: {
        x: startX,
        y: startY,
        opacity: 0,
        rotateZ: 0,
      },
      animate: {
        x: endX,
        y: endY,
        opacity: 1,
        rotateZ: [0, -2, 0, -1, 0],
        transition: {
          x: {
            duration: 2.2,
            ease: [0.25, 0.1, 0.25, 1],
          },
          y: {
            duration: 2.2,
            ease: [0.25, 0.1, 0.25, 1],
          },
          opacity: {
            duration: 0.6,
            ease: 'easeOut',
          },
          rotateZ: {
            duration: 2.2,
            ease: 'easeInOut',
            times: [0, 0.3, 0.6, 0.8, 1],
          },
        },
      },
      rest: {
        x: endX,
        y: endY,
        opacity: 1,
        rotateZ: 0,
        transition: {
          duration: 0.8,
          ease: 'easeOut',
        },
      },
    };
  };

  const mascotVariants = getMascotVariants();

  useEffect(() => {
    // Cinematic duration: 4 seconds
    const totalDuration = 4000;
    const timer = setTimeout(() => {
      handleComplete();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [handleComplete]);

  // Blink animation during movement
  const blinkVariants = {
    open: { scaleY: 1 },
    closed: { scaleY: 0.1 },
  };

  // Arm stretch forward animation
  const armVariants = {
    initial: { x: 0, rotateZ: 0 },
    animate: {
      x: [0, 8, 0],
      rotateZ: [0, -15, 0],
      transition: {
        duration: 2.2,
        ease: 'easeInOut',
        times: [0, 0.4, 1],
      },
    },
  };

  // Container exit animation - soft crossfade
  const containerVariants = {
    initial: { opacity: 1 },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.6,
        delay: 3.4,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 w-screen h-screen overflow-hidden"
      variants={containerVariants}
      initial="initial"
      exit="exit"
    >
      {/* Animated background */}
      <AmbientBackground />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        {/* Motion blur following mascot */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ x: -200, y: 60 }}
        >
          <MotionBlur />
        </motion.div>

        {/* Frigy Mascot */}
        <motion.div
          variants={mascotVariants}
          initial="initial"
          animate="animate"
          className="relative"
        >
          <div className="relative flex items-center justify-center" style={{ width: mascotSize, height: mascotSize }}>
            {/* Main mascot */}
            <div className="relative z-20">
              <AnimatedFrigyMascot size={mascotSize} animate={true} />
            </div>

            {/* Blink overlay (subtle) */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              variants={blinkVariants}
              initial="open"
              animate={{
                scaleY: [1, 1, 1, 0.05, 1, 1],
              }}
              transition={{
                duration: 2.2,
                ease: 'easeInOut',
                times: [0, 0.4, 0.5, 0.52, 0.54, 1],
              }}
            />
          </div>
        </motion.div>

        {/* Logo - appears as mascot passes center */}
        <motion.div
          className="absolute top-1/2 translate-y-1/3 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          <LogoLetters startDelay={1.1} />
        </motion.div>

        {/* Loading indicator below logo */}
        <motion.div
          className="absolute top-2/3 flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.4 }}
        >
          <LoadingIndicator startDelay={2.2} />
        </motion.div>

        {/* Breathing animation after stop */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0, 0.1, 0],
          }}
          transition={{
            delay: 2.4,
            duration: 1.2,
            repeat: 2,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle, rgba(74, 222, 128, 0.2) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      </div>
    </motion.div>
  );
};
