import { Capacitor } from "@capacitor/core";

type CapacitorWindow = Window & {
  Capacitor?: {
    getPlatform?: () => string;
    isNativePlatform?: () => boolean;
  };
};

/** True in the Capacitor iOS shell (not Android or browser). */
export function isIOSNative(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (Capacitor.getPlatform() === "ios") return true;
  } catch {
    // Capacitor bridge not ready yet
  }

  const cap = (window as CapacitorWindow).Capacitor;
  if (cap?.getPlatform?.() === "ios") return true;

  const ua = navigator.userAgent || "";
  const isAppleMobile = /iPhone|iPad|iPod/i.test(ua);
  const isCapacitorHost =
    window.location.protocol === "capacitor:" ||
    (window.location.hostname === "localhost" && cap?.isNativePlatform?.());

  if (isAppleMobile && (isCapacitorHost || cap?.isNativePlatform?.())) {
    return true;
  }

  return false;
}

/** Apply `platform-ios` on `<html>` so CSS glass tokens activate only on iOS. */
export function markIOSPlatformClass(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("platform-ios", isIOSNative());
}

let platformBootstrapStarted = false;

/** Re-check iOS while Capacitor bridge initializes (WKWebView first paint). */
export function bootstrapIOSPlatformClass(): void {
  markIOSPlatformClass();
  if (platformBootstrapStarted || typeof window === "undefined") return;
  platformBootstrapStarted = true;

  const run = () => markIOSPlatformClass();
  document.addEventListener("DOMContentLoaded", run);
  window.addEventListener("load", run);

  let attempts = 0;
  const timer = window.setInterval(() => {
    run();
    attempts += 1;
    if (attempts >= 40) window.clearInterval(timer);
  }, 50);
}
