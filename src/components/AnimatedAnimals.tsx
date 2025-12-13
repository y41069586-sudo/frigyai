import { motion } from 'framer-motion';

interface AnimalProps {
  isActive: boolean;
}

// Clean Animated Sloth - smooth hanging motion
export const AnimatedSloth = ({ isActive }: AnimalProps) => {
  return (
    <svg viewBox="0 0 80 80" className={`w-14 h-14 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
      {/* Branch */}
      <path
        d="M10 15 Q40 10 70 15"
        stroke="#374151"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Left Arm */}
      <motion.path
        d="M25 20 L30 35"
        stroke="#6b7280"
        strokeWidth="5"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M25 20 L30 35", "M26 20 L32 36", "M25 20 L30 35"]
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Right Arm */}
      <motion.path
        d="M55 20 L50 35"
        stroke="#6b7280"
        strokeWidth="5"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M55 20 L50 35", "M54 20 L48 36", "M55 20 L50 35"]
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      
      {/* Body */}
      <motion.ellipse
        cx="40"
        cy="50"
        rx="15"
        ry="18"
        fill="#9ca3af"
        animate={isActive ? { 
          cy: [50, 52, 50],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Face */}
      <motion.circle
        cx="40"
        cy="38"
        r="12"
        fill="#d1d5db"
        animate={isActive ? { 
          cy: [38, 40, 38],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Eye patches */}
      <ellipse cx="35" cy="36" rx="4" ry="5" fill="#4b5563" />
      <ellipse cx="45" cy="36" rx="4" ry="5" fill="#4b5563" />
      
      {/* Eyes */}
      <circle cx="35" cy="36" r="2" fill="#1f2937" />
      <circle cx="45" cy="36" r="2" fill="#1f2937" />
      
      {/* Nose */}
      <ellipse cx="40" cy="42" rx="2" ry="1.5" fill="#1f2937" />
      
      {/* Smile */}
      <path d="M37 45 Q40 47 43 45" stroke="#4b5563" strokeWidth="1" fill="none" />
      
      {/* Left Leg */}
      <motion.path
        d="M32 65 L28 75"
        stroke="#6b7280"
        strokeWidth="4"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M32 65 L28 75", "M32 67 L26 77", "M32 65 L28 75"]
        } : {}}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Right Leg */}
      <motion.path
        d="M48 65 L52 75"
        stroke="#6b7280"
        strokeWidth="4"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M48 65 L52 75", "M48 67 L54 77", "M48 65 L52 75"]
        } : {}}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
      />
    </svg>
  );
};

// Clean Animated Rabbit - realistic hop cycle
export const AnimatedRabbit = ({ isActive }: AnimalProps) => {
  return (
    <svg viewBox="0 0 80 70" className={`w-14 h-12 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
      {/* Tail */}
      <motion.circle
        cx="12"
        cy="35"
        r="5"
        fill="#1f2937"
        animate={isActive ? { 
          cy: [35, 28, 35],
          cx: [12, 10, 12],
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Back leg - thigh */}
      <motion.path
        d="M20 40 Q15 50 18 60"
        stroke="#1f2937"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        animate={isActive ? { 
          d: [
            "M20 40 Q15 50 18 60",
            "M20 32 Q30 40 40 42",
            "M20 40 Q15 50 18 60",
          ]
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Body */}
      <motion.ellipse
        cx="35"
        cy="38"
        rx="18"
        ry="12"
        fill="#1f2937"
        animate={isActive ? { 
          cy: [38, 30, 38],
          rx: [18, 20, 18],
          ry: [12, 10, 12],
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Front leg */}
      <motion.path
        d="M48 45 Q52 55 50 62"
        stroke="#1f2937"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        animate={isActive ? { 
          d: [
            "M48 45 Q52 55 50 62",
            "M50 32 Q60 35 68 38",
            "M48 45 Q52 55 50 62",
          ]
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Head */}
      <motion.circle
        cx="58"
        cy="32"
        r="10"
        fill="#1f2937"
        animate={isActive ? { 
          cy: [32, 25, 32],
          cx: [58, 62, 58],
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Left ear */}
      <motion.ellipse
        cx="52"
        cy="15"
        rx="3"
        ry="12"
        fill="#1f2937"
        animate={isActive ? { 
          cy: [15, 8, 15],
          ry: [12, 14, 12],
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Right ear */}
      <motion.ellipse
        cx="60"
        cy="13"
        rx="3"
        ry="12"
        fill="#374151"
        animate={isActive ? { 
          cy: [13, 6, 13],
          ry: [12, 14, 12],
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Eye */}
      <motion.circle
        cx="63"
        cy="30"
        r="2"
        fill="white"
        animate={isActive ? { 
          cy: [30, 23, 30],
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeOut" }}
      />
    </svg>
  );
};

// Clean Animated Cheetah - smooth gallop cycle
export const AnimatedCheetah = ({ isActive }: AnimalProps) => {
  return (
    <svg viewBox="0 0 100 60" className={`w-16 h-10 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
      {/* Tail */}
      <motion.path
        d="M8 25 Q0 20 5 30 Q10 40 8 45"
        stroke="#f59e0b"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M8 25 Q0 20 5 30 Q10 40 8 45",
            "M8 22 Q-2 15 3 25 Q8 35 5 42",
            "M8 28 Q2 25 7 35 Q12 45 10 48",
            "M8 22 Q-2 15 3 25 Q8 35 5 42",
            "M8 25 Q0 20 5 30 Q10 40 8 45",
          ]
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Back left leg */}
      <motion.path
        d="M22 38 L18 55"
        stroke="#f59e0b"
        strokeWidth="5"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M22 38 L18 55",
            "M22 35 L35 42",
            "M22 38 L10 48",
            "M22 35 L35 42",
            "M22 38 L18 55",
          ]
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Back right leg */}
      <motion.path
        d="M28 38 L24 55"
        stroke="#d97706"
        strokeWidth="5"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M28 38 L24 55",
            "M28 35 L15 45",
            "M28 38 L40 45",
            "M28 35 L15 45",
            "M28 38 L24 55",
          ]
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Body */}
      <motion.ellipse
        cx="45"
        cy="30"
        rx="25"
        ry="10"
        fill="#f59e0b"
        animate={isActive ? { 
          cy: [30, 27, 30, 27, 30],
          rx: [25, 28, 25, 28, 25],
          ry: [10, 8, 10, 8, 10],
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Spots */}
      <circle cx="35" cy="28" r="2.5" fill="#92400e" />
      <circle cx="45" cy="32" r="2" fill="#92400e" />
      <circle cx="55" cy="27" r="2.5" fill="#92400e" />
      
      {/* Front left leg */}
      <motion.path
        d="M62 38 L58 55"
        stroke="#f59e0b"
        strokeWidth="4"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M62 38 L58 55",
            "M62 32 L75 38",
            "M62 38 L50 48",
            "M62 32 L75 38",
            "M62 38 L58 55",
          ]
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Front right leg */}
      <motion.path
        d="M68 38 L64 55"
        stroke="#d97706"
        strokeWidth="4"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M68 38 L64 55",
            "M68 32 L55 42",
            "M68 38 L80 45",
            "M68 32 L55 42",
            "M68 38 L64 55",
          ]
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Neck */}
      <motion.path
        d="M68 28 L78 20"
        stroke="#f59e0b"
        strokeWidth="8"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M68 28 L78 20",
            "M70 25 L82 17",
            "M68 28 L78 20",
            "M70 25 L82 17",
            "M68 28 L78 20",
          ]
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Head */}
      <motion.ellipse
        cx="85"
        cy="18"
        rx="10"
        ry="7"
        fill="#f59e0b"
        animate={isActive ? { 
          cx: [85, 89, 85, 89, 85],
          cy: [18, 14, 18, 14, 18],
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Ear */}
      <motion.path
        d="M82 12 L84 6 L87 11"
        fill="#f59e0b"
        animate={isActive ? { 
          d: [
            "M82 12 L84 6 L87 11",
            "M86 8 L88 2 L91 7",
            "M82 12 L84 6 L87 11",
          ]
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Eye */}
      <motion.circle
        cx="90"
        cy="16"
        r="2"
        fill="#1f2937"
        animate={isActive ? { 
          cx: [90, 94, 90, 94, 90],
          cy: [16, 12, 16, 12, 16],
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Nose */}
      <motion.circle
        cx="95"
        cy="18"
        r="1.5"
        fill="#1f2937"
        animate={isActive ? { 
          cx: [95, 99, 95, 99, 95],
          cy: [18, 14, 18, 14, 18],
        } : {}}
        transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
};
