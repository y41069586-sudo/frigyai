import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, clearSupabaseAuthStorage } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { redeemPendingReferralCode } from '@/lib/referralCode';
import { syncAffiliateAttributionToServer } from '@/lib/affiliateSync';
import { applyDeferredReferralOnFirstOpen } from '@/lib/referralAttribution';
import {
  isEmailNotConfirmed,
  isEmailRateLimited,
  isSignupExistingUserNoIdentities,
  isUserAlreadyRegistered,
  resolveAuthErrorMessage,
} from '@/lib/authErrors';
import { registerUserWithoutEmailConfirm } from '@/lib/registerUser';
import { isSubscriptionActive } from '@/lib/subscription';
import { getPublicErrorMessage } from '@/lib/publicErrorMessage';
import { getStoredLanguage, getTranslations } from '@/contexts/LanguageContext';
import { signInWithOAuthProvider } from '@/lib/authOAuth';
import { linkAppleIdentity, signInWithApple as nativeAppleSignIn } from '@/lib/appleSignIn';
import { syncStoreSubscriptionIfNeeded } from '@/lib/subscriptionRefresh';
import { markEverPremium } from '@/lib/trialEligibility';

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
  is_trial?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  /** True when user has premium access (subscribed or in trial) */
  isPremium: boolean;
  signUp: (
    email: string,
    password: string,
    options?: { emailRedirectTo?: string; silent?: boolean }
  ) => Promise<{ error: unknown }>;
  signIn: (
    email: string,
    password: string,
    options?: { silent?: boolean },
  ) => Promise<{ error: unknown; session: Session | null }>;
  signInWithGoogle: (options?: {
    redirectPath?: string;
    authQuery?: Record<string, string>;
  }) => Promise<{ error: unknown }>;
  signInWithApple: (options?: {
    authQuery?: Record<string, string>;
  }) => Promise<{ error: unknown }>;
  linkAppleAccount: () => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<SubscriptionStatus | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache key for subscription status
const SUBSCRIPTION_CACHE_KEY = 'frig_subscription_status';

const getCachedSubscription = (): SubscriptionStatus | null => {
  try {
    const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Cache valid for 1 hour
      if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.warn('[Auth] Failed to load cached subscription:', e);
  }
  return null;
};

const setCachedSubscription = (data: SubscriptionStatus | null) => {
  try {
    if (data) {
      localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } else {
      localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    }
  } catch (e) {
    console.warn('[Auth] Failed to cache subscription:', e);
  }
};

// Fast DB cache load (much faster than edge function round-trip)
const loadFromDbCache = async (userId: string): Promise<SubscriptionStatus | null> => {
  try {
    const { data, error } = await supabase
      .from('subscription_cache')
      .select('subscribed, product_id, subscription_end, is_trial')
      .eq('user_id', userId)
      .single();

    // Handle query errors (no rows found, multiple rows, etc.)
    if (error) {
      console.warn('[Auth] Database query error for subscription cache:', error);
      return null;
    }

    if (data) {
      const status: SubscriptionStatus = {
        subscribed: data.subscribed,
        product_id: data.product_id,
        subscription_end: data.subscription_end,
        is_trial: data.is_trial || false,
      };
      if (!isSubscriptionActive(status)) {
        return { ...status, subscribed: false };
      }
      return status;
    }
  } catch (e) {
    console.warn('[Auth] Failed to load subscription from DB cache:', e);
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-2">Supabase fehlt</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Lege eine <code className="text-xs">.env</code> im Projektroot an (siehe{" "}
            <code className="text-xs">.env.example</code>) mit{" "}
            <code className="text-xs">VITE_SUPABASE_URL</code> und{" "}
            <code className="text-xs">VITE_SUPABASE_PUBLISHABLE_KEY</code>, dann Dev-Server neu starten.
          </p>
          <button
            type="button"
            className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }

  return <AuthProviderInner>{children}</AuthProviderInner>;
};

