import { motion } from "framer-motion";
import { Clock, Flame } from "lucide-react";
import type { MockMeal } from "@/lib/food-ai/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizeMealTypeLabel } from "@/lib/mealI18n";

type MealGeneratorProps = {
  meals: MockMeal[];
};

export function MealGenerator({ meals }: MealGeneratorProps) {
  const { t, language } = useLanguage();
  const copy = language === "fr"
    ? { title: "Tes 3 repas", minutes: "min" }
    : language === "en"
      ? { title: "Your 3 meals", minutes: "min" }
      : { title: "Deine 3 Mahlzeiten", minutes: "Min" };

  return (
    <div className="space-y-4 w-full">
      <h3 className="text-lg font-bold text-center sm:text-left">{copy.title}</h3>
      <div className="space-y-3">
        {meals.map((meal, i) => (
          <motion.div
            key={`${meal.type}-${meal.name}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative overflow-hidden rounded-[1.5rem] border border-primary/15 bg-gradient-to-br from-background via-card/95 to-primary/5 p-5 shadow-[0_12px_40px_-18px_hsl(var(--primary)/0.45)]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">{localizeMealTypeLabel(meal.type, t)}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {meal.prepTime} {copy.minutes}
              </span>
            </div>
            <h4 className="font-bold text-base text-foreground mb-3">{meal.name}</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                <Flame className="h-3 w-3" />
                {meal.calories} kcal
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">P {meal.protein}g</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">K {meal.carbs}g</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">F {meal.fat}g</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {meal.ingredients.slice(0, 5).map((ing) => (
                <li key={ing.name}>
                  • {ing.name} – {ing.amount}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
