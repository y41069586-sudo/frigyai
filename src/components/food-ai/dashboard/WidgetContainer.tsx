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
        "flex w-full max-w-full flex-col gap-3.5 min-[360px]:gap-4 sm:max-w-xl sm:gap-5 lg:max-w-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
