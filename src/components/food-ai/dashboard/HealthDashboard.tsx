import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFrigyStorageSnapshot } from "@/hooks/useFrigyStorageSnapshot";
import { getWeekPlanPreviewFromStorage } from "@/lib/food-ai/dashboardMock";
import { useLanguage } from "@/contexts/LanguageContext";
import { mealPlansUrlForToday } from "@/lib/food-ai/weeklyPlanWidgetData";
import { notifyOpenLogMeal } from "@/lib/overlayEvents";
import { WidgetContainer } from "./WidgetContainer";
import { WeeklyPlanWidget } from "./WeeklyPlanWidget";
import { TrackerWidget } from "./TrackerWidget";
import { TrackerWidgetCarousel } from "./TrackerWidgetCarousel";
import { DashboardWeightWidget } from "@/components/DashboardWeightWidget";
import { WaterWidget } from "./WaterWidget";
import { AiChatPromptWidget } from "./AiChatPromptWidget";
import type { MealFocusKey } from "@/lib/mealFocus";
import { confettiBurst } from "@/lib/mobileEffects";
import { ML_PER_WATER_GLASS } from "@/lib/waterUnits";

const ML_PER_GLASS = ML_PER_WATER_GLASS;
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
  aiChatEnabled = false,
  onAiChatPromptSubmit,
}: HealthDashboardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const storageVersion = useFrigyStorageSnapshot();
  const lng = (["de", "en", "fr"] as const).includes(language as "de" | "en" | "fr")
    ? (language as "de" | "en" | "fr")
    : "de";

  const weekPreview = useMemo(() => getWeekPlanPreviewFromStorage(lng), [storageVersion, lng]);
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
              loggedMealTypes={loggedMealTypes}
              onAddMeal={(slot) => notifyOpenLogMeal(slot)}
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

        <WaterWidget
          delay={0.14}
          waterGlasses={waterGlasses}
          goalMl={waterGoalMl}
          onAdd250ml={handleAddWater250}
          onSubtract250ml={handleSubtractWater250}
          className="min-h-[200px]"
        />

        {aiChatEnabled && onAiChatPromptSubmit && (
          <AiChatPromptWidget delay={0.18} onSubmit={onAiChatPromptSubmit} />
        )}
      </WidgetContainer>
    </div>
  );
}
