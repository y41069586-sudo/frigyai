import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WidgetContainerProps = {
  children: ReactNode;
  className?: string;
};

/** Vertical stack; aligned full width (no horizontal stagger). */
export function WidgetContainer({ children, className }: WidgetContainerProps) {
  return (
    <div className={cn("flex w-full max-w-lg flex-col gap-5 sm:gap-6 lg:max-w-2xl", className)}>
      {children}
    </div>
  );
}
