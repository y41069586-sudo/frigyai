import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Refrigerator, 
  Camera, 
  Clock, 
  Smile, 
  UtensilsCrossed, 
  Calendar, 
  ShoppingCart, 
  Sparkles,
  HelpCircle,
  ScanLine,
  ChefHat
} from "lucide-react";
import { AnimatedVectorFrigy, VectorFrigyMascot } from "@/components/VectorFrigyMascot";

interface InteractiveTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

type TutorialSlide = "intro" | "problem" | "scan" | "preferences" | "recipes" | "weekplan" | "shopping" | "finish";

const slideOrder: TutorialSlide[] = ["intro", "problem", "scan", "preferences", "recipes", "weekplan", "shopping", "finish"];

export const InteractiveTutorial = ({ onComplete, onSkip }: InteractiveTutorialProps) => {
  const [currentSlide, setCurrentSlide] = useState<TutorialSlide>("intro");
  const { t } = useLanguage();

  const currentIndex = slideOrder.indexOf(currentSlide);
  const progress = ((currentIndex) / (slideOrder.length - 1)) * 100;

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < slideOrder.length) {
      setCurrentSlide(slideOrder[nextIndex]);
    } else {
      // Loop back to intro
      setCurrentSlide("intro");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col">
      {/* Progress bar - hidden on intro */}
      {currentSlide !== "intro" && (
        <div className="w-full h-1 bg-muted">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {currentSlide === "intro" && (
            <IntroSlide key="intro" onStart={goNext} onSkip={onSkip} />
          )}
          {currentSlide === "problem" && (
            <ProblemSlide key="problem" onNext={goNext} />
          )}
          {currentSlide === "scan" && (
            <ScanSlide key="scan" onNext={goNext} />
          )}
          {currentSlide === "preferences" && (
            <PreferencesSlide key="preferences" onNext={goNext} />
          )}
          {currentSlide === "recipes" && (
            <RecipesSlide key="recipes" onNext={goNext} />
          )}
          {currentSlide === "weekplan" && (
            <WeekplanSlide key="weekplan" onNext={goNext} />
          )}
          {currentSlide === "shopping" && (
            <ShoppingSlide key="shopping" onNext={goNext} />
          )}
          {currentSlide === "finish" && (
            <FinishSlide key="finish" onComplete={onComplete} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Slide wrapper with consistent animations
const SlideWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    className="w-full max-w-sm mx-auto flex flex-col items-center text-center gap-8"
  >
    {children}
  </motion.div>
);

// INTRO SLIDE
const IntroSlide = ({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) => {
  const features = [
    { icon: Camera, label: "Kühlschrank scannen" },
    { icon: UtensilsCrossed, label: "Rezepte erhalten" },
    { icon: Calendar, label: "Woche planen" },
  ];

  return (
    <SlideWrapper>
      {/* Animated mascot with glow effect */}
      <div className="relative">
        {/* Ambient glow */}
        <motion.div
          className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Floating sparkles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 2) * 80}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            <Sparkles className="w-4 h-4 text-primary/60" />
          </motion.div>
        ))}
        
        <AnimatedVectorFrigy size={160} />
      </div>
      
      {/* Title with gradient effect */}
      <div className="space-y-3">
        <motion.h1 
          className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          So funktioniert Frigy
        </motion.h1>
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Ein kurzes Tutorial – weniger als 1 Minute
        </motion.p>
      </div>

      {/* Feature pills */}
      <motion.div 
        className="flex flex-wrap justify-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {features.map((feature, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 border border-primary/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--primary) / 0.2)" }}
          >
            <feature.icon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{feature.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA buttons with enhanced styling */}
      <motion.div 
        className="flex flex-col gap-3 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={onStart} 
            size="lg" 
            className="w-full relative overflow-hidden group"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <span className="relative flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Tutorial starten
            </span>
          </Button>
        </motion.div>
        <Button 
          variant="ghost" 
          onClick={onSkip} 
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Überspringen
        </Button>
      </motion.div>
    </SlideWrapper>
  );
};

