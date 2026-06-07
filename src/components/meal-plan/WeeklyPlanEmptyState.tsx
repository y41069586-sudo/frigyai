import { motion } from "framer-motion";
import { Sparkles, ShoppingCart, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import frigyMascot from "@/assets/frigy-mascot.png";
import { useLanguage } from "@/contexts/LanguageContext";

type WeeklyPlanEmptyStateProps = {
  dailyCalories?: number;
  dailyProtein?: number;
  dailyCarbs?: number;
  dailyFat?: number;
  mealsPerDay?: number;
  isGenerating?: boolean;
  onCreatePlan: () => void;
};

export function WeeklyPlanEmptyState({
  dailyCalories = 0,
  dailyProtein = 0,
  dailyCarbs = 0,
  dailyFat = 0,
  mealsPerDay = 5,
  isGenerating = false,
  onCreatePlan,
}: WeeklyPlanEmptyStateProps) {
  const { t } = useLanguage();
  const hasTargets = dailyCalories > 0;

  const features = [
    {
      icon: UtensilsCrossed,
      title: t.weeklyPlanEmptyFeature1Title,
      desc: t.weeklyPlanEmptyFeature1Desc,
    },
    {
      icon: ShoppingCart,
      title: t.weeklyPlanEmptyFeature2Title,
      desc: t.weeklyPlanEmptyFeature2Desc,
    },
    {
      icon: ShieldCheck,
      title: t.weeklyPlanEmptyFeature3Title,
      desc: t.weeklyPlanEmptyFeature3Desc,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(165deg,#FFFFFF_0%,#F2FFF8_48%,#E8FBF0_100%)] p-6 shadow-[0_24px_60px_-32px_rgba(57,212,127,0.35)] sm:p-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-white shadow-[0_16px_40px_-20px_rgba(57,212,127,0.45)] ring-1 ring-primary/10">
          <img src={frigyMascot} alt="Frigy" className="h-14 w-14 rounded-xl" />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">
          {t.weeklyPlanEmptyBadge}
        </p>
        <h2 className="mt-2 max-w-xs text-[1.65rem] font-black leading-[1.08] tracking-[-0.04em] text-slate-900">
          {t.weeklyPlanEmptyHeroTitle}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          {t.weeklyPlanEmptyHeroSubtitle}
        </p>

        {hasTargets && (
          <div className="mt-6 w-full max-w-sm rounded-2xl border border-primary/10 bg-white/80 p-4 text-left backdrop-blur-sm">
            <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/75">
              {t.weeklyPlanEmptyTargetLabel}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MacroChip label={t.macroEditCaloriesLabel} value={`${Math.round(dailyCalories)}`} unit="kcal" accent="text-orange-600" />
              <MacroChip label={t.protein} value={`${Math.round(dailyProtein)}`} unit="g" accent="text-rose-600" />
              <MacroChip label={t.carbs} value={`${Math.round(dailyCarbs)}`} unit="g" accent="text-amber-600" />
              <MacroChip label={t.fat} value={`${Math.round(dailyFat)}`} unit="g" accent="text-sky-600" />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t.weeklyPlanEmptyMealsHint.replace("{count}", String(mealsPerDay))}
            </p>
          </div>
        )}

        <ul className="mt-6 w-full max-w-md space-y-3 text-left">
          {features.map(({ icon: Icon, title, desc }, index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + index * 0.06 }}
              className="flex gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" strokeWidth={2.1} />
              </span>
              <span>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{desc}</p>
              </span>
            </motion.li>
          ))}
        </ul>

        <Button
          type="button"
          size="lg"
          disabled={isGenerating}
          onClick={onCreatePlan}
          className="mt-8 h-14 w-full max-w-sm rounded-2xl bg-[linear-gradient(135deg,#75FBB2_0%,#39D47F_100%)] text-base font-bold text-[#082013] shadow-[0_16px_40px_-16px_rgba(57,212,127,0.55)] hover:opacity-95"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          {isGenerating ? t.mealPlanCreating : t.createWeeklyPlan}
        </Button>
      </div>
    </motion.div>
  );
}

function MacroChip({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50/90 px-2 py-2 text-center">
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
      <p className={`text-lg font-black tabular-nums ${accent}`}>
        {value}
        <span className="ml-0.5 text-[10px] font-semibold text-slate-400">{unit}</span>
      </p>
    </div>
  );
}
