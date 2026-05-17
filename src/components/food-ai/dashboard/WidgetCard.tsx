import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type WidgetCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  /** subtle lift on hover */
  interactive?: boolean;
  /** visual variant */
  variant?: "glass" | "soft" | "gradient";
};

const variantStyles: Record<NonNullable<WidgetCardProps["variant"]>, string> = {
  glass:
    "border border-slate-200/85 bg-white/62 shadow-[0_10px_28px_-18px_rgba(15,40,30,0.18)] backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.06]",
  soft:
    "border border-slate-200/80 bg-card/82 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.16)] backdrop-blur-md",
  gradient:
    "border border-slate-200/80 bg-gradient-to-br from-primary/[0.055] via-background/[0.92] to-muted/[0.24] shadow-[0_10px_32px_-22px_hsl(var(--primary)/0.35)] backdrop-blur-sm",
};

export function WidgetCard({
  children,
  className,
  delay = 0,
  onClick,
  interactive = true,
  variant = "glass",
}: WidgetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        interactive
          ? { y: -3, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }
          : undefined
      }
      whileTap={onClick ? { scale: 0.992 } : undefined}
      onClick={onClick}
      style={{ transform: "translateZ(0)" }}
      className={cn(
        "relative w-full min-w-0 overflow-hidden rounded-2xl p-2.5 min-[360px]:p-3 sm:rounded-[1.35rem] sm:p-4 transition-shadow duration-300 touch-manipulation will-change-transform",
        interactive && onClick && "cursor-pointer hover:shadow-[0_20px_50px_-18px_rgba(0,0,0,0.12)]",
        variantStyles[variant],
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.08] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-emerald-400/[0.06] blur-xl" />
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}
