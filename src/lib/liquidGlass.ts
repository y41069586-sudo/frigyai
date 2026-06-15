import { cn } from "@/lib/utils";
import { isIOSNative } from "./platformUi";

/**
 * iOS Liquid Glass class tokens.
 * Styles are defined in `index.css` under `.platform-ios` (unlayered, high priority).
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

/** Default (web/Android) tab bar — iOS overrides via `.platform-ios .ios-glass-tab-bar`. */
export const defaultTabBarSurface =
  "border border-gray-200/90 bg-white/95 shadow-[0_14px_34px_-24px_rgba(0,0,0,0.3)] sm:bg-white/86 sm:backdrop-blur-2xl sm:shadow-[0_18px_46px_-22px_rgba(0,0,0,0.35)] dark:border-gray-700/50 dark:bg-background/92 sm:dark:bg-background/80";

export function glassTabBarClassName(ios: boolean): string {
  return cn(
    "pointer-events-auto flex w-full max-w-md items-end gap-1.5 overflow-visible rounded-full px-2.5 py-1.5 pr-1.5",
    ios ? "border-transparent bg-transparent shadow-none sm:bg-transparent sm:backdrop-blur-none sm:shadow-none" : defaultTabBarSurface,
    iosGlass.tabBar,
  );
}

export function glassNavBarClassName(ios: boolean, base: string): string {
  return cn(base, ios && "bg-transparent backdrop-blur-none", iosGlass.navBar);
}

export function glassHeaderPillClassName(ios: boolean, base: string): string {
  return cn(
    base,
    ios && "border border-white/35 bg-transparent shadow-none hover:bg-transparent",
    iosGlass.headerPill,
  );
}

export function glassModalClassName(ios: boolean, base: string): string {
  return cn(base, ios && "bg-transparent border-white/25", iosGlass.modal);
}

export function glassSheetClassName(ios: boolean, base: string): string {
  return cn(base, ios && "bg-transparent border-white/25", iosGlass.sheet);
}

export function glassOverlayClassName(ios: boolean, base: string): string {
  return cn(base, ios && "bg-black/25", iosGlass.overlay);
}

export function glassCardClassName(ios: boolean, base: string): string {
  return cn(base, ios && "bg-transparent sm:bg-transparent sm:backdrop-blur-none", iosGlass.card);
}

export function glassFabRingClassName(ios: boolean): string {
  return ios ? "ring-white/50" : "ring-white";
}

/** Sync helpers — read `platform-ios` class set by inline script before React. */
export function glassNavBarClasses(base: string): string {
  return glassNavBarClassName(isIOSNative(), base);
}

export function glassHeaderPillClasses(base: string): string {
  return glassHeaderPillClassName(isIOSNative(), base);
}

export function glassModalClasses(base: string): string {
  return glassModalClassName(isIOSNative(), base);
}

export function glassSheetClasses(base: string): string {
  return glassSheetClassName(isIOSNative(), base);
}

export function glassOverlayClasses(base: string): string {
  return glassOverlayClassName(isIOSNative(), base);
}

export function glassCardClasses(base: string): string {
  return glassCardClassName(isIOSNative(), base);
}

export function glassTabBarClasses(): string {
  return glassTabBarClassName(isIOSNative());
}
