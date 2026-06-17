import React, { type CSSProperties, type ReactNode } from "react";
import "./LiquidGlass.css";

type LiquidGlassVariant = "regular" | "clear";

interface LiquidGlassProps {
  children: ReactNode;
  variant?: LiquidGlassVariant;
  /** Any CSS color, e.g. 'rgba(10,132,255,0.35)'. Mirrors .glassEffect(.tint(...)) */
  tint?: string;
  interactive?: boolean;
  borderRadius?: number | string;
  /** Opt-in displacement refraction. No-op on iOS/Safari, only renders on Chromium. */
  refraction?: boolean;
  safeAreaEdge?: "top" | "bottom" | "none";
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

// Chromium supports `backdrop-filter: url(#id)`, Safari/WebKit does not.
// We feature-detect once so the SVG filter is simply never applied on iOS.
const supportsRefraction =
  typeof window !== "undefined" &&
  typeof CSS !== "undefined" &&
  CSS.supports("backdrop-filter", "url(#x)");

export function LiquidGlass({
  children,
  variant = "regular",
  tint,
  interactive = false,
  borderRadius = 20,
  refraction = false,
  safeAreaEdge = "none",
  className = "",
  style,
  onClick,
}: LiquidGlassProps) {
  const classes = [
    "liquid-glass",
    variant === "clear" && "liquid-glass--clear",
    tint && "liquid-glass--tinted",
    interactive && "liquid-glass--interactive",
    refraction && supportsRefraction && "liquid-glass--refract",
    safeAreaEdge === "bottom" && "liquid-glass--safe-bottom",
    safeAreaEdge === "top" && "liquid-glass--safe-top",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{
        borderRadius,
        ...(tint ? ({ "--lg-tint-overlay": tint } as CSSProperties) : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Groups glass elements that sit close together (e.g. a toolbar's buttons)
 * so they read as one coherent surface instead of stacked, separately
 * blurred layers — the rough equivalent of GlassEffectContainer.
 */
export function GlassGroup({
  children,
  gap = 12,
  className = "",
}: {
  children: ReactNode;
  gap?: number;
  className?: string;
}) {
  return (
    <div className={`glass-group ${className}`} style={{ gap }}>
      {children}
    </div>
  );
}

/**
 * Mount this ONCE near the app root (e.g. in App.tsx). It defines the shared
 * SVG displacement filter that `.liquid-glass--refract` references. Renders
 * nothing visible and costs nothing on browsers that ignore it (iOS Safari).
 */
export function LiquidGlassDefs() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <filter id="liquid-glass-refraction" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.012" numOctaves={1} seed={4} result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={16} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

export default LiquidGlass;
