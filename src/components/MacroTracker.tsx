import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  User, Scale, Target, Flame, Camera, Plus, Trash2, 
  ChevronRight, Sparkles, TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';

interface FoodEntry {
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
}

export const MacroTracker = ({ onSetupComplete }: MacroTrackerProps) => {
  const { recordActivity, checkAndAwardBadge } = useGamification();
  const [step, setStep] = useState<'onboarding' | 'tracker'>(
    localStorage.getItem('userProfile') ? 'tracker' : 'onboarding'
  );
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(80);
  const [targetWeight, setTargetWeight] = useState(75);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : null;
  });
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const weightDiff = weight - targetWeight;
  const weeksToGoal = 4;
  
  // Mifflin-St Jeor BMR formula (assuming average height 170cm and moderate activity)
  const height = 170;
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5; // +5 for male, -161 for female
  const tdee = Math.round(bmr * 1.55); // Moderate activity multiplier
  
  // Calculate EXACT weekly loss based on user's goal - no cap!
  const weeklyLoss = weightDiff / weeksToGoal;
  
  // Calculate exact daily deficit: 7700 kcal = 1kg fat
  const dailyDeficit = (weeklyLoss * 7700) / 7;
  
  // Calculate target calories with minimum floor for safety
  const calculatedCalories = Math.round(tdee - dailyDeficit);
  const minCalories = age < 25 ? 1200 : age < 40 ? 1100 : 1000; // Lower minimum for aggressive goals
  const targetCalories = Math.max(minCalories, calculatedCalories);
  const isAtMinimum = calculatedCalories < minCalories;
  
  // Protein: 2g per kg body weight (important for muscle retention during weight loss)
  const targetProtein = Math.round(weight * 2);
  // Fat: 0.8-1g per kg (essential fats)
  const targetFat = Math.round(weight * 0.9);
  // Carbs: remaining calories
  const proteinCalories = targetProtein * 4;
  const fatCalories = targetFat * 9;
  const carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
  const targetCarbs = Math.round(carbCalories / 4);

  const saveProfile = () => {
    const newProfile = {
      age,
      weight,
      targetWeight,
      dailyCalories: targetCalories,
      dailyProtein: targetProtein,
      dailyCarbs: targetCarbs,
      dailyFat: targetFat,
    };
    localStorage.setItem('userProfile', JSON.stringify(newProfile));
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
    try {
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { food, imageBase64 },
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
      toast({ title: 'Essen hinzugefügt', description: `${data.name} - ${data.calories} kcal` });
      
      // Record activity for streak and award badge
      recordActivity();
      checkAndAwardBadge('meal_logged');
    } catch (error) {
      console.error('Error analyzing food:', error);
      toast({ title: 'Fehler', description: 'Konnte Essen nicht analysieren', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
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

  const totalCalories = foodEntries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = foodEntries.reduce((sum, e) => sum + e.protein, 0);
  const totalCarbs = foodEntries.reduce((sum, e) => sum + e.carbs, 0);
  const totalFat = foodEntries.reduce((sum, e) => sum + e.fat, 0);

  const onboardingSteps = [
    {
      icon: User,
      title: 'Wie alt bist du?',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-6xl font-bold text-primary">{age}</span>
            <span className="text-2xl text-muted-foreground ml-2">Jahre</span>
          </div>
          <Slider
            value={[age]}
            onValueChange={([v]) => setAge(v)}
            min={16}
            max={80}
            step={1}
            className="py-4"
          />
        </div>
      ),
    },
    {
      icon: Scale,
      title: 'Wie viel wiegst du?',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-6xl font-bold text-primary">{weight}</span>
            <span className="text-2xl text-muted-foreground ml-2">kg</span>
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
      icon: Target,
      title: 'Was ist dein Ziel in 4 Wochen?',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-6xl font-bold text-primary">{targetWeight}</span>
            <span className="text-2xl text-muted-foreground ml-2">kg</span>
          </div>
          <Slider
            value={[targetWeight]}
            onValueChange={([v]) => setTargetWeight(v)}
            min={40}
            max={weight}
            step={1}
            className="py-4"
          />
          <div className="flex items-center gap-2 justify-center text-muted-foreground">
            <TrendingDown className="h-5 w-5 text-primary" />
            <span>{weightDiff} kg abnehmen</span>
          </div>
        </div>
      ),
    },
    {
      icon: Sparkles,
      title: 'Dein persönlicher Plan',
      content: (
        <div className="space-y-4 text-center">
          <div className="p-6 bg-primary/10 rounded-2xl">
            <Flame className="h-12 w-12 mx-auto text-primary mb-2" />
            <p className="text-4xl font-bold text-primary">{targetCalories}</p>
            <p className="text-muted-foreground">Kalorien pro Tag</p>
          </div>
          
          <div className="text-sm text-muted-foreground bg-background/30 rounded-lg p-3 space-y-1">
            <p>Grundumsatz: ~{bmr.toFixed(0)} kcal</p>
            <p>Mit Aktivität: ~{tdee} kcal</p>
            <p>Defizit: -{Math.round(dailyDeficit)} kcal/Tag</p>
            <p className="text-xs">
              Ziel: {weightDiff}kg in 4 Wochen ({weeklyLoss.toFixed(2)}kg/Woche)
            </p>
          </div>
          
          {isAtMinimum && (
            <div className="text-sm">
              <p className="text-amber-400 bg-amber-500/10 p-2 rounded-lg text-xs">
                Kalorienziel auf {minCalories} kcal gesetzt für deine Gesundheit.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-red-400">{targetProtein}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
              <p className="text-[10px] text-muted-foreground/60">2g/kg</p>
            </div>
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-amber-400">{targetCarbs}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="p-3 bg-background/50 rounded-xl">
              <p className="text-lg font-bold text-blue-400">{targetFat}g</p>
              <p className="text-xs text-muted-foreground">Fett</p>
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
                    Zurück
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
                    <>Weiter <ChevronRight className="h-4 w-4 ml-1" /></>
                  ) : (
                    'Los geht\'s!'
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
            <p className="text-sm text-muted-foreground">Heute</p>
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
            Ziel ändern
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
            <p className="text-lg font-bold text-red-400">{totalProtein}g</p>
            <p className="text-xs text-muted-foreground">Protein</p>
          </div>
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <p className="text-lg font-bold text-amber-400">{totalCarbs}g</p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <p className="text-lg font-bold text-blue-400">{totalFat}g</p>
            <p className="text-xs text-muted-foreground">Fett</p>
          </div>
        </div>
      </Card>

      {/* Add Food */}
      <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
        <p className="font-semibold mb-3">Essen hinzufügen</p>
        <div className="flex gap-2">
          <Input
            placeholder="z.B. 2 Eier mit Toast"
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
          >
            <Camera className="h-4 w-4" />
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

      {/* Food Entries */}
      <div className="space-y-2">
        {foodEntries.map((entry, idx) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="p-3 bg-card/60 border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.name}</span>
                    <span className="text-xs text-muted-foreground">{entry.time}</span>
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
                  onClick={() => removeEntry(entry.id)}
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
            <p className="text-muted-foreground">Noch nichts gegessen heute</p>
            <p className="text-sm text-muted-foreground mt-1">Füge dein erstes Essen hinzu</p>
          </Card>
        )}
      </div>
    </div>
  );
};
