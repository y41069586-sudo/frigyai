import { motion, AnimatePresence } from "framer-motion";
import { CalendarRange, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetCard } from "./WidgetCard";
import type { WeekPlanPreviewData } from "@/lib/food-ai/dashboardMock";
import { cn } from "@/lib/utils";

type Preview = WeekPlanPreviewData;

type WeeklyPlanWidgetProps = {
  preview: Preview;
  delay?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onOpenPlan: () => void;
  onRegenerate?: () => void;
};

export function WeeklyPlanWidget({
  preview,
  delay = 0,
  expanded,
  onToggleExpand,
  onOpenPlan,
  onRegenerate,
}: WeeklyPlanWidgetProps) {
  const today = preview.days.find((d) => d.dayLabel === "Heute") ?? preview.days[preview.days.length - 1];

  return (
    <WidgetCard
      delay={delay}
      variant="gradient"
      interactive={!!onToggleExpand}
      onClick={onToggleExpand}
      className="w-full pb-4"
    >
      <div className="flex items-center gap-2 text-primary">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl rounded-br-md bg-primary/15">
          <CalendarRange className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Wochenplan</p>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{preview.weekLabel}</h3>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {preview.days.map((d, i) => (
          <motion.div
            key={d.dayLabel + i}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className={cn(
              "min-w-[112px] rounded-2xl rounded-tr-lg border border-border/50 bg-background/60 px-3 py-2.5 backdrop-blur-sm",
              d.dayLabel === "Heute" && "border-primary/35 ring-1 ring-primary/20",
            )}
          >
            <p className="text-[11px] font-bold text-muted-foreground">{d.dayLabel}</p>
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-foreground">{d.meals.join(" · ")}</p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Fokus heute: <span className="font-medium text-foreground">{today?.meals.join(", ")}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          size="sm"
          className="h-11 flex-1 rounded-2xl rounded-bl-md rounded-tr-xl font-semibold shadow-md shadow-primary/20"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPlan();
          }}
        >
          Plan öffnen
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        {onRegenerate && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-11 flex-1 rounded-2xl border-dashed border-primary/30 bg-background/50"
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
          >
            <Sparkles className="mr-1.5 h-4 w-4 text-primary" />
            Neu generieren
          </Button>
        )}
      </div>
    </WidgetCard>
  );
}
