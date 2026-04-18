import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { WaterWidget } from "./WaterWidget";
import { StepsWidget } from "./StepsWidget";
import { MealSlotsWidget } from "./MealSlotsWidget";
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
      title: "Neuer Plan",
      description: "Öffne den Wochenplan – dort kannst du neu generieren.",
    });
    navigate("/meal-plans?tab=meals");
  };

  return (
    <div className="space-y-6">
      {scansRemaining != null && (
        <p className="px-1 text-xs text-muted-foreground">
          Free: noch <span className="font-semibold text-foreground">{scansRemaining}</span> Scan(s) diese Woche
        </p>
      )}

      <WidgetContainer>
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
          expanded={expandedId === "tracker"}
          onToggleExpand={() => toggle("tracker")}
        />

        <MealSlotsWidget
          delay={0.05}
          onAddMeal={(slot) => navigate(`/meal-plans?tab=tracker&mealFocus=${slot}`)}
        />

        {aiChatEnabled && onAiChatPromptSubmit && (
          <AiChatPromptWidget delay={0.055} onSubmit={onAiChatPromptSubmit} />
        )}

        <WaterWidget
          delay={0.08}
          waterGlasses={waterGlasses}
          goalMl={waterGoalMl}
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
