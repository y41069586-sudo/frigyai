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
      {/* Subtle background - hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-primary/20 safe-top">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold neon-text">Healthy3</h1>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {subscriptionStatus?.subscribed && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="px-2 sm:px-3 bg-primary/20 rounded-full border border-primary/50">
                        <Crown className="h-4 w-4 text-primary" />
                        <span className="hidden sm:inline text-sm text-primary ml-1">Premium</span>
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

      <div className="relative z-10 container mx-auto px-4 py-6 safe-bottom">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Hero Section - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Leichter <span className="text-neon">Abnehmen</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              3-Zutaten Rezepte • Unter 500 kcal • Unter 15 Min
            </p>
          </motion.div>

          {/* Main Scan Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/scan")}
              className="w-full glow-button gradient-neon text-black font-semibold text-lg py-6 rounded-2xl"
            >
              <Camera className="mr-2 h-6 w-6" />
              Kühlschrank scannen
            </Button>
          </motion.div>

          {/* Dashboard Grid */}
          {user && subscriptionStatus?.subscribed ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Dein Dashboard</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${trackerSetup ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {trackerSetup ? '✓ Aktiv' : 'Setup nötig'}
                </span>
              </div>

              {/* Primary Card - Tracker */}
              <NavLink to="/meal-plans">
                <div className={`p-4 rounded-2xl border-2 transition-all ${
                  trackerSetup 
                    ? "bg-primary/10 border-primary/50 hover:border-primary" 
                    : "bg-card border-primary/30 hover:border-primary animate-pulse"
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${trackerSetup ? "bg-primary/20" : "bg-primary/10"}`}>
                      <Target className={`h-7 w-7 ${trackerSetup ? "text-primary" : "text-primary/70"}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-base">
                        {trackerSetup ? "Kalorienziel aktiv" : "Tracker einrichten"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {trackerSetup ? "Tippe um deinen Fortschritt zu sehen" : "Lege dein Abnehmziel fest"}
                      </p>
                    </div>
                    <Button size="sm" variant={trackerSetup ? "outline" : "default"} className={!trackerSetup ? "glow-button" : ""}>
                      {trackerSetup ? "Öffnen" : "Start"}
                    </Button>
                  </div>
                </div>
              </NavLink>

              {/* Feature Grid - 2x2 */}
              <div className="grid grid-cols-2 gap-3">
                {/* Wochenplan */}
                <NavLink to={trackerSetup ? "/meal-plans?tab=meals" : "#"}>
                  <div className={`p-4 rounded-xl border h-full transition-all ${
                    trackerSetup 
                      ? "bg-card hover:border-primary/50 cursor-pointer" 
                      : "bg-muted/30 opacity-50 cursor-not-allowed"
                  }`}>
                    <div className={`p-2 rounded-lg w-fit mb-2 ${trackerSetup ? "bg-orange-500/20" : "bg-muted"}`}>
                      {trackerSetup ? <Calendar className="h-5 w-5 text-orange-400" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <h4 className="font-semibold text-sm">Wochenplan</h4>
                    <p className="text-[11px] text-muted-foreground">7 Tage Meal Plan</p>
                  </div>
                </NavLink>

                {/* Einkaufsliste */}
                <NavLink to={trackerSetup ? "/meal-plans?tab=shopping" : "#"}>
                  <div className={`p-4 rounded-xl border h-full transition-all ${
                    trackerSetup 
                      ? "bg-card hover:border-primary/50 cursor-pointer" 
                      : "bg-muted/30 opacity-50 cursor-not-allowed"
                  }`}>
                    <div className={`p-2 rounded-lg w-fit mb-2 ${trackerSetup ? "bg-green-500/20" : "bg-muted"}`}>
                      {trackerSetup ? <ShoppingCart className="h-5 w-5 text-green-400" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <h4 className="font-semibold text-sm">Einkaufsliste</h4>
                    <p className="text-[11px] text-muted-foreground">Automatisch erstellt</p>
                  </div>
                </NavLink>

                {/* Wasser Tracker */}
                <NavLink to={trackerSetup ? "/meal-plans?tab=water" : "#"}>
                  <div className={`p-4 rounded-xl border h-full transition-all ${
                    trackerSetup 
                      ? "bg-card hover:border-primary/50 cursor-pointer" 
                      : "bg-muted/30 opacity-50 cursor-not-allowed"
                  }`}>
                    <div className={`p-2 rounded-lg w-fit mb-2 ${trackerSetup ? "bg-cyan-500/20" : "bg-muted"}`}>
                      {trackerSetup ? <Droplets className="h-5 w-5 text-cyan-400" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <h4 className="font-semibold text-sm">Wasser</h4>
                    <p className="text-[11px] text-muted-foreground">Trinke genug</p>
                  </div>
                </NavLink>

                {/* Fortschritt */}
                <NavLink to={trackerSetup ? "/meal-plans?tab=progress" : "#"}>
                  <div className={`p-4 rounded-xl border h-full transition-all ${
                    trackerSetup 
                      ? "bg-card hover:border-primary/50 cursor-pointer" 
                      : "bg-muted/30 opacity-50 cursor-not-allowed"
                  }`}>
                    <div className={`p-2 rounded-lg w-fit mb-2 ${trackerSetup ? "bg-purple-500/20" : "bg-muted"}`}>
                      {trackerSetup ? <TrendingDown className="h-5 w-5 text-purple-400" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <h4 className="font-semibold text-sm">Fortschritt</h4>
                    <p className="text-[11px] text-muted-foreground">Gewichtsverlauf</p>
                  </div>
                </NavLink>
              </div>
            </motion.div>
          ) : user && !subscriptionStatus?.subscribed ? (
            /* Premium Upsell */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
          ) : (
            /* Not logged in - show features */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🥗", title: "3 Zutaten", desc: "Einfach" },
                  { icon: "🔥", title: "< 500 kcal", desc: "Abnehmen" },
                  { icon: "⏱️", title: "< 15 Min", desc: "Schnell" },
                ].map((f, i) => (
                  <div key={i} className="p-3 rounded-xl bg-card border border-border/50 text-center">
                    <span className="text-2xl">{f.icon}</span>
                    <h4 className="font-semibold text-sm mt-1">{f.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
              
              <NavLink to="/auth">
                <div className="p-4 bg-card rounded-xl border border-border/50 text-center hover:border-primary/50 transition-all">
                  <p className="text-sm text-muted-foreground mb-2">Anmelden für alle Features</p>
                  <Button className="glow-button">Jetzt starten</Button>
                </div>
              </NavLink>
            </motion.div>
          )}

          {/* Favorites Quick Access */}
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <NavLink to="/favorites">
                <div className="p-3 rounded-xl bg-card/50 border border-border/30 flex items-center justify-between hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-red-400" />
                    <span className="text-sm">Meine Favoriten</span>
                  </div>
                  <span className="text-xs text-muted-foreground">→</span>
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
