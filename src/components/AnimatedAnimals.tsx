import { motion } from 'framer-motion';

interface AnimalProps {
  isActive: boolean;
}

// Sloth hanging from branch - exact copy from reference
export const AnimatedSloth = ({ isActive }: AnimalProps) => {
  return (
    <svg viewBox="0 0 60 70" className={`w-12 h-14 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
      {/* Branch */}
      <path
        d="M5 8 Q20 5 35 12 L40 10 Q50 8 55 12"
        stroke="#1f2937"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Left arm hanging */}
      <motion.path
        d="M18 12 L22 28"
        stroke="#78716c"
        strokeWidth="6"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M18 12 L22 28", "M18 12 L24 29", "M18 12 L22 28"]
        } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Right arm hanging */}
      <motion.path
        d="M38 10 L34 28"
        stroke="#78716c"
        strokeWidth="6"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M38 10 L34 28", "M38 10 L32 29", "M38 10 L34 28"]
        } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
      
      {/* Body */}
      <motion.ellipse
        cx="28"
        cy="42"
        rx="14"
        ry="16"
        fill="#a8a29e"
        animate={isActive ? { 
          cy: [42, 44, 42],
        } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Face */}
      <motion.circle
        cx="28"
        cy="32"
        r="11"
        fill="#d6d3d1"
        animate={isActive ? { 
          cy: [32, 34, 32],
        } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Eye patches - dark */}
      <ellipse cx="23" cy="30" rx="5" ry="6" fill="#1f2937" />
      <ellipse cx="33" cy="30" rx="5" ry="6" fill="#1f2937" />
      
      {/* Eyes - white */}
      <circle cx="23" cy="30" r="3" fill="white" />
      <circle cx="33" cy="30" r="3" fill="white" />
      
      {/* Pupils */}
      <circle cx="24" cy="30" r="1.5" fill="#1f2937" />
      <circle cx="34" cy="30" r="1.5" fill="#1f2937" />
      
      {/* Nose */}
      <ellipse cx="28" cy="36" rx="2.5" ry="2" fill="#1f2937" />
      
      {/* Left leg */}
      <motion.path
        d="M20 55 L16 65"
        stroke="#78716c"
        strokeWidth="5"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M20 55 L16 65", "M20 56 L14 66", "M20 55 L16 65"]
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Right leg */}
      <motion.path
        d="M36 55 L40 65"
        stroke="#78716c"
        strokeWidth="5"
        strokeLinecap="round"
        animate={isActive ? { 
          d: ["M36 55 L40 65", "M36 56 L42 66", "M36 55 L40 65"]
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </svg>
  );
};

// Black rabbit silhouette - running pose like reference
export const AnimatedRabbit = ({ isActive }: AnimalProps) => {
  return (
    <svg viewBox="0 0 70 50" className={`w-14 h-10 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
      {/* Tail */}
      <motion.circle
        cx="8"
        cy="25"
        r="4"
        fill="#1f2937"
        animate={isActive ? { 
          cy: [25, 20, 25],
          cx: [8, 6, 8],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Back leg */}
      <motion.path
        d="M15 28 Q10 38 14 46"
        stroke="#1f2937"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        animate={isActive ? { 
          d: [
            "M15 28 Q10 38 14 46",
            "M15 22 Q25 30 35 32",
            "M15 28 Q10 38 14 46",
          ]
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Body - elongated oval */}
      <motion.ellipse
        cx="30"
        cy="26"
        rx="17"
        ry="10"
        fill="#1f2937"
        animate={isActive ? { 
          cy: [26, 20, 26],
          rx: [17, 19, 17],
          ry: [10, 8, 10],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Front leg */}
      <motion.path
        d="M42 32 Q46 40 44 48"
        stroke="#1f2937"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        animate={isActive ? { 
          d: [
            "M42 32 Q46 40 44 48",
            "M45 22 Q55 25 62 28",
            "M42 32 Q46 40 44 48",
          ]
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Head */}
      <motion.circle
        cx="52"
        cy="22"
        r="9"
        fill="#1f2937"
        animate={isActive ? { 
          cy: [22, 16, 22],
          cx: [52, 55, 52],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
      
      {/* Left ear */}
      <motion.ellipse
        cx="47"
        cy="8"
        rx="3"
        ry="10"
        fill="#1f2937"
        animate={isActive ? { 
          cy: [8, 3, 8],
          rotate: [-15, -20, -15],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
        style={{ transformOrigin: '47px 18px' }}
      />
      
      {/* Right ear */}
      <motion.ellipse
        cx="54"
        cy="6"
        rx="3"
        ry="10"
        fill="#1f2937"
        animate={isActive ? { 
          cy: [6, 1, 6],
          rotate: [10, 15, 10],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
        style={{ transformOrigin: '54px 16px' }}
      />
      
      {/* Eye */}
      <motion.circle
        cx="56"
        cy="20"
        r="1.5"
        fill="white"
        animate={isActive ? { 
          cy: [20, 14, 20],
          cx: [56, 59, 56],
        } : {}}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeOut" }}
      />
    </svg>
  );
};

// Orange cheetah with speed lines - exact like reference
export const AnimatedCheetah = ({ isActive }: AnimalProps) => {
  return (
    <div className="relative">
      {/* Speed lines - only when active */}
      {isActive && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-0.5 bg-orange-400 rounded-full"
              style={{ width: `${10 + i * 4}px` }}
              animate={{ 
                opacity: [0, 0.8, 0],
                x: [0, -8, -16],
              }}
              transition={{ 
                duration: 0.25,
                repeat: Infinity,
                delay: i * 0.05
              }}
            />
          ))}
        </div>
      )}
      
      <svg viewBox="0 0 80 50" className={`w-14 h-9 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
        {/* Tail */}
        <motion.path
          d="M5 22 Q0 18 3 28 Q6 35 4 40"
          stroke="#f97316"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          animate={isActive ? { 
            d: [
              "M5 22 Q0 18 3 28 Q6 35 4 40",
              "M5 20 Q-2 14 2 24 Q5 32 2 38",
              "M5 24 Q2 22 5 30 Q8 38 6 42",
              "M5 20 Q-2 14 2 24 Q5 32 2 38",
              "M5 22 Q0 18 3 28 Q6 35 4 40",
            ]
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Back legs */}
        <motion.path
          d="M18 30 L14 44"
          stroke="#f97316"
          strokeWidth="5"
          strokeLinecap="round"
          animate={isActive ? { 
            d: [
              "M18 30 L14 44",
              "M18 26 L28 34",
              "M18 30 L8 38",
              "M18 26 L28 34",
              "M18 30 L14 44",
            ]
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
        
        <motion.path
          d="M24 30 L20 44"
          stroke="#ea580c"
          strokeWidth="5"
          strokeLinecap="round"
          animate={isActive ? { 
            d: [
              "M24 30 L20 44",
              "M24 26 L14 36",
              "M24 30 L34 38",
              "M24 26 L14 36",
              "M24 30 L20 44",
            ]
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Body */}
        <motion.ellipse
          cx="38"
          cy="24"
          rx="20"
          ry="9"
          fill="#f97316"
          animate={isActive ? { 
            cy: [24, 21, 24, 21, 24],
            rx: [20, 22, 20, 22, 20],
            ry: [9, 7, 9, 7, 9],
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Front legs */}
        <motion.path
          d="M52 30 L48 44"
          stroke="#f97316"
          strokeWidth="4"
          strokeLinecap="round"
          animate={isActive ? { 
            d: [
              "M52 30 L48 44",
              "M52 24 L62 30",
              "M52 30 L42 38",
              "M52 24 L62 30",
              "M52 30 L48 44",
            ]
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
        
        <motion.path
          d="M58 30 L54 44"
          stroke="#ea580c"
          strokeWidth="4"
          strokeLinecap="round"
          animate={isActive ? { 
            d: [
              "M58 30 L54 44",
              "M58 24 L48 32",
              "M58 30 L68 36",
              "M58 24 L48 32",
              "M58 30 L54 44",
            ]
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Neck/Head */}
        <motion.ellipse
          cx="68"
          cy="18"
          rx="9"
          ry="7"
          fill="#f97316"
          animate={isActive ? { 
            cx: [68, 71, 68, 71, 68],
            cy: [18, 15, 18, 15, 18],
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Ear */}
        <motion.path
          d="M66 12 L68 6 L71 11"
          fill="#f97316"
          animate={isActive ? { 
            d: [
              "M66 12 L68 6 L71 11",
              "M69 9 L71 3 L74 8",
              "M66 12 L68 6 L71 11",
            ]
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Eye */}
        <motion.circle
          cx="72"
          cy="16"
          r="1.5"
          fill="#1f2937"
          animate={isActive ? { 
            cx: [72, 75, 72, 75, 72],
            cy: [16, 13, 16, 13, 16],
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Snout */}
        <motion.ellipse
          cx="77"
          cy="19"
          rx="3"
          ry="2"
          fill="#fb923c"
          animate={isActive ? { 
            cx: [77, 80, 77, 80, 77],
            cy: [19, 16, 19, 16, 19],
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
};