// SLIDE 1 - Problem
const ProblemSlide = ({ onNext }: { onNext: () => void }) => {
  const ingredients = ["🥕", "🧀", "🥚", "🥛", "🍅", "🥒"];
  
  return (
    <SlideWrapper>
      <div className="relative w-48 h-48">
        {/* Fridge icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Refrigerator className="w-24 h-24 text-primary" strokeWidth={1.5} />
        </motion.div>
        
        {/* Floating ingredients */}
        {ingredients.map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl"
            style={{
              left: `${20 + (i % 3) * 30}%`,
              top: `${15 + Math.floor(i / 3) * 40}%`,
            }}
            animate={{ 
              y: [0, -5, 0],
              rotate: [-5, 5, -5],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          >
            {emoji}
          </motion.span>
        ))}
        
        {/* Pulsing question mark */}
        <motion.div
          className="absolute -right-2 -top-2 bg-orange-100 rounded-full p-2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <HelpCircle className="w-6 h-6 text-orange-500" />
        </motion.div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Kühlschrank voll.</h2>
        <p className="text-lg text-muted-foreground">Keine Ahnung, was du kochen sollst.</p>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        Weiter
      </Button>
    </SlideWrapper>
  );
};

// SLIDE 2 - Scan
const ScanSlide = ({ onNext }: { onNext: () => void }) => (
  <SlideWrapper>
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Fridge background */}
      <div className="absolute inset-4 bg-gradient-to-b from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20" />
      
      {/* Camera icon */}
      <motion.div
        className="relative z-10"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Camera className="w-16 h-16 text-primary" strokeWidth={1.5} />
      </motion.div>
      
      {/* Scan line */}
      <motion.div
        className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
        animate={{ top: ["20%", "80%", "20%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Highlighted ingredients */}
      <motion.div
        className="absolute bottom-6 left-6 bg-green-100 rounded-lg px-2 py-1"
        animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
      >
        <span className="text-sm text-green-700 font-medium">🥕 Karotte</span>
      </motion.div>
      
      <motion.div
        className="absolute top-6 right-6 bg-green-100 rounded-lg px-2 py-1"
        animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5, times: [0, 0.2, 0.8, 1] }}
      >
        <span className="text-sm text-green-700 font-medium">🧀 Käse</span>
      </motion.div>
    </div>

    <div className="space-y-2">
      <h2 className="text-xl font-bold text-foreground">Frigy schaut in deinen Kühlschrank</h2>
    </div>

    <Button onClick={onNext} size="lg" className="w-full">
      Verstanden
    </Button>
  </SlideWrapper>
);

