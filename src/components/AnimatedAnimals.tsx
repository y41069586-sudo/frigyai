import { motion } from 'framer-motion';

interface AnimalProps {
  isActive: boolean;
}

// Animated Sloth - gentle swinging motion
export const AnimatedSloth = ({ isActive }: AnimalProps) => {
  return (
    <svg viewBox="0 0 100 100" className={`w-16 h-16 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
      {/* Branch */}
      <motion.path
        d="M20 25 Q50 20 80 25"
        stroke="#4a3728"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Body */}
      <motion.ellipse
        cx="50"
        cy="55"
        rx="18"
        ry="22"
        fill="#5c4033"
        animate={isActive ? { 
          cy: [55, 58, 55],
          rx: [18, 17, 18],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Face */}
      <motion.circle
        cx="50"
        cy="42"
        r="14"
        fill="#8B7355"
        animate={isActive ? { 
          cy: [42, 44, 42],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Eyes */}
      <circle cx="45" cy="40" r="4" fill="#2d2d2d" />
      <circle cx="55" cy="40" r="4" fill="#2d2d2d" />
      <circle cx="46" cy="39" r="1.5" fill="white" />
      <circle cx="56" cy="39" r="1.5" fill="white" />
      
      {/* Nose */}
      <ellipse cx="50" cy="46" rx="3" ry="2" fill="#2d2d2d" />
      
      {/* Left Arm - hanging */}
      <motion.path
        d="M35 45 Q25 35 30 25"
        stroke="#5c4033"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M35 45 Q25 35 30 25", "M35 47 Q27 37 32 27", "M35 45 Q25 35 30 25"],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Right Arm - hanging */}
      <motion.path
        d="M65 45 Q75 35 70 25"
        stroke="#5c4033"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M65 45 Q75 35 70 25", "M65 47 Q73 37 68 27", "M65 45 Q75 35 70 25"],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      
      {/* Left Leg */}
      <motion.path
        d="M40 72 Q35 82 38 88"
        stroke="#5c4033"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M40 72 Q35 82 38 88", "M40 74 Q33 84 36 90", "M40 72 Q35 82 38 88"],
        } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Right Leg */}
      <motion.path
        d="M60 72 Q65 82 62 88"
        stroke="#5c4033"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M60 72 Q65 82 62 88", "M60 74 Q67 84 64 90", "M60 72 Q65 82 62 88"],
        } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </svg>
  );
};

// Animated Rabbit - hopping with leg movement
export const AnimatedRabbit = ({ isActive }: AnimalProps) => {
  return (
    <svg viewBox="0 0 100 100" className={`w-16 h-16 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
      {/* Body */}
      <motion.ellipse
        cx="50"
        cy="60"
        rx="20"
        ry="15"
        fill="#2d2d2d"
        animate={isActive ? { 
          cy: [60, 50, 60],
          rx: [20, 22, 20],
          ry: [15, 12, 15],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Head */}
      <motion.circle
        cx="70"
        cy="50"
        r="12"
        fill="#2d2d2d"
        animate={isActive ? { 
          cy: [50, 42, 50],
          cx: [70, 72, 70],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Left Ear */}
      <motion.ellipse
        cx="65"
        cy="30"
        rx="4"
        ry="15"
        fill="#2d2d2d"
        animate={isActive ? { 
          cy: [30, 22, 30],
          rotate: [-10, -15, -10],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
        style={{ transformOrigin: "65px 45px" }}
      />
      
      {/* Right Ear */}
      <motion.ellipse
        cx="75"
        cy="28"
        rx="4"
        ry="15"
        fill="#2d2d2d"
        animate={isActive ? { 
          cy: [28, 20, 28],
          rotate: [10, 15, 10],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
        style={{ transformOrigin: "75px 43px" }}
      />
      
      {/* Eye */}
      <motion.circle
        cx="75"
        cy="48"
        r="2"
        fill="white"
        animate={isActive ? { 
          cy: [48, 40, 48],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Back Leg - Power leg */}
      <motion.path
        d="M35 65 Q25 75 30 85"
        stroke="#2d2d2d"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M35 65 Q25 75 30 85",
            "M35 55 Q45 70 55 75",
            "M35 65 Q25 75 30 85",
          ],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Front Leg */}
      <motion.path
        d="M60 70 Q65 80 60 88"
        stroke="#2d2d2d"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M60 70 Q65 80 60 88",
            "M65 55 Q75 60 80 65",
            "M60 70 Q65 80 60 88",
          ],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Tail */}
      <motion.circle
        cx="28"
        cy="55"
        r="5"
        fill="#4a4a4a"
        animate={isActive ? { 
          cy: [55, 48, 55],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
    </svg>
  );
};

// Animated Cheetah - running with leg cycle
export const AnimatedCheetah = ({ isActive }: AnimalProps) => {
  return (
    <svg viewBox="0 0 120 80" className={`w-20 h-14 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
      {/* Body */}
      <motion.ellipse
        cx="60"
        cy="35"
        rx="30"
        ry="12"
        fill="#e8a848"
        animate={isActive ? { 
          cy: [35, 32, 35, 32, 35],
          rx: [30, 33, 30, 33, 30],
          ry: [12, 10, 12, 10, 12],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Spots */}
      <circle cx="45" cy="32" r="3" fill="#8B4513" />
      <circle cx="55" cy="38" r="2.5" fill="#8B4513" />
      <circle cx="65" cy="30" r="3" fill="#8B4513" />
      <circle cx="75" cy="36" r="2" fill="#8B4513" />
      
      {/* Head */}
      <motion.ellipse
        cx="95"
        cy="30"
        rx="10"
        ry="8"
        fill="#e8a848"
        animate={isActive ? { 
          cy: [30, 27, 30, 27, 30],
          cx: [95, 97, 95, 97, 95],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Ear */}
      <motion.path
        d="M92 22 L95 15 L98 22"
        fill="#e8a848"
        animate={isActive ? { 
          d: ["M92 22 L95 15 L98 22", "M92 19 L95 12 L98 19", "M92 22 L95 15 L98 22"],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Eye */}
      <motion.circle
        cx="100"
        cy="28"
        r="2"
        fill="#2d2d2d"
        animate={isActive ? { 
          cy: [28, 25, 28, 25, 28],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Nose */}
      <motion.circle
        cx="108"
        cy="30"
        r="2"
        fill="#2d2d2d"
        animate={isActive ? { 
          cy: [30, 27, 30, 27, 30],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Back Left Leg */}
      <motion.path
        d="M35 42 Q30 55 25 70"
        stroke="#e8a848"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M35 42 Q30 55 25 70",
            "M35 40 Q45 50 55 55",
            "M35 42 Q25 50 15 55",
            "M35 40 Q45 50 55 55",
            "M35 42 Q30 55 25 70",
          ],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Back Right Leg */}
      <motion.path
        d="M45 42 Q40 55 35 70"
        stroke="#d4943f"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M45 42 Q40 55 35 70",
            "M45 40 Q35 50 25 55",
            "M45 42 Q55 50 65 55",
            "M45 40 Q35 50 25 55",
            "M45 42 Q40 55 35 70",
          ],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Front Left Leg */}
      <motion.path
        d="M75 42 Q70 55 65 70"
        stroke="#e8a848"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M75 42 Q70 55 65 70",
            "M75 38 Q85 45 95 50",
            "M75 42 Q65 50 55 55",
            "M75 38 Q85 45 95 50",
            "M75 42 Q70 55 65 70",
          ],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Front Right Leg */}
      <motion.path
        d="M85 42 Q80 55 75 70"
        stroke="#d4943f"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M85 42 Q80 55 75 70",
            "M85 38 Q75 45 65 50",
            "M85 42 Q95 50 105 55",
            "M85 38 Q75 45 65 50",
            "M85 42 Q80 55 75 70",
          ],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Tail */}
      <motion.path
        d="M28 35 Q15 30 8 40 Q5 50 10 55"
        stroke="#e8a848"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        animate={isActive ? { 
          d: [
            "M28 35 Q15 30 8 40 Q5 50 10 55",
            "M28 32 Q15 25 5 30 Q0 40 5 50",
            "M28 35 Q15 35 8 45 Q5 55 12 60",
            "M28 32 Q15 25 5 30 Q0 40 5 50",
            "M28 35 Q15 30 8 40 Q5 50 10 55",
          ],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Tail tip */}
      <motion.circle
        cx="10"
        cy="55"
        r="4"
        fill="#2d2d2d"
        animate={isActive ? { 
          cx: [10, 5, 12, 5, 10],
          cy: [55, 50, 60, 50, 55],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
};
