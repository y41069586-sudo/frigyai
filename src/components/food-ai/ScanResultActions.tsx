import { motion } from "framer-motion";
import { Loader2, Refrigerator } from "lucide-react";
import type { UserGoal } from "@/lib/food-ai/types";
import { cn } from "@/lib/utils";

type ScanResultActionsProps = {
  goal: UserGoal;
  onGoalChange: (g: UserGoal) => void;
  onWeekPlan: () => void;
  loading?: boolean;
};

const goals: { id: UserGoal; label: string }[] = [
  { id: "lose", label: "Abnehmen" },
  { id: "gain", label: "Muskelaufbau" },
  { id: "maintain", label: "Halten" },
];

/** Nach dem Scan: Ziel wählen, dann Wochenplan (ohne Einkaufsliste – die nur über „Frigy Plan erstellen“). */
export function ScanResultActions({
  goal,
  onGoalChange,
  onWeekPlan,
  loading,
}: ScanResultActionsProps) {
  return (
    <div className="space-y-6 w-full">
      <div className="text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-2">Dein Ziel</p>
        <div className="flex flex-wrap gap-2">
          {goals.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onGoalChange(g.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                goal === g.id
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-background/60 border-border/80 text-muted-foreground hover:border-primary/40",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center sm:text-left">
        Aus dem Scan wird nur dein Wochenplan erstellt. Eine Einkaufsliste entsteht, wenn du im Wochenplan-Tab{" "}
        <span className="font-medium text-foreground">Frigy Plan erstellen</span> nutzt.
      </p>

      <motion.button
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={onWeekPlan}
        disabled={!!loading}
        className="group relative w-full text-left overflow-hidden rounded-[1.75rem] p-6 sm:p-7 min-h-[140px] border border-white/40 bg-gradient-to-br from-primary/15 via-background/90 to-primary/5 shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.45)] backdrop-blur-md"
      >
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        <Refrigerator className="h-9 w-9 text-primary mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-1">Wochenplan erstellen</h3>
        <p className="text-sm text-muted-foreground leading-snug">
          7 Tage aus deinen Zutaten – ohne automatische Einkaufsliste.
        </p>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-[1.75rem]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
