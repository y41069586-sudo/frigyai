import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  User, Scale, Target, Flame, Camera, Plus, Trash2, 
  ChevronRight, Sparkles, TrendingDown, Pencil, Barcode,
  Armchair, Footprints, PersonStanding, Dumbbell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';
import { useFoodEntries, FoodEntry as DBFoodEntry } from '@/hooks/useFoodEntries';
import { MacroDisplay } from './MacroDisplay';
import { ScanSuccessOverlay } from './ScanSuccessOverlay';
import { BarcodeScanner } from './BarcodeScanner';
import { EditMacroGoalsDialog, FocusMacro } from './EditMacroGoalsDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { WheelPicker } from './WheelPicker';
import { WeightPicker } from './WeightPicker';

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
  image_url?: string;
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
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { recordActivity, checkAndAwardBadge } = useGamification();
  const { playSuccess, playClick, playScanStart } = useSoundEffects();
  const { settings: trackerSettings, saveSettings: saveTrackerSettings, resetSettings: resetTrackerSettings, isConfigured, loading: settingsLoading } = useTrackerSettings();
  const { entries: dbEntries, addEntry: addDbEntry, deleteEntry: deleteDbEntry, todayTotals } = useFoodEntries();
  
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
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showEditGoalsDialog, setShowEditGoalsDialog] = useState(false);
  const [focusMacro, setFocusMacro] = useState<FocusMacro>(null);
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

  // Sync macros to database
  const syncMacrosToDatabase = useCallback(async (entries: FoodEntry[]) => {
    if (!user) return;
    
    const totalCals = entries.reduce((sum, e) => sum + e.calories, 0);
    const totalProt = entries.reduce((sum, e) => sum + e.protein, 0);
    const totalCarb = entries.reduce((sum, e) => sum + e.carbs, 0);
    const totalFats = entries.reduce((sum, e) => sum + e.fat, 0);
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { error } = await supabase
        .from('daily_macros')
        .upsert({
          user_id: user.id,
          date: today,
          calories: totalCals,
          protein: totalProt,
          carbs: totalCarb,
          fat: totalFats,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
        });
      
      if (error) {
        console.error('Error syncing macros:', error);
      } else {
        console.log('[MACRO-SYNC] Synced to DB:', { calories: totalCals, protein: totalProt });
      }
    } catch (e) {
      console.error('Failed to sync macros:', e);
    }
  }, [user]);

  const saveFoodEntries = useCallback((entries: FoodEntry[]) => {
    localStorage.setItem('todayFood', JSON.stringify({
      date: new Date().toDateString(),
      entries,
    }));
    setFoodEntries(entries);
    
    // Sync to database
    syncMacrosToDatabase(entries);
  }, [syncMacrosToDatabase]);

  const analyzeFood = async (food: string, imageBase64?: string) => {
    setIsAnalyzing(true);
    if (imageBase64) {
      setAnalyzingImage(`data:image/jpeg;base64,${imageBase64}`);
      playScanStart();
    }
    try {
      const body: { food?: string; imageBase64?: string } = {};
      if (food && food.trim()) body.food = food.trim();
      if (imageBase64) body.imageBase64 = imageBase64;
      
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body,
      });

      if (error) throw error;

      // Save to database with image_url
      const savedEntry = await addDbEntry({
        name: data.name,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        image_url: data.image_url,
      });

      // Also update local state for immediate UI feedback
      const newEntry: FoodEntry = {
        id: savedEntry?.id || Date.now().toString(),
        name: data.name,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        image_url: data.image_url,
      };

      saveFoodEntries([...foodEntries, newEntry]);
      setFoodInput('');
      
      if (imageBase64) {
        setLastAnalyzedFood({
          name: data.name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
        });
        setShowSuccessOverlay(true);
        playSuccess();
      } else {
        toast({ title: t.foodAdded, description: `${data.name} - ${data.calories} kcal` });
        playClick();
      }
      
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
    navigate(`/food-entry/${entry.id}`);
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
      icon: PersonStanding,
      title: t.trackerYourBodyData,
      subtitle: t.trackerScrollToSet,
      content: (
        <div className="w-full">
          {/* Three wheel pickers side by side - like OnboardingFlow */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Height Picker */}
            <motion.div 
              className="rounded-2xl bg-background border-2 border-border overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
                <PersonStanding className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{t.trackerHeight}</span>
              </div>
              <WheelPicker
                value={userHeight}
                onChange={setUserHeight}
                min={60}
                max={220}
                step={1}
                unit="cm"
              />
            </motion.div>
            
            {/* Weight Picker */}
            <motion.div 
              className="rounded-2xl bg-background border-2 border-border overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
                <Scale className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{t.trackerWeight}</span>
              </div>
              <WheelPicker
                value={weight}
                onChange={setWeight}
                min={10}
                max={250}
                step={1}
                unit="kg"
              />
            </motion.div>
            
            {/* Age Picker */}
            <motion.div 
              className="rounded-2xl bg-background border-2 border-border overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-1.5 py-2 bg-muted/30 border-b border-border">
                <User className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{t.trackerAge}</span>
              </div>
              <WheelPicker
                value={age}
                onChange={setAge}
                min={10}
                max={100}
                step={1}
                unit={t.trackerYearsShort}
              />
            </motion.div>
          </div>
          
          <motion.div
            className="flex items-center gap-2 justify-center px-4 py-2 rounded-full bg-primary/5 border border-primary/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <span className="text-sm">🔒</span>
            <span className="text-xs text-muted-foreground/60">{t.trackerPrivate}</span>
          </motion.div>
        </div>
      ),
    },
    {
      icon: User,
      title: t.trackerYourGender,
      subtitle: t.trackerGenderImportant,
      content: (
        <div className="grid grid-cols-2 gap-4 w-full">
          {[
            { id: 'male' as const, label: t.trackerMale, color: 'from-blue-500/20 to-cyan-500/20' },
            { id: 'female' as const, label: t.trackerFemale, color: 'from-pink-500/20 to-rose-500/20' },
          ].map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGender(option.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all overflow-hidden ${
                gender === option.id
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-50`} />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-card/80 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium">{option.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      icon: Flame,
      title: t.trackerHowActive,
      subtitle: t.trackerForCalories,
      content: (
        <div className="space-y-3 w-full">
          {[
            { value: 1.2, label: t.trackerLowActive, desc: t.trackerLowActiveDesc, icon: Armchair, color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
            { value: 1.375, label: t.trackerLightActive, desc: t.trackerLightActiveDesc, icon: Footprints, color: 'text-green-500', bgColor: 'bg-green-500/20' },
            { value: 1.55, label: t.trackerModerateActive, desc: t.trackerModerateActiveDesc, icon: PersonStanding, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
            { value: 1.725, label: t.trackerVeryActive, desc: t.trackerVeryActiveDesc, icon: Dumbbell, color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
          ].map((level) => {
            const IconComponent = level.icon;
            return (
              <motion.button
                key={level.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActivityLevel(level.value)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${activityLevel === level.value ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${level.bgColor} flex items-center justify-center ${level.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">{level.label}</p>
                    <p className="text-sm text-muted-foreground">{level.desc}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      ),
    },
    {
      icon: Target,
      title: t.trackerYourGoal,
      subtitle: t.trackerLoseOrGain,
      content: (
        <div className="w-full space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setGoalMode('lose');
                setTargetWeight(Math.max(40, weight - 5));
              }}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                goalMode === 'lose' ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-lg font-bold block">{t.trackerLoseWeight}</span>
              <span className="text-xs text-muted-foreground/60">{t.trackerCalorieDeficit}</span>
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setGoalMode('gain');
                setTargetWeight(Math.min(200, weight + 5));
              }}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                goalMode === 'gain' ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-green-500 rotate-180" />
              </div>
              <span className="text-lg font-bold block">{t.trackerGainWeight}</span>
              <span className="text-xs text-muted-foreground/60">{t.trackerCalorieSurplus}</span>
            </motion.button>
          </div>
        </div>
      ),
    },
    {
      icon: Scale,
      title: t.trackerYourTargetWeight,
      subtitle: goalMode === 'lose' ? t.trackerHowMuchLose : t.trackerHowMuchGain,
      content: (
        <div className="w-full space-y-6">
          <motion.div 
            className="relative h-32 flex items-end justify-center gap-8 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex flex-col items-center">
              <motion.div 
                className="w-16 bg-muted-foreground/30 rounded-t-xl"
                initial={{ height: 0 }}
                animate={{ height: 70 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              />
              <span className="text-xs text-muted-foreground/60 mt-2">{t.trackerCurrent}</span>
              <span className="text-lg font-bold">{weight}kg</span>
            </div>
            
            <motion.div 
              className="flex items-center gap-1 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <span className="text-2xl">→</span>
            </motion.div>
            
            <div className="flex flex-col items-center">
              <motion.div 
                className="w-16 bg-primary rounded-t-xl"
                initial={{ height: 0 }}
                animate={{ height: goalMode === 'lose' ? 70 - weightDiff * 3 : 70 + weightDiff * 2 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                style={{ minHeight: 25, maxHeight: 100 }}
              />
              <span className="text-xs text-primary mt-2">{t.trackerGoalLabel}</span>
              <span className="text-lg font-bold text-primary">{targetWeight}kg</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="p-4 rounded-2xl bg-card border-2 border-border"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium">
                {goalMode === 'lose' ? t.trackerWeightLoss : t.trackerWeightGain}
              </span>
              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
                {goalMode === 'lose' ? '-' : '+'}{weightDiff}kg
              </div>
            </div>
            <input
              type="range" 
              min={goalMode === 'lose' ? Math.max(40, weight - 20) : weight} 
              max={goalMode === 'lose' ? weight - 1 : weight + 20} 
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseInt(e.target.value))}
              className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
          </motion.div>
        </div>
      ),
    },
    {
      icon: TrendingDown,
      title: t.trackerYourSpeed,
      subtitle: goalMode === 'lose' ? t.trackerHowFastLose : t.trackerHowFastGain,
      content: (
        <div className="w-full space-y-6">
          {/* Speed Value Display */}
          <div className="text-center">
            <span className="text-5xl font-bold text-primary">{weeklyLossRate.toFixed(1)}</span>
            <span className="text-xl text-muted-foreground ml-2">{t.trackerKgPerWeek}</span>
          </div>
          
          {/* Animal Icons */}
          <div className="relative h-20 flex items-end justify-between px-4">
            <div className={`transition-all duration-200 ${weeklyLossRate <= 0.5 ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`}>
              <AnimatedSloth isActive={weeklyLossRate <= 0.5} />
            </div>
            <div className={`transition-all duration-200 ${weeklyLossRate > 0.5 && weeklyLossRate <= 1.0 ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`}>
              <AnimatedRabbit isActive={weeklyLossRate > 0.5 && weeklyLossRate <= 1.0} />
            </div>
            <div className={`transition-all duration-200 ${weeklyLossRate > 1.0 ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}`}>
              <AnimatedCheetah isActive={weeklyLossRate > 1.0} />
            </div>
          </div>
          
          {/* Slider */}
          <div className="space-y-2 px-2">
            <Slider
              value={[weeklyLossRate * 100]}
              onValueChange={([v]) => setWeeklyLossRate(v / 100)}
              min={10}
              max={150}
              step={5}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t.trackerSlowSustainable}</span>
              <span>{t.trackerModerate}</span>
              <span>{t.trackerFast}</span>
            </div>
          </div>
          
          {/* Quick select */}
          <div className="flex gap-2 justify-center">
            {[0.3, 0.5, 0.8, 1.0, 1.2].map((speed) => (
              <button
                key={speed}
                onClick={() => setWeeklyLossRate(speed)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  Math.abs(weeklyLossRate - speed) < 0.05
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
          
          {/* Info based on speed */}
          <div className={`text-sm p-3 rounded-lg text-center ${weeklyLossRate > 1.0 ? 'bg-red-500/10 text-red-400' : weeklyLossRate > 0.75 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
            {weeklyLossRate > 1.0 && `⚠️ ${t.trackerHighDiscipline}`}
            {weeklyLossRate > 0.75 && weeklyLossRate <= 1.0 && "👍 " + t.trackerFast}
            {weeklyLossRate <= 0.75 && `✅ ${t.trackerRecommended}`}
          </div>
        </div>
      ),
    },
    {
      icon: Sparkles,
      title: t.yourPersonalPlan,
      subtitle: "Dein persönlicher Makro-Plan",
      content: (
        <div className="space-y-4 text-center w-full">
          <div className="p-6 bg-primary/10 rounded-2xl">
            <Flame className="h-12 w-12 mx-auto text-primary mb-2" />
            <p className="text-4xl font-bold text-primary">{targetCalories}</p>
            <p className="text-muted-foreground">{t.caloriesPerDay}</p>
          </div>
          
          <div className="text-sm text-muted-foreground bg-background/30 rounded-lg p-3 space-y-1">
            <p>{t.baseMetabolism}: ~{bmr.toFixed(0)} kcal</p>
            <p>{t.withActivity}: ~{tdee} kcal</p>
            <p>{goalMode === 'lose' ? t.deficit : 'Überschuss'}: {goalMode === 'lose' ? '-' : '+'}{Math.round(dailyAdjustment)} kcal/Tag</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-blue-400">{targetProtein}g</p>
              <p className="text-xs text-muted-foreground">{t.protein}</p>
            </div>
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-orange-400">{targetCarbs}g</p>
              <p className="text-xs text-muted-foreground">{t.carbs}</p>
            </div>
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-emerald-400">{targetFat}g</p>
              <p className="text-xs text-muted-foreground">{t.fat}</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Show loading state while fetching settings from database
  if (settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">{t.loading || 'Wird geladen...'}</p>
      </div>
    );
  }

  if (step === 'onboarding') {
    const currentStepData = onboardingSteps[onboardingStep];
    const Icon = currentStepData.icon;

    return (
      <div className="space-y-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-2">
          {onboardingSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === onboardingStep ? 'w-8 bg-primary' : 'w-1.5 bg-primary/30'
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
            <Card className="p-5 bg-card/90 backdrop-blur-xl border-border/30 shadow-lg">
              {/* Header */}
              <div className="flex flex-col items-center mb-4">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ duration: 0.4 }} 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3 shadow-lg"
                >
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </motion.div>
                
                <h3 className="text-xl font-bold text-center">{currentStepData.title}</h3>
                {currentStepData.subtitle && (
                  <p className="text-muted-foreground/50 text-xs mt-1">{currentStepData.subtitle}</p>
                )}
              </div>
              
              {/* Content */}
              <div className="min-h-[200px] flex flex-col justify-center">
                {currentStepData.content}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 mt-5 pt-4 border-t border-border/20">
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
                  className="flex-1"
                >
                  {onboardingStep < onboardingSteps.length - 1 ? (
                    <>{t.next} <ChevronRight className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>{t.letsGo} <Sparkles className="h-4 w-4 ml-1" /></>
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
      {/* Modern Macro Display */}
      <div className="space-y-3">
        <MacroDisplay
          calories={{ current: totalCalories, target: profile?.dailyCalories || 0 }}
          protein={{ current: totalProtein, target: profile?.dailyProtein || 0 }}
          carbs={{ current: totalCarbs, target: profile?.dailyCarbs || 0 }}
          fat={{ current: totalFat, target: profile?.dailyFat || 0 }}
          variant="full"
          onEditCalories={() => { setFocusMacro('calories'); setShowEditGoalsDialog(true); }}
          onEditProtein={() => { setFocusMacro('protein'); setShowEditGoalsDialog(true); }}
          onEditCarbs={() => { setFocusMacro('carbs'); setShowEditGoalsDialog(true); }}
          onEditFat={() => { setFocusMacro('fat'); setShowEditGoalsDialog(true); }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-primary"
          onClick={() => {
            setStep('onboarding');
            setOnboardingStep(0);
          }}
        >
          <Pencil className="h-3 w-3 mr-1.5" />
          {t.changeGoal}
        </Button>
      </div>

      {/* Edit Macro Goals Dialog */}
      <EditMacroGoalsDialog
        open={showEditGoalsDialog}
        onOpenChange={(open) => {
          setShowEditGoalsDialog(open);
          if (!open) setFocusMacro(null);
        }}
        currentGoals={{
          dailyCalories: profile?.dailyCalories || 2000,
          dailyProtein: profile?.dailyProtein || 150,
          dailyCarbs: profile?.dailyCarbs || 200,
          dailyFat: profile?.dailyFat || 70,
        }}
        focusMacro={focusMacro}
        onSave={async (goals) => {
          // Update profile state
          const newProfile = {
            ...profile!,
            dailyCalories: goals.dailyCalories,
            dailyProtein: goals.dailyProtein,
            dailyCarbs: goals.dailyCarbs,
            dailyFat: goals.dailyFat,
          };
          setProfile(newProfile);

          // Save to database
          await saveTrackerSettings({
            age: age,
            weight: weight,
            targetWeight: targetWeight,
            goalMode: goalMode,
            weeklyGoal: weeklyLossRate,
            dailyCalories: goals.dailyCalories,
            dailyProtein: goals.dailyProtein,
            dailyCarbs: goals.dailyCarbs,
            dailyFat: goals.dailyFat,
          });
        }}
      />

      {/* Add Food - Improved UX */}
      <Card className="p-4 bg-card border-border/30">
        <p className="font-semibold text-sm mb-3">{t.addFood}</p>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mb-3">
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            <Camera className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Foto</span>
          </motion.button>
          <motion.button
            onClick={() => setShowBarcodeScanner(true)}
            disabled={isAnalyzing}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            <Barcode className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-600">Barcode</span>
          </motion.button>
        </div>
        
        {/* Text Input */}
        <div className="flex gap-2">
          <Input
            placeholder={t.egTwoEggsWithToast}
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && foodInput && analyzeFood(foodInput)}
            disabled={isAnalyzing}
            className="h-11"
          />
          <Button
            onClick={() => foodInput && analyzeFood(foodInput)}
            disabled={isAnalyzing || !foodInput}
            className="shrink-0 h-11 px-4"
          >
            {isAnalyzing ? <span className="animate-spin">⏳</span> : <Plus className="h-4 w-4" />}
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

      {/* Food Entries - Improved Design */}
      <div className="space-y-2">
        {foodEntries.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">Heute gegessen</p>
            <p className="text-xs text-muted-foreground">{foodEntries.length} Einträge</p>
          </div>
        )}
        
        {foodEntries.map((entry, idx) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card 
              className="p-3 bg-card border-border/20 cursor-pointer hover:border-primary/30 transition-all active:scale-[0.99]"
              onClick={() => editEntry(entry)}
            >
              <div className="flex items-center gap-3">
                {/* Food Icon */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                  🍽️
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{entry.name}</span>
                    <Pencil className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{entry.time}</span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-red-500/70">{entry.protein}g P</span>
                    <span className="text-[10px] text-amber-500/70">{entry.carbs}g K</span>
                    <span className="text-[10px] text-blue-500/70">{entry.fat}g F</span>
                  </div>
                </div>
                
                {/* Calories */}
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-sm text-foreground">{entry.calories}</span>
                  <span className="text-[10px] text-muted-foreground ml-0.5">kcal</span>
                </div>
                
                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEntry(entry.id);
                  }}
                  className="h-8 w-8 text-muted-foreground/50 hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}

        {foodEntries.length === 0 && (
          <Card className="p-8 text-center bg-card/50 border-dashed border-border/50">
            <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
              <Flame className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">{t.nothingEatenToday}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t.addFirstFood}</p>
          </Card>
        )}
      </div>

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
