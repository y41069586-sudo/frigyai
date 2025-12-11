import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Sparkles, Check, Calendar, ShoppingCart, BarChart, XCircle, Settings, Droplets, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NavLink } from '@/components/NavLink';
import { WaterTracker } from '@/components/WaterTracker';
import { ProgressTracker } from '@/components/ProgressTracker';
import frigLogo from '@/assets/frig-logo.png';

const PremiumPage = () => {
  const { user, session, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'water' | 'weight'>('overview');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSubscribe = async () => {
    if (!session) {
      toast({
        title: 'Nicht angemeldet',
        description: 'Bitte melde dich an, um fortzufahren.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting checkout process...');
      const response = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Checkout response:', response);

      const errorMessage = response.error?.message || response.data?.error;
      
      if (errorMessage) {
        if (errorMessage.includes('401') || 
            errorMessage.includes('anmelden') || 
            errorMessage.includes('abgelaufen') || 
            errorMessage.includes('Sitzung') ||
            errorMessage.includes('session') ||
            errorMessage.includes('Auth')) {
          toast({
            title: 'Sitzung abgelaufen',
            description: 'Bitte melde dich erneut an.',
            variant: 'destructive',
          });
          await supabase.auth.signOut();
          navigate('/auth');
          return;
        }
        throw new Error(errorMessage);
      }

      if (response.data?.url) {
        console.log('Redirecting to payment link:', response.data.url);
        toast({
          title: 'Weiterleitung zu Stripe',
          description: 'Du wirst jetzt weitergeleitet...',
        });
        window.location.href = response.data.url;
      } else {
        throw new Error('Keine Checkout-URL erhalten');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) {
      toast({
        title: 'Nicht angemeldet',
        description: 'Bitte melde dich an, um fortzufahren.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    toast({ title: 'Lade Stripe-Portal...', description: 'Bitte warten' });
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow) {
          window.location.href = data.url;
        }
      } else {
        throw new Error('Keine Portal-URL erhalten');
      }
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Calendar, text: 'Wöchentliche personalisierte Meal Plans' },
    { icon: ShoppingCart, text: 'Automatische Einkaufslisten' },
    { icon: BarChart, text: 'Makro-Tracking & Kalorienanalyse' },
    { icon: Sparkles, text: 'Unbegrenzte Rezeptgenerierung' },
    { icon: Droplets, text: 'Wasser-Tracker' },
    { icon: TrendingDown, text: 'Gewichtsverlauf & Fortschritt' },
  ];

  const isPremium = subscriptionStatus?.subscribed;

  return (
    <div className="min-h-screen bg-gradient-primary safe-area-inset">
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20 safe-top">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2 touch-target h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <NavLink to="/">
              <div className="flex items-center gap-2">
                <img src={frigLogo} alt="Frig AI" className="h-8 w-8 rounded-lg" />
                <h1 className="text-lg sm:text-2xl font-bold neon-text">Frig AI</h1>
              </div>
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {isPremium ? (
            <div className="space-y-6">
              {/* Premium Status Header */}
              <div className="bg-card/80 backdrop-blur-lg rounded-3xl shadow-neon p-6 border border-primary/20">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-full">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold neon-text">Premium Aktiv</h2>
                      {subscriptionStatus?.subscription_end && (
                        <p className="text-sm text-muted-foreground">
                          Erneuert am: {new Date(subscriptionStatus.subscription_end).toLocaleDateString('de-DE')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleManageSubscription}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Verwalten
                    </Button>
                    <Button
                      onClick={handleManageSubscription}
                      disabled={loading}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Kündigen
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section Navigation */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={activeSection === 'overview' ? 'default' : 'outline'}
                  onClick={() => setActiveSection('overview')}
                  className={activeSection === 'overview' ? 'glow-button' : ''}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Übersicht
                </Button>
                <Button
                  variant={activeSection === 'water' ? 'default' : 'outline'}
                  onClick={() => setActiveSection('water')}
                  className={activeSection === 'water' ? 'glow-button' : ''}
                >
                  <Droplets className="mr-2 h-4 w-4" />
                  Wasser-Tracker
                </Button>
                <Button
                  variant={activeSection === 'weight' ? 'default' : 'outline'}
                  onClick={() => setActiveSection('weight')}
                  className={activeSection === 'weight' ? 'glow-button' : ''}
                >
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Gewichtsverlauf
                </Button>
              </div>

              {/* Content Sections */}
              {activeSection === 'overview' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <div className="bg-card/80 backdrop-blur-lg rounded-2xl p-6 border border-primary/20">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Schnellzugriff
                    </h3>
                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate('/meal-plans')}
                        className="w-full glow-button"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Meal Plans
                      </Button>
                      <Button
                        onClick={() => navigate('/manual')}
                        variant="outline"
                        className="w-full"
                      >
                        <BarChart className="mr-2 h-4 w-4" />
                        Tracker einrichten
                      </Button>
                      <Button
                        onClick={() => setActiveSection('water')}
                        variant="outline"
                        className="w-full"
                      >
                        <Droplets className="mr-2 h-4 w-4" />
                        Wasser-Tracker
                      </Button>
                      <Button
                        onClick={() => setActiveSection('weight')}
                        variant="outline"
                        className="w-full"
                      >
                        <TrendingDown className="mr-2 h-4 w-4" />
                        Gewichtsverlauf
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-card/80 backdrop-blur-lg rounded-2xl p-6 border border-primary/20">
                    <h3 className="font-semibold mb-4">Deine Premium-Features</h3>
                    <div className="space-y-2">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'water' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <WaterTracker />
                </motion.div>
              )}

              {activeSection === 'weight' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <ProgressTracker />
                </motion.div>
              )}
            </div>
          ) : (
            <div className="bg-card/80 backdrop-blur-lg rounded-3xl shadow-neon p-8 border border-primary/20 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-primary/20 rounded-full mb-4">
                  <Sparkles className="h-16 w-16 text-primary animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold neon-text mb-2">
                  Healthy3 Premium
                </h2>
                <p className="text-4xl font-bold text-primary mb-2">4,99€</p>
                <p className="text-muted-foreground">pro Monat</p>
              </div>

              <div className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-background/50 rounded-xl"
                  >
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="flex-1">{feature.text}</span>
                    <Check className="h-5 w-5 text-primary" />
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full glow-button"
                size="lg"
              >
                {loading ? 'Lädt...' : 'Jetzt Premium werden'}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PremiumPage;