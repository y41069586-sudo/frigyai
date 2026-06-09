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
import { isSubscriptionActive, mergeSubscriptionStatus } from '@/lib/subscription';
import { getPublicErrorMessage } from '@/lib/publicErrorMessage';
import { getStoredLanguage, getTranslations } from '@/contexts/LanguageContext';
import { signInWithOAuthProvider } from '@/lib/authOAuth';
import { linkAppleIdentity, signInWithApple as nativeAppleSignIn } from '@/lib/appleSignIn';
import { syncStoreSubscriptionIfNeeded } from '@/lib/subscriptionRefresh';
import { markEverPremium } from '@/lib/trialEligibility';
import { applyPendingTrialReminderNative, scheduleTrialEndingReminder } from '@/lib/notifications';
import { markKnownAccountEmail } from '@/lib/knownAccountEmail';
import { resumeAuthSession, setSupabaseAutoRefreshEnabled } from '@/lib/sessionResume';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

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
  /** True while re-validating session after app resume (prevents login flash). */
  sessionRestoring: boolean;
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
  signOut: (options?: { silent?: boolean }) => Promise<void>;
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
        const data = parsed.data as SubscriptionStatus;
        return isSubscriptionActive(data) ? data : null;
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(() => {
    const cached = getCachedSubscription();
    return cached && isSubscriptionActive(cached) ? cached : null;
  });
  const [loading, setLoading] = useState(true);
  const [sessionRestoring, setSessionRestoring] = useState(false);
  const { toast } = useToast();
  const subscriptionRef = useRef<SubscriptionStatus | null>(subscriptionStatus);

  useEffect(() => {
    subscriptionRef.current = subscriptionStatus;
  }, [subscriptionStatus]);

  const resolveSubscriptionStatus = async (
    incoming: SubscriptionStatus | null,
    userId: string,
  ): Promise<SubscriptionStatus | null> => {
    const dbCache = await loadFromDbCache(userId);
    return mergeSubscriptionStatus(incoming, subscriptionRef.current, dbCache);
  };

  const updateSubscriptionStatus = (data: SubscriptionStatus | null) => {
    if (
      data &&
      (data.subscribed || data.is_trial || data.product_id || data.subscription_end)
    ) {
      markEverPremium();
    }
    if (data?.is_trial && isSubscriptionActive(data)) {
      void scheduleTrialEndingReminder();
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
        title: "Partner-Code gespeichert",
        description: referral.message,
      });
    }

    // Step 1: Load from DB cache instantly (~50ms) — after referral attribution
    let dbCache = await loadFromDbCache(userId);
    if (dbCache) {
      updateSubscriptionStatus(dbCache);
    }

    const refreshSubscription = async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error || !data) return;
      const merged = await resolveSubscriptionStatus(data as SubscriptionStatus, userId);
      updateSubscriptionStatus(merged);
    };

    void syncStoreSubscriptionIfNeeded(accessToken).finally(() => {
      void refreshSubscription();
    });
  };

  const checkSubscription = async (): Promise<SubscriptionStatus | null> => {
    let accessToken = session?.access_token;
    let userId = user?.id ?? session?.user?.id;
    if (!accessToken) {
      const { data } = await supabase.auth.getSession();
      accessToken = data.session?.access_token;
      userId = userId ?? data.session?.user?.id;
    }
    if (!accessToken) return subscriptionRef.current;

    await Promise.race([
      syncStoreSubscriptionIfNeeded(accessToken),
      new Promise<void>((resolve) => window.setTimeout(resolve, 4000)),
    ]);

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) throw error;
      const incoming = (data ?? null) as SubscriptionStatus | null;
      const merged = userId
        ? await resolveSubscriptionStatus(incoming, userId)
        : mergeSubscriptionStatus(incoming, subscriptionRef.current, null);
      updateSubscriptionStatus(merged);
      return merged;
    } catch (error) {
      console.error('Error checking subscription:', error);
      if (isSubscriptionActive(subscriptionRef.current)) {
        return subscriptionRef.current;
      }
      return null;
    }
  };

  // Use ref to track session for visibility change handler (avoids dependency issues)
  const sessionRef = useRef<Session | null>(null);

  const applySession = (nextSession: Session | null) => {
    if (nextSession?.user?.email) {
      markKnownAccountEmail(nextSession.user.email);
    }
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
  };

  const refreshSessionFromStorage = async (): Promise<Session | null> => {
    return resumeAuthSession(3);
  };
  
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
        
        applySession(currentSession);
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

    // Initial session check — try refresh before clearing stored auth
    void refreshSessionFromStorage().then((initialSession) => {
      if (!mounted) return;
      if (initialSession?.user) {
        applySession(initialSession);
        loadSubscriptionFast(initialSession.user.id, initialSession.access_token);
      } else {
        applySession(null);
        updateSubscriptionStatus(null);
      }
      setLoading(false);
    }).catch((err) => {
      if (!mounted) return;
      console.error('[Auth] Failed to check initial session:', err);
      setLoading(false);
    });

    const resumeSessionCheck = () => {
      setSessionRestoring(true);
      void refreshSessionFromStorage()
        .then((activeSession) => {
          if (!mounted) return;
          if (activeSession?.user) {
            applySession(activeSession);
            loadSubscriptionFast(activeSession.user.id, activeSession.access_token);
            return;
          }
          if (sessionRef.current?.user) {
            return;
          }
          applySession(null);
          updateSubscriptionStatus(null);
        })
        .finally(() => {
          if (mounted) setSessionRestoring(false);
        });
    };

    // Re-check session when app returns to foreground (web + native)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setSupabaseAutoRefreshEnabled(true);
        resumeSessionCheck();
      } else {
        setSupabaseAutoRefreshEnabled(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    setSupabaseAutoRefreshEnabled(document.visibilityState === 'visible');

    let removeAppStateListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      void App.addListener('appStateChange', ({ isActive }) => {
        setSupabaseAutoRefreshEnabled(isActive);
        if (isActive) resumeSessionCheck();
      }).then((handle) => {
        removeAppStateListener = () => {
          void handle.remove();
        };
      });
    }

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      removeAppStateListener?.();
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
    markKnownAccountEmail(email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) {
      applySession(data.session);
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

  const signOut = async (options?: { silent?: boolean }) => {
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
    
    if (!options?.silent) {
      toast({
        title: "Erfolgreich abgemeldet",
      });
    }
  };

  const isPremium = isSubscriptionActive(subscriptionStatus);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        subscriptionStatus,
        loading,
        sessionRestoring,
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
