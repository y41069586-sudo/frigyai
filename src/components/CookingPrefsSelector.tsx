import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Battery, Zap, Coffee, ChefHat, ArrowRight, Flame, Heart, Frown, Smile, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MacroBudget {
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
}

interface CookingPrefsSelectorProps {
  onConfirm: (cookingTime: number, mood: 'tired' | 'normal' | 'motivated' | 'stressed') => void;
  onBack: () => void;
  macroBudget?: MacroBudget;
}

const CookingPrefsSelector = ({ onConfirm, onBack, macroBudget }: CookingPrefsSelectorProps) => {
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState<'tired' | 'normal' | 'motivated' | 'stressed' | null>(null);
  const [step, setStep] = useState<'budget' | 'time' | 'mood'>('budget');

  // Skip budget step if no budget available
  useEffect(() => {
    if (!macroBudget) {
      setStep('time');
    }
  }, [macroBudget]);

  const timeOptions = [
    { value: 15, label: "15 Min", description: "Blitzschnell", icon: Zap, color: "text-yellow-500" },
    { value: 30, label: "30 Min", description: "Normal", icon: Clock, color: "text-blue-500" },
    { value: 45, label: "45 Min", description: "Entspannt", icon: Coffee, color: "text-green-500" },
    { value: 60, label: "60 Min", description: "Ausführlich", icon: ChefHat, color: "text-purple-500" },
  ];

  const moodOptions = [
    { value: 'stressed' as const, label: "Gestresst", description: "Einfach & schnell", icon: Frown, color: "text-red-500" },
    { value: 'tired' as const, label: "Müde", description: "Minimaler Aufwand", icon: Battery, color: "text-orange-500" },
    { value: 'normal' as const, label: "Neutral", description: "Standard Kochen", icon: Smile, color: "text-blue-500" },
    { value: 'motivated' as const, label: "Motiviert", description: "Gerne mehr Aufwand", icon: Flame, color: "text-green-500" },
  ];

  const handleBudgetContinue = () => {
    setStep('time');
  };

  const handleTimeSelect = (time: number) => {
    setSelectedTime(time);
    setStep('mood');
  };

  const handleMoodSelect = (mood: 'tired' | 'normal' | 'motivated' | 'stressed') => {
    setSelectedMood(mood);
  };

  const handleConfirm = () => {
    if (selectedTime && selectedMood) {
      onConfirm(selectedTime, selectedMood);
    }
  };

  const getStepNumber = () => {
    if (!macroBudget) return step === 'time' ? 1 : 2;
    return step === 'budget' ? 1 : step === 'time' ? 2 : 3;
  };

  const totalSteps = macroBudget ? 3 : 2;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-4">
        {macroBudget && (
          <div className={`h-2 w-10 rounded-full transition-colors ${step === 'budget' ? 'bg-primary' : 'bg-primary/30'}`} />
        )}
        <div className={`h-2 w-10 rounded-full transition-colors ${step === 'time' ? 'bg-primary' : 'bg-primary/30'}`} />
        <div className={`h-2 w-10 rounded-full transition-colors ${step === 'mood' ? 'bg-primary' : 'bg-primary/30'}`} />
      </div>

      {/* Budget Step */}
      {step === 'budget' && macroBudget && (
        <motion.div
          key="budget"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Dein Tages-Budget</h2>
            <p className="text-muted-foreground">So viel hast du noch übrig</p>
          </div>

          <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold">Verbleibende Makros</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-background/60 text-center">
                <p className="text-2xl font-bold text-primary">{macroBudget.remainingCalories}</p>
                <p className="text-xs text-muted-foreground">Kalorien</p>
              </div>
              <div className="p-3 rounded-xl bg-background/60 text-center">
                <p className="text-2xl font-bold text-blue-500">{macroBudget.remainingProtein}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="p-3 rounded-xl bg-background/60 text-center">
                <p className="text-2xl font-bold text-amber-500">{macroBudget.remainingCarbs}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="p-3 rounded-xl bg-background/60 text-center">
                <p className="text-2xl font-bold text-rose-500">{macroBudget.remainingFat}g</p>
                <p className="text-xs text-muted-foreground">Fett</p>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground mt-4">
              Die KI generiert Rezepte, die in dieses Budget passen
            </p>
          </Card>

          <Button
            onClick={handleBudgetContinue}
            className="w-full gradient-neon text-black font-semibold h-12"
          >
            Weiter zur Zeitauswahl
          </Button>
        </motion.div>
      )}

      {step === 'time' && (
        <motion.div
          key="time"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Wie viel Zeit hast du?</h2>
            <p className="text-muted-foreground">Ich passe das Rezept an</p>
          </div>

          <div className="grid gap-3">
            {timeOptions.map((option) => (
              <motion.div
                key={option.value}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedTime === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                  onClick={() => handleTimeSelect(option.value)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      selectedTime === option.value ? 'bg-primary text-primary-foreground' : `bg-muted ${option.color}`
                    }`}>
                      <option.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    <ArrowRight className={`h-5 w-5 transition-opacity ${
                      selectedTime === option.value ? 'opacity-100 text-primary' : 'opacity-0'
                    }`} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Back button for time step */}
          {macroBudget && (
            <Button
              variant="ghost"
              onClick={() => setStep('budget')}
              className="w-full text-muted-foreground"
            >
              Zurück zum Budget
            </Button>
          )}
        </motion.div>
      )}

      {step === 'mood' && (
        <motion.div
          key="mood"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Wie fühlst du dich?</h2>
            <p className="text-muted-foreground">Bestimmt den Aufwand</p>
          </div>

          <div className="grid gap-3">
            {moodOptions.map((option) => (
              <motion.div
                key={option.value}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedMood === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                  onClick={() => handleMoodSelect(option.value)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      selectedMood === option.value ? 'bg-primary text-primary-foreground' : `bg-muted ${option.color}`
                    }`}>
                      <option.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep('time')}
              className="flex-1"
            >
              Zurück
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedMood}
              className="flex-1 gradient-neon text-black font-semibold"
            >
              Los geht's!
            </Button>
          </div>
        </motion.div>
      )}

      {/* Back button (only on first step) */}
      {((step === 'time' && !macroBudget) || (step === 'budget' && macroBudget)) && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full text-muted-foreground"
        >
          Andere Zutaten wählen
        </Button>
      )}
    </div>
  );
};

export default CookingPrefsSelector;