// SLIDE 3 - Preferences
const PreferencesSlide = ({ onNext }: { onNext: () => void }) => {
  const moods = ["😴", "😊", "💪", "🎉"];
  const [activeMood, setActiveMood] = useState(0);
  const [sliderValue, setSliderValue] = useState(30);

  // Auto-animate mood
  useState(() => {
    const interval = setInterval(() => {
      setActiveMood(prev => (prev + 1) % moods.length);
    }, 800);
    return () => clearInterval(interval);
  });

  // Auto-animate slider
  useState(() => {
    const interval = setInterval(() => {
      setSliderValue(prev => prev >= 60 ? 15 : prev + 15);
    }, 600);
    return () => clearInterval(interval);
  });

  return (
    <SlideWrapper>
      <div className="w-full space-y-6">
        {/* Time slider demo */}
        <div className="bg-card rounded-2xl p-4 border">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Zeit</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: [`${sliderValue}%`, `${sliderValue + 15}%`] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>15 Min</span>
            <span>60 Min</span>
          </div>
        </div>

        {/* Mood selector demo */}
        <div className="bg-card rounded-2xl p-4 border">
          <div className="flex items-center gap-3 mb-3">
            <Smile className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Stimmung</span>
          </div>
          <div className="flex justify-around">
            {moods.map((mood, i) => (
              <motion.span
                key={i}
                className="text-3xl cursor-pointer"
                animate={{ 
                  scale: activeMood === i ? 1.3 : 1,
                  opacity: activeMood === i ? 1 : 0.5
                }}
                transition={{ duration: 0.2 }}
              >
                {mood}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Sag Frigy,</h2>
        <p className="text-lg text-muted-foreground">wie viel Zeit du hast und wie du dich fühlst</p>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        Okay
      </Button>
    </SlideWrapper>
  );
};

// SLIDE 4 - Recipes
const RecipesSlide = ({ onNext }: { onNext: () => void }) => {
  const recipes = [
    { name: "Schnelle Pasta", time: "15 Min", emoji: "🍝" },
    { name: "Gemüse-Pfanne", time: "20 Min", emoji: "🥘" },
    { name: "Omelette", time: "10 Min", emoji: "🍳" },
  ];

  return (
    <SlideWrapper>
      <div className="w-full space-y-3">
        {recipes.map((recipe, i) => (
          <motion.div
            key={i}
            className={`bg-card rounded-xl p-4 border flex items-center gap-4 ${i === 1 ? 'ring-2 ring-primary shadow-lg' : ''}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
          >
            <span className="text-3xl">{recipe.emoji}</span>
            <div className="flex-1 text-left">
              <p className="font-medium">{recipe.name}</p>
              <p className="text-sm text-muted-foreground">{recipe.time}</p>
            </div>
            {i === 1 && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ChefHat className="w-5 h-5 text-primary" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Frigy entscheidet für dich</h2>
        <p className="text-lg text-muted-foreground">und zeigt dir 3 passende Gerichte</p>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        Nice
      </Button>
    </SlideWrapper>
  );
};

// SLIDE 5 - Weekplan
const WeekplanSlide = ({ onNext }: { onNext: () => void }) => {
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  return (
    <SlideWrapper>
      <div className="w-full">
        <div className="bg-card rounded-2xl p-4 border">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Wochenplan</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15, duration: 0.3 }}
              >
                <span className="text-xs text-muted-foreground">{day}</span>
                <motion.div
                  className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.15 + 0.2, duration: 0.3, ease: "backOut" }}
                >
                  <span className="text-sm">
                    {["🍳", "🥗", "🍝", "🍲", "🍕", "🥘", "🍜"][i]}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Willst du vorausplanen?</h2>
        <p className="text-lg text-muted-foreground">Dann nutze den Wochenplan</p>
        <p className="text-sm text-muted-foreground/70">Unabhängig vom Kühlschrank-Scan</p>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        Verstanden
      </Button>
    </SlideWrapper>
  );
};

// SLIDE 6 - Shopping
const ShoppingSlide = ({ onNext }: { onNext: () => void }) => {
  const items = [
    { name: "Tomaten", checked: true },
    { name: "Zwiebeln", checked: true },
    { name: "Knoblauch", checked: false },
    { name: "Olivenöl", checked: false },
  ];

  return (
    <SlideWrapper>
      <div className="w-full">
        <div className="bg-card rounded-2xl p-4 border">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-5 h-5 text-green-500" />
            <span className="font-medium">Einkaufsliste</span>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2, duration: 0.3 }}
              >
                <motion.div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    item.checked ? 'bg-green-500 border-green-500' : 'border-muted-foreground/30'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.2 + 0.15, duration: 0.2, ease: "backOut" }}
                >
                  {item.checked && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.2 + 0.25 }}
                      className="text-white text-xs"
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.div>
                <span className={item.checked ? 'line-through text-muted-foreground' : ''}>
                  {item.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Frigy schreibt dir automatisch auf,</h2>
        <p className="text-lg text-muted-foreground">was noch fehlt</p>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        Praktisch
      </Button>
    </SlideWrapper>
  );
};

// SLIDE 7 - Finish
const FinishSlide = ({ onComplete }: { onComplete: () => void }) => (
  <SlideWrapper>
    <motion.div
      animate={{
        y: [0, -15, 0],
        rotate: [-5, 5, -5]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <VectorFrigyMascot size={160} animate={true} />
    </motion.div>

    <motion.div
      className="flex gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -8, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2
          }}
        >
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </motion.div>
      ))}
    </motion.div>

    <div className="space-y-2">
      <h2 className="text-xl font-bold text-foreground">Du musst nicht mehr überlegen.</h2>
      <p className="text-lg text-primary font-medium">Frigy macht das für dich.</p>
    </div>

    <Button onClick={onComplete} size="lg" className="w-full">
      Tutorial neustarten
    </Button>
  </SlideWrapper>
);

export default InteractiveTutorial;
