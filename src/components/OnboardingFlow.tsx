import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Camera, Utensils, TrendingDown, Globe, Target, Scale, Sparkles, Check } from "lucide-react";
import frigLogo from "@/assets/frig-logo.png";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface OnboardingFlowProps {
  onComplete: () => void;
}

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
        <div className="w-full h-full bg-white border border-slate-200 rounded-sm shadow-sm">
          <div className="w-full h-2.5 bg-blue-400 rounded-t-sm" />
          <div className="text-[4px] text-center text-blue-600 mt-0.5 font-bold">MILK</div>
        </div>
      </div>
      <div className="absolute top-[4%] left-[38%] w-5 h-9">
        <div className="w-full h-full bg-orange-400 rounded-sm shadow-sm">
          <div className="w-full h-2 bg-orange-600 rounded-t-sm" />
          <div className="w-3 h-3 bg-orange-200 rounded-full mx-auto mt-1" />
        </div>
      </div>
      <div className="absolute top-[6%] right-[25%] w-5 h-5">
        <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-sm relative">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-amber-700 rounded-full" />
          <div className="absolute -top-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
        </div>
      </div>
      <div className="absolute top-[4%] right-[6%] w-7 h-5 bg-amber-50 rounded border border-amber-100 shadow-sm flex items-center justify-center gap-0.5">
        <div className="w-1.5 h-2 bg-amber-100 rounded-full" />
        <div className="w-1.5 h-2 bg-amber-100 rounded-full" />
        <div className="w-1.5 h-2 bg-amber-100 rounded-full" />
      </div>
      
      {/* Second Shelf - Vegetables */}
      <div className="absolute top-[28%] left-[8%]">
        <div className="w-3 h-7 bg-gradient-to-b from-orange-400 to-orange-500 rounded-b-full shadow-sm relative">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex">
            <div className="w-0.5 h-2 bg-green-500 rounded-full transform -rotate-12" />
            <div className="w-0.5 h-2 bg-green-500 rounded-full" />
            <div className="w-0.5 h-2 bg-green-500 rounded-full transform rotate-12" />
          </div>
        </div>
      </div>
      <div className="absolute top-[30%] left-[30%] w-5 h-5">
        <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-sm relative">
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-green-500 rounded-b-full" />
        </div>
      </div>
      <div className="absolute top-[28%] right-[25%] w-4 h-6">
        <div className="w-full h-full bg-gradient-to-b from-green-600 to-green-800 rounded-full shadow-sm" style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} />
      </div>
      <div className="absolute top-[30%] right-[6%] w-6 h-4">
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
        <div className="w-full h-full bg-white rounded-sm border border-slate-200 shadow-sm">
          <div className="w-full h-1.5 bg-pink-400 rounded-t-sm" />
        </div>
      </div>
      <div className="absolute top-[53%] right-[8%] w-6 h-6">
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
        
        <motion.div
          className="absolute left-1 right-1 h-10 pointer-events-none rounded-lg overflow-hidden"
          style={{ 
            background: 'linear-gradient(to bottom, transparent 0%, rgba(144,238,144,0.2) 20%, rgba(144,238,144,0.7) 50%, rgba(144,238,144,0.2) 80%, transparent 100%)',
            boxShadow: '0 0 25px rgba(144,238,144,0.5)'
          }}
          animate={{ top: ['5%', '80%', '5%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
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

const FrigLogoImage = ({ size = "normal" }: { size?: "small" | "normal" | "large" }) => {
  const sizeClass = size === "small" ? "w-16 h-16" : size === "large" ? "w-32 h-32" : "w-24 h-24";
  return (
    <img 
      src={frigLogo} 
      alt="Frig AI Logo" 
      className={`${sizeClass} rounded-[22%]`}
    />
  );
};

const languages: { code: Language; name: string; flag: string }[] = [
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(-1); // -1 = language selection
  const [showPlanSelection, setShowPlanSelection] = useState(false);

  const slides = [
    { title: t.onboardingSlide1Title, subtitle: t.onboardingSlide1Subtitle, type: "welcome" as const },
    { title: t.onboardingSlide2Title, subtitle: t.onboardingSlide2Subtitle, type: "scan" as const },
    { title: t.onboardingSlide3Title, subtitle: t.onboardingSlide3Subtitle, type: "analyze" as const },
    { title: t.onboardingSlide4Title, subtitle: t.onboardingSlide4Subtitle, type: "recipes" as const },
    { title: t.onboardingSlide5Title, subtitle: t.onboardingSlide5Subtitle, type: "track" as const },
    { title: t.onboardingSlide6Title, subtitle: t.onboardingSlide6Subtitle, type: "goal" as const },
  ];

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setCurrentSlide(0);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowPlanSelection(true);
    }
  };

  const handleSkip = () => {
    setShowPlanSelection(true);
  };

  const handleFreePlan = () => {
    onComplete();
  };

  const handlePremiumPlan = () => {
    onComplete();
    navigate('/premium');
  };

  // Language Selection Screen
  if (currentSlide === -1) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-6 safe-area-inset"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center gap-8"
        >
          <FrigLogoImage size="large" />
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="w-5 h-5" />
            <span className="text-lg">{t.selectLanguage}</span>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  language === lang.code
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-3xl">{lang.flag}</span>
                <span className="text-lg font-medium">{lang.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Plan Selection Screen
  if (showPlanSelection) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-6 safe-area-inset"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6 w-full max-w-sm"
        >
          <FrigLogoImage size="normal" />
          
          <h2 className="text-2xl font-bold text-center">{t.choosePlan}</h2>

          {/* Free Plan */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full p-4 rounded-xl border-2 border-border bg-card"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">{t.freePlan}</h3>
              <span className="text-muted-foreground">€0</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">{t.freePlanDesc}</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleFreePlan}
            >
              {t.continueWithFree}
            </Button>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full p-4 rounded-xl border-2 border-primary bg-primary/5 relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-primary">{t.premiumPlan}</h3>
              <span className="font-bold">€4,99<span className="text-muted-foreground text-sm">{t.perMonth}</span></span>
            </div>
            <p className="text-muted-foreground text-sm mb-3">{t.premiumPlanDesc}</p>
            <div className="flex flex-col gap-1 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" />
                <span>{t.unlimitedRecipeGeneration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" />
                <span>{t.weeklyPersonalizedMealPlans}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" />
                <span>{t.macroTrackingCalorieAnalysis}</span>
              </div>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handlePremiumPlan}
            >
              {t.getPremium}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-background p-6 safe-area-inset"
    >
      {/* Skip Button */}
      <div className="w-full flex justify-end pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          {t.skip}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${language}-${currentSlide}`}
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
              {currentSlideData.type === "welcome" && (
                <div className="relative">
                  <FrigLogoImage size="large" />
                  <motion.div
                    className="absolute -top-2 -right-2 text-3xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    👋
                  </motion.div>
                </div>
              )}
              {currentSlideData.type === "scan" && (
                <div className="relative">
                  <MiniFridge />
                  <motion.div
                    className="absolute -bottom-3 -right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Camera className="w-6 h-6 text-primary-foreground" />
                  </motion.div>
                </div>
              )}
              {currentSlideData.type === "analyze" && (
                <div className="relative">
                  <MiniFridge scanning />
                </div>
              )}
              {currentSlideData.type === "recipes" && (
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
                        <div className="text-sm font-semibold">{t.recipe} {i}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-primary font-bold">{280 + i * 50} kcal</span>
                          <span>•</span>
                          <span>3 {t.ingredients}</span>
                        </div>
                      </div>
                      <TrendingDown className="w-4 h-4 text-primary ml-auto" />
                    </motion.div>
                  ))}
                </div>
              )}
              {currentSlideData.type === "track" && (
                <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center relative">
                  <motion.div
                    className="absolute inset-2 rounded-full border-8 border-primary"
                    style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <Target className="w-12 h-12 text-primary" />
                </div>
              )}
              {currentSlideData.type === "goal" && (
                <div className="relative">
                  <motion.div
                    className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Scale className="w-12 h-12 text-primary" />
                  </motion.div>
                  <motion.div
                    className="absolute -top-2 -right-2 text-3xl"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    🎯
                  </motion.div>
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
              {currentSlideData.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {currentSlideData.subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Section */}
      <div className="w-full max-w-xs space-y-4 pb-6">
        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5">
          {slides.map((_, index) => (
            <motion.div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-6 bg-primary"
                  : index < currentSlide
                  ? "w-1.5 bg-primary/50"
                  : "w-1.5 bg-muted"
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
          className="w-full h-11 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
        >
          {currentSlide < slides.length - 1 ? (
            <>
              {t.next}
              <ChevronRight className="ml-1 w-4 h-4" />
            </>
          ) : (
            t.start
          )}
        </Button>
      </div>
    </motion.div>
  );
};