import confetti from "canvas-confetti";

export function isMobileRuntime(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse), (max-width: 640px)").matches;
}

type BurstOptions = Parameters<typeof confetti>[0];

export function confettiBurst(options: BurstOptions = {}) {
  const mobile = isMobileRuntime();
  const requested = typeof options.particleCount === "number" ? options.particleCount : 80;

  return confetti({
    ...options,
    particleCount: mobile ? Math.min(36, Math.ceil(requested * 0.35)) : requested,
    ticks: mobile ? Math.min(options.ticks ?? 160, 90) : options.ticks,
    disableForReducedMotion: true,
    scalar: mobile ? Math.min(options.scalar ?? 1, 0.85) : options.scalar,
  });
}
