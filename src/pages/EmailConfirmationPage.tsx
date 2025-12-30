import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import frigLogo from '@/assets/frig-logo.png';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const EmailConfirmationPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const email = searchParams.get('email') || '';

  // Check if user is confirmed and redirect
  useEffect(() => {
    const checkConfirmation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        setIsConfirmed(true);
        // Redirect after showing success for 2 seconds
        setTimeout(() => {
          const fromParam = searchParams.get('from');
          const shouldGoToPricing = fromParam === 'onboarding' || fromParam === 'premium';
          const next = searchParams.get('next') || (shouldGoToPricing ? '/premium-pricing' : '/');
          navigate(next, { replace: true });
        }, 2000);
      }
    };

    // Check immediately
    checkConfirmation();

    // Listen for auth state changes (when user confirms email and comes back)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setIsConfirmed(true);
        setTimeout(() => {
          const fromParam = searchParams.get('from');
          const shouldGoToPricing = fromParam === 'onboarding' || fromParam === 'premium';
          const next = searchParams.get('next') || (shouldGoToPricing ? '/premium-pricing' : '/');
          navigate(next, { replace: true });
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  if (isConfirmed) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-primary safe-area-inset">
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="bg-card/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-neon p-8 sm:p-10 border border-primary/20 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </motion.div>
              
              <h1 className="text-2xl sm:text-3xl font-bold mb-4 neon-text">
                {t.emailConfirmed || "E-Mail bestätigt!"}
              </h1>
              
              <p className="text-muted-foreground mb-6">
                {t.redirectingToApp || "Du wirst zur App weitergeleitet..."}
              </p>
              
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-primary safe-area-inset">
      {/* Back Button Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 safe-top">
        <div className="container mx-auto px-3 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/auth')}
            className="touch-target h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-neon p-8 sm:p-10 border border-primary/20 text-center">
            <div className="flex items-center justify-center mb-6">
              <img src={frigLogo} alt="FrigBuddy" className="h-12 w-12 rounded-xl" />
              <h1 className="text-2xl sm:text-3xl font-bold ml-3 neon-text">FrigBuddy</h1>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <Mail className="w-10 h-10 text-primary" />
            </motion.div>

            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              {t.checkYourEmail || "Überprüfe deine E-Mail"}
            </h2>

            <p className="text-muted-foreground mb-2">
              {t.confirmationEmailSent || "Wir haben dir eine Bestätigungs-E-Mail gesendet."}
            </p>

            {email && (
              <p className="text-sm text-primary font-medium mb-6">
                {email}
              </p>
            )}

            <div className="bg-primary/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-foreground">
                {t.clickLinkToConfirm || "Klicke auf den Link in der E-Mail, um dein Konto zu bestätigen und fortzufahren."}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => navigate('/auth')}
              >
                {t.backToLogin || "Zurück zur Anmeldung"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              {t.noEmailReceived || "Keine E-Mail erhalten? Überprüfe deinen Spam-Ordner."}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmailConfirmationPage;