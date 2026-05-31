import { motion } from "framer-motion";
import { Plus, CloudSun, SunMedium, Moon, Cookie, Refrigerator } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";
import type { MealFocusKey } from "@/lib/mealFocus";
import { useLanguage } from "@/contexts/LanguageContext";

type MealSlotsWidgetProps = {
  delay?: number;
  onAddMeal: (slot: MealFocusKey) => void;
  onFindMeals?: () => void;
};

export function MealSlotsWidget({ delay = 0, onAddMeal, onFindMeals }: MealSlotsWidgetProps) {
  const { t } = useLanguage();

  const slots = [
    { key: "breakfast" as const, label: t.breakfast, icon: CloudSun },
    { key: "lunch" as const, label: t.lunch, icon: SunMedium },
    { key: "dinner" as const, label: t.dinner, icon: Moon },
    { key: "snack" as const, label: t.snack, icon: Cookie },
  ];

  return (
    <WidgetCard delay={delay} variant="glass" interactive={false} className="w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.dashboardMealsTitle}</p>
      <h3 className="mt-1 text-base min-[360px]:text-lg font-semibold tracking-tight">{t.dashboardMealSlotsSubtitle}</h3>
      <ul className="mt-3 min-[360px]:mt-4 space-y-2">
        {slots.map((s, i) => (
          <motion.li
            key={s.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.05 }}
          >
            <button
              type="button"
              onClick={() => onAddMeal(s.key)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/50 px-3 py-2.5 text-left backdrop-blur-sm transition-colors",
                "hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]",
              )}
            >
              <span className="flex items-center gap-2.5">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{s.label}</span>
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-3.5 w-3.5" />
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
      {onFindMeals && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
          onClick={onFindMeals}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-semibold text-primary"
        >
          <Refrigerator className="h-4 w-4" />
          {t.dashboardFindThreeMeals}
        </motion.button>
      )}
    </WidgetCard>
  );
}
