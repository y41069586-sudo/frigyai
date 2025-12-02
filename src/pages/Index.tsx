import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, List, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
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

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-16"
        >
          <h1 className="text-3xl font-bold tracking-tight">
            Healthy<span className="text-neon">3</span>
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/favorites")}
            className="hover:bg-primary/10"
          >
            <Heart className="h-5 w-5" />
          </Button>
        </motion.div>

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

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
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
                transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
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
