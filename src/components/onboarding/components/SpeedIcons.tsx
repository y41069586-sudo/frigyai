import { motion } from "framer-motion";

interface SpeedIconProps {
  selected: boolean;
}

// Schnecke mit Animation - je schneller das Tempo, desto schneller die Schnecke
export const AnimatedSnail = ({ selected }: SpeedIconProps) => (
  <motion.div
    className="text-3xl"
    animate={{
      x: selected ? [0, 2, -2, 0] : 0,
      rotate: selected ? [0, -5, 5, 0] : 0
    }}
    transition={{
      duration: 0.6,
      repeat: selected ? Infinity : 0,
      ease: "easeInOut"
    }}
  >
    🐌
  </motion.div>
);

export const AnimatedBicycle = AnimatedSnail;

export const AnimatedCar = ({ selected }: SpeedIconProps) => (
  <motion.div
    className="text-3xl"
    animate={{
      x: selected ? [0, 3, -3, 0] : 0,
      rotate: selected ? [0, -8, 8, 0] : 0
    }}
    transition={{
      duration: 0.4,
      repeat: selected ? Infinity : 0,
      ease: "easeInOut"
    }}
  >
    🐌
  </motion.div>
);

export const AnimatedRocket = ({ selected }: SpeedIconProps) => (
  <motion.div
    className="text-3xl"
    animate={{
      x: selected ? [0, 4, -4, 0] : 0,
      rotate: selected ? [0, -12, 12, 0] : 0
    }}
    transition={{
      duration: 0.2,
      repeat: selected ? Infinity : 0,
      ease: "easeInOut"
    }}
  >
    🐌
  </motion.div>
);
