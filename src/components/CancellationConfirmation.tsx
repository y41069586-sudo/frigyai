import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface CancellationConfirmationProps {
  onDismiss: () => void;
}

export const CancellationConfirmation = ({ onDismiss }: CancellationConfirmationProps) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    // Store cancellation date for re-engagement timing
    localStorage.setItem('frig_cancellation_date', new Date().toISOString());
    localStorage.setItem('frig_cancellation_shown', 'true');
    onDismiss();
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          {/* Calm icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Title - No drama */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Dein Abo wurde beendet
            </h2>
            <p className="text-muted-foreground">
              Du kannst Frigy weiterhin im Free-Modus nutzen.
            </p>
          </div>

          {/* Reassurance */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-foreground/80">
              <Heart className="w-4 h-4 text-primary" />
              <span>Deine Daten bleiben gespeichert</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Du kannst jederzeit wieder Premium freischalten.
            </p>
          </div>

          {/* Single calm CTA */}
          <Button 
            onClick={handleContinue}
            className="w-full"
            size="lg"
          >
            Zum Dashboard
          </Button>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CancellationConfirmation;
