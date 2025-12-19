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
  animate = true
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}) => {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  if (animate) {
    return (
      <motion.img
        src={frigyMascot}
        alt="Frigy"
        className={`${sizeClasses[size]} object-contain ${className}`}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
      />
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
