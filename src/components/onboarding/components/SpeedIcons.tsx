import { motion } from "framer-motion";

interface SpeedIconProps {
  selected: boolean;
}

export const AnimatedBicycle = ({ selected }: SpeedIconProps) => (
  <svg viewBox="0 0 100 80" className="w-20 h-16">
    {/* Back wheel */}
    <motion.g
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.6, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "22px 58px" }}
    >
      <circle cx="22" cy="58" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <line x1="22" y1="44" x2="22" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="8" y1="58" x2="36" y2="58" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </motion.g>
    
    {/* Front wheel */}
    <motion.g
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.6, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "78px 58px" }}
    >
      <circle cx="78" cy="58" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <line x1="78" y1="44" x2="78" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="64" y1="58" x2="92" y2="58" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </motion.g>
    
    {/* Bike frame */}
    <path 
      d="M22 58 L45 35 L65 35 L78 58 M45 35 L45 58 L65 58 M65 35 L60 22" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Handlebar */}
    <path d="M60 22 L55 18 M60 22 L68 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Seat */}
    <path d="M45 35 L38 30 L52 30 Z" fill="currentColor" />
    
    {/* Pedal crank - rotating */}
    <motion.g
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.5, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "45px 58px" }}
    >
      <circle cx="45" cy="58" r="5" fill="currentColor" />
      <line x1="45" y1="52" x2="45" y2="64" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Pedals */}
      <rect x="41" y="50" width="8" height="3" rx="1" fill="currentColor" />
      <rect x="41" y="65" width="8" height="3" rx="1" fill="currentColor" />
    </motion.g>
    
    {/* Rider */}
    <motion.g 
      animate={{ y: selected ? [0, -1, 0, 1, 0] : 0 }} 
      transition={{ duration: 0.25, repeat: selected ? Infinity : 0 }}
    >
      {/* Head */}
      <circle cx="52" cy="10" r="6" fill="currentColor" />
      
      {/* Body - sitting on seat */}
      <path 
        d="M52 16 L50 28 M50 28 L45 32" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none"
      />
      
      {/* Arms to handlebar */}
      <path 
        d="M50 22 L60 22" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
    </motion.g>
    
    {/* Left leg - pedaling animation */}
    <motion.g
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.5, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "45px 58px" }}
    >
      {/* Thigh */}
      <motion.path
        d="M45 32 L45 52"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ transformOrigin: "45px 32px" }}
      />
    </motion.g>
    
    {/* Right leg - pedaling (opposite phase) */}
    <motion.g
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.5, repeat: selected ? Infinity : 0, ease: "linear", delay: 0.25 }}
      style={{ transformOrigin: "45px 58px" }}
    >
      <motion.path
        d="M45 32 L45 64"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ transformOrigin: "45px 32px" }}
      />
    </motion.g>
    
    {/* Animated legs with knee bend */}
    <motion.g>
      {/* Left leg */}
      <motion.path
        d="M47 32 Q 42 45, 45 52"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        animate={selected ? {
          d: [
            "M47 32 Q 42 45, 45 52",
            "M47 32 Q 52 48, 45 64",
            "M47 32 Q 42 45, 45 52"
          ]
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
      />
      {/* Right leg */}
      <motion.path
        d="M47 32 Q 52 48, 45 64"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        animate={selected ? {
          d: [
            "M47 32 Q 52 48, 45 64",
            "M47 32 Q 42 45, 45 52",
            "M47 32 Q 52 48, 45 64"
          ]
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
      />
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