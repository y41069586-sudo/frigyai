import { useCallback } from "react";

type HapticStyle = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    // Check if vibration API is supported
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const haptic = useCallback((style: HapticStyle = "light") => {
    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      selection: 5,
      success: [10, 50, 10],
      warning: [20, 30, 20],
      error: [30, 50, 30, 50, 30],
    };

    vibrate(patterns[style]);
  }, [vibrate]);

  // Convenience methods
  const lightTap = useCallback(() => haptic("light"), [haptic]);
  const mediumTap = useCallback(() => haptic("medium"), [haptic]);
  const heavyTap = useCallback(() => haptic("heavy"), [haptic]);
  const selectionTap = useCallback(() => haptic("selection"), [haptic]);
  const successFeedback = useCallback(() => haptic("success"), [haptic]);
  const warningFeedback = useCallback(() => haptic("warning"), [haptic]);
  const errorFeedback = useCallback(() => haptic("error"), [haptic]);

  return {
    vibrate,
    haptic,
    lightTap,
    mediumTap,
    heavyTap,
    selectionTap,
    successFeedback,
    warningFeedback,
    errorFeedback,
  };
};