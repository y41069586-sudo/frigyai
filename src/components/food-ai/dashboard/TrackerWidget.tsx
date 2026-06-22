import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Beef, Check, Droplet, Pencil, Plus, Wheat } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";
import type { MealFocusKey } from "@/lib/mealFocus";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAppLocale } from "@/lib/mealPlanLanguage";
import { useScrollFriendlyTap } from "@/hooks/useScrollFriendlyTap";

type TrackerWidgetProps = {
  delay?: number;
  caloriesEaten: number;
  targetCalories: number;
  proteinEaten: number;
  targetProtein: number;
  carbsEaten: number;
  targetCarbs: number;
  fatEaten: number;
  targetFat: number;
  waterMl?: number;
  waterGoalMl?: number;
  steps?: number;
  onAddMeal?: (slot: MealFocusKey) => void;
  onOpenTracker?: () => void;
  onOpenMealPlanner?: () => void;
  loggedMealTypes?: MealFocusKey[];
  showQuickLog?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  /** false while tracker goals still load — suppresses brief “over goal” flash */
  targetsReady?: boolean;
  /** summary = calories/macros only; quick-log = meal slot buttons; all = both */
  section?: "all" | "summary" | "quick-log";
};

let trackerSummaryEntered = false;

function AnimatedCalorieNumber({
  value,
  locale,
  className,
}: {
  value: number;
  locale: string;
  className?: string;
}) {
  const motionValue = useMotionValue(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, []);

  const displayValue = useTransform(motionValue, (v) =>
    Math.round(v).toLocaleString(locale)
  );

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}

