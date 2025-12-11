import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Leaf, Target, Utensils, TrendingDown, ChevronRight } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Leaf,
    title: "Willkommen bei Healthy3",
    description: "Dein persönlicher Begleiter für eine gesündere Ernährung und nachhaltiges Abnehmen.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Target,
    title: "Deine Ziele im Fokus",
    description: "Setze realistische Ziele und verfolge deinen Fortschritt mit personalisierten Kalorien- und Makro-Zielen.",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    icon: Utensils,
    title: "Smarte Rezepte",
    description: "Scanne deinen Kühlschrank und erhalte leckere, kalorienarme Rezepte mit nur 3-4 Zutaten.",
    gradient: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    icon: TrendingDown,
    title: "Sichtbare Erfolge",
    description: "Tracke dein Gewicht, Wasser und Mahlzeiten – und sieh wie du Woche für Woche Fortschritte machst.",
    gradient: "from-violet-500/20 to-violet-500/5",
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
  const Icon = slide.icon;

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
            {/* Icon with Gradient Background */}
            <motion.div
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-8`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <Icon className="w-16 h-16 text-primary" strokeWidth={1.5} />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-2xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {slide.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-muted-foreground text-base leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {slide.description}
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
