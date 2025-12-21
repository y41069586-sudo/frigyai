import { motion } from "framer-motion";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PremiumLockOverlayProps {
  title?: string;
  description?: string;
  className?: string;
}

export const PremiumLockOverlay = ({ 
  title = "Premium Feature",
  description = "Upgrade auf Premium um diese Funktion zu sehen",
  className = ""
}: PremiumLockOverlayProps) => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`absolute inset-0 z-10 flex flex-col items-center justify-start pt-16 backdrop-blur-[2px] bg-background/40 rounded-xl ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="flex flex-col items-center text-center p-6 bg-card/95 rounded-2xl shadow-lg border border-border"
      >
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-3">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
          {description}
        </p>
        
        <Button 
          onClick={() => navigate('/premium-pricing')}
          className="gap-2"
        >
          <Crown className="w-4 h-4" />
          Upgrade to Premium
        </Button>
      </motion.div>
    </motion.div>
  );
};
