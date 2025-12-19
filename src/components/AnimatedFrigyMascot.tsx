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
          {/* Fridge body shadow/depth - right side */}
          <path
            d="M160 35 L175 45 L175 215 L160 225 L160 35Z"
            fill="#4ade80"
          />
          
          {/* Fridge body shadow/depth - bottom */}
          <path
            d="M40 225 L55 235 L175 215 L160 225 L40 225Z"
            fill="#22c55e"
          />

          {/* Main fridge body - front - lighter green */}
          <motion.rect
            x="40"
            y="25"
            width="120"
            height="200"
            rx="12"
            fill="#4ade80"
            stroke="#22c55e"
            strokeWidth="3"
          />

          {/* Fridge door - top section (freezer) - very light green */}
          <motion.rect
            x="50"
            y="35"
            width="100"
            height="75"
            rx="8"
            fill="#dcfce7"
            stroke="#86efac"
            strokeWidth="2"
          />

          {/* Fridge door - bottom section - light green */}
          <motion.rect
            x="50"
            y="120"
            width="100"
            height="95"
            rx="8"
            fill="#bbf7d0"
            stroke="#86efac"
            strokeWidth="2"
          />

          {/* Door handles - medium green */}
          <motion.rect
            x="140"
            y="60"
            width="6"
            height="25"
            rx="3"
            fill="#22c55e"
          />
          <motion.rect
            x="140"
            y="155"
            width="6"
            height="35"
            rx="3"
            fill="#22c55e"
          />

          {/* Fridge feet */}
          <rect x="50" y="222" width="18" height="10" rx="3" fill="#22c55e" />
          <rect x="132" y="222" width="18" height="10" rx="3" fill="#22c55e" />
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

        {/* Sparkle effects around fridge */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1.3, duration: 0.8, repeat: Infinity, repeatDelay: 2.5 }}
        >
          {/* Sparkle top right */}
          <path
            d="M170 20 L173 12 L176 20 L173 28 Z"
            fill="#fbbf24"
          />
          <path
            d="M167 17 L179 23"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M173 10 L173 30"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1.6, duration: 0.8, repeat: Infinity, repeatDelay: 3 }}
        >
          {/* Sparkle left */}
          <path
            d="M25 60 L28 54 L31 60 L28 66 Z"
            fill="#4ade80"
          />
          <path
            d="M22 57 L34 63"
            stroke="#4ade80"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1.9, duration: 0.8, repeat: Infinity, repeatDelay: 3.5 }}
        >
          {/* Sparkle bottom left */}
          <circle cx="30" cy="180" r="4" fill="#a3e635" />
        </motion.g>

        {/* Floating heart */}
        <motion.path
          d="M175 100 C175 95 179 92 183 95 C187 92 191 95 191 100 C191 106 183 112 183 112 C183 112 175 106 175 100Z"
          fill="#f87171"
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0], 
            y: [0, -15, -25, -35],
            scale: [0, 1, 1, 0.5]
          }}
          transition={{ 
            delay: 1.5, 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3 
          }}
        />
      </svg>
    </motion.div>
  );
};
