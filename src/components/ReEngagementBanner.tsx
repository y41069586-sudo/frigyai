import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Sparkles, Calendar, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BANNER_DISMISSED_KEY = 'frig_reengagement_dismissed';
const CANCELLATION_DATE_KEY = 'frig_cancellation_date';
const COMEBACK_USED_KEY = 'frig_comeback_trial_used';

type BannerType = 'week1' | 'month1' | 'comeback' | null;

export const ReEngagementBanner = () => {
  const { user, isFreeMode, isPremium } = useAuth();
  const navigate = useNavigate();
  const [bannerType, setBannerType] = useState<BannerType>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user || isPremium) return;

    const cancellationDate = localStorage.getItem(CANCELLATION_DATE_KEY);
    if (!cancellationDate) return;

    const dismissedData = localStorage.getItem(BANNER_DISMISSED_KEY);
    const dismissed = dismissedData ? JSON.parse(dismissedData) : {};
    const today = new Date().toDateString();

    // Calculate days since cancellation
    const cancelDate = new Date(cancellationDate);
    const now = new Date();
    const daysSinceCancellation = Math.floor((now.getTime() - cancelDate.getTime()) / (1000 * 60 * 60 * 24));

    // Determine which banner to show
    let type: BannerType = null;

    // 45-60 days: Comeback trial (one-time ever)
    const comebackUsed = localStorage.getItem(COMEBACK_USED_KEY) === 'true';
    if (daysSinceCancellation >= 45 && daysSinceCancellation <= 90 && !comebackUsed) {
      if (dismissed.comeback !== today) {
        type = 'comeback';
      }
    }
    // 30+ days: Month reminder
    else if (daysSinceCancellation >= 30 && daysSinceCancellation < 45) {
      if (dismissed.month1 !== today) {
        type = 'month1';
      }
    }
    // 7-14 days: Week reminder
    else if (daysSinceCancellation >= 7 && daysSinceCancellation < 30) {
      if (dismissed.week1 !== today) {
        type = 'week1';
      }
    }

    if (type) {
      setBannerType(type);
      setIsVisible(true);
    }
  }, [user, isPremium, isFreeMode]);

  const handleDismiss = () => {
    if (bannerType) {
      const dismissedData = localStorage.getItem(BANNER_DISMISSED_KEY);
      const dismissed = dismissedData ? JSON.parse(dismissedData) : {};
      dismissed[bannerType] = new Date().toDateString();
      localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(dismissed));
    }
    setIsVisible(false);
  };

  const handleUpgrade = () => {
    if (bannerType === 'comeback') {
      // Mark comeback as used (one-time ever)
      localStorage.setItem(COMEBACK_USED_KEY, 'true');
    }
    navigate('/premium-pricing');
    handleDismiss();
  };

  if (!isVisible || !bannerType) return null;

  const bannerContent = {
    week1: {
      icon: <Calendar className="w-5 h-5 text-primary" />,
      title: 'Dein Wochenplan kann jederzeit weitergehen',
      subtitle: 'Deine Planung wartet noch auf dich.',
      cta: 'Premium reaktivieren',
      gradient: 'from-primary/10 to-accent/10',
      borderColor: 'border-primary/20'
    },
    month1: {
      icon: <Sparkles className="w-5 h-5 text-accent" />,
      title: 'Du weißt jetzt, wie Frigy funktioniert',
      subtitle: 'Bereit für den nächsten Schritt?',
      cta: 'Premium freischalten',
      gradient: 'from-accent/10 to-primary/10',
      borderColor: 'border-accent/20'
    },
    comeback: {
      icon: <Gift className="w-5 h-5 text-emerald-500" />,
      title: 'Willkommen zurück 🎉',
      subtitle: '7 Tage Premium – einmalig für dich.',
      cta: 'Kostenlos testen',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      borderColor: 'border-emerald-500/20'
    }
  };

  const content = bannerContent[bannerType];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 left-4 right-4 z-40"
      >
        <Card className={`max-w-lg mx-auto bg-gradient-to-r ${content.gradient} ${content.borderColor} p-4 shadow-lg`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-background/50">
              {content.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">
                {content.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {content.subtitle}
              </p>
              
              <div className="flex gap-2 mt-3">
                <Button 
                  onClick={handleUpgrade}
                  size="sm"
                  className={bannerType === 'comeback' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                >
                  {content.cta}
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
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReEngagementBanner;
