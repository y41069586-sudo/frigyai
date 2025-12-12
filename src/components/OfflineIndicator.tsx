import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOfflineMode } from "@/hooks/useOfflineMode";

export const OfflineIndicator = () => {
  const { isOnline, pendingSync } = useOfflineMode();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 inset-x-0 z-[100] safe-top"
        >
          <div className="bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <WifiOff className="h-4 w-4" />
              <span>Offline-Modus</span>
              {pendingSync.length > 0 && (
                <span className="bg-destructive-foreground/20 px-2 py-0.5 rounded-full text-xs">
                  {pendingSync.length} ausstehend
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
