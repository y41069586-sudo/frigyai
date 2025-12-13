import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  User, Scale, Target, Flame, Camera, Plus, Trash2, 
  ChevronRight, Sparkles, TrendingDown, Pencil, Barcode
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';
import { EditFoodEntryDialog } from './EditFoodEntryDialog';
import { ScanSuccessOverlay } from './ScanSuccessOverlay';
import { BarcodeScanner } from './BarcodeScanner';
import { useLanguage } from '@/contexts/LanguageContext';

// Import animated animal components
import { AnimatedSloth, AnimatedRabbit, AnimatedCheetah } from './AnimatedAnimals';

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

interface UserProfile {
  age: number;
  weight: number;
  targetWeight: number;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

interface MacroTrackerProps {
  onSetupComplete?: () => void;
  onResetTracker?: () => void;
}

export const MacroTracker = ({ onSetupComplete, onResetTracker }: MacroTrackerProps) => {
  const { t } = useLanguage();
  const { recordActivity, checkAndAwardBadge } = useGamification();
  const { playSuccess, playClick, playScanStart } = useSoundEffects();
  const { settings: trackerSettings, saveSettings: saveTrackerSettings, resetSettings: resetTrackerSettings, isConfigured, loading: settingsLoading } = useTrackerSettings();
  
  const [step, setStep] = useState<'onboarding' | 'tracker'>('onboarding');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(80);
  const [userHeight, setUserHeight] = useState(170);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState(1.55); // Moderate
  const [weeklyLossRate, setWeeklyLossRate] = useState(0.75); // kg per week
  const [goalMode, setGoalMode] = useState<'lose' | 'gain'>('lose'); // New: lose or gain weight
  const [targetWeight, setTargetWeight] = useState(75);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Sync with database settings
  useEffect(() => {
    if (!settingsLoading) {
      if (isConfigured && trackerSettings) {
        setProfile({
          age: trackerSettings.age,
          weight: trackerSettings.weight,
          targetWeight: trackerSettings.targetWeight,
          dailyCalories: trackerSettings.dailyCalories,
          dailyProtein: trackerSettings.dailyProtein,
          dailyCarbs: trackerSettings.dailyCarbs,
          dailyFat: trackerSettings.dailyFat,
        });
        setStep('tracker');
        setAge(trackerSettings.age);
        setWeight(trackerSettings.weight);
        setTargetWeight(trackerSettings.targetWeight);
        setGoalMode(trackerSettings.goalMode);
        setWeeklyLossRate(trackerSettings.weeklyGoal);
      } else {
        setStep('onboarding');
        setProfile(null);
      }
    }
  }, [trackerSettings, isConfigured, settingsLoading]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>(() => {
    const saved = localStorage.getItem('todayFood');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === new Date().toDateString()) {
        return data.entries;
      }
    }
    return [];
  });
  const [foodInput, setFoodInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [lastAnalyzedFood, setLastAnalyzedFood] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animated analyzing messages - use translations
  const analyzingMessages = [
    t.analyzingFood,
    t.patienceMessage,
    t.calculatingCalories,
    t.determiningNutrients,
    t.almostDone
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (isAnalyzing && analyzingImage) {
      const interval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % analyzingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setCurrentMessageIndex(0);
    }
  }, [isAnalyzing, analyzingImage]);

  // Expose reset function to parent
  const resetTracker = async () => {
    await resetTrackerSettings();
    localStorage.removeItem('todayFood');
    setProfile(null);
    setFoodEntries([]);
    setStep('onboarding');
    setOnboardingStep(0);
    onResetTracker?.();
  };

  // Make resetTracker available via ref or callback
  useEffect(() => {
    // Store the reset function in window for chatbot access
    (window as any).__resetMacroTracker = resetTracker;
    return () => {
      delete (window as any).__resetMacroTracker;
    };
  }, []);

  // Mifflin-St Jeor BMR formula
  const bmr = gender === 'male' 
    ? 10 * weight + 6.25 * userHeight - 5 * age + 5 
    : 10 * weight + 6.25 * userHeight - 5 * age - 161;
  const tdee = Math.round(bmr * activityLevel);
  