export function TrackerWidget({
  delay = 0,
  caloriesEaten,
  targetCalories,
  proteinEaten,
  targetProtein,
  carbsEaten,
  targetCarbs,
  fatEaten,
  targetFat,
  onAddMeal,
  onOpenTracker,
  loggedMealTypes = [],
  showQuickLog = true,
  targetsReady = true,
  section = "all",
}: TrackerWidgetProps) {
  const { t, language } = useLanguage();
  const locale = getAppLocale(language);
  const mealSlots: { key: MealFocusKey; label: string; icon: string }[] = [
    { key: "breakfast", label: t.breakfast, icon: "🍳" },
    { key: "lunch", label: t.lunch, icon: "🥗" },
    { key: "dinner", label: t.dinner, icon: "🍝" },
    { key: "snack", label: t.snack, icon: "🍎" },
  ];
  const roundedTargetCalories = Math.round(targetCalories);
  const roundedCaloriesEaten = Math.round(caloriesEaten);
  const rawCalorieDelta = targetsReady ? roundedTargetCalories - roundedCaloriesEaten : 0;
  const caloriesOver = targetsReady && rawCalorieDelta < -1 ? Math.abs(rawCalorieDelta) : 0;
  const caloriesRemaining = targetsReady && rawCalorieDelta > 1 ? rawCalorieDelta : 0;
  const isOverGoal = targetsReady && caloriesOver > 0;
  const calPct =
    targetsReady && targetCalories > 0
      ? Math.min(100, (caloriesEaten / targetCalories) * 100)
      : 0;
  const proteinPct = targetsReady && targetProtein > 0 ? Math.min(100, (proteinEaten / targetProtein) * 100) : 0;
  const carbsPct = targetsReady && targetCarbs > 0 ? Math.min(100, (carbsEaten / targetCarbs) * 100) : 0;
  const fatPct = targetsReady && targetFat > 0 ? Math.min(100, (fatEaten / targetFat) * 100) : 0;
  const openTrackerTap = useScrollFriendlyTap(() => onOpenTracker?.());
  const showSummary = section === "all" || section === "summary";
  const showSlots = (section === "all" || section === "quick-log") && showQuickLog;
  const skipProgressAnimation = trackerSummaryEntered;

  useEffect(() => {
    if (showSummary) trackerSummaryEntered = true;
  }, [showSummary]);

  const displayValue = isOverGoal ? caloriesOver : (targetsReady ? caloriesRemaining : roundedCaloriesEaten);

  return (
    <div className={cn("dashboard-touch-scroll space-y-6", section !== "quick-log" && "w-full min-w-0")}>
      {showSummary && (
      <WidgetCard
        delay={delay}
        variant="glass"
        interactive={false}
        skipEntrance
        className={cn(
          "w-full min-w-0 rounded-[2rem] p-5 sm:p-6",
          "bg-gradient-to-br from-white to-[#FBFFFD] shadow-[0_2px_20px_rgba(57,212,127,0.08)]",
          isOverGoal && "from-white to-[#FFF8F3]",
        )}
      >
        <div className="space-y-5 text-foreground">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary/75">{t.today}</p>
            {onOpenTracker && (
              <button
                type="button"
                {...openTrackerTap}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/15 active:scale-95"
                aria-label={t.changeGoal}
              >
                <Pencil className="h-4 w-4" strokeWidth={2.2} />
              </button>
            )}
          </div>

          {/* Hero calorie display */}
          <button
            type="button"
            {...openTrackerTap}
            className="block w-full text-left active:scale-[0.99]"
          >
            <div className={cn(
              "text-[44px] font-black leading-none tracking-[-0.04em] tabular-nums sm:text-[48px]",
              isOverGoal ? "text-orange-500" : "text-foreground",
            )}>
              <AnimatedCalorieNumber
                value={displayValue}
                locale={locale}
              />
              <span className="ml-1.5 text-[28px] sm:text-[32px]">kcal</span>
            </div>
            <p className={cn(
              "mt-1.5 text-[13px] font-medium",
              isOverGoal ? "text-orange-400" : "text-muted-foreground",
            )}>
              {targetsReady ? (
                <>
                  {isOverGoal ? t.dashboardTrackerOverGoal : t.dashboardTrackerRemaining}{" "}
                  {t.shoppingListOfCount} {roundedTargetCalories.toLocaleString(locale)} kcal
                </>
              ) : (
                t.eaten
              )}
            </p>
          </button>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-[8px] overflow-hidden rounded-full bg-primary/10">
              <motion.div
                className={cn(
                  "h-full origin-left rounded-full",
                  isOverGoal
                    ? "bg-gradient-to-r from-orange-400 to-orange-500"
                    : "bg-gradient-to-r from-[#75FBB2] to-[#39D47F]",
                )}
                initial={skipProgressAnimation ? false : { scaleX: 0 }}
                animate={{ scaleX: calPct / 100 }}
                transition={
                  skipProgressAnimation
                    ? { duration: 0 }
                    : { duration: 0.85, delay: delay + 0.05, ease: [0.22, 1, 0.36, 1] }
                }
              />
            </div>
            <div className="flex items-center justify-between text-[12px] font-medium text-muted-foreground">
              <span className={cn(isOverGoal && "text-orange-400")}>
                {roundedCaloriesEaten.toLocaleString(locale)} {t.eaten}
              </span>
              <span className={cn(
                "font-semibold",
                isOverGoal ? "text-orange-400" : "text-primary",
              )}>{Math.round(calPct)}%</span>
            </div>
          </div>

          {/* Macro pills */}
          <div className="grid grid-cols-3 gap-2">
            <MacroPill
              icon={Beef}
              label={t.protein}
              eaten={Math.round(proteinEaten)}
              target={Math.round(targetProtein)}
              pct={proteinPct}
              accentColor="#fb7185"
              targetsReady={targetsReady}
            />
            <MacroPill
              icon={Wheat}
              label={t.carbs}
              eaten={Math.round(carbsEaten)}
              target={Math.round(targetCarbs)}
              pct={carbsPct}
              accentColor="#fbbf24"
              targetsReady={targetsReady}
            />
            <MacroPill
              icon={Droplet}
              label={t.fat}
              eaten={Math.round(fatEaten)}
              target={Math.round(targetFat)}
              pct={fatPct}
              accentColor="#38bdf8"
              targetsReady={targetsReady}
            />
          </div>
        </div>
      </WidgetCard>
      )}

      {showSlots && (
      <motion.section
        className="space-y-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: delay + 0.04, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-end justify-between">
          <h2 className="text-[24px] font-bold tracking-[-0.03em] text-foreground">{t.today}</h2>
          <span className="text-[12px] font-medium text-muted-foreground">{t.dashboardQuickLog}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {mealSlots.map((slot, index) => {
            const logged = loggedMealTypes.includes(slot.key);
            return (
              <MealSlotButton
                key={slot.key}
                slot={slot}
                logged={logged}
                delay={delay}
                index={index}
                addMealLabel={t.dashboardAddMealBtn}
                onAddMeal={() => onAddMeal?.(slot.key)}
              />
            );
          })}
        </div>
      </motion.section>
      )}
    </div>
  );
}

