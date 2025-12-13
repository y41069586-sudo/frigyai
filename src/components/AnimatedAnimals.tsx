import { motion } from 'framer-motion';

interface IconProps {
  isActive: boolean;
}

// Walking Person - slow speed
export const AnimatedSloth = ({ isActive }: IconProps) => {
  return (
    <svg viewBox="0 0 60 80" className={`w-12 h-16 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
      {/* Head */}
      <motion.circle
        cx="30"
        cy="12"
        r="8"
        fill="#4A5568"
        animate={isActive ? { y: [0, -2, 0, -2, 0] } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Body */}
      <motion.line
        x1="30"
        y1="20"
        x2="30"
        y2="45"
        stroke="#4A5568"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Left Arm - swings opposite to legs */}
      <motion.line
        x1="30"
        y1="26"
        x2="20"
        y2="38"
        stroke="#4A5568"
        strokeWidth="3"
        strokeLinecap="round"
        animate={isActive ? { 
          rotate: [-20, 20, -20]
        } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: '30px 26px' }}
      />
      
      {/* Right Arm - swings opposite to legs */}
      <motion.line
        x1="30"
        y1="26"
        x2="40"
        y2="38"
        stroke="#4A5568"
        strokeWidth="3"
        strokeLinecap="round"
        animate={isActive ? { 
          rotate: [20, -20, 20]
        } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: '30px 26px' }}
      />
      
      {/* Left Leg - walking motion */}
      <motion.line
        x1="30"
        y1="45"
        x2="22"
        y2="70"
        stroke="#4A5568"
        strokeWidth="4"
        strokeLinecap="round"
        animate={isActive ? { 
          rotate: [20, -20, 20]
        } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: '30px 45px' }}
      />
      
      {/* Right Leg - walking motion */}
      <motion.line
        x1="30"
        y1="45"
        x2="38"
        y2="70"
        stroke="#4A5568"
        strokeWidth="4"
        strokeLinecap="round"
        animate={isActive ? { 
          rotate: [-20, 20, -20]
        } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: '30px 45px' }}
      />
    </svg>
  );
};

// Driving Car - medium speed
export const AnimatedRabbit = ({ isActive }: IconProps) => {
  return (
    <div className="relative">
      {/* Speed lines when active */}
      {isActive && (
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-0.5 bg-blue-400 rounded-full"
              style={{ width: `${8 + i * 3}px` }}
              animate={{ 
                opacity: [0, 0.8, 0],
                x: [0, -8, -16],
              }}
              transition={{ 
                duration: 0.3,
                repeat: Infinity,
                delay: i * 0.08
              }}
            />
          ))}
        </div>
      )}
      
      <svg viewBox="0 0 100 55" className={`w-20 h-11 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
        {/* Car Body */}
        <motion.g
          animate={isActive ? { y: [0, -1, 0, -1, 0] } : {}}
          transition={{ duration: 0.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Main body */}
          <path
            d="M15 28 L22 15 L42 10 L72 10 L88 22 L92 28 L92 35 L8 35 L8 28 Z"
            fill="#3182CE"
            stroke="#2C5282"
            strokeWidth="1.5"
          />
          
          {/* Roof */}
          <path
            d="M25 15 L40 10 L68 10 L78 20 L25 20 Z"
            fill="#2C5282"
          />
          
          {/* Front window */}
          <path
            d="M27 14 L40 11 L40 19 L27 19 Z"
            fill="#90CDF4"
          />
          
          {/* Side window */}
          <path
            d="M43 11 L66 11 L75 19 L43 19 Z"
            fill="#90CDF4"
          />
          
          {/* Headlight */}
          <motion.circle 
            cx="90" 
            cy="28" 
            r="3" 
            fill="#FBBF24"
            animate={isActive ? { opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          
          {/* Taillight */}
          <circle cx="10" cy="28" r="2" fill="#EF4444" />
        </motion.g>
        
        {/* Front Wheel */}
        <motion.g
          animate={isActive ? { rotate: 360 } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '75px 40px' }}
        >
          <circle cx="75" cy="40" r="8" fill="#1A202C" />
          <circle cx="75" cy="40" r="4" fill="#4A5568" />
          <line x1="75" y1="32" x2="75" y2="48" stroke="#718096" strokeWidth="1.5" />
          <line x1="67" y1="40" x2="83" y2="40" stroke="#718096" strokeWidth="1.5" />
        </motion.g>
        
        {/* Back Wheel */}
        <motion.g
          animate={isActive ? { rotate: 360 } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '25px 40px' }}
        >
          <circle cx="25" cy="40" r="8" fill="#1A202C" />
          <circle cx="25" cy="40" r="4" fill="#4A5568" />
          <line x1="25" y1="32" x2="25" y2="48" stroke="#718096" strokeWidth="1.5" />
          <line x1="17" y1="40" x2="33" y2="40" stroke="#718096" strokeWidth="1.5" />
        </motion.g>
      </svg>
    </div>
  );
};

// Flying Rocket - fast speed
export const AnimatedCheetah = ({ isActive }: IconProps) => {
  return (
    <div className="relative">
      <svg viewBox="0 0 60 90" className={`w-12 h-18 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
        {/* Rocket Body */}
        <motion.g
          animate={isActive ? { y: [0, -4, 0, -4, 0] } : {}}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Main body */}
          <path
            d="M30 5 C30 5 45 20 45 42 L45 58 L15 58 L15 42 C15 20 30 5 30 5 Z"
            fill="#E53E3E"
            stroke="#C53030"
            strokeWidth="1.5"
          />
          
          {/* Rocket tip highlight */}
          <path
            d="M30 5 L36 18 L30 16 L24 18 Z"
            fill="#FC8181"
          />
          
          {/* Window */}
          <circle cx="30" cy="32" r="7" fill="#90CDF4" stroke="#63B3ED" strokeWidth="1.5" />
          <circle cx="30" cy="32" r="3.5" fill="#BEE3F8" />
          
          {/* Left Fin */}
          <path
            d="M15 45 L5 62 L15 58 Z"
            fill="#C53030"
          />
          
          {/* Right Fin */}
          <path
            d="M45 45 L55 62 L45 58 Z"
            fill="#C53030"
          />
          
          {/* Rocket Base */}
          <rect x="20" y="58" width="20" height="4" fill="#1A202C" rx="1" />
        </motion.g>
        
        {/* Flames - only when active */}
        {isActive && (
          <motion.g>
            {/* Outer Flame */}
            <motion.path
              d="M22 62 L30 88 L38 62"
              fill="#F6AD55"
              animate={{ 
                d: [
                  "M22 62 L30 88 L38 62",
                  "M20 62 L30 92 L40 62",
                  "M22 62 L30 88 L38 62"
                ]
              }}
              transition={{ duration: 0.12, repeat: Infinity }}
            />
            
            {/* Middle Flame */}
            <motion.path
              d="M25 62 L30 80 L35 62"
              fill="#FBBF24"
              animate={{ 
                d: [
                  "M25 62 L30 80 L35 62",
                  "M24 62 L30 85 L36 62",
                  "M25 62 L30 80 L35 62"
                ]
              }}
              transition={{ duration: 0.1, repeat: Infinity }}
            />
            
            {/* Core Flame */}
            <motion.path
              d="M27 62 L30 72 L33 62"
              fill="#FEF3C7"
              animate={{ 
                d: [
                  "M27 62 L30 72 L33 62",
                  "M27 62 L30 76 L33 62",
                  "M27 62 L30 72 L33 62"
                ]
              }}
              transition={{ duration: 0.08, repeat: Infinity }}
            />
            
            {/* Smoke particles */}
            <motion.circle
              cx="20"
              cy="75"
              r="3"
              fill="#A0AEC0"
              animate={{ opacity: [0, 0.5, 0], y: [0, 12, 24], x: [-3, -8, -12] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <motion.circle
              cx="40"
              cy="75"
              r="3"
              fill="#A0AEC0"
              animate={{ opacity: [0, 0.5, 0], y: [0, 12, 24], x: [3, 8, 12] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
            />
            <motion.circle
              cx="30"
              cy="80"
              r="2"
              fill="#CBD5E0"
              animate={{ opacity: [0, 0.4, 0], y: [0, 15, 30] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.08 }}
            />
          </motion.g>
        )}
      </svg>
    </div>
  );
};
