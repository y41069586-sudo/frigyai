import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Camera, Utensils, TrendingDown, Sparkles } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Animated fridge component with opening door
const AnimatedFridge = ({ isOpen = false, scanning = false }: { isOpen?: boolean; scanning?: boolean }) => {
  return (
    <div className="relative w-36 h-48 perspective-500">
      {/* Fridge Interior - visible when door opens */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-100 to-blue-100 rounded-xl overflow-hidden border-4 border-slate-300">
        {/* Shelves */}
        <div className="absolute left-0 right-0 top-[30%] h-1 bg-slate-300/70" />
        <div className="absolute left-0 right-0 top-[55%] h-1 bg-slate-300/70" />
        <div className="absolute left-0 right-0 top-[80%] h-1 bg-slate-300/70" />
        
        {/* Food Items - Colorful! */}
        {/* Top shelf */}
        <motion.div 
          className="absolute top-[8%] left-[15%] w-6 h-10 bg-white rounded-sm border-2 border-blue-300"
          animate={isOpen ? { scale: [1, 1.1, 1] } : {}}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="w-full h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-t-sm" />
        </motion.div>
        <motion.div 
          className="absolute top-[10%] left-[45%] w-5 h-8 bg-gradient-to-b from-orange-400 to-orange-500 rounded-md"
          animate={isOpen ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ delay: 0.4, duration: 0.4 }}
        />
        <motion.div 
          className="absolute top-[12%] right-[18%] w-6 h-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg"
          animate={isOpen ? { scale: [1, 1.2, 1] } : {}}
          transition={{ delay: 0.5, duration: 0.3 }}
        />
        
        {/* Middle shelf */}
        <motion.div 
          className="absolute top-[35%] left-[12%] w-4 h-9 bg-gradient-to-b from-orange-400 to-orange-600 rounded-b-full"
          animate={isOpen ? { y: [0, -3, 0] } : {}}
          transition={{ delay: 0.35, duration: 0.3 }}
        />
        <motion.div 
          className="absolute top-[38%] left-[35%] w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full"
          animate={isOpen ? { scale: [1, 1.15, 1] } : {}}
          transition={{ delay: 0.45, duration: 0.3 }}
        />
        <motion.div 
          className="absolute top-[36%] right-[12%] w-5 h-7 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-md"
          animate={isOpen ? { rotate: [0, -5, 5, 0] } : {}}
          transition={{ delay: 0.55, duration: 0.4 }}
        />
        
        {/* Bottom shelf */}
        <motion.div 
          className="absolute top-[60%] left-[15%] w-10 h-5 bg-gradient-to-r from-green-200 to-green-300 rounded border-2 border-green-400"
          animate={isOpen ? { x: [0, 2, 0] } : {}}
          transition={{ delay: 0.4, duration: 0.3 }}
        />
        <motion.div 
          className="absolute top-[62%] right-[20%] w-5 h-5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full"
          animate={isOpen ? { scale: [1, 1.1, 1] } : {}}
          transition={{ delay: 0.5, duration: 0.3 }}
        />
        
        {/* Sparkles when open */}
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute top-[20%] right-[30%]"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute top-[50%] left-[25%]"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </motion.div>
          </>
        )}
      </div>

      {/* Scan effect */}
      {scanning && (
        <motion.div className="absolute inset-0 pointer-events-none z-20">
          {/* Corner brackets - colorful */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-cyan-400 rounded-tl-lg shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-cyan-400 rounded-tr-lg shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-cyan-400 rounded-bl-lg shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-cyan-400 rounded-br-lg shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
          
          {/* Scan line - cyan gradient */}
          <motion.div
            className="absolute left-1 right-1 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)]"
            animate={{ top: ['5%', '90%', '5%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}

      {/* Fridge Door - animates open */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-xl border-4 border-slate-300 shadow-xl origin-left"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isOpen ? -120 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut", delay: isOpen ? 0.2 : 0 }}
        style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
      >
        {/* Door handle */}
        <div className="absolute right-2 top-[45%] w-2 h-10 bg-gradient-to-b from-slate-400 to-slate-500 rounded-full shadow-md" />
        
        {/* Door details */}
        <div className="absolute left-0 right-0 top-[30%] h-[2px] bg-slate-200" />
        <div className="absolute left-0 right-0 top-[70%] h-[2px] bg-slate-200" />
        
        {/* Fridge logo */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-slate-400 text-xs font-bold tracking-wider">
          FRIG
        </div>
      </motion.div>
    </div>
  );
};

const slides = [
  {
    type: "visual" as const,
    title: "Was essen?",
    subtitle: "Keine Idee beim Kühlschrank?",
    bgGradient: "from-orange-50 to-yellow-50",
  },
  {
    type: "scan" as const,
    title: "Scannen",
    subtitle: "Foto vom Kühlschrank machen",
    bgGradient: "from-cyan-50 to-blue-50",
  },
  {
    type: "recipes" as const,
    title: "Fertig!",
    subtitle: "Kalorienarme Rezepte erhalten",
    bgGradient: "from-green-50 to-emerald-50",
  },
];

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fridgeOpen, setFridgeOpen] = useState(false);

  // Open fridge after a delay on first slide
  useEffect(() => {
    if (currentSlide === 0) {
      setFridgeOpen(false);
      const timer = setTimeout(() => setFridgeOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [currentSlide]);

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 safe-area-inset transition-colors duration-500 bg-gradient-to-b ${slide.bgGradient}`}
    >
      {/* Skip Button */}
      <div className="w-full flex justify-end pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-slate-500 hover:text-slate-700"
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
                  <AnimatedFridge isOpen={fridgeOpen} />
                  <motion.div
                    className="absolute -top-6 -right-6 text-5xl"
                    animate={{ 
                      rotate: fridgeOpen ? [0, 0, 0] : [0, 15, -15, 0],
                      scale: fridgeOpen ? [1, 1.2, 1] : 1
                    }}
                    transition={{ duration: 1.5, repeat: fridgeOpen ? 0 : Infinity }}
                  >
                    {fridgeOpen ? "😋" : "🤔"}
                  </motion.div>
                </div>
              )}
              {slide.type === "scan" && (
                <div className="relative">
                  <AnimatedFridge isOpen scanning />
                  <motion.div
                    className="absolute -top-4 -right-10 w-14 h-18 bg-white border-3 border-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-200"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <Camera className="w-7 h-7 text-cyan-500" />
                  </motion.div>
                </div>
              )}
              {slide.type === "recipes" && (
                <div className="flex flex-col gap-3">
                  {[
                    { name: "Tomaten-Salat", kcal: 180, color: "from-red-400 to-red-500" },
                    { name: "Hähnchen-Bowl", kcal: 350, color: "from-orange-400 to-orange-500" },
                    { name: "Gemüse-Wrap", kcal: 280, color: "from-green-400 to-green-500" },
                  ].map((recipe, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 30, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: i * 0.15, type: "spring" }}
                      className="flex items-center gap-3 p-3 bg-white border-2 border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${recipe.color} rounded-xl flex items-center justify-center shadow-md`}>
                        <Utensils className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-sm font-bold text-slate-700">{recipe.name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="text-green-600 font-bold">{recipe.kcal} kcal</span>
                          <span>•</span>
                          <span>3 Zutaten</span>
                        </div>
                      </div>
                      <TrendingDown className="w-5 h-5 text-green-500" />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-3xl font-bold text-slate-800 mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-slate-600 text-lg"
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
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-gradient-to-r from-cyan-400 to-blue-500"
                  : index < currentSlide
                  ? "w-2.5 bg-cyan-300"
                  : "w-2.5 bg-slate-300"
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
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-2xl shadow-lg shadow-cyan-500/30"
        >
          {currentSlide < slides.length - 1 ? (
            <>
              Weiter
              <ChevronRight className="ml-2 w-5 h-5" />
            </>
          ) : (
            "Los geht's! 🚀"
          )}
        </Button>
      </div>
    </motion.div>
  );
};
