import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Crown, CheckCircle2, Calendar, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const REMINDER_DISMISSED_KEY = 'frig_trial_reminder_dismissed';
const REMINDER_SHOWN_TODAY_KEY = 'frig_trial_reminder_shown_today';

interface FreeTrialReminderProps {
  variant?: 'banner' | 'modal';
}

export const FreeTrialReminder = ({ variant = 'banner' }: FreeTrialReminderProps) => {
  const { subscriptionStatus, isPremium, isFreeMode, user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    // Check if already shown today
    const today = new Date().toDateString();
    const shownToday = localStorage.getItem(REMINDER_SHOWN_TODAY_KEY);
    
    // Check if permanently dismissed for this session
    const dismissed = sessionStorage.getItem(REMINDER_DISMISSED_KEY);
    
    if (shownToday === today && dismissed) {
      return;
    }

    // Calculate days remaining for trial
    if (subscriptionStatus?.subscription_end && subscriptionStatus?.is_trial) {
      const endDate = new Date(subscriptionStatus.subscription_end);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0 && diffDays <= 3) {
        setDaysRemaining(diffDays);
        setIsVisible(true);
        localStorage.setItem(REMINDER_SHOWN_TODAY_KEY, today);
      }
    }
    
    // Show reminder for free mode users (no trial, no subscription)
    if (isFreeMode && !subscriptionStatus?.is_trial) {
      // Show less frequently for free mode users - once per day max
      if (shownToday !== today) {
        setIsVisible(true);
        localStorage.setItem(REMINDER_SHOWN_TODAY_KEY, today);
      }
    }
  }, [user, subscriptionStatus, isPremium, isFreeMode]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem(REMINDER_DISMISSED_KEY, 'true');
  };

  const handleUpgrade = () => {
    navigate('/premium-pricing');
    handleDismiss();
  };

  if (!isVisible) return null;

  // Trial ending reminder
  if (daysRemaining !== null && daysRemaining <= 3) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 p-4"
        >
          <Card className="max-w-lg mx-auto bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {daysRemaining === 1 
                    ? 'Dein Free Trial endet heute' 
                    : `Dein Free Trial endet in ${daysRemaining} Tagen`}
                </h3>
                
                <p className="text-sm text-muted-foreground mt-1">
                  Behalte Zugriff auf deinen Wochenplan, Rezepte & Kühlschrank-Scan.
                </p>
                
                {/* Preview effect - show what they've used */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 text-xs bg-background/50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Wochenplan generiert
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-background/50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Einkaufsliste erstellt
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground mt-3">
                  Danach: 4,99 €/Monat (jährlich). Jederzeit kündbar.
                </p>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={handleUpgrade}
                    className="flex-1"
                    size="sm"
                  >
                    Premium behalten
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDismiss}
                    className="text-muted-foreground"
                  >
                    Später
                  </Button>
                </div>
              </div>
              
              <button 
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Free mode reminder (no trial active)
  if (isFreeMode) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 p-4"
        >
          <Card className="max-w-lg mx-auto bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20 p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-accent/20">
                <Crown className="h-5 w-5 text-accent" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Schalte alle Features frei
                </h3>
                
                <p className="text-sm text-muted-foreground mt-1">
                  Starte jetzt deinen 7-tägigen Free Trial und entdecke:
                </p>
                
                {/* Features preview */}
                <div className="grid grid-cols-1 gap-1.5 mt-3">
                  <span className="inline-flex items-center gap-2 text-xs text-foreground/80">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Automatische Wochenpläne
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs text-foreground/80">
                    <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                    Smarte Einkaufslisten
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs text-foreground/80">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
                    Kühlschrank scannen & Rezepte
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground mt-3">
                  7 Tage kostenlos, dann 4,99 €/Monat. Jederzeit kündbar.
                </p>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={handleUpgrade}
                    className="flex-1"
                    size="sm"
                  >
                    Free Trial starten
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDismiss}
                    className="text-muted-foreground"
                  >
                    Nicht jetzt
                  </Button>
                </div>
              </div>
              
              <button 
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};

export default FreeTrialReminder;
