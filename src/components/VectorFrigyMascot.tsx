import { motion } from "framer-motion";

interface VectorFrigyMascotProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

// Pure SVG/Vector-based Frigy mascot - NO IMAGES
export const VectorFrigyMascot = ({ 
  className = "", 
  size = 144,
  animate = true 
}: VectorFrigyMascotProps) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      animate={animate ? {
        rotate: [-3, 3, -3],
        scale: [1, 1.02, 1]
      } : undefined}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Fridge body - main rectangle with rounded corners */}
      <defs>
        <linearGradient id="fridgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(160, 84%, 39%)" />
          <stop offset="50%" stopColor="hsl(158, 64%, 52%)" />
          <stop offset="100%" stopColor="hsl(160, 84%, 39%)" />
        </linearGradient>
        <linearGradient id="fridgeDarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(160, 84%, 32%)" />
          <stop offset="100%" stopColor="hsl(160, 64%, 25%)" />
        </linearGradient>
        <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="fridgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>

      {/* Main fridge body */}
      <rect
        x="20"
        y="10"
        width="60"
        height="80"
        rx="8"
        ry="8"
        fill="url(#fridgeGradient)"
        filter="url(#fridgeShadow)"
      />

      {/* Freezer compartment (top) */}
      <rect
        x="24"
        y="14"
        width="52"
        height="20"
        rx="4"
        ry="4"
        fill="url(#fridgeDarkGradient)"
      />

      {/* Fridge compartment (bottom) */}
      <rect
        x="24"
        y="38"
        width="52"
        height="48"
        rx="4"
        ry="4"
        fill="url(#fridgeDarkGradient)"
      />

      {/* Freezer handle */}
      <rect
        x="70"
        y="20"
        width="4"
        height="8"
        rx="2"
        fill="hsl(158, 64%, 70%)"
      />

      {/* Fridge handle */}
      <rect
        x="70"
        y="55"
        width="4"
        height="14"
        rx="2"
        fill="hsl(158, 64%, 70%)"
      />

      {/* Shine effect */}
      <rect
        x="26"
        y="16"
        width="20"
        height="6"
        rx="3"
        fill="url(#shineGradient)"
      />

      {/* Face - Eyes */}
      <motion.g
        animate={animate ? {
          y: [0, -1, 0, 1, 0]
        } : undefined}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Left eye */}
        <ellipse
          cx="40"
          cy="55"
          rx="6"
          ry="7"
          fill="white"
        />
        <motion.ellipse
          cx="41"
          cy="56"
          rx="3"
          ry="3.5"
          fill="hsl(220, 20%, 20%)"
          animate={animate ? {
            cx: [41, 42, 41, 40, 41]
          } : undefined}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <circle cx="43" cy="54" r="1.5" fill="white" />

        {/* Right eye */}
        <ellipse
          cx="60"
          cy="55"
          rx="6"
          ry="7"
          fill="white"
        />
        <motion.ellipse
          cx="61"
          cy="56"
          rx="3"
          ry="3.5"
          fill="hsl(220, 20%, 20%)"
          animate={animate ? {
            cx: [61, 62, 61, 60, 61]
          } : undefined}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <circle cx="63" cy="54" r="1.5" fill="white" />
      </motion.g>

      {/* Smile */}
      <motion.path
        d="M 42 68 Q 50 76 58 68"
        fill="none"
        stroke="hsl(220, 20%, 20%)"
        strokeWidth="2.5"
        strokeLinecap="round"
        animate={animate ? {
          d: [
            "M 42 68 Q 50 76 58 68",
            "M 42 69 Q 50 78 58 69",
            "M 42 68 Q 50 76 58 68"
          ]
        } : undefined}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Cheek blush */}
      <ellipse cx="34" cy="64" rx="4" ry="2.5" fill="hsl(350, 80%, 80%)" opacity="0.5" />
      <ellipse cx="66" cy="64" rx="4" ry="2.5" fill="hsl(350, 80%, 80%)" opacity="0.5" />

      {/* Little feet */}
      <rect x="30" y="88" width="12" height="6" rx="3" fill="hsl(160, 84%, 32%)" />
      <rect x="58" y="88" width="12" height="6" rx="3" fill="hsl(160, 84%, 32%)" />
    </motion.svg>
  );
};

// Animated version with bounce and ingredient lifting
export const AnimatedVectorFrigy = ({ 
  className = "", 
  size = 144 
}: { 
  className?: string; 
  size?: number;
}) => {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        y: [0, -15, 0]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <VectorFrigyMascot size={size} animate={true} />
      
      {/* Floating ingredient that Frigy "holds" */}
      <motion.div
        className="absolute -top-4 -right-2 text-2xl"
        animate={{
          y: [0, -8, 0],
          rotate: [-10, 10, -10],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3
        }}
      >
        🥕
      </motion.div>
    </motion.div>
  );
};
