import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Camera, Utensils, TrendingDown } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Mini fridge animation component for onboarding
const MiniFridge = ({ scanning = false }: { scanning?: boolean }) => (
  <div className="relative w-32 h-44">
    {/* Fridge Interior */}
    <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-100 rounded-xl shadow-inner overflow-hidden">
      <div className="absolute left-0 right-0 top-[25%] h-[2px] bg-slate-300" />
      <div className="absolute left-0 right-0 top-[50%] h-[2px] bg-slate-300" />
      <div className="absolute left-0 right-0 top-[75%] h-[2px] bg-slate-300" />
      
      {/* Food Items */}
      <div className="absolute top-[5%] left-[10%] w-6 h-10 bg-white border border-slate-200 rounded-sm">
        <div className="w-full h-2 bg-blue-400 rounded-t-sm" />
      </div>
      <div className="absolute top-[6%] left-[45%] w-5 h-8 bg-orange-400 rounded-sm">
        <div className="w-full h-1.5 bg-orange-600 rounded-t-sm" />
      </div>
      <div className="absolute top-[8%] right-[12%] w-5 h-5 bg-red-500 rounded-full" />
      <div className="absolute top-[30%] left-[10%] w-3 h-8 bg-gradient-to-b from-orange-400 to-orange-500 rounded-b-full" />
      <div className="absolute top-[32%] left-[35%] w-5 h-5 bg-gradient-to-br from-red-400 to-red-600 rounded-full" />
      <div className="absolute top-[30%] right-[15%] w-5 h-6 bg-gradient-to-b from-green-600 to-green-800 rounded-full" />
      <div className="absolute top-[55%] left-[10%] w-10 h-6 bg-primary/20 rounded border border-primary/40" />
      <div className="absolute top-[56%] right-[15%] w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full" />
    </div>

    {/* Scan effect inside fridge */}
    {scanning && (
      <>
        {/* Glowing border */}
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-[#90EE90] pointer-events-none"
          style={{ boxShadow: '0 0 20px rgba(144,238,144,0.6), 0 0 40px rgba(144,238,144,0.3)' }}
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(144,238,144,0.6), 0 0 40px rgba(144,238,144,0.3)',
              '0 0 30px rgba(144,238,144,0.9), 0 0 60px rgba(144,238,144,0.5)',
              '0 0 20px rgba(144,238,144,0.6), 0 0 40px rgba(144,238,144,0.3)'
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Scan beam - gradient beam effect */}
        <motion.div
          className="absolute left-0 right-0 h-12 pointer-events-none"
          style={{ 
            background: 'linear-gradient(to bottom, transparent 0%, rgba(144,238,144,0.3) 20%, rgba(144,238,144,0.8) 50%, rgba(144,238,144,0.3) 80%, transparent 100%)',
            boxShadow: '0 0 30px rgba(144,238,144,0.6)'
          }}
          animate={{ top: ['0%', '75%', '0%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Bright center line */}
          <div 
            className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-[#90EE90]"
            style={{ boxShadow: '0 0 15px rgba(144,238,144,1), 0 0 30px rgba(144,238,144,0.8)' }}
          />
        </motion.div>
      </>
    )}

    {/* Fridge Door (open) */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 rounded-xl border-2 border-slate-300 shadow-xl origin-right"
      style={{ rotateY: 110, transformStyle: 'preserve-3d' }}
    >
      <div className="absolute left-2 top-[45%] w-1.5 h-8 bg-slate-400 rounded-full" />
      <div className="absolute left-0 right-0 top-[25%] h-[2px] bg-slate-300" />
    </motion.div>
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
                    className="absolute -bottom-3 -right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Camera className="w-6 h-6 text-primary-foreground" />
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
