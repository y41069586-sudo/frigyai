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
        "relative w-full min-w-0 overflow-hidden rounded-xl rounded-tl-lg rounded-br-2xl p-2.5 min-[360px]:p-3 sm:rounded-2xl sm:rounded-tl-xl sm:rounded-br-[1.75rem] sm:p-4 transition-shadow duration-300 touch-manipulation",
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
