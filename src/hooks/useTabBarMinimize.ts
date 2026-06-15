import { useEffect, useRef, useState, type RefObject } from "react";

/** iOS 26 tabBarMinimizeBehavior(.onScrollDown) — compact while scrolling down, expand on scroll up. */
export function useTabBarMinimize(scrollRef: RefObject<HTMLElement | null>, enabled = true): boolean {
  const [minimized, setMinimized] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !enabled) return;

    lastY.current = el.scrollTop;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = el.scrollTop;
        const delta = y - lastY.current;

        if (y < 24) {
          setMinimized(false);
        } else if (delta > 6) {
          setMinimized(true);
        } else if (delta < -6) {
          setMinimized(false);
        }

        lastY.current = y;
        ticking.current = false;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, enabled]);

  return minimized;
}
