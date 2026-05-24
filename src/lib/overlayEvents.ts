export const FRIGY_OVERLAY_OPEN = "frigy-overlay-open";

export function notifyOverlayOpen(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FRIGY_OVERLAY_OPEN, { detail: { open } }));
}
