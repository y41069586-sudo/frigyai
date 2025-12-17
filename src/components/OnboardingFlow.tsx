import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Camera, 
  Scale, 
  Target, 
  Leaf, 
  Utensils,
  Activity,
  Apple,
  Smartphone,
  ShoppingCart,
  Users,
  Sparkles,
  Check,
  X
} from "lucide-react";
import frigLogo from "@/assets/frig-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Step types for the linear flow
type OnboardingStep = 
  | "welcome"
  | "goal"
  | "body-data"
  | "activity"
  | "macro-pref"
  | "dietary"
  | "fridge-intro"
  | "permissions"
  | "premium-hint"
  | "community"
  | "done";

interface UserData {
  goal: string | null;
  gender: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  activityLevel: string | null;
  macroPref: string | null;
  dietaryPrefs: string[];
  cameraPermission: boolean;
  healthSync: string | null;
}

// Mini fridge component for visuals
const MiniFridge = () => (
  <div className="relative w-24 h-32">
    <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl shadow-lg border-2 border-slate-300">
      {/* Fridge handle */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-slate-400 rounded-full" />
      {/* Fridge line */}
      <div className="absolute left-0 right-0 top-[40%] h-[2px] bg-slate-300" />
      {/* Food icons inside */}
      <div className="absolute top-2 left-2 text-lg">🥛</div>
      <div className="absolute top-2 right-4 text-lg">🍎</div>
      <div className="absolute top-[45%] left-2 text-lg">🥕</div>
      <div className="absolute top-[45%] right-4 text-lg">🧀</div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-lg">🥬</div>
    </div>
  </div>
);

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [userData, setUserData] = useState<UserData>({
    goal: null,
    gender: null,
    age: null,
    height: null,
    weight: null,
    activityLevel: null,
    macroPref: null,
    dietaryPrefs: [],
    cameraPermission: false,
    healthSync: null,
  });
  
  // Refs for wheel pickers
  const ageRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<HTMLDivElement>(null);
  const weightRef = useRef<HTMLDivElement>(null);

  const steps: OnboardingStep[] = [
    "welcome",
    "goal",
    "body-data",
    "activity",
    "macro-pref",
    "dietary",
    "fridge-intro",
    "permissions",
    "premium-hint",
    "community",
    "done"
  ];

  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      handleComplete();
    }
  };

  const goBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleComplete = () => {
    // Save user data to localStorage
    localStorage.setItem('onboardingUserData', JSON.stringify(userData));
    localStorage.setItem('onboardingComplete', 'true');
    onComplete();
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "goal":
        return userData.goal !== null;
      case "body-data":
        return userData.gender !== null && userData.age !== null && userData.height !== null && userData.weight !== null;
      case "activity":
        return userData.activityLevel !== null;
      case "macro-pref":
        return userData.macroPref !== null;
      default:
        return true;
    }
  };

  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6"
          >
            <motion.img
              src={frigLogo}
              alt="FrigBuddy"
              className="w-24 h-24 rounded-[22%] mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            />
            <h1 className="text-3xl font-bold mb-2">FrigBuddy</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Plan meals. Hit macros. Waste less.
            </p>
            <div className="relative mb-8">
              <MiniFridge />
              <motion.div
                className="absolute -bottom-2 -right-2 text-3xl"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🥗
              </motion.div>
            </div>
          </motion.div>
        );

      case "goal":
        const goalOptions = [
          { id: "lose", label: "Lose weight", icon: <Scale className="w-6 h-6" /> },
          { id: "maintain", label: "Maintain weight", icon: <Target className="w-6 h-6" /> },
          { id: "gain", label: "Gain muscle", icon: <Activity className="w-6 h-6" /> },
          { id: "healthier", label: "Eat healthier", icon: <Leaf className="w-6 h-6" /> },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">What's your goal?</h1>
            <p className="text-muted-foreground mb-6">We'll personalize your experience</p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {goalOptions.map((option) => (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserData({ ...userData, goal: option.id })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    userData.goal === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className={`${userData.goal === option.id ? "text-primary" : "text-muted-foreground"}`}>
                    {option.icon}
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case "body-data":
        const genderOptions = [
          { id: "male", label: "Male", emoji: "👨" },
          { id: "female", label: "Female", emoji: "👩" },
          { id: "other", label: "Other", emoji: "🧑" },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Basic info</h1>
            <p className="text-muted-foreground text-sm mb-6">Used only to calculate your macros</p>
            
            {/* Gender Selection */}
            <div className="flex gap-3 mb-6">
              {genderOptions.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setUserData({ ...userData, gender: g.id })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    userData.gender === g.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-xs">{g.label}</span>
                </button>
              ))}
            </div>

            {/* Age, Height, Weight inputs */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
              <div className="flex flex-col items-center">
                <label className="text-xs text-muted-foreground mb-2">Age</label>
                <input
                  type="number"
                  value={userData.age || ""}
                  onChange={(e) => setUserData({ ...userData, age: parseInt(e.target.value) || null })}
                  placeholder="25"
                  className="w-full h-12 text-center text-lg font-semibold rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none"
                />
                <span className="text-xs text-muted-foreground mt-1">years</span>
              </div>
              <div className="flex flex-col items-center">
                <label className="text-xs text-muted-foreground mb-2">Height</label>
                <input
                  type="number"
                  value={userData.height || ""}
                  onChange={(e) => setUserData({ ...userData, height: parseInt(e.target.value) || null })}
                  placeholder="175"
                  className="w-full h-12 text-center text-lg font-semibold rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none"
                />
                <span className="text-xs text-muted-foreground mt-1">cm</span>
              </div>
              <div className="flex flex-col items-center">
                <label className="text-xs text-muted-foreground mb-2">Weight</label>
                <input
                  type="number"
                  value={userData.weight || ""}
                  onChange={(e) => setUserData({ ...userData, weight: parseInt(e.target.value) || null })}
                  placeholder="70"
                  className="w-full h-12 text-center text-lg font-semibold rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none"
                />
                <span className="text-xs text-muted-foreground mt-1">kg</span>
              </div>
            </div>
          </motion.div>
        );

      case "activity":
        const activityOptions = [
          { id: "sedentary", label: "Not active", desc: "Desk job, little exercise", emoji: "🪑" },
          { id: "light", label: "Lightly active", desc: "Light exercise 1-2x/week", emoji: "🚶" },
          { id: "moderate", label: "Moderately active", desc: "Exercise 3-5x/week", emoji: "🏃" },
          { id: "very", label: "Very active", desc: "Hard exercise 6-7x/week", emoji: "💪" },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Activity level</h1>
            <p className="text-muted-foreground text-sm mb-6">How active are you typically?</p>
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {activityOptions.map((option) => (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserData({ ...userData, activityLevel: option.id })}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                    userData.activityLevel === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <div>
                    <span className="font-medium block">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.desc}</span>
                  </div>
                  {userData.activityLevel === option.id && (
                    <Check className="w-5 h-5 text-primary ml-auto" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case "macro-pref":
        const macroOptions = [
          { id: "balanced", label: "Balanced", desc: "40% carbs, 30% protein, 30% fat", icon: "⚖️" },
          { id: "high-protein", label: "High protein", desc: "30% carbs, 40% protein, 30% fat", icon: "💪" },
          { id: "low-carb", label: "Low carb", desc: "20% carbs, 35% protein, 45% fat", icon: "🥑" },
          { id: "custom", label: "Custom", desc: "Set your own macros later", icon: "⚙️" },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Macro preference</h1>
            <p className="text-muted-foreground text-sm mb-6">Choose your nutrition style</p>
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {macroOptions.map((option) => (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserData({ ...userData, macroPref: option.id })}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                    userData.macroPref === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <span className="font-medium block">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.desc}</span>
                  </div>
                  {userData.macroPref === option.id && (
                    <Check className="w-5 h-5 text-primary ml-auto" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case "dietary":
        const dietaryOptions = [
          { id: "vegetarian", label: "Vegetarian", emoji: "🥬" },
          { id: "vegan", label: "Vegan", emoji: "🌱" },
          { id: "no-pork", label: "No pork", emoji: "🐷" },
          { id: "no-lactose", label: "Lactose-free", emoji: "🥛" },
          { id: "no-gluten", label: "Gluten-free", emoji: "🌾" },
          { id: "none", label: "No restrictions", emoji: "✅" },
        ];
        const toggleDietary = (id: string) => {
          if (id === "none") {
            setUserData({ ...userData, dietaryPrefs: ["none"] });
          } else {
            const current = userData.dietaryPrefs.filter(p => p !== "none");
            if (current.includes(id)) {
              setUserData({ ...userData, dietaryPrefs: current.filter(p => p !== id) });
            } else {
              setUserData({ ...userData, dietaryPrefs: [...current, id] });
            }
          }
        };
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Dietary preferences</h1>
            <p className="text-muted-foreground text-sm mb-6">Select all that apply (optional)</p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {dietaryOptions.map((option) => (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleDietary(option.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    userData.dietaryPrefs.includes(option.id)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case "fridge-intro":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="relative mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-32 h-40 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl border-2 border-slate-300 shadow-lg relative overflow-hidden">
                {/* Scan effect */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-primary"
                  style={{ boxShadow: '0 0 10px hsl(var(--primary))' }}
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Food items */}
                <div className="absolute top-3 left-2 text-xl">🥛</div>
                <div className="absolute top-3 right-2 text-xl">🍎</div>
                <div className="absolute top-1/2 left-2 text-xl">🥕</div>
                <div className="absolute top-1/2 right-2 text-xl">🧀</div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xl">🥬</div>
              </div>
              <motion.div
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Camera className="w-6 h-6 text-primary-foreground" />
              </motion.div>
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Let's scan your fridge</h1>
            <p className="text-muted-foreground mb-6">
              Take a photo of your fridge and we'll suggest recipes based on what you have
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button onClick={goNext} className="w-full h-12 rounded-xl">
                <Camera className="w-5 h-5 mr-2" />
                Scan now
              </Button>
              <button
                onClick={goNext}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        );

      case "permissions":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <h1 className="text-2xl font-bold mb-2">Quick setup</h1>
            <p className="text-muted-foreground text-sm mb-6">Optional permissions to enhance your experience</p>
            
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {/* Camera permission */}
              <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block">Camera</span>
                    <span className="text-xs text-muted-foreground">For fridge scanning</span>
                  </div>
                </div>
                <button
                  onClick={() => setUserData({ ...userData, cameraPermission: !userData.cameraPermission })}
                  className={`w-12 h-7 rounded-full transition-colors ${
                    userData.cameraPermission ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow-sm"
                    animate={{ x: userData.cameraPermission ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Health sync options */}
              <button
                onClick={() => setUserData({ ...userData, healthSync: userData.healthSync === "apple" ? null : "apple" })}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  userData.healthSync === "apple" ? "border-red-500 bg-red-500/10" : "border-border bg-card"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Apple className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-left flex-1">
                  <span className="font-medium block">Apple Health</span>
                  <span className="text-xs text-muted-foreground">Sync weight & activity</span>
                </div>
                {userData.healthSync === "apple" && <Check className="w-5 h-5 text-red-500" />}
              </button>

              <button
                onClick={() => setUserData({ ...userData, healthSync: userData.healthSync === "google" ? null : "google" })}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  userData.healthSync === "google" ? "border-green-500 bg-green-500/10" : "border-border bg-card"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left flex-1">
                  <span className="font-medium block">Google Fit</span>
                  <span className="text-xs text-muted-foreground">Sync weight & activity</span>
                </div>
                {userData.healthSync === "google" && <Check className="w-5 h-5 text-green-500" />}
              </button>
            </div>
          </motion.div>
        );

      case "premium-hint":
        const premiumBenefits = [
          { icon: "✨", text: "Unlimited fridge scans" },
          { icon: "📅", text: "Weekly meal plans" },
          { icon: "🛒", text: "Smart shopping lists" },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <Sparkles className="w-7 h-7 text-primary" />
            </motion.div>
            
            <h1 className="text-2xl font-bold mb-1">Want even more?</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Premium unlocks the full experience
            </p>
            
            <div className="w-full max-w-xs p-4 rounded-2xl border border-border bg-card/50 mb-6">
              <div className="flex flex-col gap-3">
                {premiumBenefits.map((benefit, i) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-left"
                  >
                    <span className="text-lg">{benefit.icon}</span>
                    <span className="text-sm">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                7 days free, then €4.99/month
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button 
                onClick={goNext} 
                className="w-full h-12 rounded-xl"
              >
                Continue with Free
              </Button>
              <button
                onClick={goNext}
                className="text-primary text-sm font-medium hover:underline transition-all"
              >
                Try Premium free →
              </button>
            </div>
          </motion.div>
        );

      case "community":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="flex items-center gap-2 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {["👩‍🍳", "👨‍🍳", "🧑‍🍳", "👩", "👨"].map((emoji, i) => (
                <motion.div
                  key={i}
                  className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-xl"
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {emoji}
                </motion.div>
              ))}
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Join the community</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Share recipes, get inspiration, and connect with others
            </p>
            
            {/* Sample post preview */}
            <div className="w-full max-w-xs p-4 rounded-2xl border border-border bg-card mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm">👩‍🍳</div>
                <span className="text-sm font-medium">Sarah</span>
              </div>
              <p className="text-sm text-left text-muted-foreground">
                Just made this amazing low-carb pasta with what I had in my fridge! 🍝
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button onClick={goNext} variant="outline" className="w-full h-12 rounded-xl">
                <Users className="w-5 h-5 mr-2" />
                Join later
              </Button>
            </div>
          </motion.div>
        );

      case "done":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center mb-6"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.span
                className="text-5xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎉
              </motion.span>
            </motion.div>
            <h1 className="text-3xl font-bold mb-2">You're all set!</h1>
            <p className="text-muted-foreground mb-8">
              Your personalized meal planning journey starts now
            </p>
            <Button onClick={handleComplete} className="w-full max-w-xs h-12 rounded-xl">
              Go to dashboard
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background safe-area-inset"
    >
      {/* Header with progress and back button */}
      <div className="flex items-center justify-between p-4">
        {currentIndex > 0 ? (
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        
        {/* Progress bar */}
        <div className="flex-1 mx-4 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Skip button for optional steps */}
        {["dietary", "fridge-intro", "permissions", "community"].includes(currentStep) ? (
          <button
            onClick={goNext}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="w-full max-w-md"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom button (except for steps with custom buttons) */}
      {!["fridge-intro", "premium-hint", "community", "done"].includes(currentStep) && (
        <div className="p-6 pb-8">
          <Button
            onClick={goNext}
            disabled={!canProceed()}
            className={`w-full h-12 rounded-xl transition-opacity ${
              !canProceed() ? "opacity-50" : ""
            }`}
          >
            {currentStep === "welcome" ? "Get started" : "Continue"}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};
