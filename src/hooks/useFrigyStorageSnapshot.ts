import { useCallback, useEffect, useRef, useState } from "react";
import { FRIGY_STORAGE_UPDATED } from "@/lib/frigyStorageSync";

function isRelevantStorageKey(key: string | null): boolean {
  if (key == null) return true;
  return (
    key.startsWith("weekly") ||
    key.startsWith("frigy_") ||
    key.startsWith("frigai_") ||
    key === "todayFood" ||
    key === "waterDailyGoalCups" ||
    key === "userFoodGoal" ||
    key === "mealPlanShoppingSource" ||
    key === "reminderConfig"
  );
}

/**
 * Erhöht bei storage-Events (andere Tabs) und nach `notifyFrigyStorageUpdated()`
 * (gleicher Tab), damit Widgets neu aus localStorage lesen.
 */
export function useFrigyStorageSnapshot(): number {
  const [version, setVersion] = useState(0);
  const frameRef = useRef<number | null>(null);

  const bump = useCallback(() => {
    if (frameRef.current != null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      setVersion((v) => v + 1);
    });
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (isRelevantStorageKey(e.key)) bump();
    };
    const onCustom = () => bump();

    const passive = { passive: true };

    window.addEventListener("storage", onStorage, passive);
    window.addEventListener(FRIGY_STORAGE_UPDATED, onCustom, passive);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FRIGY_STORAGE_UPDATED, onCustom);
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [bump]);

  return version;
}
