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
      style={{ width: size, height: size * 1.2 }}
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
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        {/* Main fridge body */}
        <motion.g
          initial={animate ? { scale: 0.9 } : { scale: 1 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {/* Gradient definitions for premium look */}
          <defs>
            <linearGradient id="fridgeBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="50%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
            <linearGradient id="freezerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0fdf4" />
              <stop offset="100%" stopColor="#dcfce7" />
            </linearGradient>
            <linearGradient id="fridgeDoorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ecfdf5" />
              <stop offset="100%" stopColor="#d1fae5" />
            </linearGradient>
            <linearGradient id="handleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            {/* Glossy shine effect */}
            <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.4" />
              <stop offset="50%" stopColor="white" stopOpacity="0.1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fridge body shadow/depth - right side */}
          <path
            d="M160 35 L175 45 L175 215 L160 225 L160 35Z"
            fill="#6ee7b7"
          />
          
          {/* Fridge body shadow/depth - bottom */}
          <path
            d="M40 225 L55 235 L175 215 L160 225 L40 225Z"
            fill="#34d399"
          />

          {/* Main fridge body - front with gradient */}
          <motion.rect
            x="40"
            y="25"
            width="120"
            height="200"
            rx="12"
            fill="url(#fridgeBodyGradient)"
            stroke="#34d399"
            strokeWidth="2"
          />

          {/* Fridge door - top section (freezer) with gradient */}
          <motion.rect
            x="50"
            y="35"
            width="100"
            height="75"
            rx="8"
            fill="url(#freezerGradient)"
            stroke="#a7f3d0"
            strokeWidth="1.5"
          />
          
          {/* Freezer shine overlay */}
          <rect
            x="52"
            y="37"
            width="40"
            height="30"
            rx="6"
            fill="url(#shineGradient)"
          />

          {/* Fridge door - bottom section with gradient */}
          <motion.rect
            x="50"
            y="120"
            width="100"
            height="95"
            rx="8"
            fill="url(#fridgeDoorGradient)"
            stroke="#a7f3d0"
            strokeWidth="1.5"
          />
          
          {/* Bottom door shine overlay */}
          <rect
            x="52"
            y="122"
            width="35"
            height="40"
            rx="6"
            fill="url(#shineGradient)"
          />

          {/* Door handles with gradient */}
          <motion.rect
            x="140"
            y="60"
            width="6"
            height="25"
            rx="3"
            fill="url(#handleGradient)"
          />
          <motion.rect
            x="140"
            y="155"
            width="6"
            height="35"
            rx="3"
            fill="url(#handleGradient)"
          />

          {/* Fridge feet */}
          <rect x="50" y="222" width="18" height="10" rx="3" fill="#34d399" />
          <rect x="132" y="222" width="18" height="10" rx="3" fill="#34d399" />
        </motion.g>

        {/* Face INSIDE the freezer section */}
        <motion.g
          initial={animate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
        >
          {/* Eyes - inside freezer */}
          <motion.g
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ 
              delay: 2, 
              duration: 0.15, 
              repeat: Infinity, 
              repeatDelay: 3.5 
            }}
            style={{ transformOrigin: "100px 65px" }}
          >
            {/* Left eye */}
            <ellipse cx="80" cy="65" rx="8" ry="9" fill="#1f2937" />
            <ellipse cx="83" cy="62" rx="3" ry="3" fill="white" />
            
            {/* Right eye */}
            <ellipse cx="120" cy="65" rx="8" ry="9" fill="#1f2937" />
            <ellipse cx="123" cy="62" rx="3" ry="3" fill="white" />
          </motion.g>

          {/* Cute blush cheeks */}
          <motion.ellipse
            cx="65"
            cy="78"
            rx="10"
            ry="6"
            fill="#fca5a5"
            opacity="0.5"
            initial={animate ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
          />
          <motion.ellipse
            cx="135"
            cy="78"
            rx="10"
            ry="6"
            fill="#fca5a5"
            opacity="0.5"
            initial={animate ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.1, duration: 0.3 }}
          />

          {/* Big happy smile */}
          <motion.path
            d="M75 85 Q100 105 125 85"
            stroke="#1f2937"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          />
        </motion.g>

        {/* Wiggle animation for whole fridge */}
        <motion.g
          animate={{ rotate: [0, -2, 2, -1, 1, 0] }}
          transition={{ 
            delay: 1.2, 
            duration: 0.5, 
            repeat: Infinity,
            repeatDelay: 4
          }}
          style={{ transformOrigin: "100px 130px" }}
        >
        </motion.g>

        {/* Premium sparkle effects */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1.3, duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        >
          {/* Star sparkle top right */}
          <g transform="translate(170, 15)">
            <motion.path
              d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z"
              fill="#fde047"
              animate={{ rotate: [0, 180] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </g>
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1.8, duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
        >
          {/* Star sparkle left */}
          <g transform="translate(25, 55)">
            <motion.path
              d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z"
              fill="#86efac"
              animate={{ rotate: [0, -180] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
          </g>
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 2.2, duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
        >
          {/* Small sparkle bottom */}
          <g transform="translate(28, 175)">
            <circle cx="0" cy="0" r="3" fill="#a3e635" />
            <motion.circle 
              cx="0" cy="0" r="6" 
              fill="none" 
              stroke="#a3e635" 
              strokeWidth="1"
              animate={{ r: [3, 8], opacity: [0.8, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </g>
        </motion.g>

        {/* Floating hearts - multiple */}
        <motion.path
          d="M175 95 C175 91 178 89 181 91 C184 89 187 91 187 95 C187 99 181 104 181 104 C181 104 175 99 175 95Z"
          fill="#fb7185"
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0], 
            y: [0, -20, -35, -50],
            scale: [0, 1, 0.9, 0.3]
          }}
          transition={{ 
            delay: 1.5, 
            duration: 2.5, 
            repeat: Infinity, 
            repeatDelay: 2.5 
          }}
        />
        
        <motion.path
          d="M20 130 C20 127 22 126 24 127 C26 126 28 127 28 130 C28 133 24 136 24 136 C24 136 20 133 20 130Z"
          fill="#f472b6"
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.8, 0.8, 0], 
            y: [0, -15, -25, -40],
            scale: [0, 0.8, 0.7, 0.2]
          }}
          transition={{ 
            delay: 2.5, 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3.5 
          }}
        />
      </svg>
    </motion.div>
  );
};
