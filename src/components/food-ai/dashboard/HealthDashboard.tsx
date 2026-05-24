import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFrigyStorageSnapshot } from "@/hooks/useFrigyStorageSnapshot";
import { getWeekPlanPreviewFromStorage } from "@/lib/food-ai/dashboardMock";
import { mealPlansUrlForToday } from "@/lib/food-ai/weeklyPlanWidgetData";
import { WidgetContainer } from "./WidgetContainer";
import { WeeklyPlanWidget } from "./WeeklyPlanWidget";
import { TrackerWidget } from "./TrackerWidget";
import { TrackerWidgetCarousel } from "./TrackerWidgetCarousel";
import { DashboardWeightWidget } from "@/components/DashboardWeightWidget";
import { WaterWidget } from "./WaterWidget";
import { StepsWidget } from "./StepsWidget";
import { AiChatPromptWidget } from "./AiChatPromptWidget";
import type { MealFocusKey } from "@/lib/mealFocus";
import { confettiBurst } from "@/lib/mobileEffects";

const ML_PER_GLASS = 250;
const WATER_CONFETTI_GOAL_ML = 2000;

export type HealthDashboardProps = {
  caloriesEaten: number;
  targetCalories: number;
  proteinEaten: number;
  targetProtein: number;
  carbsEaten: number;
  targetCarbs: number;
  fatEaten: number;
  targetFat: number;
  loggedMealTypes?: MealFocusKey[];
  waterGlasses: number;
  /** Tagesziel in ml (wie auf der Wasser-Seite, Standard 2000) */
  waterGoalMl?: number;
  onWaterGlassesChange: (glasses: number) => void;
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
  loggedMealTypes = [],
  waterGlasses,
  waterGoalMl = 2000,
  onWaterGlassesChange,
  steps: stepsProp,
  stepsGoal = 10_000,
  aiChatEnabled = false,
  onAiChatPromptSubmit,
}: HealthDashboardProps) {
  const navigate = useNavigate();
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
  const currentWaterMl = waterGlasses * ML_PER_GLASS;

  const handleAddWater250 = useCallback(() => {
    const currentMl = waterGlasses * ML_PER_GLASS;
    const newGlasses = Math.max(0, Math.round((currentMl + 250) / ML_PER_GLASS));
    const newMl = newGlasses * ML_PER_GLASS;

    if (currentMl < WATER_CONFETTI_GOAL_ML && newMl >= WATER_CONFETTI_GOAL_ML) {
      void confettiBurst({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.72 },
        colors: ["#38bdf8", "#7dd3fc", "#22d3ee", "#ffffff"],
      });
    }

    onWaterGlassesChange(newGlasses);
  }, [waterGlasses, onWaterGlassesChange]);

  const handleSubtractWater250 = useCallback(() => {
    const currentMl = waterGlasses * ML_PER_GLASS;
    const newGlasses = Math.max(0, Math.round((currentMl - 250) / ML_PER_GLASS));
    onWaterGlassesChange(newGlasses);
  }, [waterGlasses, onWaterGlassesChange]);

  return (
    <div className="space-y-8">
      <WidgetContainer>
        <TrackerWidgetCarousel
          tracker={
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
              waterMl={currentWaterMl}
              waterGoalMl={waterGoalMl}
              steps={stepsDemo}
              loggedMealTypes={loggedMealTypes}
              onAddMeal={(slot) => navigate(`/?logMeal=1&mealFocus=${slot}`)}
              onOpenMealPlanner={() => navigate(mealPlansUrlForToday())}
              onOpenTracker={() => navigate("/?editMacros=1")}
            />
          }
          weight={<DashboardWeightWidget embedded targetWeight={undefined} />}
        />

        <WeeklyPlanWidget
          delay={0.1}
          preview={weekPreview}
          onOpenPlan={() => navigate(mealPlansUrlForToday())}
        />

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 [content-visibility:auto] [contain-intrinsic-size:88px]">
          <WaterWidget
            delay={0.14}
            waterGlasses={waterGlasses}
            goalMl={Math.min(waterGoalMl, 2000)}
            onAdd250ml={handleAddWater250}
            onSubtract250ml={handleSubtractWater250}
          />
          <StepsWidget
            delay={0.16}
            steps={stepsDemo}
            goal={stepsGoal}
          />
        </div>

        {aiChatEnabled && onAiChatPromptSubmit && (
          <AiChatPromptWidget delay={0.18} onSubmit={onAiChatPromptSubmit} />
        )}
      </WidgetContainer>
    </div>
  );
}
