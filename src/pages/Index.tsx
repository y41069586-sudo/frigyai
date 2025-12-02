import { motion } from "framer-motion";
import { Camera, List, Heart, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";

const Index = () => {
  const { user, subscriptionStatus, signOut } = useAuth();
  const navigate = useNavigate();

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
                  <NavLink to="/meal-plans">
                    <Button variant="ghost" size="sm" className="hover:bg-primary/20">
                      <Sparkles className="h-4 w-4 mr-2 text-primary" />
                      Premium
                    </Button>
                  </NavLink>
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

      <div className="relative z-10 container mx-auto px-4 py-12">

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Ultra-Einfache
              <br />
              <span className="text-neon">3-Zutaten</span>
              <br />
              Abnehm-Rezepte
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Scanne deinen Kühlschrank oder gib Zutaten ein – erhalte sofort gesunde,
              kalorienarme Rezepte in Sekunden.
            </p>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16 rounded-3xl overflow-hidden shadow-2xl"
          >
            <img
              src={heroImage}
              alt="Fresh healthy ingredients"
              className="w-full h-auto"
            />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col md:flex-row gap-6 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={() => navigate("/scan")}
              className="glow-button pulse-glow gradient-neon text-black font-semibold text-lg px-8 py-6 rounded-2xl w-full md:w-auto group"
            >
              <Camera className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
              Kühlschrank scannen
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/manual")}
              className="text-lg px-8 py-6 rounded-2xl border-2 border-primary hover:bg-primary/10 w-full md:w-auto group"
            >
              <List className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
              Zutaten eingeben
            </Button>
          </motion.div>

          {!subscriptionStatus?.subscribed && user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-12"
            >
              <NavLink to="/premium">
                <div className="p-8 bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-lg rounded-3xl border border-primary/30 hover:shadow-neon transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                        <h3 className="text-2xl font-bold neon-text">Premium freischalten</h3>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Wöchentliche Meal Plans • Einkaufslisten • Makro-Tracking
                      </p>
                      <p className="text-3xl font-bold text-primary">Nur 4,99€/Monat</p>
                    </div>
                    <Button className="glow-button" size="lg">
                      Mehr erfahren
                    </Button>
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
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Nur 3 Zutaten",
                description: "Ultra-einfache Rezepte mit maximal 3-4 Zutaten",
              },
              {
                title: "Unter 500 Kalorien",
                description: "Perfekt für deine Abnehm-Ziele",
              },
              {
                title: "Unter 15 Minuten",
                description: "Schnell, einfach und gesund",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 + index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all"
              >
                <h3 className="text-xl font-semibold mb-2 text-neon">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
