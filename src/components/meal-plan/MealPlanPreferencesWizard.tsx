import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, ChefHat, Clock, Repeat, Shuffle, Wallet, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CUISINE_IDS,
  type BudgetTier,
  type CookFrequency,
  type CuisineId,
  type MaxPrepTime,
  type MealPlanPreferences,
  type VarietyPref,
  DEFAULT_MEAL_PLAN_PREFERENCES,
} from '@/lib/mealPlanPreferences';
import { cn } from '@/lib/utils';

type MealPlanPreferencesWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (prefs: MealPlanPreferences) => void;
  initialPrefs?: MealPlanPreferences;
  finishLabel?: string;
};

const STEPS = ['cuisines', 'time', 'cooking', 'budget'] as const;
type StepId = (typeof STEPS)[number];

export function MealPlanPreferencesWizard({
  open,
  onOpenChange,
  onComplete,
  initialPrefs,
  finishLabel,
}: MealPlanPreferencesWizardProps) {
  const { t } = useLanguage();
  const [stepIndex, setStepIndex] = useState(0);
  const [cuisines, setCuisines] = useState<CuisineId[]>(
    initialPrefs?.cuisines ?? DEFAULT_MEAL_PLAN_PREFERENCES.cuisines,
  );
  const [maxPrepTime, setMaxPrepTime] = useState<MaxPrepTime>(
    initialPrefs?.maxPrepTime ?? DEFAULT_MEAL_PLAN_PREFERENCES.maxPrepTime,
  );
  const [cookFrequency, setCookFrequency] = useState<CookFrequency>(
    initialPrefs?.cookFrequency ?? DEFAULT_MEAL_PLAN_PREFERENCES.cookFrequency,
  );
  const [budget, setBudget] = useState<BudgetTier>(
    initialPrefs?.budget ?? DEFAULT_MEAL_PLAN_PREFERENCES.budget,
  );
  const [variety, setVariety] = useState<VarietyPref>(
    initialPrefs?.variety ?? DEFAULT_MEAL_PLAN_PREFERENCES.variety,
  );

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const cuisineOptions = useMemo(
    () =>
      CUISINE_IDS.map((id) => ({
        id,
        label: t[`mealPlanPrefCuisine_${id}` as keyof typeof t] as string,
      })),
    [t],
  );

  const toggleCuisine = (id: CuisineId) => {
    setCuisines((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((c) => c !== id);
        return next.length ? next : prev;
      }
      return [...prev, id];
    });
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete({
        cuisines,
        maxPrepTime,
        cookFrequency,
        budget,
        variety,
        completed: true,
      });
      onOpenChange(false);
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      onOpenChange(false);
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-background shadow-2xl sm:rounded-[2rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">
                  {t.mealPlanPrefStep.replace('{current}', String(stepIndex + 1)).replace('{total}', String(STEPS.length))}
                </p>
                <h2 className="text-lg font-bold">{stepTitle(step, t)}</h2>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60"
                aria-label={t.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {step === 'cuisines' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t.mealPlanPrefCuisineDesc}</p>
                  <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-900">
                    {t.mealPlanPrefCuisineDisclaimer}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {cuisineOptions.map(({ id, label }) => {
                      const selected = cuisines.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleCuisine(id)}
                          className={cn(
                            'relative rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition-all',
                            selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card hover:border-primary/30',
                          )}
                        >
                          {selected && (
                            <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                          )}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 'time' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t.mealPlanPrefTimeDesc}</p>
                  <OptionGroup
                    icon={Clock}
                    options={[
                      { id: '10' as const, label: t.mealPlanPrefTime10, desc: t.mealPlanPrefTime10Desc },
                      { id: '30' as const, label: t.mealPlanPrefTime30, desc: t.mealPlanPrefTime30Desc },
                      { id: '60plus' as const, label: t.mealPlanPrefTime60, desc: t.mealPlanPrefTime60Desc },
                    ]}
                    value={maxPrepTime}
                    onChange={setMaxPrepTime}
                  />
                </div>
              )}

              {step === 'cooking' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t.mealPlanPrefCookDesc}</p>
                  <OptionGroup
                    icon={ChefHat}
                    options={[
                      { id: 'daily' as const, label: t.mealPlanPrefCookDaily, desc: t.mealPlanPrefCookDailyDesc },
                      { id: '4_5' as const, label: t.mealPlanPrefCook45, desc: t.mealPlanPrefCook45Desc },
                      { id: '3_4' as const, label: t.mealPlanPrefCook34, desc: t.mealPlanPrefCook34Desc },
                      { id: '1_2' as const, label: t.mealPlanPrefCook12, desc: t.mealPlanPrefCook12Desc },
                    ]}
                    value={cookFrequency}
                    onChange={setCookFrequency}
                  />
                </div>
              )}

              {step === 'budget' && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">{t.mealPlanPrefBudgetTitle}</p>
                    <OptionGroup
                      icon={Wallet}
                      options={[
                        { id: 'cheap' as const, label: t.mealPlanPrefBudgetCheap, desc: t.mealPlanPrefBudgetCheapDesc },
                        { id: 'medium' as const, label: t.mealPlanPrefBudgetMedium, desc: t.mealPlanPrefBudgetMediumDesc },
                        { id: 'any' as const, label: t.mealPlanPrefBudgetAny, desc: t.mealPlanPrefBudgetAnyDesc },
                      ]}
                      value={budget}
                      onChange={setBudget}
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">{t.mealPlanPrefVarietyTitle}</p>
                    <OptionGroup
                      icon={Shuffle}
                      options={[
                        { id: 'varied' as const, label: t.mealPlanPrefVarietyVaried, desc: t.mealPlanPrefVarietyVariedDesc, secondaryIcon: Shuffle },
                        { id: 'repeat_ok' as const, label: t.mealPlanPrefVarietyRepeat, desc: t.mealPlanPrefVarietyRepeatDesc, secondaryIcon: Repeat },
                      ]}
                      value={variety}
                      onChange={setVariety}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t px-5 py-4">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={handleBack}>
                {stepIndex === 0 ? t.cancel : t.back}
              </Button>
              <Button type="button" className="flex-1 rounded-xl" onClick={handleNext}>
                {isLastStep ? (finishLabel ?? t.mealPlanPrefFinish) : t.next}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function stepTitle(step: StepId, t: ReturnType<typeof useLanguage>['t']): string {
  switch (step) {
    case 'cuisines':
      return t.mealPlanPrefCuisineTitle;
    case 'time':
      return t.mealPlanPrefTimeTitle;
    case 'cooking':
      return t.mealPlanPrefCookTitle;
    case 'budget':
      return t.mealPlanPrefBudgetStepTitle;
    default:
      return '';
  }
}

function OptionGroup<T extends string>({
  icon: Icon,
  options,
  value,
  onChange,
}: {
  icon: typeof Clock;
  options: { id: T; label: string; desc: string; secondaryIcon?: typeof Repeat }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(({ id, label, desc, secondaryIcon: SecondaryIcon }) => {
        const selected = value === id;
        const RowIcon = SecondaryIcon ?? Icon;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
              selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30',
            )}
          >
            <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
              <RowIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold">
                {label}
                {selected && <Check className="h-4 w-4 text-primary" />}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
