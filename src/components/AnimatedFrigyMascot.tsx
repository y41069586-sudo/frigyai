import { motion } from "framer-motion";

interface AnimatedFrigyMascotProps {
  size?: number;
  animate?: boolean;
  onAnimationComplete?: () => void;
}

export const AnimatedFrigyMascot = ({ 
  size = 256, 
  animate = true,
  onAnimationComplete 
}: AnimatedFrigyMascotProps) => {
  const scale = size / 256;

  return (
    <motion.div
      style={{ width: size, height: size }}
      initial={animate ? { y: 300, scale: 0.5, opacity: 0 } : false}
      animate={animate ? { y: 0, scale: 1, opacity: 1 } : false}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 12,
        duration: 1.2
      }}
      onAnimationComplete={onAnimationComplete}
    >
      <svg
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        {/* Shadow */}
        <motion.ellipse
          cx="128"
          cy="240"
          rx="60"
          ry="12"
          fill="rgba(0,0,0,0.1)"
          initial={animate ? { scale: 0.5, opacity: 0 } : { scale: 1, opacity: 1 }}
          animate={{ scale: 1, opacity: 0.15 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />

        {/* Main fridge body */}
        <motion.g
          initial={animate ? { rotate: -10 } : { rotate: 0 }}
          animate={{ rotate: [0, -3, 3, -2, 2, 0] }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeInOut" }}
          style={{ transformOrigin: "128px 150px" }}
        >
          {/* Fridge body - back */}
          <motion.path
            d="M75 70 L75 210 Q75 220 85 220 L171 220 Q181 220 181 210 L181 70 Q181 60 171 60 L85 60 Q75 60 75 70Z"
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="3"
          />

          {/* Fridge front panel - top section */}
          <motion.rect
            x="82"
            y="68"
            width="92"
            height="70"
            rx="8"
            fill="#dcfce7"
            stroke="#22c55e"
            strokeWidth="2"
          />

          {/* Fridge front panel - bottom section */}
          <motion.rect
            x="82"
            y="145"
            width="92"
            height="68"
            rx="8"
            fill="#dcfce7"
            stroke="#22c55e"
            strokeWidth="2"
          />

          {/* Fridge handles */}
          <motion.rect
            x="164"
            y="90"
            width="6"
            height="30"
            rx="3"
            fill="#16a34a"
          />
          <motion.rect
            x="164"
            y="165"
            width="6"
            height="30"
            rx="3"
            fill="#16a34a"
          />

          {/* Fridge feet */}
          <rect x="85" y="218" width="15" height="8" rx="2" fill="#16a34a" />
          <rect x="156" y="218" width="15" height="8" rx="2" fill="#16a34a" />
        </motion.g>

        {/* Fridge lid/top - animated to open */}
        <motion.g
          initial={animate ? { rotate: 0 } : { rotate: -15 }}
          animate={{ rotate: [-15, -20, -15] }}
          transition={{ 
            delay: 0.6, 
            duration: 0.8, 
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut" 
          }}
          style={{ transformOrigin: "75px 55px" }}
        >
          <motion.path
            d="M70 55 L70 45 Q70 35 80 35 L176 35 Q186 35 186 45 L186 55 Q186 60 176 60 L80 60 Q70 60 70 55Z"
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="3"
          />
          <motion.rect
            x="78"
            y="42"
            width="100"
            height="12"
            rx="4"
            fill="#4ade80"
          />
        </motion.g>

        {/* Face container - peeks out from top */}
        <motion.g
          initial={animate ? { y: 20, opacity: 0 } : { y: 0, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
        >
          {/* Face background */}
          <motion.ellipse
            cx="128"
            cy="25"
            rx="35"
            ry="28"
            fill="#fefce8"
            stroke="#22c55e"
            strokeWidth="2"
          />

          {/* Blush cheeks */}
          <motion.ellipse
            cx="100"
            cy="28"
            rx="8"
            ry="5"
            fill="#fecaca"
            opacity="0.6"
            initial={animate ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
          />
          <motion.ellipse
            cx="156"
            cy="28"
            rx="8"
            ry="5"
            fill="#fecaca"
            opacity="0.6"
            initial={animate ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
          />

          {/* Eyes */}
          <motion.g
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ 
              delay: 1.5, 
              duration: 0.15, 
              repeat: Infinity, 
              repeatDelay: 4 
            }}
            style={{ transformOrigin: "128px 18px" }}
          >
            {/* Left eye */}
            <circle cx="112" cy="18" r="6" fill="#1f2937" />
            <circle cx="114" cy="16" r="2" fill="white" />
            
            {/* Right eye */}
            <circle cx="144" cy="18" r="6" fill="#1f2937" />
            <circle cx="146" cy="16" r="2" fill="white" />
          </motion.g>

          {/* Smile */}
          <motion.path
            d="M115 32 Q128 42 141 32"
            stroke="#1f2937"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          />
        </motion.g>

        {/* Sparkle effects */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ delay: 1, duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
        >
          {/* Sparkle 1 */}
          <motion.path
            d="M55 40 L58 35 L61 40 L58 45 Z"
            fill="#fbbf24"
          />
          <motion.path
            d="M53 38 L63 42 M58 33 L58 47"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ delay: 1.2, duration: 0.8, repeat: Infinity, repeatDelay: 2.5 }}
        >
          {/* Sparkle 2 */}
          <motion.path
            d="M195 50 L198 45 L201 50 L198 55 Z"
            fill="#22c55e"
          />
          <motion.path
            d="M193 48 L203 52 M198 43 L198 57"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ delay: 1.4, duration: 0.8, repeat: Infinity, repeatDelay: 3 }}
        >
          {/* Sparkle 3 */}
          <motion.path
            d="M45 90 L47 87 L49 90 L47 93 Z"
            fill="#a3e635"
          />
        </motion.g>

        {/* Small floating hearts */}
        <motion.g
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: [0, -20] }}
          transition={{ delay: 1.3, duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <motion.path
            d="M185 80 C185 76 188 74 191 76 C194 74 197 76 197 80 C197 84 191 88 191 88 C191 88 185 84 185 80Z"
            fill="#f87171"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
};
