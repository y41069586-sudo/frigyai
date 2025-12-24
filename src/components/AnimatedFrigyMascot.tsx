import { motion } from "framer-motion";

interface AnimatedFrigyMascotProps {
  size?: number;
  animate?: boolean;
  onAnimationComplete?: () => void;
}

export const AnimatedFrigyMascot = ({ 
  size = 320, 
  animate = true,
  onAnimationComplete 
}: AnimatedFrigyMascotProps) => {

  return (
    <motion.div
      style={{ width: size, height: size * 1.1 }}
      initial={animate ? { y: "100vh", rotate: -5 } : false}
      animate={animate ? { y: 0, rotate: 0 } : false}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 14,
        duration: 1.2
      }}
      onAnimationComplete={onAnimationComplete}
    >
      <svg
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          {/* Premium gradients */}
          <linearGradient id="bodyGradientPremium" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="30%" stopColor="#34d399" />
            <stop offset="70%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          
          <linearGradient id="bodyHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
          
          <linearGradient id="doorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0fdf4" />
            <stop offset="50%" stopColor="#ecfdf5" />
            <stop offset="100%" stopColor="#d1fae5" />
          </linearGradient>
          
          <linearGradient id="screenGlow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="100%" stopColor="#86efac" />
          </linearGradient>
          
          <linearGradient id="handleGradientNew" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="100%" stopColor="#a7f3d0" />
          </linearGradient>

          <linearGradient id="glossShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="40%" stopColor="white" stopOpacity="0.2" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          
          <linearGradient id="feetGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Shadow filter */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#059669" floodOpacity="0.25"/>
          </filter>
          
          <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Main body group with hover effect */}
        <motion.g
          initial={animate ? { scale: 0.9 } : { scale: 1 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {/* Ambient glow behind fridge */}
          <ellipse cx="100" cy="190" rx="60" ry="15" fill="#10b981" opacity="0.15" />
          
          {/* 3D depth - back panel */}
          <path
            d="M155 25 L170 35 L170 195 L155 205 L155 25Z"
            fill="#059669"
          />
          <path
            d="M45 205 L60 215 L170 195 L155 205 L45 205Z"
            fill="#047857"
          />

          {/* Main fridge body */}
          <motion.rect
            x="45"
            y="20"
            width="110"
            height="185"
            rx="16"
            fill="url(#bodyGradientPremium)"
            filter="url(#softShadow)"
          />
          
          {/* Body highlight strip */}
          <rect
            x="45"
            y="20"
            width="12"
            height="185"
            rx="16"
            fill="url(#bodyHighlight)"
            opacity="0.5"
          />

          {/* Top freezer door */}
          <motion.rect
            x="55"
            y="30"
            width="90"
            height="65"
            rx="10"
            fill="url(#doorGradient)"
          />
          
          {/* Freezer gloss effect */}
          <path
            d="M55 30 L55 60 Q75 55 95 60 L95 30 Q75 32 55 30"
            fill="url(#glossShine)"
            opacity="0.7"
          />

          {/* Bottom fridge door */}
          <motion.rect
            x="55"
            y="105"
            width="90"
            height="90"
            rx="10"
            fill="url(#doorGradient)"
          />
          
          {/* Bottom door gloss */}
          <path
            d="M55 105 L55 145 Q70 140 90 145 L90 105 Q70 108 55 105"
            fill="url(#glossShine)"
            opacity="0.6"
          />

          {/* Separator line between doors */}
          <line x1="58" y1="100" x2="142" y2="100" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />

          {/* Premium handles */}
          <rect x="135" y="55" width="8" height="22" rx="4" fill="url(#handleGradientNew)" />
          <rect x="136" y="56" width="3" height="20" rx="1.5" fill="white" opacity="0.4" />
          
          <rect x="135" y="140" width="8" height="35" rx="4" fill="url(#handleGradientNew)" />
          <rect x="136" y="141" width="3" height="33" rx="1.5" fill="white" opacity="0.4" />

          {/* Ice dispenser / screen on freezer */}
          <rect x="65" y="42" width="35" height="12" rx="3" fill="url(#screenGlow)" />
          <rect x="67" y="44" width="31" height="8" rx="2" fill="#10b981" opacity="0.3" />
          
          {/* Cute little vents */}
          <g opacity="0.3">
            <rect x="110" y="45" width="20" height="2" rx="1" fill="#10b981" />
            <rect x="110" y="49" width="20" height="2" rx="1" fill="#10b981" />
            <rect x="110" y="53" width="20" height="2" rx="1" fill="#10b981" />
          </g>

          {/* Rounded feet */}
          <ellipse cx="65" cy="208" rx="12" ry="6" fill="url(#feetGradient)" />
          <ellipse cx="135" cy="208" rx="12" ry="6" fill="url(#feetGradient)" />
          <ellipse cx="65" cy="206" rx="8" ry="3" fill="#34d399" opacity="0.5" />
          <ellipse cx="135" cy="206" rx="8" ry="3" fill="#34d399" opacity="0.5" />
        </motion.g>

        {/* Face - The cute part! */}
        <motion.g
          initial={animate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
        >
          {/* Eyes with blink animation */}
          <motion.g
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ 
              delay: 2, 
              duration: 0.15, 
              repeat: Infinity, 
              repeatDelay: 3 
            }}
            style={{ transformOrigin: "100px 140px" }}
          >
            {/* Left eye - bigger and cuter */}
            <ellipse cx="80" cy="140" rx="12" ry="14" fill="#1f2937" />
            <ellipse cx="80" cy="140" rx="10" ry="12" fill="#374151" />
            <ellipse cx="84" cy="136" rx="4" ry="5" fill="white" />
            <circle cx="76" cy="144" r="2" fill="white" opacity="0.5" />
            
            {/* Right eye */}
            <ellipse cx="120" cy="140" rx="12" ry="14" fill="#1f2937" />
            <ellipse cx="120" cy="140" rx="10" ry="12" fill="#374151" />
            <ellipse cx="124" cy="136" rx="4" ry="5" fill="white" />
            <circle cx="116" cy="144" r="2" fill="white" opacity="0.5" />
          </motion.g>

          {/* Eyebrows - expressive */}
          <motion.path
            d="M68 122 Q80 118 92 124"
            stroke="#1f2937"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            animate={{ d: ["M68 122 Q80 118 92 124", "M68 120 Q80 116 92 120", "M68 122 Q80 118 92 124"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M108 124 Q120 118 132 122"
            stroke="#1f2937"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            animate={{ d: ["M108 124 Q120 118 132 122", "M108 120 Q120 116 132 120", "M108 124 Q120 118 132 122"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Rosy cheeks */}
          <motion.ellipse
            cx="60"
            cy="155"
            rx="12"
            ry="7"
            fill="#fb7185"
            opacity="0.4"
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.ellipse
            cx="140"
            cy="155"
            rx="12"
            ry="7"
            fill="#fb7185"
            opacity="0.4"
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />

          {/* Big happy smile */}
          <motion.path
            d="M75 165 Q100 190 125 165"
            stroke="#1f2937"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          />
          
          {/* Tongue peaking out */}
          <motion.ellipse
            cx="100"
            cy="175"
            rx="8"
            ry="5"
            fill="#fb7185"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.3 }}
          />

          {/* Cute nose */}
          <ellipse cx="100" cy="152" rx="3" ry="2" fill="#1f2937" opacity="0.3" />
        </motion.g>

        {/* Sparkle effects */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1.3, duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
        >
          <g transform="translate(165, 10)">
            <motion.path
              d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z"
              fill="#fde047"
              animate={{ rotate: [0, 180], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </g>
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 2, duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        >
          <g transform="translate(20, 50)">
            <motion.path
              d="M0 -7 L1.5 -1.5 L7 0 L1.5 1.5 L0 7 L-1.5 1.5 L-7 0 L-1.5 -1.5 Z"
              fill="#a3e635"
              animate={{ rotate: [0, -180] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
          </g>
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 2.5, duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
        >
          <g transform="translate(175, 80)">
            <circle cx="0" cy="0" r="3" fill="#67e8f9" />
            <motion.circle 
              cx="0" cy="0" r="5" 
              fill="none" 
              stroke="#67e8f9" 
              strokeWidth="1.5"
              animate={{ r: [3, 10], opacity: [1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </g>
        </motion.g>

        {/* Floating hearts */}
        <motion.path
          d="M175 120 C175 115 179 112 183 115 C187 112 191 115 191 120 C191 126 183 132 183 132 C183 132 175 126 175 120Z"
          fill="#fb7185"
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0], 
            y: [0, -25, -45, -65],
            scale: [0, 1.1, 1, 0.4],
            rotate: [0, -10, 10, 0]
          }}
          transition={{ 
            delay: 1.5, 
            duration: 3, 
            repeat: Infinity, 
            repeatDelay: 2 
          }}
        />
        
        <motion.path
          d="M15 140 C15 136 18 134 21 136 C24 134 27 136 27 140 C27 144 21 148 21 148 C21 148 15 144 15 140Z"
          fill="#f472b6"
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.9, 0.9, 0], 
            y: [0, -20, -35, -50],
            scale: [0, 0.9, 0.8, 0.3],
            rotate: [0, 8, -8, 0]
          }}
          transition={{ 
            delay: 3, 
            duration: 2.5, 
            repeat: Infinity, 
            repeatDelay: 3 
          }}
        />

        {/* Music notes floating */}
        <motion.text
          x="25"
          y="100"
          fontSize="14"
          fill="#10b981"
          initial={{ opacity: 0, y: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: [0, -15, -30, -45],
            x: [25, 20, 28, 22]
          }}
          transition={{ delay: 2, duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
        >
          ♪
        </motion.text>
        
        <motion.text
          x="170"
          y="160"
          fontSize="12"
          fill="#34d399"
          initial={{ opacity: 0, y: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: [0, -12, -25, -38],
            x: [170, 175, 168, 172]
          }}
          transition={{ delay: 3.5, duration: 2, repeat: Infinity, repeatDelay: 4 }}
        >
          ♫
        </motion.text>
      </svg>
    </motion.div>
  );
};