  // Calculate based on user-selected weekly rate and goal mode
  const weightDiff = goalMode === 'lose' ? weight - targetWeight : targetWeight - weight;
  const weeksToGoal = weightDiff > 0 ? Math.ceil(weightDiff / weeklyLossRate) : 0;
  
  // Calculate daily adjustment: 7700 kcal = 1kg
  const dailyAdjustment = (weeklyLossRate * 7700) / 7;
  
  // Calculate target calories based on goal mode
  const calculatedCalories = goalMode === 'lose' 
    ? Math.round(tdee - dailyAdjustment)
    : Math.round(tdee + dailyAdjustment);
  const minCalories = age < 25 ? 1200 : age < 40 ? 1100 : 1000;
  const maxCalories = tdee + 1500; // Max surplus for gaining
  const targetCalories = goalMode === 'lose' 
    ? Math.max(minCalories, calculatedCalories)
    : Math.min(maxCalories, calculatedCalories);
  const isAtMinimum = goalMode === 'lose' && calculatedCalories < minCalories;
  
  // Protein: Higher for gaining (2.2g/kg), standard for losing (2g/kg)
  const targetProtein = Math.round(weight * (goalMode === 'gain' ? 2.2 : 2));
  // Fat: 0.8-1g per kg
  const targetFat = Math.round(weight * 0.9);
  // Carbs: remaining calories
  const proteinCalories = targetProtein * 4;
  const fatCalories = targetFat * 9;
  const carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
  const targetCarbs = Math.round(carbCalories / 4);

  const saveProfile = async () => {
    const newProfile = {
      age,
      weight,
      targetWeight,
      dailyCalories: targetCalories,
      dailyProtein: targetProtein,
      dailyCarbs: targetCarbs,
      dailyFat: targetFat,
    };
    
    // Save to database via hook
    await saveTrackerSettings({
      age,
      weight,
      targetWeight,
      goalMode,
      weeklyGoal: weeklyLossRate,
      dailyCalories: targetCalories,
      dailyProtein: targetProtein,
      dailyCarbs: targetCarbs,
      dailyFat: targetFat,
    });
    
    setProfile(newProfile);
    setStep('tracker');
    onSetupComplete?.();
  };

  const saveFoodEntries = (entries: FoodEntry[]) => {
    localStorage.setItem('todayFood', JSON.stringify({
      date: new Date().toDateString(),
      entries,
    }));
    setFoodEntries(entries);
  };

  const analyzeFood = async (food: string, imageBase64?: string) => {
    setIsAnalyzing(true);
    if (imageBase64) {
      setAnalyzingImage(`data:image/jpeg;base64,${imageBase64}`);
      playScanStart(); // Play scan start sound
    }
    try {
      // Only send non-empty food, or imageBase64
      const body: { food?: string; imageBase64?: string } = {};
      if (food && food.trim()) body.food = food.trim();
      if (imageBase64) body.imageBase64 = imageBase64;
      
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body,
      });

      if (error) throw error;

      const newEntry: FoodEntry = {
        id: Date.now().toString(),
        name: data.name,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      };

      saveFoodEntries([...foodEntries, newEntry]);
      setFoodInput('');
      
      // Show success overlay with confetti for image scans
      if (imageBase64) {
        setLastAnalyzedFood({
          name: data.name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
        });
        setShowSuccessOverlay(true);
        playSuccess(); // Play success sound
      } else {
        toast({ title: t.foodAdded, description: `${data.name} - ${data.calories} kcal` });
        playClick(); // Play click sound for text input
      }
      
