/** Routes that share the bottom nav — use a soft cross-fade instead of a full page slide. */
const MAIN_NAV_PATHS = new Set(["/", "/meal-plans"]);

export function isMainNavRoute(pathname: string): boolean {
  return MAIN_NAV_PATHS.has(pathname);
}

export const mainNavPageTransition = {
  initial: { opacity: 0.96, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0.96, y: -6 },
  transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const },
};

export const defaultPageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
};
