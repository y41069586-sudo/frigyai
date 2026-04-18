import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FRIGY_STORAGE_UPDATED } from "@/lib/frigyStorageSync";

function isRelevantStorageKey(key: string | null): boolean {
  if (key == null) return true;
  return (
    key.startsWith("weekly") ||
    key.startsWith("frigy_") ||
    key.startsWith("frigai_") ||
    key.startsWith("frigy_steps_") ||
    key === "todayFood" ||
    key === "waterDailyGoalCups" ||
    key === "userFoodGoal" ||
    key === "mealPlanShoppingSource" ||
    key === "reminderConfig"
  );
}

/**
 * Erhöht bei Navigation zurück zum Dashboard, bei storage-Events (andere Tabs)
 * und nach `notifyFrigyStorageUpdated()` (gleicher Tab), damit Widgets neu aus localStorage lesen.
 */
export function useFrigyStorageSnapshot(): number {
  const [version, setVersion] = useState(0);
  const location = useLocation();

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    bump();
  }, [location.pathname, location.search, bump]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (isRelevantStorageKey(e.key)) bump();
    };
    const onCustom = () => bump();
    const onFocus = () => bump();
    const onVisibility = () => {
      if (document.visibilityState === "visible") bump();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(FRIGY_STORAGE_UPDATED, onCustom);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FRIGY_STORAGE_UPDATED, onCustom);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [bump]);

  return version;
}
