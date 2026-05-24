import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
    () => false,
  );
}
