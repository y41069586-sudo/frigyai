import { Capacitor } from "@capacitor/core";

/** Native iOS/Android builds must use App Store / Play Billing (RevenueCat). */
export function isNativeAppPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/** Web/PWA checkout via Stripe Payment Links. */
export function usesWebStripeBilling(): boolean {
  return !isNativeAppPlatform();
}

export function usesStoreBilling(): boolean {
  return isNativeAppPlatform();
}
