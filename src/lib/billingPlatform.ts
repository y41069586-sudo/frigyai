import { Capacitor } from "@capacitor/core";

/** Native iOS/Android builds use App Store / Play Billing (RevenueCat). */
export function isNativeAppPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function usesStoreBilling(): boolean {
  return isNativeAppPlatform();
}
