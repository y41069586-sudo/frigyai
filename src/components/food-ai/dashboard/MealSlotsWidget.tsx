import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Plus, CloudSun, SunMedium, Moon, Cookie } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";
import type { MealFocusKey } from "@/lib/mealFocus";

const slots: { key: MealFocusKey; label: string; icon: LucideIcon }[] = [
  { key: "breakfast", label: "Frühstück", icon: CloudSun },
  { key: "lunch", label: "Mittagessen", icon: SunMedium },
  { key: "dinner", label: "Abendessen", icon: Moon },
  { key: "snack", label: "Snacks", icon: Cookie },
];

type MealSlotsWidgetProps = {
  delay?: number;
  onAddMeal: (slot: MealFocusKey) => void;
};

export function MealSlotsWidget({ delay = 0, onAddMeal }: MealSlotsWidgetProps) {
  return (
    <WidgetCard delay={delay} variant="glass" interactive={false} className="w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Mahlzeiten</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight">Heute eintragen</h3>
      <ul className="mt-4 space-y-2">
        {slots.map((s, i) => (
          <motion.li
            key={s.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/50 px-4 py-3 backdrop-blur-sm"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" />
              </span>
              <span className="truncate font-medium text-foreground">{s.label}</span>
            </span>
            <button
              type="button"
              onClick={() => onAddMeal(s.key)}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                "bg-primary text-primary-foreground shadow-md shadow-primary/25",
                "transition-transform active:scale-95",
              )}
              aria-label={`${s.label} hinzufügen`}
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </motion.li>
        ))}
      </ul>
    </WidgetCard>
  );
}
