import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSubscription = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setSubscriptionStatus(data);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        // Check subscription on sign in
        if (currentSession?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            if (mounted && currentSession) {
              supabase.functions.invoke('check-subscription', {
                headers: {
                  Authorization: `Bearer ${currentSession.access_token}`,
                },
              }).then(({ data, error }) => {
                if (!error && mounted) {
                  setSubscriptionStatus(data);
                }
              });
            }
          }, 100);
        } else if (!currentSession) {
          setSubscriptionStatus(null);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
      
      if (initialSession?.user) {
        setTimeout(() => {
          if (mounted && initialSession) {
            supabase.functions.invoke('check-subscription', {
              headers: {
                Authorization: `Bearer ${initialSession.access_token}`,
              },
            }).then(({ data, error }) => {
              if (!error && mounted) {
                setSubscriptionStatus(data);
              }
            });
          }
        }, 100);
      }
    });

    // Re-check subscription when window regains focus (e.g., returning from Stripe)
    const handleVisibilityChange = () => {
      const currentSession = sessionRef.current;
      if (document.visibilityState === 'visible' && currentSession?.user) {
        supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        }).then(({ data, error }) => {
          if (!error && mounted) {
            setSubscriptionStatus(data);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
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
    } else {
      toast({
        title: "Registrierung erfolgreich!",
        description: "Bitte bestätige deine E-Mail-Adresse.",
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscriptionStatus(null);
    toast({
      title: "Erfolgreich abgemeldet",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        subscriptionStatus,
        loading,
        signUp,
        signIn,
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