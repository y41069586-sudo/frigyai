import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export interface RecentMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type?: string;
}

interface QuickReLogCardProps {
  recentMeals: RecentMeal[];
  onReLog: (meal: RecentMeal) => void;
  language: "de" | "en" | "fr";
}

function getTitle(language: "de" | "en" | "fr"): string {
  switch (language) {
    case "en": return "Recently eaten";
    case "fr": return "Récemment mangé";
    case "de":
    default: return "Zuletzt gegessen";
  }
}

export const QuickReLogCard = ({
  recentMeals,
  onReLog,
  language,
}: QuickReLogCardProps) => {
  if (!recentMeals || recentMeals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="rounded-2xl border border-border/30 bg-card px-3.5 pt-2.5 pb-3"
    >
      {/* Title */}
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {getTitle(language)}
      </p>

      {/* Horizontal scroll row */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {recentMeals.map((meal, index) => (
          <motion.button
            key={`${meal.name}-${index}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 + 0.15, duration: 0.25 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onReLog(meal)}
            className="flex items-center gap-1.5 flex-shrink-0 pl-2.5 pr-1.5 py-1.5 rounded-full
                       border border-border/40 bg-muted/40 hover:bg-[#75FBB2]/15 hover:border-[#75FBB2]/50
                       transition-all group"
          >
            {/* Meal name + kcal */}
            <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
              {meal.name}
            </span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {meal.calories} kcal
            </span>

            {/* Plus button */}
            <div
              className="w-5 h-5 rounded-full bg-[#39D47F]/20 group-hover:bg-[#39D47F]/40
                         flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <Plus className="w-3 h-3 text-[#39D47F]" strokeWidth={2.5} />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
