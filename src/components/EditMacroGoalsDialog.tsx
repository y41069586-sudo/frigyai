import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame, Dumbbell, Wheat, Droplets, Save, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface MacroGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

export type FocusMacro = 'calories' | 'protein' | 'carbs' | 'fat' | null;

interface EditMacroGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoals: MacroGoals;
  onSave: (goals: MacroGoals) => void;
  focusMacro?: FocusMacro;
}

type MacroField = 'calories' | 'protein' | 'carbs' | 'fat';

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

function parseDigits(raw: string): number {
  const cleaned = digitsOnly(raw);
  if (!cleaned) return 0;
  return Number(cleaned);
}

function formatDigits(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(Math.round(value));
}

export const EditMacroGoalsDialog = ({
  open,
  onOpenChange,
  currentGoals,
  onSave,
  focusMacro = null,
}: EditMacroGoalsDialogProps) => {
  const { t, language } = useLanguage();
  const [calories, setCalories] = useState(currentGoals.dailyCalories);
  const [protein, setProtein] = useState(currentGoals.dailyProtein);
  const [carbs, setCarbs] = useState(currentGoals.dailyCarbs);
  const [fat, setFat] = useState(currentGoals.dailyFat);

  const [caloriesText, setCaloriesText] = useState(formatDigits(currentGoals.dailyCalories));
  const [proteinText, setProteinText] = useState(formatDigits(currentGoals.dailyProtein));
  const [carbsText, setCarbsText] = useState(formatDigits(currentGoals.dailyCarbs));
  const [fatText, setFatText] = useState(formatDigits(currentGoals.dailyFat));

  const inputRefs = useRef<Partial<Record<MacroField, HTMLInputElement | null>>>({});

  const syncFromGoals = useCallback((goals: MacroGoals) => {
    setCalories(goals.dailyCalories);
    setProtein(goals.dailyProtein);
    setCarbs(goals.dailyCarbs);
    setFat(goals.dailyFat);
    setCaloriesText(formatDigits(goals.dailyCalories));
    setProteinText(formatDigits(goals.dailyProtein));
    setCarbsText(formatDigits(goals.dailyCarbs));
    setFatText(formatDigits(goals.dailyFat));
  }, []);

  useEffect(() => {
    if (!open) return;
    syncFromGoals(currentGoals);

    if (!focusMacro) return;

    const timer = window.setTimeout(() => {
      const input = inputRefs.current[focusMacro];
      if (!input) return;
      input.focus({ preventScroll: true });
      try {
        input.setSelectionRange(0, input.value.length);
      } catch {
        input.select();
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [open, currentGoals, focusMacro, syncFromGoals]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const handleAutoCalculateCarbs = () => {
    const proteinCals = protein * 4;
    const fatCals = fat * 9;
    const carbCals = Math.max(0, calories - proteinCals - fatCals);
    const newCarbs = Math.round(carbCals / 4);

    setCarbs(newCarbs);
    setCarbsText(formatDigits(newCarbs));

    toast({
      title: language === 'de' ? 'Kohlenhydrate berechnet' : language === 'fr' ? 'Glucides calculés' : 'Carbs calculated',
      description: language === 'de'
        ? `Kohlenhydrate auf ${newCarbs}g eingestellt, um ${calories} kcal zu erreichen.`
        : language === 'fr'
          ? `Les glucides ont été définis à ${newCarbs}g pour atteindre ${calories} kcal.`
          : `Carbs set to ${newCarbs}g to reach ${calories} kcal.`,
    });
  };

  const handleSave = () => {
    const resolvedCalories = parseDigits(caloriesText) || calories;
    const resolvedProtein = parseDigits(proteinText) || protein;
    const resolvedCarbs = parseDigits(carbsText) || carbs;
    const resolvedFat = parseDigits(fatText) || fat;

    if (resolvedCalories < 800 || resolvedCalories > 10000) {
      toast({
        title: language === 'de' ? 'Ungültiger Wert' : language === 'fr' ? 'Valeur invalide' : 'Invalid value',
        description: language === 'de' ? 'Kalorien müssen zwischen 800 und 10000 liegen' : language === 'fr' ? 'Les calories doivent être entre 800 et 10000' : 'Calories must be between 800 and 10000',
        variant: 'destructive',
      });
      return;
    }

    const proteinCalories = resolvedProtein * 4;
    const fatCalories = resolvedFat * 9;
    const remainingForCarbs = resolvedCalories - proteinCalories - fatCalories;

    if (remainingForCarbs < 0) {
      toast({
        title: language === 'de' ? 'Warnung' : language === 'fr' ? 'Avertissement' : 'Warning',
        description: language === 'de'
          ? 'Protein und Fett sind zusammen zu hoch für dein Kalorienziel. Bitte senke einen der Werte oder erhöhe die Kalorien.'
          : language === 'fr'
            ? 'Les protéines et les lipides sont trop élevés pour cet objectif calorique.'
            : 'Protein and fat are too high for this calorie target.',
        variant: 'destructive',
      });
      return;
    }

    const adjustedCarbs = Math.max(0, Math.round(remainingForCarbs / 4));

    onSave({
      dailyCalories: Math.round(resolvedCalories),
      dailyProtein: Math.round(resolvedProtein),
      dailyCarbs: adjustedCarbs,
      dailyFat: Math.round(resolvedFat),
    });

    toast({
      title: language === 'de' ? 'Ziele gespeichert!' : language === 'fr' ? 'Objectifs sauvegardés!' : 'Goals saved!',
      description: language === 'de' ? 'Deine neuen Makroziele wurden übernommen.' : language === 'fr' ? 'Vos nouveaux objectifs macro ont été appliqués.' : 'Your new macro goals have been applied.',
    });

    onOpenChange(false);
  };

  const fieldBindings: Record<
    MacroField,
    {
      text: string;
      setText: (value: string) => void;
      setNumber: (value: number) => void;
    }
  > = {
    calories: { text: caloriesText, setText: setCaloriesText, setNumber: setCalories },
    protein: { text: proteinText, setText: setProteinText, setNumber: setProtein },
    carbs: { text: carbsText, setText: setCarbsText, setNumber: setCarbs },
    fat: { text: fatText, setText: setFatText, setNumber: setFat },
  };

  const macros = [
    {
      key: 'calories' as const,
      label: language === 'de' ? 'Kalorien' : language === 'fr' ? 'Calories' : 'Calories',
      unit: 'kcal',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      highlightBorder: 'ring-2 ring-orange-500 ring-offset-2',
    },
    {
      key: 'protein' as const,
      label: t.protein,
      unit: 'g',
      icon: Dumbbell,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      highlightBorder: 'ring-2 ring-red-500 ring-offset-2',
    },
    {
      key: 'carbs' as const,
      label: t.carbs,
      unit: 'g',
      icon: Wheat,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      highlightBorder: 'ring-2 ring-amber-500 ring-offset-2',
    },
    {
      key: 'fat' as const,
      label: t.fat,
      unit: 'g',
      icon: Droplets,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      highlightBorder: 'ring-2 ring-blue-500 ring-offset-2',
    },
  ];

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex flex-col bg-background text-foreground safe-area-inset"
      role="dialog"
      aria-modal="true"
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-4">
        <h2 className="text-lg font-semibold">{t.changeGoal}</h2>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 touch-manipulation"
          aria-label={t.cancel}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
        <div className="mx-auto w-full max-w-md space-y-3">
          {macros.map((macro, index) => {
            const Icon = macro.icon;
            const isHighlighted = focusMacro === macro.key;
            const binding = fieldBindings[macro.key];
            return (
              <motion.div
                key={macro.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isHighlighted ? 1.02 : 1,
                }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  isHighlighted ? `${macro.highlightBorder} bg-muted/50` : 'bg-card border border-border/50'
                }`}
              >
                <div className={`rounded-xl p-2.5 ${macro.bgColor}`}>
                  <Icon className={`h-5 w-5 ${macro.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`macro-${macro.key}`} className="text-sm font-medium">
                    {macro.label}
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      id={`macro-${macro.key}`}
                      ref={(el) => {
                        inputRefs.current[macro.key] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      enterKeyHint="done"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      value={binding.text}
                      onChange={(e) => {
                        const nextText = digitsOnly(e.target.value);
                        binding.setText(nextText);
                        binding.setNumber(parseDigits(nextText));
                      }}
                      onBlur={() => {
                        const normalized = formatDigits(parseDigits(binding.text));
                        binding.setText(normalized);
                        binding.setNumber(parseDigits(normalized));
                      }}
                      className={`h-12 min-w-0 flex-1 touch-manipulation text-base tabular-nums ${isHighlighted ? 'border-primary' : ''}`}
                    />
                    <span className="w-10 shrink-0 text-sm text-muted-foreground">{macro.unit}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px)+0.5rem)] pt-3">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="h-11 flex-1 touch-manipulation" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button
            variant="secondary"
            className="h-11 flex-1 touch-manipulation text-xs sm:text-sm"
            onClick={handleAutoCalculateCarbs}
          >
            {language === 'de' ? 'Auto-KH' : 'Auto-Carbs'}
          </Button>
          <Button className="h-11 flex-1 touch-manipulation" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {t.save}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
