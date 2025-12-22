import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Battery, Zap, Coffee, ChefHat, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CookingPrefsSelectorProps {
  onConfirm: (cookingTime: number, mood: 'tired' | 'normal' | 'motivated') => void;
  onBack: () => void;
}

const CookingPrefsSelector = ({ onConfirm, onBack }: CookingPrefsSelectorProps) => {
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState<'tired' | 'normal' | 'motivated' | null>(null);
  const [step, setStep] = useState<'time' | 'mood'>('time');

  const timeOptions = [
    { value: 10, label: "10 Min", description: "Blitzschnell", icon: Zap },
    { value: 20, label: "20 Min", description: "Normal", icon: Clock },
    { value: 30, label: "Kein Stress", description: "Zeit lassen", icon: Coffee },
  ];

  const moodOptions = [
    { value: 'tired' as const, label: "Müde", description: "Minimaler Aufwand", icon: Battery },
    { value: 'normal' as const, label: "Normal", description: "Standard Kochen", icon: ChefHat },
    { value: 'motivated' as const, label: "Motiviert", description: "Gerne etwas mehr", icon: Zap },
  ];

  const handleTimeSelect = (time: number) => {
    setSelectedTime(time);
    setStep('mood');
  };

  const handleMoodSelect = (mood: 'tired' | 'normal' | 'motivated') => {
    setSelectedMood(mood);
  };

  const handleConfirm = () => {
    if (selectedTime && selectedMood) {
      onConfirm(selectedTime, selectedMood);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-4">
        <div className={`h-2 w-12 rounded-full transition-colors ${step === 'time' ? 'bg-primary' : 'bg-primary/30'}`} />
        <div className={`h-2 w-12 rounded-full transition-colors ${step === 'mood' ? 'bg-primary' : 'bg-primary/30'}`} />
      </div>

      {step === 'time' ? (
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
                      selectedTime === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
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
        </motion.div>
      ) : (
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
                      selectedMood === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
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

      {/* Back button (only on time step) */}
      {step === 'time' && (
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
