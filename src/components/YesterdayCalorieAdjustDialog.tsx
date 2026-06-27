import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTranslation } from '@/contexts/translationsExtended';
import type { YesterdayCalorieBalance } from '@/lib/yesterdayCalorieBalance';
import { computeTodayAdjustedTargets } from '@/lib/yesterdayCalorieBalance';
import type { DailyMacroTargets } from '@/lib/mealPlanMacros';

type YesterdayCalorieAdjustDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: YesterdayCalorieBalance | null;
  baseTargets: DailyMacroTargets;
  onConfirm: (adjustedTargets: DailyMacroTargets) => void;
  onDismiss: () => void;
  isAdjusting?: boolean;
};

export function YesterdayCalorieAdjustDialog({
  open,
  onOpenChange,
  balance,
  baseTargets,
  onConfirm,
  onDismiss,
  isAdjusting = false,
}: YesterdayCalorieAdjustDialogProps) {
  const { t } = useLanguage();

  if (!balance) return null;

  const adjusted = computeTodayAdjustedTargets(baseTargets, balance.delta);
  const absDelta = Math.abs(balance.delta);
  const isOver = balance.delta > 0;

  const title = isOver ? t.yesterdayCalorieOverTitle : t.yesterdayCalorieUnderTitle;
  const description = isOver
    ? formatTranslation(t.yesterdayCalorieOverDesc, {
        delta: String(absDelta),
        eaten: String(balance.eatenCalories),
        target: String(balance.targetCalories),
        todayTarget: String(adjusted.dailyCalories),
      })
    : formatTranslation(t.yesterdayCalorieUnderDesc, {
        delta: String(absDelta),
        eaten: String(balance.eatenCalories),
        target: String(balance.targetCalories),
        todayTarget: String(adjusted.dailyCalories),
      });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isAdjusting} onClick={onDismiss}>
            {t.yesterdayCalorieSkip}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isAdjusting}
            onClick={(e) => {
              e.preventDefault();
              onConfirm(adjusted);
            }}
          >
            {isAdjusting ? t.yesterdayCalorieAdjusting : t.yesterdayCalorieAdjustToday}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
