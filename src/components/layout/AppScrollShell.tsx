import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BottomNavigation } from "@/components/BottomNavigation";
import { shouldHideBottomNavForFirstPlan } from "@/lib/firstWeekPlanFlow";

type AppScrollShellProps = {
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
  showBottomNav?: boolean;
};

/**
 * iOS-style app shell: scroll content fills the viewport; tab bar floats above as a sibling
 * (Apple HIG — navigation layer separate from content layer; enables backdrop blur on WKWebView).
 */
export function AppScrollShell({
  children,
  className,
  scrollClassName,
  showBottomNav = true,
}: AppScrollShellProps) {
  const scrollRef = useRef<HTMLElement>(null);
  const hideNav = !showBottomNav || shouldHideBottomNavForFirstPlan();

  return (
    <div className={cn("relative h-[100dvh] max-h-[100dvh] overflow-hidden", className)}>
      <main
        ref={scrollRef}
        className={cn(
          "dashboard-scroll-main absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
          scrollClassName,
        )}
      >
        {children}
      </main>
      {!hideNav && <BottomNavigation scrollContainerRef={scrollRef} />}
    </div>
  );
}