function MealSlotButton({
  slot,
  logged,
  delay,
  index,
  addMealLabel,
  onAddMeal,
}: {
  slot: { key: MealFocusKey; label: string; icon: string };
  logged: boolean;
  delay: number;
  index: number;
  addMealLabel: string;
  onAddMeal: () => void;
}) {
  const tap = useScrollFriendlyTap(onAddMeal);
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.08 + index * 0.04, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      {...tap}
      className={cn(
        "flex min-h-[78px] flex-col items-center justify-center gap-1.5 rounded-[1.25rem] border-0 px-1.5 py-3 text-center transition-all sm:min-h-[84px]",
        logged
          ? "bg-gradient-to-b from-primary/10 to-primary/[0.06] text-primary shadow-[0_8px_24px_-8px_rgba(57,212,127,0.28)] active:scale-[0.97]"
          : "bg-white text-foreground shadow-[0_4px_18px_-4px_rgba(15,23,42,0.12)] hover:shadow-[0_8px_24px_-6px_rgba(15,23,42,0.16)] active:scale-[0.97] dark:bg-white/[0.96]",
      )}
      aria-label={`${addMealLabel} ${slot.label}`}
    >
      <span className="text-[24px] sm:text-[26px]" aria-hidden>{slot.icon}</span>
      <span className={cn(
        "text-[10px] font-semibold leading-tight sm:text-[11px]",
        logged ? "text-primary" : "text-[#1F2937]",
      )}>{slot.label}</span>
      <span
        className={cn(
          "flex h-[18px] w-[18px] items-center justify-center rounded-full",
          logged
            ? "bg-primary shadow-[0_2px_8px_rgba(57,212,127,0.4)]"
            : "bg-[#6B7280]/15",
        )}
      >
        {logged ? (
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        ) : (
          <Plus className="h-2.5 w-2.5 text-[#6B7280]" strokeWidth={3} />
        )}
      </span>
    </motion.button>
  );
}

function MacroPill({
  icon: Icon,
  label,
  eaten,
  target,
  pct,
  accentColor,
  targetsReady,
}: {
  icon: typeof Beef;
  label: string;
  eaten: number;
  target: number;
  pct: number;
  accentColor: string;
  targetsReady: boolean;
}) {
  const pillBg =
    !targetsReady || target === 0
      ? "bg-slate-50 border-slate-100"
      : pct >= 80
      ? "bg-green-50 border-green-100"
      : pct >= 40
      ? "bg-amber-50 border-amber-100"
      : "bg-red-50/60 border-red-100/80";

  const textColor =
    !targetsReady || target === 0
      ? "text-slate-500"
      : pct >= 80
      ? "text-green-600"
      : pct >= 40
      ? "text-amber-600"
      : "text-red-400";

  return (
    <div className={cn(
      "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-2.5 text-center",
      pillBg,
    )}>
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full"
        style={{ backgroundColor: `${accentColor}22` }}
      >
        <Icon className="h-3 w-3" style={{ color: accentColor }} />
      </span>
      <p className="text-[10px] font-medium text-[#6B7280]">{label}</p>
      <p className={cn("text-[11px] font-bold leading-none tabular-nums", textColor)}>
        {targetsReady && target > 0 ? `${eaten} / ${target}g` : `${eaten}g`}
      </p>
    </div>
  );
}
