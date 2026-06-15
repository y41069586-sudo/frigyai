import { Capacitor } from "@capacitor/core";

/** True in the Capacitor iOS shell (not Android or browser). */
export function isIOSNative(): boolean {
  return Capacitor.getPlatform() === "ios";
}

/** Apply `platform-ios` on `<html>` so CSS glass tokens activate only on iOS. */
export function markIOSPlatformClass(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("platform-ios", isIOSNative());
}
