import { motion } from "framer-motion";
import frigLogo from "@/assets/frigy-mascot.png";

export const PageLoader = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.img
          src={frigLogo}
          alt="Frigy"
          className="w-16 h-16"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="h-1 w-24 bg-muted rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
