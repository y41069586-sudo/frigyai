// Clean, consistent animation variants for onboarding
// No springs - all smooth easeOut transitions

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const scaleIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// For progress/loading animations
export const pulse = {
  animate: { 
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8]
  },
  transition: { 
    duration: 1.5, 
    repeat: Infinity, 
    ease: "easeInOut" 
  }
};

export const spin = {
  animate: { rotate: 360 },
  transition: { 
    duration: 2, 
    repeat: Infinity, 
    ease: "linear" 
  }
};

// Card hover - subtle
export const cardHover = {
  scale: 1.02,
  transition: { duration: 0.2, ease: "easeOut" }
};

export const cardTap = {
  scale: 0.98
};

// Button press
export const buttonTap = {
  scale: 0.97
};

// Delays for staggered animations
export const getDelay = (index: number, baseDelay = 0.1) => ({
  transition: { delay: index * baseDelay, duration: 0.3, ease: "easeOut" }
});
