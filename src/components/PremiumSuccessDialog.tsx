import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, Sparkles, Calendar, ShoppingCart, Droplets, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import confetti from "canvas-confetti";

interface PremiumSuccessDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PremiumSuccessDialog = ({ open, onClose }: PremiumSuccessDialogProps) => {
  const { t } = useLanguage();
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    if (open) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#7CF57C", "#4ADE80", "#22C55E"],
      });

      // Show features after delay
      const timer = setTimeout(() => setShowFeatures(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowFeatures(false);
    }
  }, [open]);

  const features = [
    { icon: Calendar, label: "Wöchentliche Mahlzeitenpläne" },
    { icon: ShoppingCart, label: "Automatische Einkaufslisten" },
    { icon: Activity, label: "Makro- & Kalorientracker" },
    { icon: Droplets, label: "Wasser-Tracker" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/30 p-0 overflow-hidden">
        <div className="relative">
          {/* Top gradient */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/20 to-transparent" />
          
          <div className="relative p-6 pt-8 text-center">
            {/* Crown Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="relative mx-auto mb-4"
            >
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Crown className="h-10 w-10 text-primary" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="h-4 w-4 text-primary-foreground" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Willkommen bei Premium!
                <Sparkles className="h-5 w-5 text-primary" />
              </h2>
              <p className="text-muted-foreground">
                Dein 7-Tage kostenloser Test hat begonnen
              </p>
            </motion.div>

            {/* Features */}
            <AnimatePresence>
              {showFeatures && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 space-y-3"
                >
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 bg-primary/10 rounded-lg p-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{feature.label}</span>
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6"
            >
              <Button onClick={onClose} className="w-full glow-button h-12 text-lg">
                Los geht's!
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Nach 7 Tagen: €4,99/Monat • Jederzeit kündbar
              </p>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
