import { motion } from 'framer-motion';

interface IconProps {
  isActive: boolean;
}

// Cycling Bicycle - slow speed
export const AnimatedSloth = ({ isActive }: IconProps) => {
  return (
    <motion.svg 
      viewBox="0 0 80 60" 
      className={`w-12 h-9 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}
      animate={isActive ? { x: [0, 2, 0] } : {}}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Back Wheel */}
      <motion.g
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '18px 42px' }}
      >
        <circle cx="18" cy="42" r="12" fill="none" stroke="#4A5568" strokeWidth="3" />
        <circle cx="18" cy="42" r="3" fill="#718096" />
        {/* Spokes */}
        <line x1="18" y1="30" x2="18" y2="54" stroke="#718096" strokeWidth="1" />
        <line x1="6" y1="42" x2="30" y2="42" stroke="#718096" strokeWidth="1" />
        <line x1="9" y1="33" x2="27" y2="51" stroke="#718096" strokeWidth="1" />
        <line x1="9" y1="51" x2="27" y2="33" stroke="#718096" strokeWidth="1" />
      </motion.g>
      
      {/* Front Wheel */}
      <motion.g
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '62px 42px' }}
      >
        <circle cx="62" cy="42" r="12" fill="none" stroke="#4A5568" strokeWidth="3" />
        <circle cx="62" cy="42" r="3" fill="#718096" />
        {/* Spokes */}
        <line x1="62" y1="30" x2="62" y2="54" stroke="#718096" strokeWidth="1" />
        <line x1="50" y1="42" x2="74" y2="42" stroke="#718096" strokeWidth="1" />
        <line x1="53" y1="33" x2="71" y2="51" stroke="#718096" strokeWidth="1" />
        <line x1="53" y1="51" x2="71" y2="33" stroke="#718096" strokeWidth="1" />
      </motion.g>
      
      {/* Frame */}
      <path
        d="M18 42 L40 28 L62 42 M40 28 L40 42 L18 42 M40 28 L50 18"
        fill="none"
        stroke="#48BB78"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Handlebar */}
      <path
        d="M50 18 L56 14 M50 18 L56 22"
        fill="none"
        stroke="#2D3748"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Seat */}
      <ellipse cx="32" cy="24" rx="6" ry="2.5" fill="#2D3748" />
      
      {/* Pedals */}
      <motion.g
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '40px 42px' }}
      >
        <circle cx="40" cy="42" r="4" fill="#718096" />
        <line x1="40" y1="42" x2="40" y2="50" stroke="#4A5568" strokeWidth="2" />
        <line x1="40" y1="42" x2="40" y2="34" stroke="#4A5568" strokeWidth="2" />
        <rect x="37" y="49" width="6" height="3" rx="1" fill="#2D3748" />
        <rect x="37" y="32" width="6" height="3" rx="1" fill="#2D3748" />
      </motion.g>
      
      {/* Rider - simplified */}
      <motion.g
        animate={isActive ? { y: [0, -1, 0] } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Body */}
        <path
          d="M32 24 L45 16"
          stroke="#5B8DEF"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Head */}
        <circle cx="48" cy="12" r="6" fill="#FFCC4D" stroke="#E8A825" strokeWidth="1" />
        {/* Arms */}
        <path
          d="M42 18 L54 16"
          stroke="#FFCC4D"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Legs to pedals */}
        <motion.path
          d="M34 26 L40 42"
          stroke="#3B5998"
          strokeWidth="3"
          strokeLinecap="round"
          animate={isActive ? { 
            d: ["M34 26 L40 50", "M34 26 L40 34", "M34 26 L40 50"]
          } : {}}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.g>
    </motion.svg>
  );
};

// Driving Car - medium speed (smooth animation)
export const AnimatedRabbit = ({ isActive }: IconProps) => {
  return (
    <div className="relative">
      {/* Speed lines when active */}
      {isActive && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-0.5 bg-blue-400/80 rounded-full"
              style={{ width: `${10 + i * 4}px` }}
              animate={{ 
                opacity: [0, 0.7, 0],
                x: [0, -12, -24],
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
      
      <motion.svg 
        viewBox="0 0 100 55" 
        className={`w-14 h-9 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}
      >
        {/* Car Body */}
        <motion.g
          animate={isActive ? { y: [0, -0.5, 0, -0.5, 0] } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
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
            animate={isActive ? { opacity: [0.6, 1, 0.6] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Taillight */}
          <circle cx="10" cy="28" r="2" fill="#EF4444" />
        </motion.g>
        
        {/* Front Wheel */}
        <motion.g
          animate={isActive ? { rotate: 360 } : {}}
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
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
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '25px 40px' }}
        >
          <circle cx="25" cy="40" r="8" fill="#1A202C" />
          <circle cx="25" cy="40" r="4" fill="#4A5568" />
          <line x1="25" y1="32" x2="25" y2="48" stroke="#718096" strokeWidth="1.5" />
          <line x1="17" y1="40" x2="33" y2="40" stroke="#718096" strokeWidth="1.5" />
        </motion.g>
      </motion.svg>
    </div>
  );
};

// Flying Rocket - fast speed (smoother flame animation)
export const AnimatedCheetah = ({ isActive }: IconProps) => {
  return (
    <div className="relative">
      <motion.svg 
        viewBox="0 0 60 90" 
        className={`w-9 h-14 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}
      >
        {/* Rocket Body */}
        <motion.g
          animate={isActive ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
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
                  "M22 62 L30 85 L38 62",
                  "M20 62 L30 90 L40 62",
                  "M22 62 L30 88 L38 62"
                ]
              }}
              transition={{ duration: 0.2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Middle Flame */}
            <motion.path
              d="M25 62 L30 80 L35 62"
              fill="#FBBF24"
              animate={{ 
                d: [
                  "M25 62 L30 80 L35 62",
                  "M24 62 L30 85 L36 62",
                  "M25 62 L30 78 L35 62",
                  "M24 62 L30 83 L36 62",
                  "M25 62 L30 80 L35 62"
                ]
              }}
              transition={{ duration: 0.15, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Core Flame */}
            <motion.path
              d="M27 62 L30 72 L33 62"
              fill="#FEF3C7"
              animate={{ 
                d: [
                  "M27 62 L30 72 L33 62",
                  "M27 62 L30 76 L33 62",
                  "M27 62 L30 70 L33 62",
                  "M27 62 L30 74 L33 62",
                  "M27 62 L30 72 L33 62"
                ]
              }}
              transition={{ duration: 0.12, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Smoke particles */}
            <motion.circle
              cx="20"
              cy="75"
              r="3"
              fill="#A0AEC0"
              animate={{ opacity: [0, 0.4, 0], y: [0, 15, 30], x: [-3, -10, -18] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.circle
              cx="40"
              cy="75"
              r="3"
              fill="#A0AEC0"
              animate={{ opacity: [0, 0.4, 0], y: [0, 15, 30], x: [3, 10, 18] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
            />
            <motion.circle
              cx="30"
              cy="80"
              r="2"
              fill="#CBD5E0"
              animate={{ opacity: [0, 0.3, 0], y: [0, 20, 40] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "easeOut", delay: 0.1 }}
            />
          </motion.g>
        )}
      </motion.svg>
    </div>
  );
};
