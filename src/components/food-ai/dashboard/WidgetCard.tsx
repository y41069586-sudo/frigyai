import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BlurView } from "@/components/ui/BlurView";
import { useIsMobile } from "@/hooks/use-mobile";
import { entryFrom, entryTo, dashboardScrollTransition, dashboardScrollViewport } from "@/lib/motionPresets";
import {
  dashboardCardBorder,
  dashboardCardShadow,
  dashboardCardShadowHover,
} from "./dashboardCardStyles";

export type WidgetCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  /** subtle lift on hover */
  interactive?: boolean;
  /** visual variant */
  variant?: "glass" | "soft" | "gradient";
  /** skip fade-in when remounting (e.g. dashboard tracker after tab switch) */
  skipEntrance?: boolean;
};

const softVariantClass = `${dashboardCardBorder} bg-card/96 ${dashboardCardShadow} sm:bg-card/82 sm:backdrop-blur-md`;
const gradientVariantClass = `${dashboardCardBorder} bg-gradient-to-br from-primary/[0.05] via-white/[0.98] to-muted/[0.16] ${dashboardCardShadow} sm:backdrop-blur-sm dark:from-primary/[0.08] dark:via-white/[0.04]`;

export function WidgetCard({
  children,
  className,
  delay = 0,
  onClick,
  interactive = true,
  variant = "glass",
  skipEntrance = false,
}: WidgetCardProps) {
  const isMobile = useIsMobile();

  const shellClass = cn(
    "relative w-full min-w-0 overflow-hidden rounded-2xl p-2.5 min-[360px]:p-3 sm:rounded-[1.35rem] sm:p-4 transition-shadow duration-300 touch-manipulation",
    !isMobile && "sm:will-change-transform",
    interactive && onClick && `cursor-pointer ${dashboardCardShadowHover}`,
    variant !== "glass" && (variant === "soft" ? softVariantClass : gradientVariantClass),
    className,
  );

  const inner = (
    <>
      <div className="pointer-events-none absolute -right-8 -top-8 hidden h-24 w-24 rounded-full bg-primary/[0.08] blur-2xl sm:block" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 hidden h-20 w-20 rounded-full bg-emerald-400/[0.06] blur-xl sm:block" />
      <div className="relative z-[1]">{children}</div>
    </>
  );

  return (
    <motion.div
      initial={skipEntrance ? false : entryFrom(isMobile, 18)}
      whileInView={skipEntrance ? undefined : entryTo(isMobile)}
      viewport={skipEntrance ? undefined : dashboardScrollViewport}
      transition={skipEntrance ? { duration: 0 } : dashboardScrollTransition(isMobile, delay)}
      whileHover={
        interactive && !isMobile
          ? { y: -3, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }
          : undefined
      }
      whileTap={onClick ? { scale: 0.992 } : undefined}
      onClick={onClick}
      style={isMobile ? undefined : { transform: "translateZ(0)" }}
      className={variant !== "glass" ? shellClass : cn(shellClass, "p-0")}
    >
      {variant === "glass" ? (
        <BlurView
          variant="card"
          intensity={48}
          className={cn(
            "h-full w-full rounded-2xl p-2.5 min-[360px]:p-3 sm:rounded-[1.35rem] sm:p-4",
            dashboardCardBorder,
            dashboardCardShadow,
          )}
        >
          {inner}
        </BlurView>
      ) : (
        inner
      )}
    </motion.div>
  );
}
