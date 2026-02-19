import { motion } from "framer-motion";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FreeModePaywallOverlayProps {
  title?: string;
  description?: string;
  showBlurredContent?: boolean;
  className?: string;
  /** If true, shows re-engagement messaging for cancelled users */
  isCancelledUser?: boolean;
}

export const FreeModePaywallOverlay = ({ 
  title,
  description,
  showBlurredContent = true,
  className = "",
  isCancelledUser = false
}: FreeModePaywallOverlayProps) => {
  const navigate = useNavigate();
  
  // Check if user was previously subscribed (cancelled)
  const hasCancellationDate = !!localStorage.getItem('frig_cancellation_date');
  const showCancelledUI = isCancelledUser || hasCancellationDate;
  
  // Dynamic messaging based on user state
  const displayTitle = title || (showCancelledUI ? "Bereit weiterzumachen?" : "Premium freischalten");
  const displayDescription = description || (showCancelledUI 
    ? "Deine Planung wartet noch auf dich." 
    : "Plane deine Woche automatisch");
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`absolute inset-0 z-20 flex flex-col items-center justify-start pt-16 sm:justify-center sm:pt-0 ${className}`}
    >
      {/* Blur overlay background */}
      {showBlurredContent && (
        <div className="absolute inset-0 backdrop-blur-md bg-background/60 rounded-xl" />
      )}
      
      {/* Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative flex flex-col items-center text-center p-6 z-10"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
          {showCancelledUI ? (
            <ArrowRight className="w-10 h-10 text-primary" />
          ) : (
            <Lock className="w-10 h-10 text-primary" />
          )}
        </div>
        
        <h3 className="text-xl font-bold mb-2">{displayTitle}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
          {displayDescription}
        </p>
        
        <Button 
          onClick={() => navigate('/premium-pricing')}
          size="lg"
          className="gap-2 px-8 shadow-lg shadow-primary/20"
        >
          <Crown className="w-5 h-5" />
          Premium freischalten
        </Button>
        
        {!showCancelledUI && (
          <p className="text-xs text-muted-foreground mt-3">
            7 Tage kostenlos testen
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};
