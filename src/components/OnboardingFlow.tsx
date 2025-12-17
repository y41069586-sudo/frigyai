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
  | "problem-pain"
  | "transformation"
  | "social-proof"
  | "feature-scan"
  | "feature-plans"
  | "feature-tracking"
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
    "problem-pain",
    "transformation",
    "social-proof",
    "feature-scan",
    "feature-plans",
    "feature-tracking",
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

      case "problem-pain":
        const painPoints = [
          { emoji: "🤔", text: "No idea what to cook", stat: "67%", statDesc: "give up on healthy eating" },
          { emoji: "🗑️", text: "Food going bad", stat: "40%", statDesc: "of groceries wasted" },
          { emoji: "📊", text: "Losing track", stat: "82%", statDesc: "underestimate calories" },
          { emoji: "💸", text: "Overspending", stat: "€120", statDesc: "wasted monthly" },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-3xl">😩</span>
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Sound familiar?</h1>
            <p className="text-muted-foreground text-sm mb-6">You're not alone</p>
            
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-4">
              {painPoints.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.12 }}
                  className="relative p-3 rounded-xl bg-red-500/5 border border-red-500/20 overflow-hidden"
                >
                  {/* Animated background bar */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-500/20 to-transparent"
                    initial={{ height: 0 }}
                    animate={{ height: "60%" }}
                    transition={{ delay: i * 0.12 + 0.3, duration: 0.6 }}
                  />
                  <div className="relative z-10">
                    <span className="text-2xl block mb-1">{item.emoji}</span>
                    <motion.span
                      className="text-xl font-bold text-red-500 block"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.12 + 0.4 }}
                    >
                      {item.stat}
                    </motion.span>
                    <span className="text-[10px] text-muted-foreground leading-tight block">
                      {item.statDesc}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-muted-foreground text-sm"
            >
              We've got the solution. <span className="font-medium text-foreground">→</span>
            </motion.p>
          </motion.div>
        );

      case "transformation":
        // Animated comparison data
        const comparisonStats = [
          { label: "Food Waste", without: 85, withApp: 15, unit: "%", goodIsLow: true },
          { label: "Macro Goals Hit", without: 25, withApp: 92, unit: "%", goodIsLow: false },
          { label: "Money Saved", without: 0, withApp: 75, unit: "€/mo", goodIsLow: false },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4"
            >
              <Sparkles className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">The FrigBuddy Effect</h1>
            <p className="text-muted-foreground text-sm mb-6">Real results from real users</p>
            
            {/* Animated Bar Charts */}
            <div className="w-full max-w-sm space-y-5 mb-6">
              {comparisonStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{stat.label}</span>
                  </div>
                  
                  {/* Comparison bars container */}
                  <div className="flex gap-3 items-end h-16">
                    {/* Without bar */}
                    <div className="flex-1 flex flex-col items-center">
                      <motion.div
                        className="w-full rounded-t-lg bg-red-500/20 relative overflow-hidden"
                        initial={{ height: 0 }}
                        animate={{ height: `${(stat.goodIsLow ? stat.without : stat.without) * 0.6}px` }}
                        transition={{ delay: index * 0.2 + 0.3, duration: 0.8, ease: "easeOut" }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-red-500/40 to-red-500/10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.2 + 0.5 }}
                        />
                      </motion.div>
                      <motion.span
                        className="text-xs text-red-500 font-bold mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.2 + 0.6 }}
                      >
                        {stat.without}{stat.unit === "€/mo" ? "€" : stat.unit}
                      </motion.span>
                      <span className="text-[10px] text-muted-foreground">Without</span>
                    </div>
                    
                    {/* With FrigBuddy bar */}
                    <div className="flex-1 flex flex-col items-center">
                      <motion.div
                        className="w-full rounded-t-lg bg-primary/20 relative overflow-hidden"
                        initial={{ height: 0 }}
                        animate={{ height: `${stat.withApp * 0.6}px` }}
                        transition={{ delay: index * 0.2 + 0.5, duration: 0.8, ease: "easeOut" }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-primary/60 to-primary/20"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.2 + 0.7 }}
                        />
                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ delay: index * 0.2 + 1, duration: 0.6 }}
                        />
                      </motion.div>
                      <motion.span
                        className="text-xs text-primary font-bold mt-1"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.2 + 0.8, type: "spring" }}
                      >
                        {stat.withApp}{stat.unit === "€/mo" ? "€" : stat.unit}
                      </motion.span>
                      <span className="text-[10px] text-primary font-medium">FrigBuddy</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Animated percentage progress summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="w-full max-w-sm p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/15 border border-primary/20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Average User Success</span>
                <motion.span
                  className="text-lg font-bold text-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                >
                  94%
                </motion.span>
              </div>
              <div className="h-3 bg-background/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "94%" }}
                  transition={{ delay: 1.5, duration: 1, ease: "easeOut" }}
                />
              </div>
              <motion.p
                className="text-xs text-muted-foreground mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
              >
                hit their nutrition goals within 4 weeks
              </motion.p>
            </motion.div>
          </motion.div>
        );

      case "social-proof":
        const testimonials = [
          { name: "Lisa M.", text: "Lost 8kg in 2 months! The meal plans are 🔥", avatar: "👩" },
          { name: "Tom K.", text: "Finally hitting my protein goals daily", avatar: "👨" },
          { name: "Sarah", text: "No more food waste. Saving €50/month!", avatar: "👩‍🦰" },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map((_, i) => (
                <motion.span 
                  key={i} 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-yellow-500 text-xl"
                >
                  ⭐
                </motion.span>
              ))}
            </div>
            <h1 className="text-2xl font-bold mb-1">4.9 out of 5</h1>
            <p className="text-muted-foreground text-sm mb-6">From 12,000+ reviews</p>
            
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <span className="font-medium text-sm block">{t.name}</span>
                    <span className="text-muted-foreground text-xs">{t.text}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "feature-scan":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Camera className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Magic Fridge Scan</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Just point your camera. AI does the rest.
            </p>
            <div className="w-full max-w-xs p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-20 bg-slate-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🧊</span>
                  </div>
                  <motion.div
                    className="absolute inset-0 border-2 border-primary rounded-lg"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <div className="flex-1">
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-2xl mb-1"
                  >
                    →
                  </motion.div>
                </div>
                <div className="text-left">
                  <div className="text-xs space-y-1">
                    <p>🥛 Milk</p>
                    <p>🥕 Carrots</p>
                    <p>🧀 Cheese</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-primary">2 seconds</span> to scan · Instant recipes
            </p>
          </motion.div>
        );

      case "feature-plans":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Utensils className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Weekly Meal Plans</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Perfectly matched to YOUR macros
            </p>
            <div className="w-full max-w-xs space-y-2 mb-4">
              {["Mon", "Tue", "Wed"].map((day, i) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-xl bg-card border border-border"
                >
                  <span className="w-10 text-xs font-medium text-muted-foreground">{day}</span>
                  <div className="flex gap-2 flex-1">
                    <span className="text-sm">🥣</span>
                    <span className="text-sm">🥗</span>
                    <span className="text-sm">🍝</span>
                  </div>
                  <span className="text-xs text-primary font-medium">1,850 kcal</span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-generated <span className="font-medium text-foreground">shopping list</span> included
            </p>
          </motion.div>
        );

      case "feature-tracking":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Hit Your Goals</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Track everything in one place
            </p>
            <div className="w-full max-w-xs p-4 rounded-2xl bg-card border border-border mb-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Calories", value: "1,650", target: "2,000", color: "bg-blue-500" },
                  { label: "Protein", value: "98g", target: "120g", color: "bg-red-500" },
                  { label: "Water", value: "1.5L", target: "2L", color: "bg-cyan-500" },
                  { label: "Streak", value: "7 days", target: "", color: "bg-orange-500" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold">{item.value}</span>
                    {item.target && <span className="text-xs text-muted-foreground">/{item.target}</span>}
                  </motion.div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">Gamified</span> progress keeps you motivated
            </p>
          </motion.div>
        );

      case "premium-hint":
        const premiumBenefits = [
          { icon: "♾️", text: "Unlimited fridge scans", desc: "Scan as much as you want" },
          { icon: "📅", text: "Weekly meal plans", desc: "Personalized to your macros" },
          { icon: "🛒", text: "Smart shopping lists", desc: "Auto-generated, never forget" },
          { icon: "🤖", text: "AI nutrition coach", desc: "24/7 help & tips" },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center px-6 w-full"
          >
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-bold mb-1">Unlock everything</h1>
            <p className="text-muted-foreground text-sm mb-4">
              Join 50,000+ members hitting their goals
            </p>
            
            <div className="w-full max-w-xs p-4 rounded-2xl border-2 border-primary bg-primary/5 mb-4">
              <div className="flex flex-col gap-3">
                {premiumBenefits.map((benefit, i) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-left"
                  >
                    <span className="text-xl">{benefit.icon}</span>
                    <div>
                      <span className="text-sm font-medium block">{benefit.text}</span>
                      <span className="text-xs text-muted-foreground">{benefit.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-primary/20">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold">€4.99</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-primary font-medium mt-1">
                  First 7 days FREE · Cancel anytime
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button 
                onClick={goNext} 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
              >
                Start 7-Day Free Trial
              </Button>
              <button
                onClick={goNext}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Continue with Free (2 scans/day)
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
