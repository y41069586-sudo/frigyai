import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame, Dumbbell, Wheat, Droplets, Save, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import {
  calculateMacrosForWeightAndCalories,
  macroGoalsEqual,
} from '@/lib/macroGoals';

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
  /** Used when calories change and user opts into auto P/C/F calculation. */
  weightKg?: number;
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
  weightKg = 70,
}: EditMacroGoalsDialogProps) => {
  const { t } = useLanguage();
  const [calories, setCalories] = useState(currentGoals.dailyCalories);
  const [protein, setProtein] = useState(currentGoals.dailyProtein);
  const [carbs, setCarbs] = useState(currentGoals.dailyCarbs);
  const [fat, setFat] = useState(currentGoals.dailyFat);

  const [caloriesText, setCaloriesText] = useState(formatDigits(currentGoals.dailyCalories));
  const [proteinText, setProteinText] = useState(formatDigits(currentGoals.dailyProtein));
  const [carbsText, setCarbsText] = useState(formatDigits(currentGoals.dailyCarbs));
  const [fatText, setFatText] = useState(formatDigits(currentGoals.dailyFat));

  const [showRecalcConfirm, setShowRecalcConfirm] = useState(false);
  const [pendingGoals, setPendingGoals] = useState<MacroGoals | null>(null);
  const baselineRef = useRef<MacroGoals>(currentGoals);

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
    if (!open) {
      setShowRecalcConfirm(false);
      setPendingGoals(null);
      return;
    }
    baselineRef.current = { ...currentGoals };
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

  const readGoalsFromInputs = (): MacroGoals => ({
    dailyCalories: Math.round(parseDigits(caloriesText) || calories),
    dailyProtein: Math.round(parseDigits(proteinText) || protein),
    dailyCarbs: Math.round(parseDigits(carbsText) || carbs),
    dailyFat: Math.round(parseDigits(fatText) || fat),
  });

  const validateGoals = (goals: MacroGoals): boolean => {
    if (goals.dailyCalories < 800 || goals.dailyCalories > 10000) {
      toast({
        title: t.macroEditInvalidValue,
        description: t.macroEditCaloriesRange,
        variant: 'destructive',
      });
      return false;
    }

    const remainingForCarbs =
      goals.dailyCalories - goals.dailyProtein * 4 - goals.dailyFat * 9;

    if (remainingForCarbs < 0) {
      toast({
        title: t.macroEditMacroMismatchWarning,
        description: t.macroEditMacroMismatchDesc,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const commitSave = (goals: MacroGoals) => {
    onSave(goals);
    toast({
      title: t.macroEditGoalsSaved,
      description: t.macroEditGoalsSavedDesc,
    });
    setShowRecalcConfirm(false);
    setPendingGoals(null);
    onOpenChange(false);
  };

  const handleRecalcChoice = (recalculate: boolean) => {
    if (!pendingGoals) return;

    if (recalculate) {
      const calculated = calculateMacrosForWeightAndCalories(
        pendingGoals.dailyCalories,
        weightKg,
      );
      commitSave(calculated);
      return;
    }

    if (!validateGoals(pendingGoals)) return;
    commitSave(pendingGoals);
  };

  const handleSave = () => {
    const goals = readGoalsFromInputs();

    if (macroGoalsEqual(goals, baselineRef.current)) {
      onOpenChange(false);
      return;
    }

    if (!validateGoals(goals)) return;

    const caloriesChanged = goals.dailyCalories !== baselineRef.current.dailyCalories;

    if (caloriesChanged) {
      setPendingGoals(goals);
      setShowRecalcConfirm(true);
      return;
    }

    commitSave(goals);
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
      label: t.macroEditCaloriesLabel,
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
          <Button className="h-11 flex-1 touch-manipulation sm:flex-[1.4]" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {t.save}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showRecalcConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-end justify-center bg-black/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-5 shadow-xl"
            >
              <h3 className="text-lg font-bold">{t.macroEditRecalcConfirmTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t.macroEditRecalcConfirmDesc}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => handleRecalcChoice(false)}
                >
                  {t.macroEditRecalcNo}
                </Button>
                <Button
                  type="button"
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => handleRecalcChoice(true)}
                >
                  {t.macroEditRecalcYes}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
};
