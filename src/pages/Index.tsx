import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Heart, LogOut, Crown, Calendar, Target, ShoppingCart, Lock, Settings, XCircle, Droplets, TrendingDown } from "lucide-react";
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
    // Check if tracker is set up
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
        // Try to open in new tab, fallback to same window
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow) {
          // Popup blocked, use redirect
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
      {/* Animated background elements - hidden on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20 safe-top">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold neon-text">Healthy3</h1>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {user ? (
              <>
                {subscriptionStatus?.subscribed && (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center px-2 sm:px-3 py-1 bg-primary/20 rounded-full border border-primary/50 hover:bg-primary/30">
                          <Crown className="h-4 w-4 text-primary" />
                          <span className="hidden sm:inline text-sm font-medium text-primary ml-1">Premium</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="end">
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start touch-target"
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Abo verwalten
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 touch-target"
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Abo kündigen
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <NavLink to="/meal-plans">
                      <Button variant="ghost" size="sm" className="hover:bg-primary/20 px-2 sm:px-3 touch-target">
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Meal Plans</span>
                      </Button>
                    </NavLink>
                  </>
                )}
                <NavLink to="/favorites">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/20 touch-target">
                    <Heart className="h-5 w-5" />
                  </Button>
                </NavLink>
                <Button variant="ghost" size="icon" onClick={signOut} className="hover:bg-primary/20 touch-target">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <NavLink to="/auth">
                <Button className="glow-button" size="sm">
                  Anmelden
                </Button>
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-6 sm:py-8 safe-bottom">
        <div className="max-w-6xl mx-auto">
          
          {/* Hero Animation - smaller on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-12"
          >
            <HeroAnimation />
          </motion.div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-6 sm:mb-10"
          >
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4 leading-tight">
              Leichter <span className="text-neon">Abnehmen</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto px-2">
              Kühlschrank scannen • Tracker einstellen • Abnehm-Rezepte genießen
            </p>
          </motion.div>

          {/* Main Action - Tracker First */}
          {user && subscriptionStatus?.subscribed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-8"
            >
              <NavLink to="/meal-plans">
                <div className={`p-4 sm:p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                  trackerSetup 
                    ? "bg-primary/20 border-primary shadow-neon" 
                    : "bg-card border-primary/50 hover:border-primary"
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${trackerSetup ? "bg-primary/30" : "bg-muted"}`}>
                        <Target className={`h-6 w-6 sm:h-8 sm:w-8 ${trackerSetup ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-xl font-bold truncate">
                          {trackerSetup ? "Tracker eingerichtet ✓" : "1. Tracker einrichten"}
                        </h3>
                        <p className="text-muted-foreground text-xs sm:text-sm truncate">
                          {trackerSetup 
                            ? "Dein Kalorienziel ist aktiv" 
                            : "Starte hier um dein Ziel festzulegen"}
                        </p>
                      </div>
                    </div>
                    <Button className={`shrink-0 ${trackerSetup ? "glow-button" : ""}`} size="sm">
                      {trackerSetup ? "Öffnen" : "Start"}
                    </Button>
                  </div>
                </div>
              </NavLink>

              {/* Connected Features - Grid Layout */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* Wasser Tracker - Größer */}
                <NavLink to={trackerSetup ? "/meal-plans?tab=water" : "#"} className="col-span-2 sm:col-span-1">
                  <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
                    trackerSetup 
                      ? "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 hover:border-cyan-500/50 cursor-pointer" 
                      : "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${trackerSetup ? "bg-cyan-500/20" : "bg-muted"}`}>
                        {trackerSetup ? (
                          <Droplets className="h-6 w-6 text-cyan-400" />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-base">Wasser Tracker</h4>
                        <p className="text-xs text-muted-foreground">
                          {trackerSetup ? "Trinke genug!" : "Tracker zuerst einrichten"}
                        </p>
                      </div>
                    </div>
                  </div>
                </NavLink>

                {/* Stats - Größer */}
                <NavLink to={trackerSetup ? "/meal-plans?tab=progress" : "#"} className="col-span-2 sm:col-span-1">
                  <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
                    trackerSetup 
                      ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50 cursor-pointer" 
                      : "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${trackerSetup ? "bg-purple-500/20" : "bg-muted"}`}>
                        {trackerSetup ? (
                          <TrendingDown className="h-6 w-6 text-purple-400" />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-base">Fortschritt</h4>
                        <p className="text-xs text-muted-foreground">
                          {trackerSetup ? "Dein Gewichtsverlauf" : "Tracker zuerst einrichten"}
                        </p>
                      </div>
                    </div>
                  </div>
                </NavLink>

                {/* Wochenplan - Kleiner */}
                <NavLink to={trackerSetup ? "/meal-plans?tab=meals" : "#"}>
                  <div className={`p-3 rounded-xl border transition-all ${
                    trackerSetup 
                      ? "bg-card border-border/50 hover:border-primary/50 cursor-pointer" 
                      : "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${trackerSetup ? "bg-primary/20" : "bg-muted"}`}>
                        {trackerSetup ? (
                          <Calendar className="h-4 w-4 text-primary" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Wochenplan</h4>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {trackerSetup ? "Meal Plan" : "Gesperrt"}
                        </p>
                      </div>
                    </div>
                  </div>
                </NavLink>

                {/* Einkaufsliste - Kleiner */}
                <NavLink to={trackerSetup ? "/meal-plans?tab=shopping" : "#"}>
                  <div className={`p-3 rounded-xl border transition-all ${
                    trackerSetup 
                      ? "bg-card border-border/50 hover:border-primary/50 cursor-pointer" 
                      : "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${trackerSetup ? "bg-primary/20" : "bg-muted"}`}>
                        {trackerSetup ? (
                          <ShoppingCart className="h-4 w-4 text-primary" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Einkaufsliste</h4>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {trackerSetup ? "Automatisch" : "Gesperrt"}
                        </p>
                      </div>
                    </div>
                  </div>
                </NavLink>
              </div>
            </motion.div>
          )}

          {/* Scan CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center mb-8 sm:mb-12 px-2"
          >
            <Button
              size="lg"
              onClick={() => navigate("/scan")}
              className="glow-button pulse-glow gradient-neon text-black font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-2xl group w-full sm:w-auto max-w-sm touch-target"
            >
              <Camera className="mr-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
              Kühlschrank scannen
            </Button>
          </motion.div>

          {/* Premium upsell for non-premium users */}
          {user && !subscriptionStatus?.subscribed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-12"
            >
              <NavLink to="/premium">
                <div className="p-6 bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-lg rounded-2xl border border-primary/30 hover:shadow-neon transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Crown className="h-5 w-5 text-primary animate-pulse" />
                        <h3 className="text-xl font-bold neon-text">Premium freischalten</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Tracker • Wochenpläne • Einkaufslisten
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">4,99€</p>
                      <p className="text-xs text-muted-foreground">/Monat</p>
                    </div>
                  </div>
                </div>
              </NavLink>
            </motion.div>
          )}

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Nur 3 Zutaten",
                description: "Ultra-einfache Rezepte",
              },
              {
                title: "Unter 500 kcal",
                description: "Perfekt zum Abnehmen",
              },
              {
                title: "Unter 15 Min",
                description: "Schnell & gesund",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 + index * 0.1 }}
                className="text-center p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all"
              >
                <h3 className="text-lg font-semibold mb-1 text-neon">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
