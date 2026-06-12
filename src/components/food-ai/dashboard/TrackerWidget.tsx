import { useEffect } from "react";
import { motion } from "framer-motion";
import { Beef, Check, Droplet, Pencil, Plus, Wheat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  /** true while tracker settings are still loading from DB */
  targetsLoading?: boolean;
  /** summary = calories/macros only; quick-log = meal slot buttons; all = both */
  section?: "all" | "summary" | "quick-log";
};

let trackerSummaryEntered = false;

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
  targetsLoading = false,
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
  const proteinText = targetsReady
    ? `${Math.round(proteinEaten)} / ${Math.round(targetProtein)}g`
    : `${Math.round(proteinEaten)} g`;
  const carbsText = targetsReady
    ? `${Math.round(carbsEaten)} / ${Math.round(targetCarbs)}g`
    : `${Math.round(carbsEaten)} g`;
  const fatText = targetsReady
    ? `${Math.round(fatEaten)} / ${Math.round(targetFat)}g`
    : `${Math.round(fatEaten)} g`;
  const proteinPct = targetsReady && targetProtein > 0 ? Math.min(100, (proteinEaten / targetProtein) * 100) : 0;
  const carbsPct = targetsReady && targetCarbs > 0 ? Math.min(100, (carbsEaten / targetCarbs) * 100) : 0;
  const fatPct = targetsReady && targetFat > 0 ? Math.min(100, (fatEaten / targetFat) * 100) : 0;
  const openTrackerTap = useScrollFriendlyTap(() => onOpenTracker?.());
  const showSummary = section === "all" || section === "summary";
  const showSlots = (section === "all" || section === "quick-log") && showQuickLog;
  const showTargetsSkeleton = targetsLoading && !targetsReady;
  const skipSummaryEntrance = showSummary && trackerSummaryEntered;
  const skipProgressAnimation = trackerSummaryEntered;

  useEffect(() => {
    if (showSummary) trackerSummaryEntered = true;
  }, [showSummary]);

  return (
    <div className={cn("dashboard-touch-scroll space-y-6", section !== "quick-log" && "w-full min-w-0")}>
      {showSummary && (
      <WidgetCard
        delay={delay}
        variant="glass"
        interactive={false}
        skipEntrance={skipSummaryEntrance}
        className="w-full min-w-0 rounded-[2rem] p-5 sm:p-6"
      >
        {showTargetsSkeleton ? (
          <div className="space-y-5 py-1" aria-busy="true" aria-label={t.loading}>
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-10 w-40 rounded-xl" />
            <Skeleton className="h-3 w-52 rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Skeleton className="h-[76px] rounded-2xl" />
              <Skeleton className="h-[76px] rounded-2xl" />
              <Skeleton className="h-[76px] rounded-2xl" />
            </div>
          </div>
        ) : (
        <div className="space-y-7 text-foreground">
          <div className="space-y-1.5">
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
            <button
              type="button"
              {...openTrackerTap}
              className={cn(
                "block w-full text-left text-[34px] font-black leading-none tracking-[-0.04em] tabular-nums active:scale-[0.99] sm:text-[38px]",
                isOverGoal ? "text-rose-600" : "text-foreground",
              )}
            >
              {targetsReady
                ? `${(isOverGoal ? caloriesOver : caloriesRemaining).toLocaleString(locale)} kcal`
                : `${roundedCaloriesEaten.toLocaleString(locale)} kcal`}
            </button>
            <p className={cn("text-[13px] font-medium", isOverGoal ? "text-rose-500" : "text-muted-foreground")}>
              {targetsReady ? (
                <>
                  {isOverGoal ? t.dashboardTrackerOverGoal : t.dashboardTrackerRemaining}{" "}
                  {t.shoppingListOfCount} {roundedTargetCalories.toLocaleString(locale)} kcal
                </>
              ) : (
                t.eaten
              )}
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-3 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                className={cn("h-full origin-left rounded-full", isOverGoal ? "bg-rose-500" : "bg-primary")}
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
              <span className={cn(isOverGoal && "text-rose-500")}>
                {roundedCaloriesEaten.toLocaleString(locale)} {t.eaten}
              </span>
              <span className={cn(isOverGoal && "text-rose-500")}>{Math.round(calPct)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <InlineStat icon={Beef} colorClass="text-rose-500 bg-rose-50" ringColor="#fb7185" label={t.protein} value={proteinText} progress={proteinPct} />
            <InlineStat icon={Wheat} colorClass="text-amber-500 bg-amber-50" ringColor="#fbbf24" label={t.carbs} value={carbsText} progress={carbsPct} />
            <InlineStat icon={Droplet} colorClass="text-sky-500 bg-sky-50" ringColor="#38bdf8" label={t.fat} value={fatText} progress={fatPct} />
          </div>
        </div>
        )}
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
        "flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-[1.15rem] border-0 bg-white px-1.5 py-2 text-center shadow-[0_12px_28px_-14px_rgba(15,23,42,0.18)] transition-[box-shadow,background-color] sm:min-h-[78px] dark:bg-white/[0.96]",
        logged
          ? "bg-primary/[0.08] text-primary shadow-[0_12px_28px_-14px_rgba(57,212,127,0.22)]"
          : "text-foreground hover:bg-white hover:shadow-[0_14px_32px_-14px_rgba(15,23,42,0.22)] active:scale-[0.98]",
      )}
      aria-label={`${addMealLabel} ${slot.label}`}
    >
      <span className="text-[23px] sm:text-[24px]" aria-hidden>{slot.icon}</span>
      <span className="text-[10px] font-bold leading-tight sm:text-[11px]">{slot.label}</span>
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full sm:h-5.5 sm:w-5.5",
          logged ? "bg-primary" : "bg-primary/12",
        )}
      >
        {logged ? (
          <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
        ) : (
          <Plus className="h-3 w-3 text-primary" strokeWidth={3} />
        )}
      </span>
    </motion.button>
  );
}

function InlineStat({
  icon: Icon,
  colorClass,
  ringColor,
  label,
  value,
  progress,
}: {
  icon: typeof Beef;
  colorClass: string;
  ringColor: string;
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div className="relative rounded-2xl px-2.5 py-3 text-center">
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `conic-gradient(${ringColor} ${progress * 3.6}deg, rgba(148,163,184,0.22) 0deg)`,
        }}
      />
      <div className="pointer-events-none absolute inset-[3px] rounded-[0.82rem] bg-[#f9fbf9]/96" />
      <div className="relative z-[1]">
        <span className={cn("mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full", colorClass)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p className="mt-1 text-[10px] font-semibold leading-none tabular-nums text-slate-600">{value}</p>
      </div>
    </div>
  );
}
