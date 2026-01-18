import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Camera, ChefHat, ShoppingCart, Calendar, Crown, ArrowRight, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AnimatedFrigyMascot } from "@/components/AnimatedFrigyMascot";
import frigyMascotSrc from "@/assets/frigy-mascot.png";

const TrialIntroPage = () => {
  const { t } = useLanguage();
  const { user, session, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  // If user already has premium, redirect to home
  useEffect(() => {
    if (subscriptionStatus?.subscribed) {
      navigate('/', { replace: true });
    }
  }, [subscriptionStatus, navigate]);

  // Auto-cycle features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Camera,
      title: "Kühlschrank scannen",
      desc: "Zeig Frigy was du hast",
      gradient: "from-blue-500 to-cyan-400"
    },
    {
      icon: ChefHat,
      title: "KI-Rezepte erhalten",
      desc: "Passend zu deinen Zutaten",
      gradient: "from-orange-500 to-amber-400"
    },
    {
      icon: Calendar,
      title: "Woche automatisch planen",
      desc: "Meal Plans auf Knopfdruck",
      gradient: "from-purple-500 to-pink-400"
    },
    {
      icon: ShoppingCart,
      title: "Smart einkaufen",
      desc: "Automatische Einkaufslisten",
      gradient: "from-emerald-500 to-teal-400"
    }
  ];

  const handleStartTrial = () => {
    navigate('/premium-pricing', { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col bg-background safe-area-inset overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col relative z-10 px-6 pt-8 pb-6">
        {/* Header with mascot */}
        <motion.div 
          className="flex flex-col items-center mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mascot with glow */}
          <div className="relative mb-4">
            <motion.div
              className="absolute inset-0 bg-primary/30 rounded-full blur-2xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.img
              src={frigyMascotSrc}
              alt="Frigy"
              className="w-24 h-24 relative z-10"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            />
          </div>

          {/* Price highlight */}
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Premium 7 Tage kostenlos</span>
          </motion.div>

          <motion.h1 
            className="text-3xl font-bold text-center mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Starte für €0,00
            </span>
          </motion.h1>
          
          <motion.p
            className="text-muted-foreground text-center text-sm max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Teste alle Premium-Features kostenlos – kündige jederzeit.
          </motion.p>
        </motion.div>

        {/* Feature showcase */}
        <motion.div 
          className="flex-1 flex flex-col justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === activeFeature;
              
              return (
                <motion.div
                  key={index}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' 
                      : 'border-border bg-card/50'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => setActiveFeature(index)}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Text */}
                  <h3 className="font-semibold text-sm mb-0.5">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute top-2 right-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Trial info card */}
          <motion.div
            className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">So funktioniert's:</p>
                <p className="text-xs text-muted-foreground">In 3 einfachen Schritten</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {[
                "7 Tage voller Zugang – komplett kostenlos",
                "Erinnerung bevor die Testphase endet",
                "Jederzeit kündbar – kein Risiko"
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs text-foreground/80">{step}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Button
            onClick={handleStartTrial}
            className="w-full h-14 text-base font-semibold rounded-2xl relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Kostenlos starten
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
            />
          </Button>
          
          <p className="text-center text-[10px] text-muted-foreground/60 mt-3">
            Keine versteckten Kosten. Du bezahlst erst nach den 7 Tagen.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TrialIntroPage;
