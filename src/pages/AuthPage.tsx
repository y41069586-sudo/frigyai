import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import frigLogo from '@/assets/frigy-mascot.png';
import { resolveAuthErrorMessage, waitForAuthSession } from '@/lib/authErrors';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { isOAuthCallbackUrl, POST_AUTH_PAYWALL_ROUTE } from '@/lib/authOAuth';
import { clearOAuthPending, clearStaleOAuthPendingIfIdle, getOAuthPending } from '@/lib/oauthPending';
import { isAuthCompletionPending, isAuthFlowOverlayVisible } from '@/lib/authCompletion';
import { redirectAfterSignIn, wasPostAuthRedirectRecentlyHandled } from '@/lib/postAuthRedirect';
import { persistOnboardingSignupFromStorage } from '@/components/onboarding/utils';
import { isAppleSignInAvailable } from '@/lib/appleSignIn';
import { AppleSignInIcon } from '@/components/icons/AppleSignInIcon';
import { GoogleSignInIcon } from '@/components/icons/GoogleSignInIcon';

const AuthPage = () => {
  const { t, language } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authStuck, setAuthStuck] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithApple, signOut, user, loading, checkSubscription } = useAuth();
  const showAppleSignIn = isAppleSignInAvailable() || Capacitor.getPlatform() === "web";
  const navigate = useNavigate();
  const redirectStartedRef = useRef(false);

  const searchParams = new URLSearchParams(window.location.search);
  const fromParam = searchParams.get('from');
  const isLoginOnly = searchParams.get('mode') === 'login';
  const isFromOnboarding = fromParam === 'onboarding';
  const isFromPremiumPricing = fromParam === 'premium-pricing';
  const hasOAuthCallback = isOAuthCallbackUrl(window.location.href);
  const oauthFromQuery = isFromOnboarding
    ? { from: "onboarding" as const }
    : isLoginOnly || isLogin
      ? { from: "login" as const }
      : { from: "signup" as const };

  useEffect(() => {
    if (isLoginOnly) {
      setIsLogin(true);
    }
  }, [isLoginOnly]);

  const finishAuthRedirect = useCallback(async (
    signedInSession?: Session | null,
    options?: { emailPasswordLogin?: boolean },
  ) => {
    if (redirectStartedRef.current || wasPostAuthRedirectRecentlyHandled()) {
      return;
    }
    redirectStartedRef.current = true;
    setIsRedirecting(true);

    try {
      const sessionUserId =
        signedInSession?.user?.id ??
        (await supabase.auth.getSession()).data.session?.user?.id ??
        user?.id;

      const nextParam = searchParams.get('next');
      const redirectPath = localStorage.getItem('redirectAfterAuth');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterAuth');
      }

      await redirectAfterSignIn({
        userId: sessionUserId,
        checkSubscription,
        navigate,
        fromOnboarding: isFromOnboarding,
        authIntent: isLoginOnly || isLogin ? "login" : "signup",
        emailPasswordLogin: options?.emailPasswordLogin ?? false,
        explicitPath:
          nextParam && nextParam.startsWith('/')
            ? nextParam
            : redirectPath && redirectPath.startsWith('/')
              ? redirectPath
              : isFromPremiumPricing
                ? POST_AUTH_PAYWALL_ROUTE
                : null,
      });
    } catch (redirectError) {
      console.error('[Auth] redirectAfterSignIn failed:', redirectError);
      redirectStartedRef.current = false;
      setError(t.authLoginFailed);
      navigate('/', { replace: true });
    } finally {
      setIsRedirecting(false);
    }
  }, [checkSubscription, isFromOnboarding, isFromPremiumPricing, isLogin, isLoginOnly, navigate, searchParams, t.authLoginFailed, user?.id]);

  const handleBack = () => {
    if (isLoginOnly) {
      navigate('/', { replace: true });
      return;
    }

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

  // Already signed in → paywall or dashboard (never show login form again).
  useEffect(() => {
    if (loading || !user) return;
    // OAuth ?code= is completed by AuthOAuthCallbackBootstrap — do not race or strip the URL here.
    if (hasOAuthCallback) return;
    if (getOAuthPending()) return;
    if (wasPostAuthRedirectRecentlyHandled()) return;
    if (redirectStartedRef.current) return;
    void finishAuthRedirect();
  }, [user, loading, finishAuthRedirect, hasOAuthCallback]);

  useEffect(() => {
    if (!user || loading || isRedirecting) {
      setAuthStuck(false);
      return;
    }
    const timer = window.setTimeout(() => setAuthStuck(true), 6000);
    return () => window.clearTimeout(timer);
  }, [user, loading, isRedirecting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    redirectStartedRef.current = false;
    setIsSubmitting(true);
    setError(null);

    try {
      if (isLogin || isLoginOnly) {
        const { error, session } = await signIn(email, password);
        if (error) {
          const resolved = resolveAuthErrorMessage(error, language, 'login');
          setError(resolved?.message ?? error.message ?? t.authLoginFailed);
          if (resolved?.switchToLogin) setIsLogin(true);
        } else {
          const activeSession = session ?? (await supabase.auth.getSession()).data.session;
          if (!activeSession && !(await waitForAuthSession(3500))) {
            setError(t.authSignInIncomplete);
            return;
          }

          await finishAuthRedirect(activeSession, { emailPasswordLogin: true });
        }
      } else if (!isLoginOnly) {
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
            setError(t.authPasswordMinLength);
          } else if (error.message?.includes('Invalid email')) {
            setError(t.authInvalidEmail);
          } else {
            setError(error.message || t.authSignupFailed);
          }
        } else if (!(await waitForAuthSession(3000))) {
          setError(t.authSignInIncomplete);
        } else {
          const activeSession = (await supabase.auth.getSession()).data.session;
          if (shouldGoToPricing && isFromOnboarding) {
            persistOnboardingSignupFromStorage();
          }
          redirectStartedRef.current = false;
          await finishAuthRedirect(activeSession);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('oauth_error') !== '1') return;
    setError(t.authLoginFailed);
    clearOAuthPending();
    window.history.replaceState({}, '', '/auth');
  }, [searchParams, t.authLoginFailed]);

  useEffect(() => {
    clearStaleOAuthPendingIfIdle();
  }, []);

  const oauthInFlight =
    hasOAuthCallback ||
    isAuthCompletionPending() ||
    isAuthFlowOverlayVisible() ||
    getOAuthPending() ||
    isGoogleLoading ||
    isAppleLoading;

  // OAuth return / post-auth: only loader — never flash the login form.
  if (oauthInFlight || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary px-6">
        <div className="text-center">
          <img src={frigLogo} alt="Frigy" className="h-12 w-12 mx-auto mb-4 rounded-xl animate-pulse" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  const showAuthLoader = loading && !user;

  if (showAuthLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary px-6">
        <div className="text-center">
          <img src={frigLogo} alt="Frigy" className="h-12 w-12 mx-auto mb-4 rounded-xl animate-pulse" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (user && authStuck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary px-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <img src={frigLogo} alt="Frigy" className="h-12 w-12 mx-auto mb-4 rounded-xl" />
          <p className="text-sm text-muted-foreground mb-4">
            Anmeldung hängt. Bitte Session zurücksetzen und erneut versuchen.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => {
                redirectStartedRef.current = false;
                setAuthStuck(false);
                void finishAuthRedirect();
              }}
            >
              Weiter
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                redirectStartedRef.current = false;
                setAuthStuck(false);
                clearOAuthPending();
                await signOut();
                setAuthStuck(false);
                window.location.replace('/auth');
              }}
            >
              Abmelden & neu starten
            </Button>
          </div>
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
              {t.signIn}
            </h2>
            {isLoginOnly && (
              <p className="mb-4 text-center text-sm text-muted-foreground">
                {t.authSignInOnlyHint}
              </p>
            )}

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
                {isSubmitting ? t.loading : t.signIn}
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

            {showAppleSignIn && (
              <Button
                type="button"
                className="w-full h-12 sm:h-14 text-base touch-target flex items-center justify-center gap-3 bg-black text-white hover:bg-black/90"
                onClick={async () => {
                  setIsAppleLoading(true);
                  setError(null);
                  const { error: appleError } = await signInWithApple({
                    authQuery: oauthFromQuery,
                  });
                  if (appleError) {
                    const msg =
                      appleError instanceof Error ? appleError.message : "Apple-Anmeldung fehlgeschlagen";
                    setError(msg);
                  } else if (await waitForAuthSession(3500)) {
                    await finishAuthRedirect();
                  }
                  setIsAppleLoading(false);
                }}
                disabled={isAppleLoading || isGoogleLoading}
              >
                <AppleSignInIcon size={20} />
                {isAppleLoading ? t.loading : t.signInWithApple}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 sm:h-14 text-base touch-target flex items-center justify-center gap-3 bg-background/50 hover:bg-background/80"
              onClick={async () => {
                setIsGoogleLoading(true);
                setError(null);
                redirectStartedRef.current = false;
                const { error: googleError } = await signInWithGoogle({
                  authQuery: oauthFromQuery,
                });
                if (googleError) {
                  setError(t.authLoginFailed);
                }
                setIsGoogleLoading(false);
              }}
              disabled={isGoogleLoading || isAppleLoading}
            >
              <GoogleSignInIcon size={20} />
              {isGoogleLoading ? t.loading : t.signInWithGoogle}
            </Button>

            <div className="mt-6 text-center space-y-2">
              {!isLoginOnly && (
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors touch-target py-2 block w-full"
                >
                  {isLogin ? t.noAccount : t.alreadyHaveAccount}
                </button>
              )}
              {(isLogin || isLoginOnly) && (
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
