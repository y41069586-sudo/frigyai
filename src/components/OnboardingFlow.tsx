import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Camera, Utensils, TrendingDown, Globe, Target, Scale, Users, Sparkles, Activity, Apple, Smartphone } from "lucide-react";
import frigLogo from "@/assets/frig-logo.png";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { HealthSync } from "@/components/HealthSync";
// Social media icons as SVG components
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

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
      alt="FriG AI Logo" 
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
  const [currentSlide, setCurrentSlide] = useState(-1); // -1 = language selection
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [showHealthSync, setShowHealthSync] = useState(false);
  const slides = [
    { title: t.onboardingSlide1Title, subtitle: t.onboardingSlide1Subtitle, type: "welcome" as const },
    { title: t.onboardingSlide2Title, subtitle: t.onboardingSlide2Subtitle, type: "scan" as const },
    { title: t.onboardingSlide3Title, subtitle: t.onboardingSlide3Subtitle, type: "analyze" as const },
    { title: t.onboardingSlide4Title, subtitle: t.onboardingSlide4Subtitle, type: "recipes" as const },
    { title: t.onboardingSlide5Title, subtitle: t.onboardingSlide5Subtitle, type: "track" as const },
    { title: t.onboardingSlide6Title, subtitle: t.onboardingSlide6Subtitle, type: "goal" as const },
    // New slides 7-14 with Health Sync and Community
    { title: t.onboardingSlide7Title, subtitle: t.onboardingSlide7Subtitle, type: "health-sync" as const },
    { title: t.onboardingSlide8Title, subtitle: t.onboardingSlide8Subtitle, type: "community-join" as const },
    { title: t.onboardingSlide9Title, subtitle: "", type: "community" as const },
    { title: t.onboardingSlide10Title, subtitle: "", type: "question-source" as const },
    { title: t.onboardingSlide11Title, subtitle: "", type: "question-goal" as const },
    { title: t.onboardingSlide12Title, subtitle: "", type: "question-cooking" as const },
    { title: t.onboardingSlide13Title, subtitle: "", type: "question-challenge" as const },
    { title: t.onboardingSlide14Title, subtitle: "", type: "ready" as const },
  ];

  const questionOptions = {
    "question-source": [
      { id: "tiktok", label: t.optionTikTok, icon: <TikTokIcon /> },
      { id: "youtube", label: t.optionYouTube, icon: <YouTubeIcon /> },
      { id: "instagram", label: t.optionInstagram, icon: <InstagramIcon /> },
      { id: "friends", label: t.optionFriends, icon: <span className="text-2xl">👥</span> },
      { id: "other", label: t.optionOther, icon: <span className="text-2xl">🔍</span> },
    ],
    "question-goal": [
      { id: "lose-weight", label: t.goalLoseWeight, icon: <span className="text-2xl">⚖️</span> },
      { id: "eat-healthier", label: t.goalEatHealthier, icon: <span className="text-2xl">🥗</span> },
      { id: "save-time", label: t.goalSaveTime, icon: <span className="text-2xl">⏰</span> },
      { id: "learn-cooking", label: t.goalLearnCooking, icon: <span className="text-2xl">👨‍🍳</span> },
    ],
    "question-cooking": [
      { id: "daily", label: t.cookDaily, icon: <span className="text-2xl">🍳</span> },
      { id: "few-times", label: t.cookFewTimes, icon: <span className="text-2xl">📅</span> },
      { id: "rarely", label: t.cookRarely, icon: <span className="text-2xl">🤷</span> },
      { id: "never", label: t.cookNever, icon: <span className="text-2xl">🍕</span> },
    ],
    "question-challenge": [
      { id: "no-ideas", label: t.challengeNoIdeas, icon: <span className="text-2xl">💡</span> },
      { id: "no-time", label: t.challengeNoTime, icon: <span className="text-2xl">⏳</span> },
      { id: "calories", label: t.challengeCalories, icon: <span className="text-2xl">🔢</span> },
      { id: "ingredients", label: t.challengeIngredients, icon: <span className="text-2xl">🗑️</span> },
    ],
  };

  const handleSelectOption = (slideIndex: number, optionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [slideIndex]: optionId }));
  };

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setCurrentSlide(0);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // After slides, go to auth page (user must register/login first)
      onComplete();
    }
  };

  const handleSkip = () => {
    // Skip also goes to auth
    onComplete();
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
              {currentSlideData.type === "health-sync" && (
                <div className="space-y-4 w-full max-w-sm">
                  {showHealthSync ? (
                    <div className="bg-card rounded-2xl border border-border p-4 max-h-[60vh] overflow-y-auto">
                      <HealthSync onClose={() => {
                        setShowHealthSync(false);
                        handleNext();
                      }} />
                    </div>
                  ) : (
                    <>
                      <motion.div
                        className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Activity className="w-10 h-10 text-primary" />
                      </motion.div>
                      <div className="space-y-3 mt-6">
                        <motion.button
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          onClick={() => {
                            localStorage.setItem('healthSyncSettings', JSON.stringify({ appleHealth: true, googleFit: false, syncWeight: true, syncSteps: true, syncCalories: true, autoSync: true }));
                            setShowHealthSync(true);
                          }}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-card hover:border-red-500/50 transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <Apple className="w-5 h-5 text-red-500" />
                          </div>
                          <span className="font-medium">{t.connectAppleHealth}</span>
                        </motion.button>
                        <motion.button
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          onClick={() => {
                            localStorage.setItem('healthSyncSettings', JSON.stringify({ appleHealth: false, googleFit: true, syncWeight: true, syncSteps: true, syncCalories: true, autoSync: true }));
                            setShowHealthSync(true);
                          }}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-card hover:border-green-500/50 transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-green-500" />
                          </div>
                          <span className="font-medium">{t.connectGoogleFit}</span>
                        </motion.button>
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          onClick={handleNext}
                          className="w-full text-center text-muted-foreground text-sm py-2 hover:text-foreground transition-colors"
                        >
                          {t.skipForNow}
                        </motion.button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {currentSlideData.type === "community-join" && (
                <div className="space-y-4 w-full max-w-sm">
                  <motion.div
                    className="flex items-center justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center text-2xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.15 }}
                      >
                        {["👩‍🍳", "👨‍🍳", "🧑‍🍳"][i]}
                      </motion.div>
                    ))}
                  </motion.div>
                  <div className="space-y-3 mt-6">
                    <motion.a
                      href="https://discord.gg/frig-community"
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      onClick={() => {
                        localStorage.setItem('communityJoined', 'true');
                        toast({ title: "Willkommen in der Community! 🎉" });
                      }}
                      className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-all"
                    >
                      <Users className="w-5 h-5 text-primary" />
                      <span className="font-medium text-primary">{t.joinCommunity}</span>
                    </motion.a>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      onClick={handleNext}
                      className="w-full text-center text-muted-foreground text-sm py-2 hover:text-foreground transition-colors"
                    >
                      {t.maybeLater}
                    </motion.button>
                  </div>
                </div>
              )}
              {currentSlideData.type === "community" && (
                <div className="relative">
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-2xl"
                        initial={{ scale: 0, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        {["👩", "👨", "👩‍🦰", "👨‍🦱", "👩‍🦳"][i]}
                      </motion.div>
                    ))}
                  </motion.div>
                  <motion.div
                    className="flex items-center justify-center gap-1 mt-4"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Users className="w-6 h-6 text-primary" />
                    <span className="text-lg font-bold text-primary">10,000+</span>
                  </motion.div>
                </div>
              )}
              {(currentSlideData.type === "question-source" || 
                currentSlideData.type === "question-goal" || 
                currentSlideData.type === "question-cooking" || 
                currentSlideData.type === "question-challenge") && (
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  {questionOptions[currentSlideData.type as keyof typeof questionOptions]?.map((option, i) => (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleSelectOption(currentSlide, option.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedOptions[currentSlide] === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="text-2xl">{option.icon}</div>
                      <span className="text-sm font-medium text-center">{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              )}
              {currentSlideData.type === "ready" && (
                <div className="relative">
                  <motion.div
                    className="w-28 h-28 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-14 h-14 text-primary" />
                  </motion.div>
                  <motion.div
                    className="absolute -top-3 -right-3 text-4xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    🎉
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