import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Camera, Utensils, TrendingDown } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Mini fridge animation component for onboarding - Neon white style
const MiniFridge = ({ scanning = false }: { scanning?: boolean }) => (
  <div className="relative w-32 h-44">
    {/* Neon white fridge outline */}
    <div className="absolute inset-0 border-2 border-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.6),0_0_40px_rgba(255,255,255,0.3)]">
      {/* Freezer compartment line */}
      <div className="absolute left-3 right-3 top-[30%] h-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      
      {/* Freezer handle */}
      <div className="absolute right-4 top-[14%] w-1.5 h-5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      
      {/* Main handle */}
      <div className="absolute right-4 top-[50%] w-1.5 h-8 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      
      {/* Inner glow */}
      <div className="absolute inset-2 rounded-lg bg-white/5" />
    </div>

    {/* Scan effect with rounded corners */}
    {scanning && (
      <motion.div className="absolute inset-0 pointer-events-none">
        {/* Corner brackets - neon white */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-2xl shadow-[0_0_15px_rgba(255,255,255,0.9)]" style={{ borderWidth: '3px' }} />
        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-2xl shadow-[0_0_15px_rgba(255,255,255,0.9)]" style={{ borderWidth: '3px' }} />
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-2xl shadow-[0_0_15px_rgba(255,255,255,0.9)]" style={{ borderWidth: '3px' }} />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-2xl shadow-[0_0_15px_rgba(255,255,255,0.9)]" style={{ borderWidth: '3px' }} />
        
        {/* Scan line - neon white */}
        <motion.div
          className="absolute -left-1 -right-1 h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_20px_rgba(255,255,255,1)]"
          animate={{ top: ['0%', '95%', '0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Subtle overlay glow */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-white/10"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>
    )}
  </div>
);

const slides = [
  {
    type: "visual" as const,
    title: "Was essen?",
    subtitle: "Keine Idee beim Kühlschrank?",
  },
  {
    type: "scan" as const,
    title: "Scannen",
    subtitle: "Foto vom Kühlschrank machen",
  },
  {
    type: "recipes" as const,
    title: "Fertig!",
    subtitle: "Kalorienarme Rezepte erhalten",
  },
];

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-background p-6 safe-area-inset"
    >
      {/* Skip Button */}
      <div className="w-full flex justify-end pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          Überspringen
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            {/* Visual Content */}
            <motion.div
              className="mb-8"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              {slide.type === "visual" && (
                <div className="relative">
                  <MiniFridge />
                  <motion.div
                    className="absolute -top-4 -right-4 text-4xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🤔
                  </motion.div>
                </div>
              )}
              {slide.type === "scan" && (
                <div className="relative">
                  <MiniFridge scanning />
                  <motion.div
                    className="absolute -top-2 -right-8 w-12 h-16 bg-card border-2 border-primary rounded-lg flex items-center justify-center shadow-lg"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Camera className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
              )}
              {slide.type === "recipes" && (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-3 p-3 bg-card border-2 border-primary/50 rounded-xl shadow-lg"
                    >
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold">Rezept {i}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-primary font-bold">{280 + i * 50} kcal</span>
                          <span>•</span>
                          <span>3 Zutaten</span>
                        </div>
                      </div>
                      <TrendingDown className="w-4 h-4 text-primary ml-auto" />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-3xl font-bold text-foreground mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {slide.subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Section */}
      <div className="w-full max-w-sm space-y-6 pb-4">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : index < currentSlide
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted"
              }`}
              initial={false}
              animate={{
                scale: index === currentSlide ? 1 : 0.8,
              }}
            />
          ))}
        </div>

        {/* Next Button */}
        <Button
          onClick={handleNext}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg shadow-primary/25"
        >
          {currentSlide < slides.length - 1 ? (
            <>
              Weiter
              <ChevronRight className="ml-2 w-5 h-5" />
            </>
          ) : (
            "Los geht's!"
          )}
        </Button>
      </div>
    </motion.div>
  );
};
