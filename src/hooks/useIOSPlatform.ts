import { useSyncExternalStore } from "react";
import {
  bootstrapIOSPlatformClass,
  getIOSPlatformSnapshot,
  subscribeIOSPlatform,
} from "@/lib/platformUi";

/** Reactive iOS-native flag — re-renders when Capacitor bridge becomes ready. */
export function useIOSPlatform(): boolean {
  return useSyncExternalStore(subscribeIOSPlatform, getIOSPlatformSnapshot, () => false);
}

/** Call once near app root so detection retries run. */
export function useIOSPlatformBootstrap(): void {
  useSyncExternalStore(
    (onStoreChange) => {
      bootstrapIOSPlatformClass();
      return subscribeIOSPlatform(onStoreChange);
    },
    getIOSPlatformSnapshot,
    () => false,
  );
}
