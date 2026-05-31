import { motion } from "framer-motion";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollFriendlyTap } from "@/hooks/useScrollFriendlyTap";
import type { WeekPlanPreviewData } from "@/lib/food-ai/dashboardMock";
import {
  buildWeekDayStatuses,
  buildWeekDayStatusesFromPreview,
  countPlannedMeals,
  getNextMeal,
  getTodayPlan,
  getTodayWeekdayFull,
  readWeeklyPlanFromStorage,
  type NextMealInfo,
} from "@/lib/food-ai/weeklyPlanWidgetData";
import { cn } from "@/lib/utils";

type WeeklyPlanWidgetProps = {
  preview: WeekPlanPreviewData;
  delay?: number;
  onOpenPlan: () => void;
};

function resolveNextFromPreview(
  preview: WeekPlanPreviewData,
  todayLabel: string,
  noPlanLabel: string,
  slotLabel: string,
): NextMealInfo | null {
  const today = preview.days.find((d) => d.dayLabel === todayLabel) ?? preview.days[0];
  const name = today?.meals?.[0];
  if (!name || name === "—" || name === noPlanLabel) return null;

  const hour = new Date().getHours();
  const timeLabel =
    hour < 10 ? "08:00" : hour < 14 ? "12:30" : hour < 18 ? "15:30" : "19:00";

  return {
    meal: { name, type: slotLabel },
    slotLabel,
    timeLabel,
  };
}

export function WeeklyPlanWidget({ preview, delay = 0, onOpenPlan }: WeeklyPlanWidgetProps) {
  const { language, t } = useLanguage();
  const lng = (["de", "en", "fr"] as const).includes(language as "de" | "en" | "fr")
    ? (language as "de" | "en" | "fr")
    : "de";

  const plan = useMemo(() => readWeeklyPlanFromStorage(), [preview]);
  const hasPlan = plan.length > 0 && countPlannedMeals(plan) > 0;

  const todayPlan = useMemo(() => getTodayPlan(plan), [plan]);
  const nextMeal = useMemo(() => {
    if (hasPlan && todayPlan?.meals?.length) {
      return getNextMeal(todayPlan.meals);
    }
    return resolveNextFromPreview(preview, t.today, t.dashboardNoPlanEntry, t.defaultMealName);
  }, [hasPlan, todayPlan, preview, t.today, t.dashboardNoPlanEntry, t.defaultMealName]);

  const weekDays = useMemo(
    () =>
      hasPlan ? buildWeekDayStatuses(plan) : buildWeekDayStatusesFromPreview(preview.days),
    [plan, hasPlan, preview.days],
  );

  const weekday = getTodayWeekdayFull(lng);
  const hasNext = Boolean(nextMeal?.meal.name?.trim());
  const mealName = hasNext ? nextMeal!.meal.name!.trim() : t.dashboardWeeklyPlanNextFallback;
  const ctaText = hasNext ? t.dashboardWeeklyPlanCta : t.dashboardWeeklyPlanCtaEmpty;
  const openPlanTap = useScrollFriendlyTap(onOpenPlan);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay, ease: [0.22, 1, 0.36, 1] }}
      {...openPlanTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenPlan();
        }
      }}
      aria-label={`${t.weeklyPlan}: ${mealName}`}
      className={cn(
        "dashboard-touch-scroll group relative w-full min-w-0 overflow-hidden rounded-[1.65rem] border border-slate-200/75 p-5 text-left",
        "bg-gradient-to-br from-white via-white to-primary/[0.06]",
        "shadow-[0_18px_44px_-32px_rgba(74,232,150,0.32)]",
        "transition-[box-shadow,transform] duration-300",
        "hover:shadow-[0_22px_50px_-28px_rgba(74,232,150,0.4)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2",
        "dark:border-white/10 dark:from-white/[0.07] dark:to-primary/[0.08]",
      )}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-primary/15 blur-2xl"
        aria-hidden
      />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <CalendarDays className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-[17px] font-bold tracking-[-0.03em] text-foreground">
                {t.weeklyPlan}
              </h3>
              <p className="text-[12px] font-medium text-primary/75">{weekday}</p>
            </div>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0 text-primary/35 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary/65"
            strokeWidth={2.2}
            aria-hidden
          />
        </div>

        <div className="rounded-2xl bg-primary/[0.08] px-4 py-3.5">
          {hasNext ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/70">
                {t.dashboardWeeklyPlanNextLabel}
              </p>
              <p className="mt-1.5 line-clamp-2 text-[19px] font-bold leading-snug tracking-[-0.03em] text-foreground">
                {mealName}
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                {nextMeal?.timeLabel && (
                  <span className="text-[16px] font-semibold tabular-nums tracking-tight text-[#39D47F]">
                    {nextMeal.timeLabel}
                  </span>
                )}
                {nextMeal?.slotLabel && (
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {nextMeal.slotLabel}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-[15px] font-semibold leading-snug text-muted-foreground">{t.dashboardWeeklyPlanHint}</p>
          )}
        </div>

        <div className="flex items-end justify-between gap-0.5 px-0.5" aria-hidden>
          {weekDays.map((day) => (
            <div key={day.short} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full",
                  day.isToday
                    ? "h-2 w-2 bg-primary shadow-[0_0_0_3px_rgba(110,240,168,0.25)]"
                    : "h-1.5 w-1.5",
                  !day.isToday &&
                    (day.hasMeals ? "bg-primary/45" : "bg-slate-200/90 dark:bg-white/12"),
                )}
              />
              <span
                className={cn(
                  "text-[9px] font-semibold leading-none",
                  day.isToday ? "text-primary" : "text-muted-foreground/65",
                )}
              >
                {day.short}
              </span>
            </div>
          ))}
        </div>

        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary/80 transition-colors group-hover:text-primary">
          <span>{ctaText}</span>
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
        </p>
      </div>
    </motion.div>
  );
}
