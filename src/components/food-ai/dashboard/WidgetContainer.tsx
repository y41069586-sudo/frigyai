import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WidgetContainerProps = {
  children: ReactNode;
  className?: string;
};

/** Vertical stack; aligned full width (no horizontal stagger). */
export function WidgetContainer({ children, className }: WidgetContainerProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-full flex-col gap-8 sm:max-w-xl lg:max-w-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
