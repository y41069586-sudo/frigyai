import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Heart, LogOut, Crown, Calendar, Target, Settings, XCircle, Droplets, TrendingDown, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import HeroAnimation from "@/components/HeroAnimation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const { user, session, subscriptionStatus, signOut } = useAuth();
  const [trackerSetup, setTrackerSetup] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const profile = localStorage.getItem("userProfile");
    setTrackerSetup(!!profile);
  }, []);

  const handleManageSubscription = async () => {
    if (!session) {
      toast({ title: 'Nicht angemeldet', variant: 'destructive' });
      return;
    }
    setPortalLoading(true);
    toast({ title: 'Lade Stripe-Portal...', description: 'Bitte warten' });
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) {
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow) {
          window.location.href = data.url;
        }
      }
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20 safe-top">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold neon-text">Healthy3</h1>
          <div className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                {subscriptionStatus?.subscribed && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="bg-primary/20 rounded-full">
                        <Crown className="h-5 w-5 text-primary" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 bg-card" align="end">
                      <Button variant="ghost" className="w-full justify-start" onClick={handleManageSubscription} disabled={portalLoading}>
                        <Settings className="mr-2 h-4 w-4" /> Abo verwalten
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleManageSubscription} disabled={portalLoading}>
                        <XCircle className="mr-2 h-4 w-4" /> Abo kündigen
                      </Button>
                    </PopoverContent>
                  </Popover>
                )}
                <NavLink to="/meal-plans">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/20">
                    <Calendar className="h-5 w-5" />
                  </Button>
                </NavLink>
                <NavLink to="/favorites">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/20">
                    <Heart className="h-5 w-5" />
                  </Button>
                </NavLink>
                <Button variant="ghost" size="icon" onClick={signOut} className="hover:bg-primary/20">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <NavLink to="/auth">
                <Button className="glow-button" size="sm">Anmelden</Button>
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8 safe-bottom">
        <div className="max-w-md mx-auto space-y-6 sm:space-y-8">
          
          {/* Hero Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <HeroAnimation />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-3"
          >
            <h2 className="text-2xl sm:text-4xl font-bold">
              Leichter <span className="text-neon">Abnehmen</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Kühlschrank scannen • Tracker einstellen • Abnehm-Rezepte genießen
            </p>
          </motion.div>

          {/* Tracker Status Card */}
          {user && subscriptionStatus?.subscribed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NavLink to="/meal-plans">
                <div className={`p-4 rounded-2xl border-2 transition-all ${
                  trackerSetup 
                    ? "bg-primary/10 border-primary/50 hover:border-primary" 
                    : "bg-card border-primary/30 hover:border-primary animate-pulse"
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${trackerSetup ? "bg-primary/20" : "bg-primary/10"}`}>
                      <Target className={`h-6 w-6 ${trackerSetup ? "text-primary" : "text-primary/70"}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold flex items-center gap-2">
                        {trackerSetup ? "Tracker eingerichtet" : "Tracker einrichten"}
                        {trackerSetup && <span className="text-primary">✓</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {trackerSetup ? "Dein Kalorienziel ist aktiv" : "Lege dein Abnehmziel fest"}
                      </p>
                    </div>
                    <Button size="sm" className="glow-button">
                      {trackerSetup ? "Öffnen" : "Start"}
                    </Button>
                  </div>
                </div>
              </NavLink>
            </motion.div>
          )}

          {/* Wasser & Stats Cards */}
          {user && subscriptionStatus?.subscribed && trackerSetup && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-3"
            >
              <NavLink to="/meal-plans?tab=water">
                <div className="p-4 rounded-2xl bg-card border border-cyan-500/30 hover:border-cyan-500/60 transition-all h-full">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-xl bg-cyan-500/20">
                      <Droplets className="h-6 w-6 text-cyan-400" />
                    </div>
                    <h4 className="font-bold text-sm">Wasser</h4>
                    <p className="text-xs text-muted-foreground">Trinke genug!</p>
                  </div>
                </div>
              </NavLink>
              <NavLink to="/meal-plans?tab=progress">
                <div className="p-4 rounded-2xl bg-card border border-purple-500/30 hover:border-purple-500/60 transition-all h-full">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-xl bg-purple-500/20">
                      <TrendingDown className="h-6 w-6 text-purple-400" />
                    </div>
                    <h4 className="font-bold text-sm">Stats</h4>
                    <p className="text-xs text-muted-foreground">Dein Fortschritt</p>
                  </div>
                </div>
              </NavLink>
            </motion.div>
          )}

          {/* Wochenplan & Einkaufsliste - small */}
          {user && subscriptionStatus?.subscribed && trackerSetup && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-3"
            >
              <NavLink to="/meal-plans?tab=meals">
                <div className="p-3 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-medium">Wochenplan</span>
                  </div>
                </div>
              </NavLink>
              <NavLink to="/meal-plans?tab=shopping">
                <div className="p-3 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-medium">Einkaufsliste</span>
                  </div>
                </div>
              </NavLink>
            </motion.div>
          )}

          {/* Scan Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/scan")}
              className="w-full glow-button gradient-neon text-black font-semibold text-base sm:text-lg py-5 sm:py-6 rounded-2xl"
            >
              <Camera className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Kühlschrank scannen
            </Button>
          </motion.div>

          {/* Premium Upsell for non-subscribed users */}
          {user && !subscriptionStatus?.subscribed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NavLink to="/premium">
                <div className="p-5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 hover:shadow-neon transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/20">
                      <Crown className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">Premium freischalten</h3>
                      <p className="text-xs text-muted-foreground">Tracker • Wochenpläne • Einkaufslisten</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">4,99€</p>
                      <p className="text-[10px] text-muted-foreground">/Monat</p>
                    </div>
                  </div>
                </div>
              </NavLink>
            </motion.div>
          )}

          {/* Auth CTA for non-logged in users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NavLink to="/auth">
                <div className="p-4 bg-card rounded-xl border border-border/50 text-center hover:border-primary/50 transition-all">
                  <p className="text-sm text-muted-foreground mb-2">Anmelden für alle Features</p>
                  <Button className="glow-button">Jetzt starten</Button>
                </div>
              </NavLink>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Index;
