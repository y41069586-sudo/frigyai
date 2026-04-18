import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  /** True when user is logged in but has no subscription and no active trial */
  isFreeMode: boolean;
  /** True when user has premium access (subscribed or in trial) */
  isPremium: boolean;
  signUp: (
    email: string,
    password: string,
    options?: { emailRedirectTo?: string }
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
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

  const checkSubscription = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      updateSubscriptionStatus(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
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
    options?: { emailRedirectTo?: string }
  ) => {
    // Redirect target for email confirmation flow (used when email confirmation is enabled)
    const defaultRedirectUrl = `${window.location.origin}/email-confirmation?confirmed=true&next=/premium-pricing&from=signup`;
    const redirectUrl = options?.emailRedirectTo ?? defaultRedirectUrl;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user && !data.session) {
      // E-Mail-Bestätigung in Supabase aktiviert: noch kein Login bis zum Link in der E-Mail
      toast({
        title: "Bestätige deine E-Mail",
        description: "Wir haben dir einen Link geschickt. Nach dem Klick wirst du zur App und zur Mitgliedschaft weitergeleitet.",
      });
    } else {
      toast({
        title: "Registrierung erfolgreich!",
        description: "Du kannst jetzt fortfahren.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
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

  // Computed values for free mode and premium access
  const isPremium = subscriptionStatus?.subscribed || user?.email?.toLowerCase() === 'yousef0089mohamed@gmail.com' || false;
  const isFreeMode = !!user && !isPremium;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        subscriptionStatus,
        loading,
        isFreeMode,
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
