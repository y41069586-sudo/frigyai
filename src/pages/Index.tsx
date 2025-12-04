import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Heart, LogOut, Crown, Calendar, Target, ShoppingCart, Lock, Settings, XCircle } from "lucide-react";
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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold neon-text">Healthy3</h1>
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {subscriptionStatus?.subscribed && (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="flex items-center px-3 py-1 bg-primary/20 rounded-full border border-primary/50 hover:bg-primary/30">
                          <Crown className="h-4 w-4 text-primary mr-1" />
                          <span className="text-sm font-medium text-primary">Premium</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="end">
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Abo verwalten
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
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
                      <Button variant="ghost" size="sm" className="hover:bg-primary/20">
                        <Calendar className="h-4 w-4 mr-2" />
                        Meal Plans
                      </Button>
                    </NavLink>
                  </>
                )}
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
                <Button className="glow-button" size="sm">
                  Anmelden
                </Button>
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Hero Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <HeroAnimation />
          </motion.div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-10"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Leichter <span className="text-neon">Abnehmen</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
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
                <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                  trackerSetup 
                    ? "bg-primary/20 border-primary shadow-neon" 
                    : "bg-card border-primary/50 hover:border-primary"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${trackerSetup ? "bg-primary/30" : "bg-muted"}`}>
                        <Target className={`h-8 w-8 ${trackerSetup ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {trackerSetup ? "Tracker eingerichtet ✓" : "1. Tracker einrichten"}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {trackerSetup 
                            ? "Dein Kalorienziel ist aktiv" 
                            : "Starte hier um dein Kalorienziel festzulegen"}
                        </p>
                      </div>
                    </div>
                    <Button className={trackerSetup ? "glow-button" : ""} size="lg">
                      {trackerSetup ? "Öffnen" : "Jetzt starten"}
                    </Button>
                  </div>
                </div>
              </NavLink>

              {/* Connected Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <NavLink to={trackerSetup ? "/meal-plans" : "#"}>
                  <div className={`p-4 rounded-xl border transition-all ${
                    trackerSetup 
                      ? "bg-card border-border/50 hover:border-primary/50 cursor-pointer" 
                      : "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${trackerSetup ? "bg-primary/20" : "bg-muted"}`}>
                        {trackerSetup ? (
                          <Calendar className="h-5 w-5 text-primary" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">Wochenplan</h4>
                        <p className="text-xs text-muted-foreground">
                          {trackerSetup ? "Generiere deinen Meal Plan" : "Tracker zuerst einrichten"}
                        </p>
                      </div>
                    </div>
                  </div>
                </NavLink>

                <NavLink to={trackerSetup ? "/meal-plans" : "#"}>
                  <div className={`p-4 rounded-xl border transition-all ${
                    trackerSetup 
                      ? "bg-card border-border/50 hover:border-primary/50 cursor-pointer" 
                      : "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${trackerSetup ? "bg-primary/20" : "bg-muted"}`}>
                        {trackerSetup ? (
                          <ShoppingCart className="h-5 w-5 text-primary" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">Einkaufsliste</h4>
                        <p className="text-xs text-muted-foreground">
                          {trackerSetup ? "Automatisch aus Wochenplan" : "Tracker zuerst einrichten"}
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
            className="flex justify-center mb-12"
          >
            <Button
              size="lg"
              onClick={() => navigate("/scan")}
              className="glow-button pulse-glow gradient-neon text-black font-semibold text-lg px-8 py-6 rounded-2xl group"
            >
              <Camera className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
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
