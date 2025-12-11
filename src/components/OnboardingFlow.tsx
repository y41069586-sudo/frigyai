import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Camera, Utensils, TrendingDown } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Logo component - green fridge with scan corners (like uploaded image)
const FrigLogo = ({ size = "normal" }: { size?: "small" | "normal" | "large" }) => {
  const dimensions = size === "small" ? "w-20 h-20" : size === "large" ? "w-40 h-40" : "w-28 h-28";
  const iconSize = size === "small" ? "w-10 h-14" : size === "large" ? "w-20 h-28" : "w-14 h-20";
  const cornerSize = size === "small" ? 12 : size === "large" ? 24 : 16;
  const strokeWidth = size === "small" ? 2 : size === "large" ? 4 : 3;
  
  return (
    <div className={`${dimensions} relative flex items-center justify-center`}>
      {/* Green rounded background */}
      <div 
        className="absolute inset-0 rounded-[20%]"
        style={{ 
          background: 'linear-gradient(135deg, #5FD068 0%, #4ABA54 50%, #3DA347 100%)',
          boxShadow: '0 8px 32px rgba(90, 200, 100, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)'
        }}
      />
      
      {/* Inner lighter background */}
      <div 
        className="absolute inset-2 rounded-[18%]"
        style={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)'
        }}
      />
      
      {/* Scan corners */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {/* Top Left Corner */}
        <path 
          d={`M ${15} ${30} L ${15} ${15} L ${30} ${15}`} 
          fill="none" 
          stroke="rgba(255,255,255,0.9)" 
          strokeWidth={strokeWidth} 
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
        />
        {/* Top Right Corner */}
        <path 
          d={`M ${70} ${15} L ${85} ${15} L ${85} ${30}`} 
          fill="none" 
          stroke="rgba(255,255,255,0.9)" 
          strokeWidth={strokeWidth} 
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
        />
        {/* Bottom Left Corner */}
        <path 
          d={`M ${15} ${70} L ${15} ${85} L ${30} ${85}`} 
          fill="none" 
          stroke="rgba(255,255,255,0.9)" 
          strokeWidth={strokeWidth} 
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
        />
        {/* Bottom Right Corner */}
        <path 
          d={`M ${70} ${85} L ${85} ${85} L ${85} ${70}`} 
          fill="none" 
          stroke="rgba(255,255,255,0.9)" 
          strokeWidth={strokeWidth} 
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
        />
      </svg>
      
      {/* Fridge Icon */}
      <div 
        className={`${iconSize} relative z-10`}
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' }}
      >
        <svg viewBox="0 0 40 56" fill="none" className="w-full h-full">
          {/* Fridge body */}
          <rect x="4" y="4" width="32" height="48" rx="4" 
            stroke="rgba(255,255,255,0.95)" 
            strokeWidth="2.5" 
            fill="none"
          />
          {/* Freezer line */}
          <line x1="4" y1="18" x2="36" y2="18" stroke="rgba(255,255,255,0.95)" strokeWidth="2" />
          {/* Freezer handle */}
          <line x1="28" y1="10" x2="28" y2="14" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Fridge handle */}
          <line x1="28" y1="26" x2="28" y2="34" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

