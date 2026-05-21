import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { redeemPendingReferralCode } from '@/lib/referralCode';
import { syncAffiliateAttributionToServer } from '@/lib/affiliateSync';
import { applyDeferredReferralOnFirstOpen } from '@/lib/referralAttribution';
import {
  isEmailNotConfirmed,
  isEmailRateLimited,
  isUserAlreadyRegistered,
} from '@/lib/authErrors';
import { registerUserWithoutEmailConfirm } from '@/lib/registerUser';

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
  ) => Promise<{ error: any }>;
  signIn: (
    email: string,
    password: string,
    options?: { silent?: boolean },
  ) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
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

// Fast DB cache load (much faster than Stripe API)
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
      return {
        subscribed: data.subscribed,
        product_id: data.product_id,
        subscription_end: data.subscription_end,
        is_trial: data.is_trial || false
      };
    }
  } catch (e) {
    console.warn('[Auth] Failed to load subscription from DB cache:', e);
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Check if supabase is initialized before any hooks or logic
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Bitte stelle sicher, dass VITE_SUPABASE_URL und VITE_SUPABASE_PUBLISHABLE_KEY in den "Environment Variables" (NICHT Secrets) in den Project Settings eingetragen sind.');
  }

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Load cached subscription immediately for instant UI
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(getCachedSubscription);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const updateSubscriptionStatus = (data: SubscriptionStatus | null) => {
    setSubscriptionStatus(data);
    setCachedSubscription(data);
  };

  // Fast load from DB, then background refresh from Stripe
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
    
    // Step 2: Background refresh from Stripe (don't await)
    supabase.functions.invoke('check-subscription', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(({ data, error }) => {
      if (!error && data) {
        updateSubscriptionStatus(data);
      }
    }).catch((err) => {
      console.warn('[Auth] Background subscription refresh failed:', err);
    });
  };

  const checkSubscription = async (): Promise<SubscriptionStatus | null> => {
    if (!session) return null;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
        
        // Load subscription fast: DB cache first, then Stripe in background
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
        // Clear potentially stale auth token
        localStorage.removeItem('sb-zbvrhyyjlnmeqtjbvtwt-auth-token');
        setLoading(false);
        return;
      }

      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);

      // Load subscription fast: DB cache first, then Stripe in background
      if (initialSession?.user) {
        loadSubscriptionFast(initialSession.user.id, initialSession.access_token);
      }
    }).catch((err) => {
      if (!mounted) return;
      console.error('[Auth] Failed to check initial session:', err);
      setLoading(false);
    });

    // Re-check subscription when window regains focus (e.g., returning from Stripe)
    const handleVisibilityChange = () => {
      const currentSession = sessionRef.current;
      if (document.visibilityState === 'visible' && currentSession?.user) {
        // First refresh the session to ensure it's valid
        supabase.auth.refreshSession().then(({ data: { session: refreshedSession }, error }) => {
          if (error || !refreshedSession) {
            console.log('[Auth] Session refresh failed on visibility change');
            return;
          }

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
      const { session, error: signInError } = await signInAfterSignup();
      if (session) {
        if (!silent) {
          toast({
            title: "Registrierung erfolgreich!",
            description: "Du kannst jetzt fortfahren.",
          });
        }
        return { error: null };
      }
      if (!silent && signInError) {
        toast({
          title: "Registrierung fehlgeschlagen",
          description: signInError.message,
          variant: "destructive",
        });
      }
      return { error: signInError };
    };

    const registered = await registerUserWithoutEmailConfirm(normalizedEmail, password);
    if (registered.ok) {
      return finishWithSession();
    }

    if (registered.alreadyRegistered) {
      const result = await finishWithSession();
      if (!result.error) return result;
      return {
        error: { message: "User already registered" },
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const shouldTrySignIn =
        isUserAlreadyRegistered(error) || isEmailRateLimited(error);

      if (shouldTrySignIn) {
        return finishWithSession();
      }

      if (!silent && !isUserAlreadyRegistered(error)) {
        toast({
          title: "Registrierung fehlgeschlagen",
          description: registered.error || error.message,
          variant: "destructive",
        });
      }
      return { error: { message: registered.error || error.message } };
    }

    if (data.session) {
      if (!silent) {
        toast({
          title: "Registrierung erfolgreich!",
          description: "Du kannst jetzt fortfahren.",
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error && !silent && !isEmailNotConfirmed(error)) {
      toast({
        title: "Login fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Google bestätigt die E-Mail – direkt zur Paywall statt ins leere Dashboard
        redirectTo: `${window.location.origin}/premium-pricing`,
      },
    });

    if (error) {
      toast({
        title: "Google-Anmeldung fehlgeschlagen",
        description: error.message,
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
    localStorage.removeItem('sb-zbvrhyyjlnmeqtjbvtwt-auth-token');
    
    toast({
      title: "Erfolgreich abgemeldet",
    });
  };

  const isPremium = Boolean(subscriptionStatus?.subscribed);

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
