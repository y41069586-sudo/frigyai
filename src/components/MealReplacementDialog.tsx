import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Sun, Moon, Coffee, Utensils, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MealReplacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mealType: string, dayOffset: number) => void;
  recipeName: string;
}

const MealReplacementDialog = ({
  open,
  onOpenChange,
  onConfirm,
  recipeName,
}: MealReplacementDialogProps) => {
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);

  const mealOptions = [
    { value: "Frühstück", label: "Frühstück", icon: Coffee, time: "7:00 - 10:00" },
    { value: "Mittagessen", label: "Mittagessen", icon: Sun, time: "12:00 - 14:00" },
    { value: "Abendessen", label: "Abendessen", icon: Moon, time: "18:00 - 20:00" },
    { value: "Snack", label: "Snack", icon: Utensils, time: "Zwischendurch" },
  ];

  const dayOptions = [
    { value: 0, label: "Heute" },
    { value: 1, label: "Morgen" },
    { value: 2, label: "Übermorgen" },
  ];

  const handleConfirm = () => {
    if (selectedMeal) {
      onConfirm(selectedMeal, selectedDay);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Wochenplan aktualisieren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recipe Preview */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <p className="text-sm text-muted-foreground">Rezept hinzufügen:</p>
            <p className="font-semibold text-primary">{recipeName}</p>
          </div>

          {/* Day Selection */}
          <div>
            <p className="text-sm font-medium mb-3">Welcher Tag?</p>
            <div className="flex gap-2">
              {dayOptions.map((day) => (
                <Button
                  key={day.value}
                  variant={selectedDay === day.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDay(day.value)}
                  className="flex-1"
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Meal Selection */}
          <div>
            <p className="text-sm font-medium mb-3">Welche Mahlzeit ersetzen?</p>
            <div className="grid grid-cols-2 gap-2">
              {mealOptions.map((meal) => (
                <motion.div key={meal.value} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={`p-3 cursor-pointer transition-all border-2 ${
                      selectedMeal === meal.value
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedMeal(meal.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          selectedMeal === meal.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <meal.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{meal.label}</p>
                        <p className="text-xs text-muted-foreground">{meal.time}</p>
                      </div>
                      {selectedMeal === meal.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={!selectedMeal}
            className="w-full gradient-neon text-black font-semibold"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Im Wochenplan speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealReplacementDialog;