// Mini fridge with visible food items inside
const MiniFridge = ({ scanning = false }: { scanning?: boolean }) => (
  <div className="relative w-32 h-44">
    {/* Fridge Interior */}
    <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50 rounded-xl shadow-inner overflow-hidden">
      {/* Shelves */}
      <div className="absolute left-0 right-0 top-[25%] h-[2px] bg-slate-200" />
      <div className="absolute left-0 right-0 top-[50%] h-[2px] bg-slate-200" />
      <div className="absolute left-0 right-0 top-[75%] h-[2px] bg-slate-200" />
      
      {/* Top Shelf - Milk, Juice, Apple */}
      <div className="absolute top-[3%] left-[8%] w-6 h-10">
        {/* Milk carton */}
        <div className="w-full h-full bg-white border border-slate-200 rounded-sm shadow-sm">
          <div className="w-full h-2.5 bg-blue-400 rounded-t-sm" />
          <div className="text-[4px] text-center text-blue-600 mt-0.5 font-bold">MILK</div>
        </div>
      </div>
      <div className="absolute top-[4%] left-[38%] w-5 h-9">
        {/* Orange juice */}
        <div className="w-full h-full bg-orange-400 rounded-sm shadow-sm">
          <div className="w-full h-2 bg-orange-600 rounded-t-sm" />
          <div className="w-3 h-3 bg-orange-200 rounded-full mx-auto mt-1" />
        </div>
      </div>
      <div className="absolute top-[6%] right-[25%] w-5 h-5">
        {/* Apple */}
        <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-sm relative">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-amber-700 rounded-full" />
          <div className="absolute -top-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
        </div>
      </div>
      <div className="absolute top-[4%] right-[6%] w-7 h-5 bg-amber-50 rounded border border-amber-100 shadow-sm flex items-center justify-center gap-0.5">
        {/* Eggs */}
        <div className="w-1.5 h-2 bg-amber-100 rounded-full" />
        <div className="w-1.5 h-2 bg-amber-100 rounded-full" />
        <div className="w-1.5 h-2 bg-amber-100 rounded-full" />
      </div>
      
      {/* Second Shelf - Vegetables */}
      <div className="absolute top-[28%] left-[8%]">
        {/* Carrot */}
        <div className="w-3 h-7 bg-gradient-to-b from-orange-400 to-orange-500 rounded-b-full shadow-sm relative">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex">
            <div className="w-0.5 h-2 bg-green-500 rounded-full transform -rotate-12" />
            <div className="w-0.5 h-2 bg-green-500 rounded-full" />
            <div className="w-0.5 h-2 bg-green-500 rounded-full transform rotate-12" />
          </div>
        </div>
      </div>
      <div className="absolute top-[30%] left-[30%] w-5 h-5">
        {/* Tomato */}
        <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-sm relative">
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-green-500 rounded-b-full" />
        </div>
      </div>
      <div className="absolute top-[28%] right-[25%] w-4 h-6">
        {/* Avocado */}
        <div className="w-full h-full bg-gradient-to-b from-green-600 to-green-800 rounded-full shadow-sm" style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} />
      </div>
      <div className="absolute top-[30%] right-[6%] w-6 h-4">
        {/* Cheese */}
        <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-sm shadow-sm relative">
          <div className="absolute top-0.5 left-1 w-1 h-1 bg-yellow-200 rounded-full" />
          <div className="absolute bottom-0.5 right-1.5 w-0.5 h-0.5 bg-yellow-200 rounded-full" />
        </div>
      </div>
      
      {/* Third Shelf - Containers */}
      <div className="absolute top-[53%] left-[6%] w-10 h-5 bg-primary/20 rounded border border-primary/40 shadow-sm">
        <div className="w-full h-1 bg-primary/30 rounded-t" />
      </div>
      <div className="absolute top-[54%] left-[45%] w-5 h-5">
        {/* Yogurt */}
        <div className="w-full h-full bg-white rounded-sm border border-slate-200 shadow-sm">
          <div className="w-full h-1.5 bg-pink-400 rounded-t-sm" />
        </div>
      </div>
      <div className="absolute top-[53%] right-[8%] w-6 h-6">
        {/* Broccoli */}
        <div className="w-full h-full relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-2 bg-green-700 rounded-sm" />
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-600 rounded-full" />
        </div>
      </div>
      
      {/* Bottom Drawer */}
      <div className="absolute bottom-[2%] left-[4%] right-[4%] h-6 bg-gradient-to-b from-green-50 to-green-100 rounded border border-slate-200 flex items-center justify-around px-1">
        <div className="w-3 h-3 bg-gradient-to-br from-green-300 to-green-500 rounded-full" />
        <div className="w-2 h-4 bg-gradient-to-b from-red-400 to-red-600 rounded-b-full rounded-t-sm" />
        <div className="w-1.5 h-4 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
        <div className="w-3 h-2 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full" />
      </div>
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
          className="absolute left-1 right-1 h-10 pointer-events-none rounded-lg overflow-hidden"
          style={{ 
            background: 'linear-gradient(to bottom, transparent 0%, rgba(144,238,144,0.2) 20%, rgba(144,238,144,0.7) 50%, rgba(144,238,144,0.2) 80%, transparent 100%)',
            boxShadow: '0 0 25px rgba(144,238,144,0.5)'
          }}
          animate={{ top: ['5%', '80%', '5%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Bright center line */}
          <div 
            className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-[#90EE90]"
            style={{ boxShadow: '0 0 12px rgba(144,238,144,1), 0 0 24px rgba(144,238,144,0.8)' }}
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
