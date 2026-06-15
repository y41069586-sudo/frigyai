import { useIOSPlatformBootstrap } from "@/hooks/useIOSPlatform";

/** Ensures iOS detection retries and subscribed components re-render when ready. */
export function IOSPlatformBootstrap() {
  useIOSPlatformBootstrap();
  return null;
}
