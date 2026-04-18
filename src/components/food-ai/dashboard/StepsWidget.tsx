import { motion } from "framer-motion";
import { Footprints, Link2 } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type StepsWidgetProps = {
  steps: number;
  goal?: number;
  delay?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

export function StepsWidget({
  steps,
  goal = 10_000,
  delay = 0,
  expanded,
  onToggleExpand,
}: StepsWidgetProps) {
  const pct = Math.min(100, (steps / goal) * 100);

  const connectHealth = () => {
    toast({
      title: "Google Health / Health Connect",
      description:
        "Verbindung kommt als nächstes. Du kannst dann Schritte automatisch synchronisieren.",
    });
  };

  return (
    <WidgetCard
      delay={delay}
      variant="soft"
      interactive={!!onToggleExpand}
      onClick={onToggleExpand}
      className="w-full rounded-[2rem] rounded-br-xl rounded-tl-[2.25rem]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl rounded-br-md bg-orange-500/10">
            <Footprints className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Bewegung</p>
            <h3 className="text-lg font-semibold tracking-tight">Schritte</h3>
          </div>
        </div>
        <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
          Ziel {goal >= 1000 ? `${goal / 1000}k` : goal}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-end justify-between">
          <motion.span
            className="text-3xl font-bold tabular-nums tracking-tight text-foreground"
            key={steps}
            initial={{ opacity: 0.6, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {steps.toLocaleString("de-DE")}
          </motion.span>
          <span className="text-sm text-muted-foreground">Schritte</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted/80">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-4 h-11 w-full rounded-2xl border-dashed border-orange-400/40 bg-orange-500/[0.06] text-foreground hover:bg-orange-500/10"
        onClick={(e) => {
          e.stopPropagation();
          connectHealth();
        }}
      >
        <Link2 className="mr-2 h-4 w-4 text-orange-600" />
        Mit Google Health verbinden
      </Button>

      {expanded && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-muted-foreground"
        >
          Aktuell Demo-Werte. Nach Verbindung werden echte Schritte übernommen (Health Connect / kompatible Apps).
        </motion.p>
      )}
    </WidgetCard>
  );
}
