import { useEffect } from "react";
import { bootstrapIOSPlatformClass } from "@/lib/platformUi";

/** Ensures `html.platform-ios` is set once Capacitor bridge is ready. */
export function IOSPlatformBootstrap() {
  useEffect(() => {
    bootstrapIOSPlatformClass();
  }, []);

  return null;
}
