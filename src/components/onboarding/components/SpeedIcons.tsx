import { motion } from "framer-motion";

interface SpeedIconProps {
  selected: boolean;
}

export const AnimatedBicycle = ({ selected }: SpeedIconProps) => (
  <svg viewBox="0 0 80 60" className="w-16 h-12">
    {/* Back wheel */}
    <motion.circle
      cx="18" cy="45" r="12"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.8, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "18px 45px" }}
    />
    
    {/* Front wheel */}
    <motion.circle
      cx="62" cy="45" r="12"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.8, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "62px 45px" }}
    />
    
    {/* Bike frame */}
    <path 
      d="M18 45 L35 28 L50 28 L62 45 M35 28 L35 45 L50 45 M50 28 L48 20" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Handlebar */}
    <path d="M48 20 L44 17 M48 20 L54 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    
    {/* Seat */}
    <rect x="30" y="25" width="10" height="3" rx="1.5" fill="currentColor" />
    
    {/* Pedal crank */}
    <motion.g
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.6, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "35px 45px" }}
    >
      <circle cx="35" cy="45" r="3" fill="currentColor" />
      <line x1="35" y1="40" x2="35" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </motion.g>
    
    {/* Rider - simple stick figure */}
    <motion.g 
      animate={{ y: selected ? [0, -1, 0] : 0 }} 
      transition={{ duration: 0.3, repeat: selected ? Infinity : 0 }}
    >
      {/* Head */}
      <circle cx="42" cy="8" r="5" fill="currentColor" />
      
      {/* Body */}
      <line x1="42" y1="13" x2="38" y2="25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Arm to handlebar */}
      <line x1="40" y1="17" x2="48" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </motion.g>
    
    {/* Legs - simple animated */}
    <motion.g
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.6, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "35px 45px" }}
    >
      <line x1="35" y1="40" x2="38" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="35" y1="50" x2="38" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </motion.g>
  </svg>
);

export const AnimatedCar = ({ selected }: SpeedIconProps) => (
  <svg viewBox="0 0 80 50" className="w-16 h-12">
    <motion.g animate={{ x: selected ? [0, 2, 0] : 0 }} transition={{ duration: 0.3, repeat: selected ? Infinity : 0 }}>
      <path d="M10 35 L10 25 L20 25 L28 15 L55 15 L65 25 L75 25 L75 35 Z" 
            fill="currentColor" opacity="0.9" />
      <path d="M30 16 L25 24 L40 24 L40 16 Z" fill="hsl(var(--background))" opacity="0.5" />
      <path d="M42 16 L42 24 L58 24 L52 16 Z" fill="hsl(var(--background))" opacity="0.5" />
    </motion.g>
    <motion.circle
      cx="22" cy="38" r="7"
      fill="hsl(var(--background))" stroke="currentColor" strokeWidth="3"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.3, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "22px 38px" }}
    />
    <motion.circle
      cx="60" cy="38" r="7"
      fill="hsl(var(--background))" stroke="currentColor" strokeWidth="3"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.3, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "60px 38px" }}
    />
    {selected && (
      <>
        <motion.line x1="0" y1="22" x2="8" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }} />
        <motion.line x1="0" y1="28" x2="10" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }} />
        <motion.line x1="0" y1="34" x2="6" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }} />
      </>
    )}
  </svg>
);

export const AnimatedRocket = ({ selected }: SpeedIconProps) => (
  <svg viewBox="0 0 60 80" className="w-12 h-16">
    <motion.g 
      animate={{ y: selected ? [0, -3, 0] : 0 }} 
      transition={{ duration: 0.5, repeat: selected ? Infinity : 0 }}
    >
      <path d="M30 5 C30 5 45 25 45 45 L45 55 L15 55 L15 45 C15 25 30 5 30 5" fill="currentColor" />
      <circle cx="30" cy="30" r="7" fill="hsl(var(--primary))" opacity="0.5" />
      <circle cx="30" cy="30" r="4" fill="hsl(var(--background))" />
      <path d="M15 45 L5 60 L15 55 Z" fill="currentColor" opacity="0.8" />
      <path d="M45 45 L55 60 L45 55 Z" fill="currentColor" opacity="0.8" />
    </motion.g>
    {selected && (
      <motion.g>
        <motion.path d="M22 56 L25 75 L30 65 L35 75 L38 56" 
          fill="hsl(45, 100%, 55%)"
          animate={{ d: ["M22 56 L25 75 L30 65 L35 75 L38 56", "M22 56 L25 70 L30 78 L35 70 L38 56", "M22 56 L25 75 L30 65 L35 75 L38 56"] }}
          transition={{ duration: 0.2, repeat: Infinity }} />
        <motion.path d="M25 56 L28 68 L30 60 L32 68 L35 56" 
          fill="hsl(25, 100%, 55%)"
          animate={{ d: ["M25 56 L28 68 L30 60 L32 68 L35 56", "M25 56 L28 62 L30 70 L32 62 L35 56", "M25 56 L28 68 L30 60 L32 68 L35 56"] }}
          transition={{ duration: 0.15, repeat: Infinity }} />
      </motion.g>
    )}
  </svg>
);
