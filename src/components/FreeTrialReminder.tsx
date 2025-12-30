import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Crown, CheckCircle2, Calendar, ShoppingCart, UtensilsCrossed, Clock, AlertCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const REMINDER_DISMISSED_KEY = 'frig_trial_reminder_dismissed';

type ReminderType = 'day5' | 'day6' | 'day7' | 'freeMode' | null;

interface FreeTrialReminderProps {
  variant?: 'banner' | 'modal';
}

export const FreeTrialReminder = ({ variant = 'banner' }: FreeTrialReminderProps) => {
  const { subscriptionStatus, isPremium, isFreeMode, user, session } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [reminderType, setReminderType] = useState<ReminderType>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    // Check if dismissed today for specific reminder type
    const getDismissedToday = (type: string) => {
      const dismissedData = localStorage.getItem(REMINDER_DISMISSED_KEY);
      if (!dismissedData) return false;
      try {
        const dismissed = JSON.parse(dismissedData);
        return dismissed[type] === new Date().toDateString();
      } catch {
        return false;
      }
    };

    // Calculate days remaining for trial
    if (subscriptionStatus?.subscription_end && subscriptionStatus?.is_trial) {
      const endDate = new Date(subscriptionStatus.subscription_end);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysRemaining(diffDays);
      
      // Determine which reminder to show based on days remaining
      // Day 5 of trial = 2 days remaining (48h)
      // Day 6 of trial = 1 day remaining (24h)
      // Day 7 of trial = 0 days remaining (last day)
      
      if (diffDays === 2 && !getDismissedToday('day5')) {
        setReminderType('day5');
        setIsVisible(true);
      } else if (diffDays === 1 && !getDismissedToday('day6')) {
        setReminderType('day6');
        setIsVisible(true);
      } else if (diffDays <= 0 && !getDismissedToday('day7')) {
        // Last day or trial ended
        setReminderType('day7');
        setIsVisible(true);
      }
    }
    
    // Show reminder for free mode users (no trial, no subscription)
    if (isFreeMode && !subscriptionStatus?.is_trial) {
      if (!getDismissedToday('freeMode')) {
        setReminderType('freeMode');
        setIsVisible(true);
      }
    }
  }, [user, subscriptionStatus, isPremium, isFreeMode]);

  const handleDismiss = () => {
    if (reminderType) {
      const dismissedData = localStorage.getItem(REMINDER_DISMISSED_KEY);
      const dismissed = dismissedData ? JSON.parse(dismissedData) : {};
      dismissed[reminderType] = new Date().toDateString();
      localStorage.setItem(REMINDER_DISMISSED_KEY, JSON.stringify(dismissed));
    }
    setIsVisible(false);
  };

  const handleUpgrade = () => {
    navigate('/premium-pricing');
    handleDismiss();
  };

  const handleManageSubscription = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!error && data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (e) {
      console.error('Portal error:', e);
    }
    handleDismiss();
  };

  if (!isVisible || !reminderType) return null;

  // REMINDER 1: Day 5 (48h before end)
  if (reminderType === 'day5') {
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
                <Clock className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Dein Free Trial endet bald ⏳
                </h3>
                
                <p className="text-sm text-muted-foreground mt-1">
                  In 2 Tagen endet dein kostenloser Test.
                  Behalte weiterhin deinen Wochenplan, Rezepte & Kühlschrank-Scan.
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
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={handleUpgrade}
                    className="flex-1"
                    size="sm"
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Premium behalten
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDismiss}
                    className="text-muted-foreground"
                  >
                    Später erinnern
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

  // REMINDER 2: Day 6 (24h before end)
  if (reminderType === 'day6') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 p-4"
        >
          <Card className="max-w-lg mx-auto bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-500/20">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Letzter Tag deines Free Trials
                </h3>
                
                <p className="text-sm text-muted-foreground mt-1">
                  Morgen wird dein Premium-Abo aktiviert (4,99 €/Monat, jährlich abgerechnet).
                  Du kannst jederzeit kündigen.
                </p>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={handleUpgrade}
                    className="flex-1"
                    size="sm"
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Premium behalten
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleManageSubscription}
                    className="text-muted-foreground"
                  >
                    <Settings className="h-3.5 w-3.5 mr-1" />
                    Abo verwalten
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

  // REMINDER 3: Day 7 (Last day - LEGALLY IMPORTANT)
  if (reminderType === 'day7') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 p-4"
        >
          <Card className="max-w-lg mx-auto bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20 p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Free Trial endet heute
                </h3>
                
                <p className="text-sm text-muted-foreground mt-1">
                  Heute ist dein letzter kostenloser Tag.
                  Danach werden <strong>4,99 €/Monat</strong> (jährlich abgerechnet) abgebucht.
                </p>
                
                {/* Clear pricing info */}
                <div className="bg-background/50 rounded-lg p-3 mt-3">
                  <p className="text-xs text-foreground/80">
                    💳 Jährliche Abrechnung: 59,88 €/Jahr (4,99 €/Monat)
                  </p>
                </div>
                
                {/* LEGALLY REQUIRED: Both options clearly visible */}
                <div className="flex flex-col gap-2 mt-4">
                  <Button 
                    onClick={handleUpgrade}
                    className="w-full"
                    size="sm"
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Premium aktiv lassen
                  </Button>
                  
                  {/* IMPORTANT: Cancellation button clearly visible */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleManageSubscription}
                    className="w-full text-foreground border-border"
                  >
                    Abo kündigen
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Jederzeit kündbar. Keine versteckten Kosten.
                </p>
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
  if (reminderType === 'freeMode') {
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
                  7 Tage kostenlos, dann 4,99 €/Monat (jährlich). Jederzeit kündbar.
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
