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
  const { language } = useLanguage();
  const copy = language === "fr"
    ? {
        title: "Repas",
        subtitle: "Ajouter aujourd'hui",
        findMeals: "Trouver 3 plats",
        add: "Ajouter",
        slots: [
          { key: "breakfast" as const, label: "Petit dej", icon: CloudSun },
          { key: "lunch" as const, label: "Dejeuner", icon: SunMedium },
          { key: "dinner" as const, label: "Diner", icon: Moon },
          { key: "snack" as const, label: "Snacks", icon: Cookie },
        ],
      }
    : language === "en"
      ? {
          title: "Meals",
          subtitle: "Log today",
          findMeals: "Find 3 meals",
          add: "Add",
          slots: [
            { key: "breakfast" as const, label: "Breakfast", icon: CloudSun },
            { key: "lunch" as const, label: "Lunch", icon: SunMedium },
            { key: "dinner" as const, label: "Dinner", icon: Moon },
            { key: "snack" as const, label: "Snacks", icon: Cookie },
          ],
        }
      : {
          title: "Mahlzeiten",
          subtitle: "Heute eintragen",
          findMeals: "3 Gerichte suchen",
          add: "Hinzufügen",
          slots: [
            { key: "breakfast" as const, label: "Frühstück", icon: CloudSun },
            { key: "lunch" as const, label: "Mittagessen", icon: SunMedium },
            { key: "dinner" as const, label: "Abendessen", icon: Moon },
            { key: "snack" as const, label: "Snacks", icon: Cookie },
          ],
        };
  return (
    <WidgetCard delay={delay} variant="glass" interactive={false} className="w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{copy.title}</p>
      <h3 className="mt-1 text-base min-[360px]:text-lg font-semibold tracking-tight">{copy.subtitle}</h3>
      <ul className="mt-3 min-[360px]:mt-4 space-y-2">
        {copy.slots.map((s, i) => (
          <motion.li
            key={s.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i }}
            className="flex items-center justify-between gap-2.5 min-[360px]:gap-3 rounded-xl min-[360px]:rounded-2xl border border-border/40 bg-background/50 px-3 min-[360px]:px-4 py-2.5 min-[360px]:py-3 backdrop-blur-sm"
          >
            <span className="flex min-w-0 items-center gap-2 min-[360px]:gap-3">
              <span className="flex h-8 w-8 min-[360px]:h-9 min-[360px]:w-9 shrink-0 items-center justify-center rounded-lg min-[360px]:rounded-xl bg-primary/10">
                <s.icon className="h-3.5 w-3.5 min-[360px]:h-4 min-[360px]:w-4 text-primary" />
              </span>
              <span className="truncate text-sm min-[360px]:text-base font-medium text-foreground">{s.label}</span>
            </span>
            <button
              type="button"
              onClick={() => onAddMeal(s.key)}
              className={cn(
                "flex h-9 w-9 min-[360px]:h-10 min-[360px]:w-10 shrink-0 items-center justify-center rounded-full bg-[#DCF5EA]",
                "transition-transform active:scale-95",
              )}
              aria-label={`${copy.add} ${s.label}`}
            >
              <Plus className="h-4 w-4 min-[360px]:h-5 min-[360px]:w-5 text-[#1ED78A]" strokeWidth={2.5} />
            </button>
          </motion.li>
        ))}
      </ul>
      {onFindMeals && (
        <button
          type="button"
          onClick={onFindMeals}
          className="mt-2.5 min-[360px]:mt-3 flex w-full items-center justify-center gap-1.5 min-[360px]:gap-2 rounded-lg min-[360px]:rounded-xl border border-border/50 bg-background/60 px-2.5 min-[360px]:px-3 py-2 min-[360px]:py-2.5 text-xs min-[360px]:text-sm font-medium text-foreground transition-colors hover:border-primary/35"
        >
          <Refrigerator className="h-3.5 w-3.5 min-[360px]:h-4 min-[360px]:w-4 text-primary" />
          {copy.findMeals}
        </button>
      )}
    </WidgetCard>
  );
}
