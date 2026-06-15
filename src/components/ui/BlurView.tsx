import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";
import { useIOSPlatform } from "@/hooks/useIOSPlatform";

/**
 * Frigy BlurView — Capacitor/Vite equivalent of expo-blur BlurView.
 * iOS WKWebView: backdrop-filter must live on the painted shell (not a nested child)
 * and the element must share a scroll ancestor with the content behind it.
 */
export type BlurViewVariant =
  | "default"
  | "tabBar"
  | "navBar"
  | "sheet"
  | "modal"
  | "card"
  | "pill"
  | "overlay"
  | "popover";

export type BlurViewTint = "light" | "dark";

export type BlurViewProps = {
  children?: ReactNode;
  /** Blur radius in px — overrides variant default */
  intensity?: number;
  tint?: BlurViewTint;
  variant?: BlurViewVariant;
  /** Classes on the outer shell (layout, positioning) */
  className?: string;
  /** Classes when blur is off (Android native solid fallback) */
  fallbackClassName?: string;
  as?: ElementType;
} & HTMLAttributes<HTMLElement>;

type BlurMode = "ios" | "web" | "solid";

const BLUR_IOS: Record<BlurViewVariant, number> = {
  default: 56,
  tabBar: 80,
  navBar: 64,
  sheet: 64,
  modal: 64,
  card: 48,
  pill: 44,
  overlay: 28,
  popover: 36,
};

const BLUR_WEB: Record<BlurViewVariant, number> = {
  default: 32,
  tabBar: 40,
  navBar: 32,
  sheet: 36,
  modal: 36,
  card: 28,
  pill: 24,
  overlay: 16,
  popover: 28,
};

const TINT_LIGHT: Record<BlurViewVariant, string> = {
  default: "rgba(255, 255, 255, 0.22)",
  tabBar: "rgba(255, 255, 255, 0.14)",
  navBar: "rgba(255, 255, 255, 0.18)",
  sheet: "rgba(255, 255, 255, 0.24)",
  modal: "rgba(255, 255, 255, 0.26)",
  card: "rgba(255, 255, 255, 0.20)",
  pill: "rgba(255, 255, 255, 0.22)",
  overlay: "rgba(0, 0, 0, 0.22)",
  popover: "rgba(255, 255, 255, 0.24)",
};

const TINT_DARK: Record<BlurViewVariant, string> = {
  default: "rgba(44, 44, 46, 0.42)",
  tabBar: "rgba(44, 44, 46, 0.48)",
  navBar: "rgba(44, 44, 46, 0.45)",
  sheet: "rgba(44, 44, 46, 0.50)",
  modal: "rgba(44, 44, 46, 0.52)",
  card: "rgba(44, 44, 46, 0.40)",
  pill: "rgba(44, 44, 46, 0.42)",
  overlay: "rgba(0, 0, 0, 0.45)",
  popover: "rgba(44, 44, 46, 0.48)",
};

const FALLBACK: Record<BlurViewVariant, string> = {
  default: "bg-background/95 border border-border/40",
  tabBar:
    "border border-gray-200/90 bg-white/95 shadow-[0_14px_34px_-24px_rgba(0,0,0,0.3)] sm:bg-white/86 sm:backdrop-blur-2xl",
  navBar: "bg-background/90 border-b border-border/30 backdrop-blur-md",
  sheet: "bg-background border-t border-border/40",
  modal: "bg-background border border-border/40 shadow-lg",
  card: "bg-white/88 border border-border/30 sm:bg-white/72 sm:backdrop-blur-xl",
  pill: "bg-white/80 border border-white/50 shadow-sm",
  overlay: "bg-black/50",
  popover: "bg-popover/95 border border-border/40 shadow-md",
};

function supportsBackdropFilter(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.CSS?.supports?.("backdrop-filter", "blur(8px)") === true ||
    window.CSS?.supports?.("-webkit-backdrop-filter", "blur(8px)") === true
  );
}

function resolveBlurMode(ios: boolean): BlurMode {
  if (ios) return "ios";
  if (typeof window === "undefined") return "solid";
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") return "solid";
  return supportsBackdropFilter() ? "web" : "solid";
}

function blurStyles(mode: BlurMode, variant: BlurViewVariant, intensity: number, tint: BlurViewTint): CSSProperties {
  const saturate = mode === "ios" ? 200 : 170;
  const tintMap = tint === "dark" ? TINT_DARK : TINT_LIGHT;
  return {
    backdropFilter: `blur(${intensity}px) saturate(${saturate}%)`,
    WebkitBackdropFilter: `blur(${intensity}px) saturate(${saturate}%)`,
    backgroundColor: tintMap[variant],
  };
}

function sheenStyle(tint: BlurViewTint): CSSProperties {
  return {
    background:
      tint === "dark"
        ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 55%)"
        : "linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.06) 45%, transparent 72%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
  };
}

export const BlurView = forwardRef<HTMLElement, BlurViewProps>(function BlurView(
  {
    children,
    intensity,
    tint = "light",
    variant = "default",
    className,
    fallbackClassName,
    as: Component = "div",
    style,
    ...props
  },
  ref,
) {
  const ios = useIOSPlatform();
  const mode = resolveBlurMode(ios);
  const useBlur = mode !== "solid";
  const blurPx = intensity ?? (mode === "ios" ? BLUR_IOS[variant] : BLUR_WEB[variant]);

  if (!useBlur) {
    return (
      <Component
        ref={ref}
        className={cn(FALLBACK[variant], fallbackClassName, className)}
        style={style}
        {...props}
      >
        {children}
      </Component>
    );
  }

  const backdropStyle = blurStyles(mode, variant, blurPx, tint);
  const inlineBlur = mode === "ios";

  return (
    <Component
      ref={ref}
      className={cn(
        "frigy-blur-view relative",
        inlineBlur ? "frigy-blur-view--ios border border-white/30 dark:border-white/12" : "overflow-hidden",
        className,
      )}
      style={{
        ...style,
        ...(inlineBlur ? backdropStyle : undefined),
      }}
      {...props}
    >
      {!inlineBlur && (
        <div
          aria-hidden
          className="frigy-blur-view__backdrop pointer-events-none absolute inset-0"
          style={backdropStyle}
        />
      )}
      <div
        aria-hidden
        className="frigy-blur-view__sheen pointer-events-none absolute inset-0"
        style={sheenStyle(tint)}
      />
      <div className="frigy-blur-view__content relative z-[1]">{children}</div>
    </Component>
  );
});

BlurView.displayName = "BlurView";

/** Sticky top navigation with real blur on iOS / web. */
export function GlassNavBar({
  children,
  className,
  innerClassName,
  as = "nav",
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  as?: ElementType;
}) {
  return (
    <BlurView
      variant="navBar"
      as={as}
      intensity={64}
      className={cn("sticky top-0 z-[60] safe-top border-b border-white/20", className)}
    >
      <div className={innerClassName}>{children}</div>
    </BlurView>
  );
}

/** Modal / sheet overlay with blur. */
export function BlurOverlay({
  className,
  ...props
}: Omit<BlurViewProps, "variant" | "children"> & { children?: ReactNode }) {
  return <BlurView variant="overlay" className={cn("fixed inset-0", className)} {...props} />;
}
