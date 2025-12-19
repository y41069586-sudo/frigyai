import { motion, AnimatePresence } from "framer-motion";
import { AnimatedFrigyMascot } from "../AnimatedFrigyMascot";

interface MascotPopupProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  duration?: number; // How long to show before sliding out
  position?: "left" | "center" | "right";
}

export const MascotPopup = ({ 
  show, 
  message, 
  onComplete,
  duration = 2500,
  position = "center"
}: MascotPopupProps) => {
  
  const positionClasses = {
    left: "left-4",
    center: "left-1/2 -translate-x-1/2",
    right: "right-4"
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className={`fixed bottom-0 ${positionClasses[position]} z-50 flex flex-col items-center pointer-events-none`}
          initial={{ y: 200, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.8
            }
          }}
          exit={{ 
            y: 200, 
            opacity: 0,
            transition: {
              duration: 0.5,
              ease: "easeIn"
            }
          }}
        >
          {/* Speech bubble */}
          {message && (
            <motion.div
              className="bg-card border border-border shadow-lg rounded-2xl px-4 py-2 mb-2 relative"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: { delay: 0.3, duration: 0.3, type: "spring" }
              }}
            >
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {message}
              </span>
              {/* Bubble tail */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-border" />
              <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-card" />
            </motion.div>
          )}
          
          {/* Mascot with bounce */}
          <motion.div
            animate={{ 
              y: [0, -8, 0],
            }}
            transition={{
              duration: 0.6,
              delay: 0.4,
              ease: "easeOut"
            }}
          >
            <AnimatedFrigyMascot size={120} animate={false} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
