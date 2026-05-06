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
    "border border-white/50 bg-white/55 shadow-[0_12px_40px_-12px_rgba(15,40,30,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]",
  soft:
    "border border-border/40 bg-card/80 shadow-[0_8px_32px_-10px_rgba(0,0,0,0.08)] backdrop-blur-md",
  gradient:
    "border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-background/90 to-muted/30 shadow-[0_16px_48px_-16px_hsl(var(--primary)/0.25)] backdrop-blur-sm",
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
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        interactive
          ? { y: -3, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }
          : undefined
      }
      whileTap={onClick ? { scale: 0.992 } : undefined}
      onClick={onClick}
      className={cn(
        "relative w-full min-w-0 overflow-hidden rounded-2xl rounded-tl-xl rounded-br-3xl p-3.5 min-[360px]:p-4 sm:rounded-[1.75rem] sm:rounded-tl-2xl sm:rounded-br-[2.25rem] sm:p-6 transition-shadow duration-300 touch-manipulation",
        interactive && onClick && "cursor-pointer hover:shadow-[0_20px_50px_-18px_rgba(0,0,0,0.12)]",
        variantStyles[variant],
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-400/[0.06] blur-2xl" />
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}
