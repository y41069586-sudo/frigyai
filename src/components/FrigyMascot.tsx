import { motion, AnimatePresence } from "framer-motion";
import frigyMascot from "@/assets/frigy-mascot.png";

interface FrigyMascotProps {
  show: boolean;
  position?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
  delay?: number;
}

export const FrigyMascot = ({ 
  show, 
  position = "bottom", 
  size = "md",
  className = "",
  delay = 0
}: FrigyMascotProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const positionStyles = {
    top: {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 },
      className: "top-0 left-1/2 -translate-x-1/2"
    },
    bottom: {
      initial: { y: 100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 100, opacity: 0 },
      className: "bottom-0 left-1/2 -translate-x-1/2"
    },
    left: {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -100, opacity: 0 },
      className: "left-0 top-1/2 -translate-y-1/2"
    },
    right: {
      initial: { x: 100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 },
      className: "right-0 top-1/2 -translate-y-1/2"
    }
  };

  const config = positionStyles[position];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={config.initial}
          animate={config.animate}
          exit={config.exit}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            delay 
          }}
          className={`fixed z-50 pointer-events-none ${config.className} ${className}`}
        >
          <motion.img
            src={frigyMascot}
            alt="Frigy Mascot"
            className={`${sizeClasses[size]} object-contain drop-shadow-lg`}
            animate={{ 
              rotate: [0, -5, 5, -3, 3, 0],
              scale: [1, 1.02, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 3,
              delay: delay + 0.5
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Inline mascot for use within content
export const FrigyMascotInline = ({ 
  size = "md",
  className = "",
  animate = true,
  variant = "default"
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
  variant?: "default" | "bounce" | "wiggle" | "bubble";
}) => {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  const variants = {
    default: {
      initial: { scale: 0, rotate: -20 },
      animate: { scale: 1, rotate: 0 },
      transition: { type: "spring" as const, stiffness: 400, damping: 15 }
    },
    bounce: {
      initial: { y: 100, opacity: 0, scale: 0.5 },
      animate: { y: 0, opacity: 1, scale: 1 },
      transition: { type: "spring" as const, stiffness: 300, damping: 12 }
    },
    wiggle: {
      initial: { y: 50, opacity: 0, rotate: -10 },
      animate: { y: 0, opacity: 1, rotate: 0 },
      transition: { type: "spring" as const, stiffness: 500, damping: 15 }
    },
    bubble: {
      initial: { y: 80, opacity: 0, scale: 0.3 },
      animate: { y: 0, opacity: 1, scale: 1 },
      transition: { 
        type: "spring" as const, 
        stiffness: 200, 
        damping: 10,
        mass: 0.8
      }
    }
  };

  const continuousAnimations = {
    default: {
      rotate: [0, -5, 5, -3, 3, 0],
      scale: [1, 1.03, 1],
    },
    bounce: {
      y: [0, -8, 0, -4, 0],
      rotate: [0, -3, 3, -2, 0],
    },
    wiggle: {
      rotate: [0, -8, 8, -5, 5, -2, 2, 0],
      scale: [1, 1.02, 1],
    },
    bubble: {
      y: [0, -6, 0, -3, 0],
      scale: [1, 1.05, 0.98, 1.02, 1],
      rotate: [0, -4, 4, -2, 2, 0],
    }
  };

  if (animate) {
    return (
      <motion.div className="relative">
        {/* Bubble particles behind mascot */}
        {variant === "bubble" && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary/20"
                style={{
                  width: 8 + Math.random() * 12,
                  height: 8 + Math.random() * 12,
                  left: `${20 + Math.random() * 60}%`,
                  bottom: 0,
                }}
                initial={{ y: 0, opacity: 0, scale: 0 }}
                animate={{ 
                  y: [-20, -60 - Math.random() * 40],
                  opacity: [0, 0.6, 0],
                  scale: [0, 1, 0.5]
                }}
                transition={{
                  duration: 1.5 + Math.random() * 1,
                  delay: 0.2 + i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 2 + Math.random() * 2
                }}
              />
            ))}
          </>
        )}
        
        <motion.img
          src={frigyMascot}
          alt="Frigy"
          className={`${sizeClasses[size]} object-contain drop-shadow-lg ${className}`}
          initial={variants[variant].initial}
          animate={variants[variant].animate}
          transition={variants[variant].transition}
          whileHover={{ scale: 1.1, rotate: 5 }}
        />
        
        {/* Continuous animation overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={continuousAnimations[variant]}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: "easeInOut"
          }}
        >
          <img
            src={frigyMascot}
            alt=""
            className={`${sizeClasses[size]} object-contain opacity-0`}
          />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <img
      src={frigyMascot}
      alt="Frigy"
      className={`${sizeClasses[size]} object-contain ${className}`}
    />
  );
};

// Peek animation - mascot peeks from edge of screen
export const FrigyPeek = ({
  show,
  from = "bottom-right",
  delay = 0
}: {
  show: boolean;
  from?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  delay?: number;
}) => {
  const positions = {
    "bottom-right": {
      initial: { x: 80, y: 80, rotate: 15 },
      animate: { x: 20, y: 20, rotate: -5 },
      className: "bottom-0 right-0"
    },
    "bottom-left": {
      initial: { x: -80, y: 80, rotate: -15 },
      animate: { x: -20, y: 20, rotate: 5 },
      className: "bottom-0 left-0"
    },
    "top-right": {
      initial: { x: 80, y: -80, rotate: -15 },
      animate: { x: 20, y: -20, rotate: 5 },
      className: "top-0 right-0"
    },
    "top-left": {
      initial: { x: -80, y: -80, rotate: 15 },
      animate: { x: -20, y: -20, rotate: -5 },
      className: "top-0 left-0"
    }
  };

  const config = positions[from];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ ...config.initial, opacity: 0 }}
          animate={{ ...config.animate, opacity: 1 }}
          exit={{ ...config.initial, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay 
          }}
          className={`fixed z-50 pointer-events-none ${config.className}`}
        >
          <motion.img
            src={frigyMascot}
            alt="Frigy"
            className="w-20 h-20 object-contain drop-shadow-xl"
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
