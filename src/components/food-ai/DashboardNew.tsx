import { motion } from "framer-motion";
import {
  Camera,
  CalendarDays,
  Sparkles,
  Target,
  TrendingUp,
  Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { UserGoal } from "@/lib/food-ai/types";
import { cn } from "@/lib/utils";

type DashboardNewProps = {
  displayName: string;
  greeting: string;
  goal: UserGoal;
  onGoalChange: (g: UserGoal) => void;
  calorieProgress: number;
  remainingCalories: number;
  targetCalories: number;
  proteinEaten: number;
  targetProtein: number;
};

const goals: { id: UserGoal; label: string }[] = [
  { id: "lose", label: "Abnehmen" },
  { id: "gain", label: "Muskelaufbau" },
  { id: "maintain", label: "Halten" },
];

export function DashboardNew({
  displayName,
  greeting,
  goal,
  onGoalChange,
  calorieProgress,
  remainingCalories,
  targetCalories,
  proteinEaten,
  targetProtein,
}: DashboardNewProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero CTA – Kühlschrank scannen */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] rounded-tl-3xl rounded-br-[2.5rem] border border-primary/25 bg-gradient-to-br from-primary/20 via-background/95 to-muted/30 p-6 sm:p-8 shadow-[0_28px_60px_-24px_hsl(var(--primary)/0.55)]"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/40 blur-2xl opacity-60" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Scan className="h-6 w-6" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">AI Food</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {greeting}
            {displayName ? `, ${displayName}` : ""}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md">
            Scanne deinen Kühlschrank, erkenne Zutaten und plane deine Woche oder deine nächsten drei Mahlzeiten – personalisiert nach Ziel.
          </p>
          <div className="flex flex-col xs:flex-row gap-3 pt-2">
            <Button
              size="lg"
              className="h-14 rounded-2xl rounded-bl-md rounded-tr-[1.75rem] text-base font-semibold shadow-lg shadow-primary/35 bg-gradient-to-r from-primary to-primary/80"
              onClick={() => navigate("/scan")}
            >
              <Camera className="h-5 w-5 mr-2" />
              Kühlschrank scannen
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-2xl border-primary/30 bg-background/70 backdrop-blur-md"
              onClick={() => navigate("/meal-plans?tab=meals")}
            >
              <CalendarDays className="h-5 w-5 mr-2 text-primary" />
              Wochenplan
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Ziel */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-[1.75rem] border border-border/60 bg-card/70 backdrop-blur-xl p-5 sm:p-6 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center gap-2 mb-4 text-foreground">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Ziel</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {goals.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onGoalChange(g.id)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium transition-all border",
                goal === g.id
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-muted/50 border-transparent hover:border-primary/30 text-muted-foreground",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Fortschritt – große Karte, kein Raster */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8 border border-primary/15 bg-gradient-to-br from-background via-card/90 to-primary/5 shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.35)]"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Heute</p>
            <p className="text-4xl sm:text-5xl font-bold tabular-nums text-foreground">
              {Math.round(calorieProgress)}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-foreground font-semibold">{remainingCalories}</span> kcal übrig · Ziel {targetCalories} kcal
            </p>
          </div>
          <div className="flex-1 max-w-md w-full">
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, calorieProgress)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Protein: <span className="text-foreground font-medium">{Math.round(proteinEaten)}</span> / {targetProtein} g
            </div>
          </div>
        </div>
      </motion.section>

      {/* Schnellaktionen */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <button
          type="button"
          onClick={() => navigate("/meal-plans?tab=meals")}
          className="group text-left rounded-[1.5rem] rounded-tr-3xl p-6 border border-border/60 bg-card/80 backdrop-blur-md hover:border-primary/40 hover:shadow-lg transition-all"
        >
          <CalendarDays className="h-8 w-8 text-primary mb-3" />
          <h4 className="font-bold text-foreground mb-1">Wochenplan generieren</h4>
          <p className="text-sm text-muted-foreground">7 Tage im Überblick – nach dem Scan oder manuell.</p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/scan")}
          className="group text-left rounded-[1.5rem] rounded-tl-3xl p-6 border border-border/60 bg-card/80 backdrop-blur-md hover:border-primary/40 hover:shadow-lg transition-all"
        >
          <Sparkles className="h-8 w-8 text-primary mb-3" />
          <h4 className="font-bold text-foreground mb-1">3 Meals generieren</h4>
          <p className="text-sm text-muted-foreground">Nach dem Scan aus Zutaten & Ziel – Frühstück bis Abend.</p>
        </button>
      </motion.section>

      {/* AI Vorschlag Teaser */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-center text-sm text-muted-foreground"
      >
        <span className="text-primary font-medium">KI-Tipp:</span> Scanne vor dem Wocheneinkauf – so schlägt die App Mahlzeiten mit dem vor, was du schon hast.
      </motion.div>
    </div>
  );
}
