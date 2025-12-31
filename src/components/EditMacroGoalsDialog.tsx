import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame, Dumbbell, Wheat, Droplets, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface MacroGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

interface EditMacroGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoals: MacroGoals;
  onSave: (goals: MacroGoals) => void;
}

export const EditMacroGoalsDialog = ({
  open,
  onOpenChange,
  currentGoals,
  onSave,
}: EditMacroGoalsDialogProps) => {
  const { t, language } = useLanguage();
  const [calories, setCalories] = useState(currentGoals.dailyCalories);
  const [protein, setProtein] = useState(currentGoals.dailyProtein);
  const [carbs, setCarbs] = useState(currentGoals.dailyCarbs);
  const [fat, setFat] = useState(currentGoals.dailyFat);

  // Sync state when dialog opens with new values
  useEffect(() => {
    if (open) {
      setCalories(currentGoals.dailyCalories);
      setProtein(currentGoals.dailyProtein);
      setCarbs(currentGoals.dailyCarbs);
      setFat(currentGoals.dailyFat);
    }
  }, [open, currentGoals]);

  const handleSave = () => {
    if (calories < 800 || calories > 10000) {
      toast({
        title: language === 'de' ? 'Ungültiger Wert' : language === 'fr' ? 'Valeur invalide' : 'Invalid value',
        description: language === 'de' ? 'Kalorien müssen zwischen 800 und 10000 liegen' : language === 'fr' ? 'Les calories doivent être entre 800 et 10000' : 'Calories must be between 800 and 10000',
        variant: 'destructive',
      });
      return;
    }

    onSave({
      dailyCalories: Math.round(calories),
      dailyProtein: Math.round(protein),
      dailyCarbs: Math.round(carbs),
      dailyFat: Math.round(fat),
    });

    toast({
      title: language === 'de' ? 'Ziele gespeichert!' : language === 'fr' ? 'Objectifs sauvegardés!' : 'Goals saved!',
      description: language === 'de' ? 'Deine neuen Makroziele wurden übernommen.' : language === 'fr' ? 'Vos nouveaux objectifs macro ont été appliqués.' : 'Your new macro goals have been applied.',
    });

    onOpenChange(false);
  };

  const macros = [
    {
      key: 'calories',
      label: language === 'de' ? 'Kalorien' : language === 'fr' ? 'Calories' : 'Calories',
      value: calories,
      setValue: setCalories,
      unit: 'kcal',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      min: 800,
      max: 10000,
    },
    {
      key: 'protein',
      label: t.protein,
      value: protein,
      setValue: setProtein,
      unit: 'g',
      icon: Dumbbell,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      min: 0,
      max: 500,
    },
    {
      key: 'carbs',
      label: t.carbs,
      value: carbs,
      setValue: setCarbs,
      unit: 'g',
      icon: Wheat,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      min: 0,
      max: 1000,
    },
    {
      key: 'fat',
      label: t.fat,
      value: fat,
      setValue: setFat,
      unit: 'g',
      icon: Droplets,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      min: 0,
      max: 500,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t.changeGoal}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {macros.map((macro, index) => {
            const Icon = macro.icon;
            return (
              <motion.div
                key={macro.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className={`p-2.5 rounded-xl ${macro.bgColor}`}>
                  <Icon className={`h-5 w-5 ${macro.color}`} />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium">{macro.label}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={macro.value}
                      onChange={(e) => macro.setValue(Number(e.target.value))}
                      min={macro.min}
                      max={macro.max}
                      className="h-10"
                    />
                    <span className="text-sm text-muted-foreground w-10">{macro.unit}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            {t.cancel}
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-2" />
            {t.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