      // Record activity for streak and award badge
      recordActivity();
      checkAndAwardBadge('meal_logged');
    } catch (error) {
      console.error('Error analyzing food:', error);
      toast({ title: t.error, description: t.couldNotAnalyzeFood, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
      setAnalyzingImage(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        analyzeFood('', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeEntry = (id: string) => {
    saveFoodEntries(foodEntries.filter(e => e.id !== id));
  };

  const editEntry = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setIsEditDialogOpen(true);
  };

  const saveEditedEntry = (updatedEntry: FoodEntry) => {
    const updatedEntries = foodEntries.map(e => 
      e.id === updatedEntry.id ? updatedEntry : e
    );
    saveFoodEntries(updatedEntries);
    toast({ title: t.entryUpdated, description: `${updatedEntry.name} - ${updatedEntry.calories} kcal` });
  };

  const handleBarcodeScanned = (food: { name: string; calories: number; protein: number; carbs: number; fat: number }) => {
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    };
    saveFoodEntries([...foodEntries, newEntry]);
    recordActivity();
    checkAndAwardBadge('meal_logged');
    playSuccess();
  };

  const totalCalories = foodEntries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = foodEntries.reduce((sum, e) => sum + e.protein, 0);
  const totalCarbs = foodEntries.reduce((sum, e) => sum + e.carbs, 0);
  const totalFat = foodEntries.reduce((sum, e) => sum + e.fat, 0);

  // Get speed label and emoji based on weeklyLossRate
  const getSpeedInfo = () => {
    if (weeklyLossRate <= 0.5) return { emoji: '🐢', label: 'Langsam & Nachhaltig', color: 'text-green-400' };
    if (weeklyLossRate <= 0.75) return { emoji: '🐇', label: 'Moderat', color: 'text-amber-400' };
    if (weeklyLossRate <= 1.0) return { emoji: '🐇', label: 'Schnell', color: 'text-orange-400' };
    return { emoji: '🐆', label: 'Sehr Schnell', color: 'text-red-400' };
  };
  const speedInfo = getSpeedInfo();

  const onboardingSteps = [
    {
      icon: User,
      title: t.howOldAreYou,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-6xl font-bold text-primary">{age}</span>
            <span className="text-2xl text-muted-foreground ml-2">{t.years}</span>
          </div>
          <Slider
            value={[age]}
            onValueChange={([v]) => setAge(v)}
            min={13}
            max={80}
            step={1}
            className="py-4"
          />
        </div>
      ),
    },
    {
      icon: User,
      title: "Geschlecht",
      content: (
        <div className="space-y-6">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setGender('male')}
              className={`p-6 rounded-2xl border-2 transition-all ${gender === 'male' ? 'border-primary bg-primary/20' : 'border-border'}`}
            >
              <span className="text-4xl">👨</span>
              <p className="mt-2 font-medium">Mann</p>
            </button>
            <button
              onClick={() => setGender('female')}
              className={`p-6 rounded-2xl border-2 transition-all ${gender === 'female' ? 'border-primary bg-primary/20' : 'border-border'}`}
            >
              <span className="text-4xl">👩</span>
              <p className="mt-2 font-medium">Frau</p>
            </button>
          </div>
        </div>
      ),
    },
    {
      icon: Scale,
      title: "Wie groß bist du?",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-6xl font-bold text-primary">{userHeight}</span>
            <span className="text-2xl text-muted-foreground ml-2">cm</span>
          </div>
          <Slider
            value={[userHeight]}
            onValueChange={([v]) => setUserHeight(v)}
            min={140}
            max={220}
            step={1}
            className="py-4"
          />
        </div>
      ),
    },
    {
      icon: Scale,
      title: t.howMuchDoYouWeigh,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-6xl font-bold text-primary">{weight}</span>
            <span className="text-2xl text-muted-foreground ml-2">{t.kg}</span>
          </div>
          <Slider
            value={[weight]}
            onValueChange={([v]) => setWeight(v)}
            min={40}
            max={200}
            step={1}
            className="py-4"
          />
        </div>
      ),
    },
    {
      icon: Flame,
      title: "Wie aktiv bist du?",
      content: (
        <div className="space-y-4">
          {[
            { value: 1.2, label: 'Wenig aktiv', desc: 'Bürojob, wenig Bewegung', emoji: '🪑' },
            { value: 1.375, label: 'Leicht aktiv', desc: '1-2x Sport pro Woche', emoji: '🚶' },
            { value: 1.55, label: 'Moderat aktiv', desc: '3-5x Sport pro Woche', emoji: '🏃' },
            { value: 1.725, label: 'Sehr aktiv', desc: '6-7x Sport pro Woche', emoji: '💪' },
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => setActivityLevel(level.value)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${activityLevel === level.value ? 'border-primary bg-primary/20' : 'border-border'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{level.emoji}</span>
                <div>
                  <p className="font-medium">{level.label}</p>
                  <p className="text-sm text-muted-foreground">{level.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ),
    },
    {
      icon: Target,
      title: "Was ist dein Ziel?",
      content: (
        <div className="space-y-6">
          {/* Goal Mode Selection */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setGoalMode('lose');
                setTargetWeight(Math.max(40, weight - 10));
              }}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${goalMode === 'lose' ? 'border-primary bg-primary/20' : 'border-border'}`}
            >
              <TrendingDown className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <p className="font-medium">Abnehmen</p>
              <p className="text-xs text-muted-foreground">Gewicht verlieren</p>
            </button>
            <button
              onClick={() => {
                setGoalMode('gain');
                setTargetWeight(Math.min(200, weight + 10));
              }}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${goalMode === 'gain' ? 'border-primary bg-primary/20' : 'border-border'}`}
            >
              <Scale className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <p className="font-medium">Zunehmen</p>
              <p className="text-xs text-muted-foreground">Masse aufbauen</p>
            </button>
          </div>
          
          {/* Target Weight */}
          <div className="text-center mt-6">
            <span className="text-6xl font-bold text-primary">{targetWeight}</span>
            <span className="text-2xl text-muted-foreground ml-2">{t.kg}</span>
          </div>
          <Slider
            value={[targetWeight]}
            onValueChange={([v]) => setTargetWeight(v)}
            min={goalMode === 'lose' ? Math.max(40, weight - 30) : weight}
            max={goalMode === 'lose' ? weight : Math.min(200, weight + 30)}
            step={1}
            className="py-4"
          />
          <div className="flex items-center gap-2 justify-center text-muted-foreground">
            {goalMode === 'lose' ? (
              <>
                <TrendingDown className="h-5 w-5 text-green-400" />
                <span>{weightDiff} {t.kg} abnehmen</span>
              </>
            ) : (
              <>
                <Scale className="h-5 w-5 text-blue-400" />
                <span>{weightDiff} {t.kg} zunehmen</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      icon: TrendingDown,
      title: goalMode === 'lose' ? "Wie schnell möchtest du abnehmen?" : "Wie schnell möchtest du zunehmen?",
      content: (
        <div className="space-y-6">
          {/* Speed Value Display */}
          <div className="text-center">
            <span className="text-5xl font-bold text-primary">{weeklyLossRate.toFixed(1)}</span>
            <span className="text-xl text-muted-foreground ml-2">kg/Woche</span>
          </div>
          
          {/* Icons - All 3 positioned without track */}
          <div className="relative h-28 mt-4 flex items-end justify-between px-4">
            {/* Walking Person - Left (slow) */}
            <div className="flex flex-col items-center">
              <AnimatedSloth isActive={weeklyLossRate <= 0.5} />
            </div>
            
            {/* Car - Center (medium) */}
            <div className="flex flex-col items-center">
              <AnimatedRabbit isActive={weeklyLossRate > 0.5 && weeklyLossRate <= 1.0} />
            </div>
            
            {/* Rocket - Right (fast) */}
            <div className="flex flex-col items-center">
              <AnimatedCheetah isActive={weeklyLossRate > 1.0} />
            </div>
          </div>
          
          {/* Slider */}
          <div className="space-y-2 px-2">
            <Slider
              value={[weeklyLossRate * 100]}
              onValueChange={([v]) => setWeeklyLossRate(v / 100)}
              min={30}
              max={140}
              step={5}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Langsam</span>
              <span>Moderat</span>
              <span>Schnell</span>
            </div>
          </div>
          
          {/* Info based on speed and mode */}
          <div className={`text-sm p-3 rounded-lg ${weeklyLossRate > 1.0 ? 'bg-red-500/10 text-red-400' : weeklyLossRate > 0.75 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
            {goalMode === 'lose' ? (
              <>
                {weeklyLossRate > 1.0 && "⚠️ Sehr ambitioniert! Kann schwer durchzuhalten sein."}
                {weeklyLossRate > 0.75 && weeklyLossRate <= 1.0 && "👍 Schnell aber machbar mit Disziplin."}
                {weeklyLossRate <= 0.75 && "✅ Nachhaltig und gesund - empfohlen!"}
              </>
            ) : (
              <>
                {weeklyLossRate > 1.0 && "⚠️ Sehr schneller Aufbau - mehr Fett möglich."}
                {weeklyLossRate > 0.75 && weeklyLossRate <= 1.0 && "👍 Guter Aufbau mit moderatem Überschuss."}
                {weeklyLossRate <= 0.75 && "✅ Lean Bulk - minimaler Fettansatz!"}
              </>
            )}
          </div>
          
        </div>
      ),
    },
    {
      icon: Sparkles,
      title: t.yourPersonalPlan,
      content: (
        <div className="space-y-4 text-center">
          <div className="p-6 bg-primary/10 rounded-2xl">
            <Flame className="h-12 w-12 mx-auto text-primary mb-2" />
            <p className="text-4xl font-bold text-primary">{targetCalories}</p>
            <p className="text-muted-foreground">{t.caloriesPerDay}</p>
          </div>
          
          <div className="text-sm text-muted-foreground bg-background/30 rounded-lg p-3 space-y-1">
            <p>{t.baseMetabolism}: ~{bmr.toFixed(0)} kcal</p>
            <p>{t.withActivity}: ~{tdee} kcal</p>
            <p>{goalMode === 'lose' ? t.deficit : 'Überschuss'}: {goalMode === 'lose' ? '-' : '+'}{Math.round(dailyAdjustment)} kcal/{t.today.toLowerCase()}</p>
            <p className="text-xs">
              {t.goal}: {weightDiff}{t.kg} {goalMode === 'lose' ? 'abnehmen' : 'zunehmen'} ({weeklyLossRate.toFixed(1)}{t.kg}/Woche)
            </p>
          </div>
          
          {isAtMinimum && (
            <div className="text-sm">
              <p className="text-amber-400 bg-amber-500/10 p-2 rounded-lg text-xs">
                {t.calorieGoalSet} {minCalories} kcal {t.forYourHealth}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-red-400">{targetProtein}g</p>
              <p className="text-xs text-muted-foreground">{t.protein}</p>
              <p className="text-[10px] text-muted-foreground/60">2g/{t.kg}</p>
            </div>
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-amber-400">{targetCarbs}g</p>
              <p className="text-xs text-muted-foreground">{t.carbs}</p>
            </div>
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-blue-400">{targetFat}g</p>
              <p className="text-xs text-muted-foreground">{t.fat}</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (step === 'onboarding') {
    const currentStep = onboardingSteps[onboardingStep];
    const Icon = currentStep.icon;

    return (
      <div className="space-y-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {onboardingSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === onboardingStep ? 'w-8 bg-primary' : 'w-2 bg-primary/30'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={onboardingStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 bg-card/80 backdrop-blur-lg border-primary/20">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-center mb-6">{currentStep.title}</h3>
              
              {currentStep.content}

              <div className="flex gap-3 mt-6">
                {onboardingStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setOnboardingStep(prev => prev - 1)}
                    className="flex-1"
                  >
                    {t.back}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (onboardingStep < onboardingSteps.length - 1) {
                      setOnboardingStep(prev => prev + 1);
                    } else {
                      saveProfile();
                    }
                  }}
                  className="flex-1 glow-button"
                >
                  {onboardingStep < onboardingSteps.length - 1 ? (
                    <>{t.next} <ChevronRight className="h-4 w-4 ml-1" /></>
                  ) : (
                    t.letsGo
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Daily Summary */}
      <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">{t.today}</p>
            <p className="text-2xl font-bold">
              <span className={totalCalories > (profile?.dailyCalories || 0) ? 'text-red-500' : 'text-primary'}>
                {totalCalories}
              </span>
              <span className="text-muted-foreground text-lg"> / {profile?.dailyCalories} kcal</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('userProfile');
              setStep('onboarding');
              setOnboardingStep(0);
            }}
          >
            {t.changeGoal}
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-background/50 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${totalCalories > (profile?.dailyCalories || 0) ? 'bg-red-500' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalCalories / (profile?.dailyCalories || 1)) * 100, 100)}%` }}
          />
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <p className="text-lg font-bold">
              <span className={totalProtein > (profile?.dailyProtein || 0) ? 'text-red-400' : 'text-red-400'}>{totalProtein}</span>
              <span className="text-muted-foreground text-sm"> / {profile?.dailyProtein}g</span>
            </p>
            <p className="text-xs text-muted-foreground">{t.protein}</p>
          </div>
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <p className="text-lg font-bold">
              <span className={totalCarbs > (profile?.dailyCarbs || 0) ? 'text-red-400' : 'text-amber-400'}>{totalCarbs}</span>
              <span className="text-muted-foreground text-sm"> / {profile?.dailyCarbs}g</span>
            </p>
            <p className="text-xs text-muted-foreground">{t.carbs}</p>
          </div>
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <p className="text-lg font-bold">
              <span className={totalFat > (profile?.dailyFat || 0) ? 'text-red-400' : 'text-blue-400'}>{totalFat}</span>
              <span className="text-muted-foreground text-sm"> / {profile?.dailyFat}g</span>
            </p>
            <p className="text-xs text-muted-foreground">{t.fat}</p>
          </div>
        </div>
      </Card>

      {/* Add Food */}
      <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
        <p className="font-semibold mb-3">{t.addFood}</p>
        <div className="flex gap-2">
          <Input
            placeholder={t.egTwoEggsWithToast}
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && foodInput && analyzeFood(foodInput)}
            disabled={isAnalyzing}
          />
          <Button
            onClick={() => foodInput && analyzeFood(foodInput)}
            disabled={isAnalyzing || !foodInput}
            className="shrink-0"
          >
            {isAnalyzing ? <span className="animate-spin">⏳</span> : <Plus className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="shrink-0"
            title={t.takePhoto}
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowBarcodeScanner(true)}
            disabled={isAnalyzing}
            className="shrink-0"
            title={t.scanBarcode}
          >
            <Barcode className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </Card>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onFoodScanned={handleBarcodeScanned}
      />

      {/* Analyzing State with Image Preview */}
      <AnimatePresence>
        {isAnalyzing && analyzingImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden"
          >
            {/* Background Image with Dark Overlay */}
            <div className="relative aspect-video w-full">
              <img
                src={analyzingImage}
                alt="Analyzing food"
                className="w-full h-full object-cover"
              />
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-black/60" />
              
              {/* Neon Glow Border */}
              <div 
                className="absolute inset-0 rounded-2xl"
                style={{
                  boxShadow: 'inset 0 0 30px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.3)',
                  border: '2px solid rgba(34, 197, 94, 0.5)'
                }}
              />
              
              {/* Scanning Line Animation */}
              <motion.div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                initial={{ top: 0 }}
                animate={{ top: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                {/* Pulsing Icon */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mb-4"
                >
                  <div 
                    className="p-4 rounded-full bg-primary/20 backdrop-blur-sm"
                    style={{ boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)' }}
                  >
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </motion.div>
                
                {/* Animated Messages */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="text-lg font-medium text-white text-center"
                    style={{ textShadow: '0 0 20px rgba(34, 197, 94, 0.8)' }}
                  >
                    {analyzingMessages[currentMessageIndex]}
                  </motion.p>
                </AnimatePresence>
                
                {/* Loading Dots */}
                <div className="flex gap-2 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Food Entries */}
      <div className="space-y-2">
        {foodEntries.map((entry, idx) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card 
              className="p-3 bg-card/60 border-primary/10 cursor-pointer hover:bg-card/80 transition-colors"
              onClick={() => editEntry(entry)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.name}</span>
                    <span className="text-xs text-muted-foreground">{entry.time}</span>
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>{entry.calories} kcal</span>
                    <span className="text-red-400">{entry.protein}g P</span>
                    <span className="text-amber-400">{entry.carbs}g K</span>
                    <span className="text-blue-400">{entry.fat}g F</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEntry(entry.id);
                  }}
                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}

        {foodEntries.length === 0 && (
          <Card className="p-8 text-center bg-card/60 border-primary/10">
            <Flame className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t.nothingEatenToday}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.addFirstFood}</p>
          </Card>
        )}
      </div>

      {/* Edit Food Entry Dialog */}
      <EditFoodEntryDialog
        entry={editingEntry}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={saveEditedEntry}
      />

      {/* Success Overlay after successful scan */}
      <ScanSuccessOverlay
        isVisible={showSuccessOverlay}
        foodName={lastAnalyzedFood?.name || ''}
        calories={lastAnalyzedFood?.calories || 0}
        protein={lastAnalyzedFood?.protein || 0}
        carbs={lastAnalyzedFood?.carbs || 0}
        fat={lastAnalyzedFood?.fat || 0}
        onComplete={() => setShowSuccessOverlay(false)}
      />
    </div>
  );
};
