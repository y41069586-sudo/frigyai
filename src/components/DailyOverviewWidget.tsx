import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Droplets, Apple, Check, ChevronRight } from "lucide-react";
import { useLanguage, formatTranslation } from "@/contexts/LanguageContext";
import { getAppLocale } from "@/lib/mealPlanLanguage";

interface DailyOverviewWidgetProps {
  targetCalories: number;
  caloriesEaten: number;
  waterGlasses: number;
}

export const DailyOverviewWidget = ({
  targetCalories,
  caloriesEaten,
  waterGlasses,
}: DailyOverviewWidgetProps) => {
  const { t, language } = useLanguage();
  const locale = getAppLocale(language);
  const navigate = useNavigate();
  const [mealsLogged, setMealsLogged] = useState(0);

  useEffect(() => {
    const loadMeals = () => {
      const saved = localStorage.getItem("todayFood");
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.date === new Date().toDateString() && data.entries) {
            setMealsLogged(data.entries.length);
          }
        } catch {
          setMealsLogged(0);
        }
      }
    };

    loadMeals();
    const interval = setInterval(loadMeals, 2000);
    return () => clearInterval(interval);
  }, []);

  const caloriePercent = Math.min(100, Math.round((caloriesEaten / targetCalories) * 100));
  const remainingCalories = Math.max(0, targetCalories - caloriesEaten);
  const waterLiters = (waterGlasses * 0.25).toFixed(1);
  const waterTarget = 2.0;
  const waterPercent = Math.min(100, Math.round((parseFloat(waterLiters) / waterTarget) * 100));

  const items = [
    {
      icon: Flame,
      label: t.calories,
      value: `${caloriesEaten}`,
      subtext: formatTranslation(t.dailyOverviewOfKcal, { target: targetCalories }),
      percent: caloriePercent,
      color: caloriePercent >= 90 ? "emerald" : "primary",
      isComplete: caloriePercent >= 90,
    },
    {
      icon: Droplets,
      label: t.water,
      value: `${waterLiters}L`,
      subtext: formatTranslation(t.dailyOverviewOfLiters, { target: waterTarget }),
      percent: waterPercent,
      color: waterPercent >= 75 ? "emerald" : "sky",
      isComplete: waterPercent >= 75,
    },
    {
      icon: Apple,
      label: t.trackerMealsUnit,
      value: `${mealsLogged}`,
      subtext: t.dailyOverviewMealsLogged,
      percent: Math.min(100, (mealsLogged / 3) * 100),
      color: mealsLogged >= 3 ? "emerald" : "amber",
      isComplete: mealsLogged >= 3,
    },
  ];

  const completedCount = items.filter((i) => i.isComplete).length;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <div
        className="rounded-2xl bg-card border border-border/30 overflow-hidden cursor-pointer group hover:border-primary/40 transition-all"
        onClick={() => navigate("/")}
      >
        <div className="px-4 py-3 flex items-center justify-between border-b border-border/20">
          <div>
            <h2 className="text-sm font-bold text-foreground">{t.dailyOverviewTitle}</h2>
            <p className="text-[10px] text-muted-foreground">
              {new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                completedCount === 3
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {formatTranslation(t.dailyOverviewGoalsBadge, { count: completedCount })}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        <div className="p-3 space-y-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            const colorClasses = {
              primary: { bg: "bg-primary/10", text: "text-primary", bar: "bg-primary" },
              emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", bar: "bg-emerald-500" },
              sky: { bg: "bg-sky-500/10", text: "text-sky-500", bar: "bg-sky-500" },
              amber: { bg: "bg-amber-500/10", text: "text-amber-500", bar: "bg-amber-500" },
            };
            const colors = colorClasses[item.color as keyof typeof colorClasses];

            return (
              <motion.div
                key={item.label}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index + 0.5 }}
              >
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                  {item.isComplete ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${colors.text}`}>{item.value}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">{item.subtext}</span>
                    </div>
                  </div>

                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${colors.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 0.6, delay: 0.2 * index + 0.6 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {remainingCalories > 0 && (
          <div className="px-4 py-2.5 bg-muted/10 border-t border-border/20">
            <p className="text-xs text-center text-muted-foreground">
              {formatTranslation(t.dailyOverviewRemainingCalories, { calories: remainingCalories })}
            </p>
          </div>
        )}

        {remainingCalories === 0 && caloriesEaten > 0 && (
          <div className="px-4 py-2.5 bg-emerald-500/5 border-t border-emerald-500/20">
            <p className="text-xs text-center text-emerald-600 font-medium">
              ✓ {t.dailyOverviewCalorieGoalReached}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
