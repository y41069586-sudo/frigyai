import { CalendarDays, ChevronRight } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import type { WeekPlanPreviewData } from "@/lib/food-ai/dashboardMock";

type Preview = WeekPlanPreviewData;

type WeeklyPlanWidgetProps = {
  preview: Preview;
  delay?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onOpenPlan: () => void;
};

type StoredMeal = {
  name?: string;
};

const DE_WEEKDAY_FULL = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
] as const;

function readTodayMealDetails(): StoredMeal | null {
  try {
    const raw = localStorage.getItem("weeklyMealPlan");
    if (!raw) return null;
    const plan = JSON.parse(raw) as { day?: string; meals?: StoredMeal[] }[];
    if (!Array.isArray(plan)) return null;

    const today = DE_WEEKDAY_FULL[new Date().getDay()].toLowerCase();
    const day = plan.find((entry) => (entry.day ?? "").trim().toLowerCase() === today);
    return day?.meals?.[0] ?? null;
  } catch {
    return null;
  }
}

export function WeeklyPlanWidget({
  preview,
  delay = 0,
  onToggleExpand,
  onOpenPlan,
}: WeeklyPlanWidgetProps) {
  const today = preview.days.find((d) => d.dayLabel === "Heute") ?? preview.days[preview.days.length - 1];
  const mealDetails = readTodayMealDetails();
  const meal = mealDetails?.name ?? today?.meals[0] ?? "Noch kein Plan";

  return (
    <WidgetCard
      delay={delay}
      variant="glass"
      interactive={!!onToggleExpand}
      onClick={onToggleExpand}
      className="w-full rounded-[1.6rem] border border-slate-200/85 bg-white/72 p-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" />
            </span>
            <h3 className="text-[18px] font-bold tracking-[-0.03em] text-foreground">Wochenplan</h3>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/85 bg-muted/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
            Nächstes Essen
          </p>
          <h4 className="mt-1 line-clamp-1 text-[15px] font-bold leading-snug tracking-[-0.02em] text-foreground">
            {meal}
          </h4>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPlan();
          }}
          className="flex h-10 w-full shrink-0 items-center justify-center gap-1 rounded-2xl bg-primary px-4 text-[13px] font-bold text-primary-foreground shadow-[0_12px_28px_-18px_hsl(var(--primary))] transition-transform active:scale-[0.98]"
        >
          Plan öffnen
          <ChevronRight className="h-4 w-4" />
        </button>

      </div>
    </WidgetCard>
  );
}