const AuthProviderInner = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Load cached subscription immediately for instant UI
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(getCachedSubscription);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const updateSubscriptionStatus = (data: SubscriptionStatus | null) => {
    if (
      data &&
      (data.subscribed || data.is_trial || data.product_id || data.subscription_end)
    ) {
      markEverPremium();
    }
    setSubscriptionStatus(data);
    setCachedSubscription(data);
  };

  // Fast load from DB cache, then refresh from RevenueCat / subscription_cache
  const loadSubscriptionFast = async (userId: string, accessToken: string) => {
    applyDeferredReferralOnFirstOpen();
    await syncAffiliateAttributionToServer(accessToken, { source: "auth" });

    const referral = await redeemPendingReferralCode(accessToken);
    if (referral.success && referral.message && !referral.already_redeemed) {
      toast({
        title: "Empfehlungscode aktiviert",
        description: referral.message,
      });
    }

    // Step 1: Load from DB cache instantly (~50ms)
    const dbCache = await loadFromDbCache(userId);
    if (dbCache) {
      updateSubscriptionStatus(dbCache);
    }
    
    // Step 2: Sync store billing + refresh subscription status
    void syncStoreSubscriptionIfNeeded(accessToken).finally(() => {
      supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(({ data, error }) => {
        if (!error && data) {
          updateSubscriptionStatus(data);
        }
      }).catch((err) => {
        console.warn('[Auth] Background subscription refresh failed:', err);
      });
    });
  };

  const checkSubscription = async (): Promise<SubscriptionStatus | null> => {
    let accessToken = session?.access_token;
    if (!accessToken) {
      const { data } = await supabase.auth.getSession();
      accessToken = data.session?.access_token;
    }
    if (!accessToken) return null;

    await syncStoreSubscriptionIfNeeded(accessToken);

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) throw error;
      const status = (data ?? null) as SubscriptionStatus | null;
      updateSubscriptionStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return null;
    }
  };

  // Use ref to track session for visibility change handler (avoids dependency issues)
  const sessionRef = useRef<Session | null>(null);
  
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let mounted = true;

    // Fallback timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.log('[Auth] Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;
        
        console.log('[Auth] State change:', event);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        // Handle session errors - sign out if session is invalid
        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          console.log('[Auth] Token refresh failed, signing out');
          setSubscriptionStatus(null);
          return;
        }
        
        // Load subscription: DB cache first, then RevenueCat refresh
        if (currentSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          loadSubscriptionFast(currentSession.user.id, currentSession.access_token);
        } else if (!currentSession) {
          updateSubscriptionStatus(null);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!mounted) return;

      // If there's a session error or invalid session, clear everything
      if (error) {
        console.log('[Auth] Session error:', error.message);
        setSession(null);
        setUser(null);
        updateSubscriptionStatus(null);
        clearSupabaseAuthStorage();
        setLoading(false);
        return;
      }

      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);

      // Load subscription: DB cache first, then RevenueCat refresh
      if (initialSession?.user) {
        loadSubscriptionFast(initialSession.user.id, initialSession.access_token);
      }
    }).catch((err) => {
      if (!mounted) return;
      console.error('[Auth] Failed to check initial session:', err);
      setLoading(false);
    });

    // Re-check subscription when app returns to foreground (e.g. after Store purchase)
    const handleVisibilityChange = () => {
      const currentSession = sessionRef.current;
      if (document.visibilityState === 'visible' && currentSession?.user) {
        supabase.auth.refreshSession().then(({ data: { session: refreshedSession }, error }) => {
          if (error || !refreshedSession) {
            console.log('[Auth] Session refresh failed on visibility change');
            return;
          }

          void syncStoreSubscriptionIfNeeded(refreshedSession.access_token).finally(() => {
            supabase.functions.invoke('check-subscription', {
              headers: {
                Authorization: `Bearer ${refreshedSession.access_token}`,
              },
            }).then(({ data, error }) => {
              if (!error && mounted) {
                updateSubscriptionStatus(data);
              }
            }).catch((err) => {
              console.warn('[Auth] Subscription check on visibility change failed:', err);
            });
          });
        }).catch((err) => {
          console.warn('[Auth] Session refresh on visibility change failed:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    options?: { emailRedirectTo?: string; silent?: boolean }
  ) => {
    const silent = options?.silent === true;
    const normalizedEmail = email.trim().toLowerCase();

    const signInAfterSignup = async () => {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError) return { session: null, error: signInError };
      return { session: data.session, error: null };
    };

    const finishWithSession = async () => {
      const tr = getTranslations(getStoredLanguage());
      const { session, error: signInError } = await signInAfterSignup();
      if (session) {
        if (!silent) {
          toast({
            title: tr.onboardingSuccessfullyRegistered,
            description: tr.onboardingProgressSavedMsg,
          });
        }
        return { error: null };
      }
      if (!silent && signInError) {
        toast({
          title: tr.onboardingRegistrationFailed,
          description: signInError.message,
          variant: "destructive",
        });
      }
      return { error: signInError };
    };

    const alreadyRegisteredError = () => {
      const lang = getStoredLanguage();
      return {
        error: {
          message:
            resolveAuthErrorMessage({ message: "already registered" }, lang, "signup")
              ?.message ?? "You already registered with this email. Please sign in.",
        },
      };
    };

    const registered = await registerUserWithoutEmailConfirm(normalizedEmail, password);
    if (registered.alreadyRegistered || (registered.ok && registered.existing)) {
      return alreadyRegisteredError();
    }

    if (registered.ok) {
      return finishWithSession();
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      if (isUserAlreadyRegistered(error)) {
        return alreadyRegisteredError();
      }

      if (isEmailRateLimited(error)) {
        const rateResult = await finishWithSession();
        if (!rateResult.error) return rateResult;
        return { error: rateResult.error };
      }

      if (!silent && !isUserAlreadyRegistered(error)) {
        const tr = getTranslations(getStoredLanguage());
        toast({
          title: tr.onboardingRegistrationFailed,
          description: getPublicErrorMessage(registered.error || error.message, tr.onboardingRegistrationFailed),
          variant: "destructive",
        });
      }
      return { error: { message: registered.error || error.message } };
    }

    if (isSignupExistingUserNoIdentities(data.user)) {
      return alreadyRegisteredError();
    }

    if (data.session) {
      if (!silent) {
        const tr = getTranslations(getStoredLanguage());
        toast({
          title: tr.onboardingSuccessfullyRegistered,
          description: tr.onboardingProgressSavedMsg,
        });
      }
      return { error: null };
    }

    return finishWithSession();
  };

  const signIn = async (
    email: string,
    password: string,
    options?: { silent?: boolean },
  ) => {
    const silent = options?.silent === true;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) {
      setSession(data.session);
      setUser(data.session.user);
      setLoading(false);
      if (data.session.user && data.session.access_token) {
        loadSubscriptionFast(data.session.user.id, data.session.access_token);
      }
    }

    if (error && !silent && !isEmailNotConfirmed(error)) {
      toast({
        title: "Login fehlgeschlagen",
        description: getPublicErrorMessage(error, "Dein Login konnte gerade nicht abgeschlossen werden. Bitte versuche es erneut."),
        variant: "destructive",
      });
    }

    return { error, session: data.session ?? null };
  };

  const signInWithGoogle = async (options?: {
    redirectPath?: string;
    authQuery?: Record<string, string>;
  }) => {
    const { error } = await signInWithOAuthProvider("google", options);

    if (error) {
      toast({
        title: "Google-Anmeldung fehlgeschlagen",
        description: getPublicErrorMessage(error, "Die Google-Anmeldung konnte gerade nicht abgeschlossen werden. Bitte versuche es erneut."),
        variant: "destructive",
      });
    }

    return { error };
  };

  const signInWithApple = async (options?: { authQuery?: Record<string, string> }) => {
    const { error } = await nativeAppleSignIn(options);

    if (error) {
      toast({
        title: "Apple-Anmeldung fehlgeschlagen",
        description: getPublicErrorMessage(error, "Die Apple-Anmeldung konnte gerade nicht abgeschlossen werden. Bitte versuche es erneut."),
        variant: "destructive",
      });
    }

    return { error };
  };

  const linkAppleAccount = async () => {
    const { error } = await linkAppleIdentity();
    if (error) {
      toast({
        title: "Verknüpfung fehlgeschlagen",
        description: getPublicErrorMessage(error, "Apple konnte nicht mit deinem Konto verknüpft werden."),
        variant: "destructive",
      });
    }
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear local state first to ensure UI updates
      setSession(null);
      setUser(null);
      updateSubscriptionStatus(null); // Also clears cache
      
      // Then attempt server-side signout (may fail if session already invalid)
      await supabase.auth.signOut();
    } catch (error) {
      console.log('[Auth] Sign out error (session may already be invalid):', error);
    }
    
    // Clear any cached auth data from localStorage
    clearSupabaseAuthStorage();
    
    toast({
      title: "Erfolgreich abgemeldet",
    });
  };

  const isPremium = isSubscriptionActive(subscriptionStatus);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        subscriptionStatus,
        loading,
        isPremium,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        linkAppleAccount,
        signOut,
        checkSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
