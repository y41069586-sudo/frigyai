import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useFrigyStorageSnapshot } from "@/hooks/useFrigyStorageSnapshot";
import {
  getWeekPlanPreviewFromStorage,
  getShoppingPreviewFromStorage,
} from "@/lib/food-ai/dashboardMock";
import { WidgetContainer } from "./WidgetContainer";
import { WeeklyPlanWidget } from "./WeeklyPlanWidget";
import { ShoppingListWidget } from "./ShoppingListWidget";
import { TrackerWidget } from "./TrackerWidget";
import { DashboardWeightWidget } from "@/components/DashboardWeightWidget";
import { WaterWidget } from "./WaterWidget";
import { StepsWidget } from "./StepsWidget";
import { AiChatPromptWidget } from "./AiChatPromptWidget";

const ML_PER_GLASS = 200;

export type HealthDashboardProps = {
  caloriesEaten: number;
  targetCalories: number;
  proteinEaten: number;
  targetProtein: number;
  carbsEaten: number;
  targetCarbs: number;
  fatEaten: number;
  targetFat: number;
  waterGlasses: number;
  /** Tagesziel in ml (wie auf der Wasser-Seite, Standard 2000) */
  waterGoalMl?: number;
  onWaterGlassesChange: (glasses: number) => void;
  scansRemaining?: number | null;
  steps?: number;
  stepsGoal?: number;
  /** Premium: Schnellfrage unter „Heute eintragen“, öffnet den KI-Chat */
  aiChatEnabled?: boolean;
  onAiChatPromptSubmit?: (message: string) => void;
};

export function HealthDashboard({
  caloriesEaten,
  targetCalories,
  proteinEaten,
  targetProtein,
  carbsEaten,
  targetCarbs,
  fatEaten,
  targetFat,
  waterGlasses,
  waterGoalMl = 2000,
  onWaterGlassesChange,
  scansRemaining,
  steps: stepsProp,
  stepsGoal = 10_000,
  aiChatEnabled = false,
  onAiChatPromptSubmit,
}: HealthDashboardProps) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dashboardPage, setDashboardPage] = useState<0 | 1>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const storageVersion = useFrigyStorageSnapshot();

  const stepsDemo = useMemo(() => {
    if (stepsProp != null) return stepsProp;
    const key = `frigy_steps_${new Date().toISOString().split("T")[0]}`;
    const raw = localStorage.getItem(key);
    if (raw) return parseInt(raw, 10) || 6420;
    const seed = 5200 + Math.floor(Math.random() * 3800);
    localStorage.setItem(key, String(seed));
    return seed;
  }, [stepsProp, storageVersion]);

  const weekPreview = useMemo(() => getWeekPlanPreviewFromStorage(), [storageVersion]);

  const shoppingPreview = useMemo(() => getShoppingPreviewFromStorage(), [storageVersion]);

  const toggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleAddWater250 = useCallback(() => {
    const currentMl = waterGlasses * ML_PER_GLASS;
    const newGlasses = Math.max(0, Math.round((currentMl + 250) / ML_PER_GLASS));
    onWaterGlassesChange(newGlasses);
  }, [waterGlasses, onWaterGlassesChange]);

  const handleSubtractWater250 = useCallback(() => {
    const currentMl = waterGlasses * ML_PER_GLASS;
    const newGlasses = Math.max(0, Math.round((currentMl - 250) / ML_PER_GLASS));
    onWaterGlassesChange(newGlasses);
  }, [waterGlasses, onWaterGlassesChange]);

  const handleRegeneratePlan = () => {
    toast({
      title: "Neuen Wochenplan starten",
      description: "Bitte Kühlschrank mit Kamera oder Galerie scannen.",
    });
    navigate("/scan");
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const deltaX = endX - touchStartX;
    if (deltaX <= -40) setDashboardPage(1);
    if (deltaX >= 40) setDashboardPage(0);
    setTouchStartX(null);
  };

  return (
    <div className="space-y-2.5 min-[360px]:space-y-3 sm:space-y-4">
      {scansRemaining != null && (
        <p className="px-1 text-[11px] min-[360px]:text-xs text-muted-foreground">
          Free: noch <span className="font-semibold text-foreground">{scansRemaining}</span> Scan(s) diese Woche
        </p>
      )}

      <WidgetContainer>
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <motion.div className="relative min-h-[280px] min-[360px]:min-h-[300px] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              {dashboardPage === 0 ? (
                <motion.div
                  key="tracker-page"
                  className="w-full"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                <TrackerWidget
                  delay={0.02}
                  caloriesEaten={caloriesEaten}
                  targetCalories={targetCalories}
                  proteinEaten={proteinEaten}
                  targetProtein={targetProtein}
                  carbsEaten={carbsEaten}
                  targetCarbs={targetCarbs}
                  fatEaten={fatEaten}
                  targetFat={targetFat}
                  onAddMeal={(slot) => navigate(`/?logMeal=1&mealFocus=${slot}`)}
                  onOpenMealPlanner={() => navigate("/meal-plans?tab=meals")}
                  onOpenTracker={() => navigate("/?editMacros=1")}
                  expanded={expandedId === "tracker"}
                  onToggleExpand={() => toggle("tracker")}
                />
                </motion.div>
              ) : (
                <motion.div
                  key="weight-page"
                  className="w-full"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <DashboardWeightWidget embedded />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="mt-2 flex items-center justify-center gap-1.5">
            <button
              type="button"
              aria-label="Tracker Seite"
              onClick={() => setDashboardPage(0)}
              className={`h-1.5 rounded-full transition-all ${dashboardPage === 0 ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"}`}
            />
            <button
              type="button"
              aria-label="Gewichtsverlauf Seite"
              onClick={() => setDashboardPage(1)}
              className={`h-1.5 rounded-full transition-all ${dashboardPage === 1 ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"}`}
            />
          </div>
        </div>

        {aiChatEnabled && onAiChatPromptSubmit && (
          <AiChatPromptWidget delay={0.055} onSubmit={onAiChatPromptSubmit} />
        )}

        <div className="grid grid-cols-2 gap-2 min-[360px]:gap-2.5">
          <WaterWidget
            delay={0.08}
            waterGlasses={waterGlasses}
            goalMl={Math.min(waterGoalMl, 2000)}
            onAdd250ml={handleAddWater250}
            onSubtract250ml={handleSubtractWater250}
            expanded={expandedId === "water"}
            onToggleExpand={() => toggle("water")}
          />
          <StepsWidget
            delay={0.1}
            steps={stepsDemo}
            goal={stepsGoal}
            expanded={expandedId === "steps"}
            onToggleExpand={() => toggle("steps")}
          />
        </div>

        <WeeklyPlanWidget
          delay={0.12}
          preview={weekPreview}
          expanded={expandedId === "week"}
          onToggleExpand={() => toggle("week")}
          onOpenPlan={() => navigate("/meal-plans?tab=meals")}
          onRegenerate={handleRegeneratePlan}
        />

        <ShoppingListWidget
          delay={0.14}
          items={shoppingPreview}
          expanded={expandedId === "shop"}
          onToggleExpand={() => toggle("shop")}
          onOpenList={() => navigate("/meal-plans?tab=shopping")}
        />
      </WidgetContainer>
    </div>
  );
}
