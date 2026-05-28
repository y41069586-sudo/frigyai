import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import frigLogo from '@/assets/frigy-mascot.png';
import { resolveAuthErrorMessage, waitForAuthSession } from '@/lib/authErrors';

const AuthPage = () => {
  const { t, language } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  // Check where user is coming from
  const searchParams = new URLSearchParams(window.location.search);
  const fromParam = searchParams.get('from');
  const isFromOnboarding = fromParam === 'onboarding';
  const isFromPremiumPricing = fromParam === 'premium-pricing';

  const handleBack = () => {
    if (isFromOnboarding) {
      navigate('/?onboardingStep=save-progress', { replace: true });
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (!isFromOnboarding) return;

    const handleBrowserBack = () => {
      navigate('/?onboardingStep=save-progress', { replace: true });
    };

    window.addEventListener('popstate', handleBrowserBack);
    return () => window.removeEventListener('popstate', handleBrowserBack);
  }, [isFromOnboarding, navigate]);

  // Redirect if already logged in
  useEffect(() => {
    if (!user || loading) return;

    if (isFromOnboarding || isFromPremiumPricing) {
      navigate('/?onboardingStep=paywall', { replace: true });
      return;
    }

    const redirectPath = localStorage.getItem('redirectAfterAuth');
    if (redirectPath) {
      localStorage.removeItem('redirectAfterAuth');
      navigate(redirectPath);
    } else {
      navigate('/');
    }
  }, [user, loading, navigate, isFromOnboarding, isFromPremiumPricing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          const resolved = resolveAuthErrorMessage(error, language, 'login');
          setError(resolved?.message ?? error.message ?? 'Login fehlgeschlagen');
          if (resolved?.switchToLogin) setIsLogin(true);
        } else {
          const hasSession = await waitForAuthSession(3500);
          if (!hasSession) {
            setError(
              language === 'de'
                ? 'Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen.'
                : 'Could not complete sign-in. Please try again.',
            );
            return;
          }

          // Coming from onboarding or premium-pricing: go to paywall
          if (isFromOnboarding || isFromPremiumPricing) {
            navigate('/?onboardingStep=paywall', { replace: true });
            return;
          }

          const redirectPath = localStorage.getItem('redirectAfterAuth');
          if (redirectPath) {
            localStorage.removeItem('redirectAfterAuth');
            navigate(redirectPath);
          } else {
            navigate('/');
          }
        }
      } else {
        const shouldGoToPricing = isFromOnboarding || isFromPremiumPricing;

        const { error } = await signUp(email, password, { silent: true });
        if (error) {
          const resolved = resolveAuthErrorMessage(error, language, 'signup');
          if (resolved) {
            setError(resolved.message);
            if (resolved.switchToLogin) {
              setIsLogin(true);
              return;
            }
          } else if (error.message?.includes('Password should be at least')) {
            setError('Passwort muss mindestens 6 Zeichen lang sein');
          } else if (error.message?.includes('Invalid email')) {
            setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
          } else {
            setError(error.message || 'Registrierung fehlgeschlagen');
          }
        } else if (!(await waitForAuthSession(3000))) {
          setError(
            language === 'de'
              ? 'Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen.'
              : 'Could not complete sign-in. Please try again.',
          );
        } else if (shouldGoToPricing) {
          navigate('/?onboardingStep=paywall', { replace: true });
        } else {
          navigate('/premium-pricing', { replace: true });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <img src={frigLogo} alt="Frigy" className="h-12 w-12 mx-auto mb-4 rounded-xl animate-pulse" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-primary safe-area-inset">
      {/* Back Button Header */}
      <div className="shrink-0 safe-top">
        <div className="container mx-auto px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="touch-target h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 pb-6 pt-3 sm:items-center sm:pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-neon p-5 sm:p-8 border border-primary/20">
            <div className="flex items-center justify-center mb-5 sm:mb-8">
              <img src={frigLogo} alt="Frigy" className="h-12 w-12 rounded-xl" />
              <h1 className="text-2xl sm:text-3xl font-bold ml-3 neon-text">Frigy</h1>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-center mb-3 sm:mb-4">
              {isLogin ? t.signIn : t.signUp}
            </h2>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-8 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background/50 h-12 text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full glow-button h-12 sm:h-14 text-base touch-target"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? t.loading : (isLogin ? t.signIn : t.signUp)}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t.or}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 sm:h-14 text-base touch-target flex items-center justify-center gap-3 bg-background/50 hover:bg-background/80"
              onClick={async () => {
                setIsGoogleLoading(true);
                await signInWithGoogle();
                setIsGoogleLoading(false);
              }}
              disabled={isGoogleLoading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isGoogleLoading ? t.loading : t.signInWithGoogle}
            </Button>

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors touch-target py-2 block w-full"
              >
                {isLogin ? t.noAccount : t.alreadyHaveAccount}
              </button>
              {isLogin && (
                <button
                  onClick={() => navigate("/reset-password")}
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  {t.forgotPassword}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
