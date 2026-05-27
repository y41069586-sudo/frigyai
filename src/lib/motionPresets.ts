import type { TargetAndTransition, Transition } from "framer-motion";

/** Shared easing — stable on iOS (no spring on full-screen overlays). */
export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export function entryFrom(isMobile: boolean, y = 14): TargetAndTransition {
  return isMobile ? { opacity: 0 } : { opacity: 0, y };
}

export function entryTo(isMobile: boolean): TargetAndTransition {
  return isMobile ? { opacity: 1 } : { opacity: 1, y: 0 };
}

export function entryTransition(isMobile: boolean, delay = 0, duration = 0.32): Transition {
  return {
    duration: isMobile ? 0.18 : duration,
    delay: isMobile ? Math.min(delay, 0.06) : delay,
    ease: MOTION_EASE,
  };
}

/** Viewport-fixed panels (meal detail, AI chat) — avoid y+scale on mobile (iOS fixed bugs). */
export function viewportPanelFrom(isMobile: boolean): TargetAndTransition {
  return isMobile ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 };
}

export function viewportPanelTo(): TargetAndTransition {
  return { opacity: 1, y: 0, scale: 1 };
}

export function viewportPanelExit(isMobile: boolean): TargetAndTransition {
  return isMobile ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 };
}

export function viewportPanelTransition(isMobile: boolean, duration = 0.22): Transition {
  return { duration: isMobile ? 0.16 : duration, ease: MOTION_EASE };
}

/** Full-screen takeover (tracker log meal). */
export function fullScreenFrom(isMobile: boolean): TargetAndTransition {
  return isMobile ? { opacity: 0 } : { y: "100%" };
}

export function fullScreenTo(isMobile: boolean): TargetAndTransition {
  return isMobile ? { opacity: 1 } : { y: 0 };
}

export function fullScreenExit(isMobile: boolean): TargetAndTransition {
  return isMobile ? { opacity: 0 } : { y: "100%" };
}

export function fullScreenTransition(isMobile: boolean): Transition {
  return isMobile
    ? { duration: 0.2, ease: MOTION_EASE }
    : { type: "spring", stiffness: 280, damping: 32, mass: 0.95 };
}

export function bottomSheetFrom(isMobile: boolean): TargetAndTransition {
  return isMobile ? { opacity: 0 } : { y: "100%" };
}

export function bottomSheetTo(isMobile: boolean): TargetAndTransition {
  return isMobile ? { opacity: 1 } : { y: 0 };
}

export function bottomSheetExit(isMobile: boolean): TargetAndTransition {
  return isMobile ? { opacity: 0 } : { y: "100%" };
}

export function bottomSheetTransition(isMobile: boolean): Transition {
  return isMobile
    ? { duration: 0.18, ease: MOTION_EASE }
    : { type: "spring", damping: 28, stiffness: 320 };
}

export function tabPanelFrom(isMobile: boolean, y = 6): TargetAndTransition {
  return isMobile ? { opacity: 0 } : { opacity: 0, y };
}

export function tabPanelExit(isMobile: boolean, y = -4): TargetAndTransition {
  return isMobile ? { opacity: 0 } : { opacity: 0, y };
}

export function tabPanelTransition(isMobile: boolean): Transition {
  return { duration: isMobile ? 0.14 : 0.18, ease: [0.25, 0.1, 0.25, 1] };
}

export function getPageTransition(isMobile: boolean, mainNav: boolean) {
  if (mainNav) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: isMobile ? 0.12 : 0.2, ease: MOTION_EASE },
    };
  }
  // Never start routes at opacity 0 — on some mobile browsers the fade-in never runs (blank white screen).
  return {
    initial: { opacity: 1, y: isMobile ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 1, y: isMobile ? 0 : -6 },
    transition: { duration: isMobile ? 0.14 : 0.22, ease: MOTION_EASE },
  };
}
