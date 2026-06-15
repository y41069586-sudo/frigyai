import { Capacitor } from "@capacitor/core";

type CapacitorWindow = Window & {
  Capacitor?: {
    getPlatform?: () => string;
    isNativePlatform?: () => boolean;
  };
  __FRIGY_IOS_NATIVE__?: boolean;
};

const APPLE_UA = /iPhone|iPad|iPod/i;

/** Packaged Capacitor iOS always serves the bundle from localhost (not Safari). */
function isCapacitorIOSHost(): boolean {
  if (typeof window === "undefined") return false;
  const { protocol, hostname } = window.location;
  if (protocol === "capacitor:") return true;
  if (hostname === "localhost" && APPLE_UA.test(navigator.userAgent || "")) return true;
  return false;
}

/** True in the Capacitor iOS shell (not Android or mobile Safari). */
export function isIOSNative(): boolean {
  if (typeof window === "undefined") return false;

  if ((window as CapacitorWindow).__FRIGY_IOS_NATIVE__) return true;
  if (document.documentElement.classList.contains("platform-ios")) return true;

  try {
    if (Capacitor.getPlatform() === "ios") return true;
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() !== "android") {
      return APPLE_UA.test(navigator.userAgent || "");
    }
  } catch {
    // bridge not ready
  }

  const cap = (window as CapacitorWindow).Capacitor;
  if (cap?.getPlatform?.() === "ios") return true;
  if (cap?.isNativePlatform?.() && APPLE_UA.test(navigator.userAgent || "")) return true;

  return isCapacitorIOSHost();
}

/** Apply `platform-ios` on `<html>` so CSS glass tokens activate only on iOS. */
export function markIOSPlatformClass(): void {
  if (typeof document === "undefined") return;
  const ios = isIOSNative();
  document.documentElement.classList.toggle("platform-ios", ios);
  if (ios) (window as CapacitorWindow).__FRIGY_IOS_NATIVE__ = true;
}

let platformBootstrapStarted = false;
const platformListeners = new Set<() => void>();

export function subscribeIOSPlatform(listener: () => void): () => void {
  platformListeners.add(listener);
  return () => platformListeners.delete(listener);
}

export function getIOSPlatformSnapshot(): boolean {
  return isIOSNative();
}

function notifyPlatformListeners(): void {
  platformListeners.forEach((listener) => listener());
}

/** Re-check iOS while Capacitor bridge initializes (WKWebView first paint). */
export function bootstrapIOSPlatformClass(): void {
  markIOSPlatformClass();
  notifyPlatformListeners();

  if (platformBootstrapStarted || typeof window === "undefined") return;
  platformBootstrapStarted = true;

  const run = () => {
    const before = document.documentElement.classList.contains("platform-ios");
    markIOSPlatformClass();
    const after = document.documentElement.classList.contains("platform-ios");
    if (before !== after) notifyPlatformListeners();
  };

  document.addEventListener("DOMContentLoaded", run);
  window.addEventListener("load", run);

  let attempts = 0;
  const timer = window.setInterval(() => {
    run();
    attempts += 1;
    if (attempts >= 60) window.clearInterval(timer);
  }, 50);
}

/** PWA service worker serves stale CSS on Capacitor — disable on native shells. */
export async function disableNativeServiceWorker(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isIOSNative() && !Capacitor.isNativePlatform()) return;

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((registration) => registration.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // non-fatal
  }
}
