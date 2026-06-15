import { cn } from "@/lib/utils";
import { isIOSNative } from "@/lib/platformUi";

/**
 * iOS Liquid Glass class tokens.
 * Primary styles live in `index.css` under `.platform-ios` (unlayered, high priority).
 */
export const iosGlass = {
  surface: "ios-glass-surface",
  tabBar: "ios-glass-tab-bar",
  navBar: "ios-glass-nav-bar",
  modal: "ios-glass-modal",
  sheet: "ios-glass-sheet",
  overlay: "ios-glass-overlay",
  popover: "ios-glass-popover",
  fab: "ios-glass-fab",
  headerPill: "ios-glass-header-pill",
  card: "ios-glass-card",
} as const;

/** Tailwind surface classes when iOS native — avoids opaque defaults fighting glass CSS. */
export function iosGlassTabBarBase(): string {
  return isIOSNative()
    ? "border-white/40 bg-transparent shadow-none sm:bg-transparent sm:backdrop-blur-none sm:shadow-none dark:bg-transparent"
    : "border-gray-200/90 bg-white/95 shadow-[0_14px_34px_-24px_rgba(0,0,0,0.3)] sm:bg-white/86 sm:backdrop-blur-2xl sm:shadow-[0_18px_46px_-22px_rgba(0,0,0,0.35)] dark:border-gray-700/50 dark:bg-background/92 sm:dark:bg-background/80";
}

export function iosGlassNavBarBase(): string {
  return isIOSNative() ? "bg-transparent backdrop-blur-none" : "";
}

export function iosGlassHeaderPillBase(): string {
  return isIOSNative()
    ? "border border-white/35 bg-transparent shadow-none hover:bg-transparent"
    : "";
}

export function iosGlassModalBase(): string {
  return isIOSNative() ? "bg-transparent border-white/25" : "";
}

export function iosGlassSheetBase(): string {
  return isIOSNative() ? "bg-transparent border-white/25" : "";
}

export function iosGlassCardBase(): string {
  return isIOSNative()
    ? "bg-transparent sm:bg-transparent sm:backdrop-blur-none"
    : "";
}

export function iosGlassOverlayBase(): string {
  return isIOSNative() ? "bg-black/25" : "";
}

export function iosGlassFabRing(): string {
  return isIOSNative() ? "ring-white/50" : "ring-white";
}

export function glassCn(iosClasses: string, defaultClasses = ""): string {
  return cn(isIOSNative() ? iosClasses : defaultClasses);
}
