import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, Camera, Flame, Droplets, TrendingDown, 
  Users, Share2, Apple, Activity, ChevronRight, Star,
  Check, Zap, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import frigLogo from '@/assets/frig-logo.png';

export const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Camera,
      title: "Kühlschrank scannen",
      description: "Fotografiere deinen Kühlschrank und erhalte sofort passende Rezepte."
    },
    {
      icon: Flame,
      title: "Kalorien-Tracking",
      description: "Verfolge deine Kalorien und Makros automatisch mit KI-Analyse."
    },
    {
      icon: TrendingDown,
      title: "Gewichtsverlust",
      description: "Personalisierte Pläne für nachhaltiges Abnehmen."
    },
    {
      icon: Droplets,
      title: "Wasser-Tracker",
      description: "Bleib hydratisiert mit täglichen Erinnerungen."
    },
    {
      icon: Users,
      title: "Community",
      description: "Teile Rezepte und verbinde dich mit anderen."
    },
    {
      icon: Activity,
      title: "Health-Sync",
      description: "Synchronisiere mit Apple Health & Google Fit."
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      text: "Endlich eine App, die versteht was ich im Kühlschrank habe!",
      rating: 5
    },
    {
      name: "Thomas K.",
      text: "12kg in 3 Monaten abgenommen. Die Meal Plans sind perfekt.",
      rating: 5
    },
    {
      name: "Lisa W.",
      text: "Die Community ist super motivierend!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-50" />
        
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-32">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <img src={frigLogo} alt="FriG AI" className="h-16" />
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Abnehmen war noch nie so einfach
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Scanne deinen Kühlschrank, erhalte personalisierte Rezepte und erreiche dein Wunschgewicht mit KI-Unterstützung.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
              onClick={() => navigate('/auth')}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Kostenlos starten
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              Anmelden
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>

          {/* App Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="relative max-w-sm mx-auto"
          >
            <div className="bg-gradient-to-br from-card to-card/80 rounded-3xl p-6 shadow-2xl border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Kühlschrank gescannt</p>
                  <p className="text-sm text-muted-foreground">3 Rezepte gefunden</p>
                </div>
              </div>
              <div className="space-y-2">
                {["Hähnchen-Salat", "Joghurt-Bowl", "Gemüse-Omelette"].map((recipe, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-background/50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Flame className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{recipe}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{250 + i * 50} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Alles was du brauchst</h2>
            <p className="text-muted-foreground">Eine App für deinen kompletten Abnehm-Erfolg</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow bg-card/50 backdrop-blur border-border/50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Einfache Preise</h2>
            <p className="text-muted-foreground">Starte kostenlos, upgrade wenn du bereit bist</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full bg-card/50 backdrop-blur">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <p className="text-3xl font-bold mb-6">€0<span className="text-sm text-muted-foreground">/Monat</span></p>
                <ul className="space-y-3 mb-8">
                  {["2 Scans pro Tag", "Basis-Rezepte", "Kalorien-Anzeige"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                  Kostenlos starten
                </Button>
              </Card>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  Beliebt
                </div>
                <h3 className="text-xl font-bold mb-2">Premium</h3>
                <p className="text-3xl font-bold mb-6">€4,99<span className="text-sm text-muted-foreground">/Monat</span></p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Unbegrenzte Scans",
                    "KI-Chatbot",
                    "Wöchentliche Meal Plans",
                    "Einkaufslisten",
                    "Makro-Tracking",
                    "Wasser-Tracker",
                    "Community-Zugang",
                    "Health-Sync"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => navigate('/auth')}>
                  <Zap className="mr-2 h-4 w-4" />
                  1 Woche gratis testen
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Was andere sagen</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 bg-card/50 backdrop-blur">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm mb-4">"{testimonial.text}"</p>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Store Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-primary/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Bald im App Store</h2>
            <p className="text-muted-foreground mb-8">Verfügbar für iOS und Android</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" className="gap-2" disabled>
                <Apple className="h-5 w-5" />
                App Store (Bald)
              </Button>
              <Button size="lg" variant="outline" className="gap-2" disabled>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Play Store (Bald)
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Heart className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Bereit für deine Transformation?</h2>
            <p className="text-muted-foreground mb-8">
              Schließe dich tausenden an, die bereits ihr Wunschgewicht erreicht haben.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Jetzt starten
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <img src={frigLogo} alt="FriG AI" className="h-8" />
          <p className="text-sm text-muted-foreground">
            © 2024 FriG AI. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
