import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Check, Calendar, ShoppingCart, BarChart, XCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NavLink } from '@/components/NavLink';

const PremiumPage = () => {
  const { user, session, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

      // Check for any error - either from invoke error or from response data
      const errorMessage = response.error?.message || response.data?.error;
      
      if (errorMessage) {
        // Check if it's a session/auth error
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
        // Direct redirect instead of popup (avoids popup blockers)
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
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Keine Portal-URL erhalten');
      }
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const features = [
    { icon: Calendar, text: 'Wöchentliche personalisierte Meal Plans' },
    { icon: ShoppingCart, text: 'Automatische Einkaufslisten' },
    { icon: BarChart, text: 'Makro-Tracking & Kalorienanalyse' },
    { icon: Sparkles, text: 'Unbegrenzte Rezeptgenerierung' },
  ];

  const isPremium = subscriptionStatus?.subscribed;

  return (
    <div className="min-h-screen bg-gradient-primary">
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <NavLink to="/">
            <h1 className="text-2xl font-bold neon-text">Healthy3</h1>
          </NavLink>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-card/80 backdrop-blur-lg rounded-3xl shadow-neon p-8 border border-primary/20">
            {isPremium ? (
              <div className="text-center space-y-6">
                <div className="inline-block p-4 bg-primary/20 rounded-full">
                  <Sparkles className="h-16 w-16 text-primary" />
                </div>
                <h2 className="text-3xl font-bold neon-text">Premium Aktiv</h2>
                <p className="text-muted-foreground">
                  Du hast Zugriff auf alle Premium-Features!
                </p>
                {subscriptionStatus?.subscription_end && (
                  <p className="text-sm text-muted-foreground">
                    Erneuert am:{' '}
                    {new Date(subscriptionStatus.subscription_end).toLocaleDateString('de-DE')}
                  </p>
                )}
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/meal-plans')}
                    className="w-full glow-button"
                    size="lg"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Meal Plans ansehen
                  </Button>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Abo verwalten
                  </Button>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loading}
                    variant="ghost"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Abo kündigen
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Du wirst zum Stripe Kundenportal weitergeleitet, wo du dein Abo verwalten oder kündigen kannst.
                </p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PremiumPage;