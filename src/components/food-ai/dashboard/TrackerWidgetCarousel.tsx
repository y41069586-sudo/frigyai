import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TrackerWidgetCarouselProps = {
  tracker: ReactNode;
  weight: ReactNode;
  className?: string;
};

export function TrackerWidgetCarousel({ tracker, weight, className }: TrackerWidgetCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
  const [page, setPage] = useState(0);
  const [trackHeight, setTrackHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const slide = slideRefs.current[page];
    if (!slide) return;

    const updateHeight = () => setTrackHeight(slide.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(slide);
    return () => observer.disconnect();
  }, [page, tracker, weight]);

  const scrollToPage = (next: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setPage(clamped);
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== page) setPage(next);
  };

  return (
    <div className={cn("dashboard-touch-scroll relative w-full min-w-0", className)}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="dashboard-carousel-scroll flex snap-x snap-mandatory overflow-x-auto overflow-y-visible overscroll-x-contain scrollbar-none"
        style={{
          height: trackHeight,
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          ref={(el) => {
            slideRefs.current[0] = el;
          }}
          className="w-full min-w-0 shrink-0 snap-center snap-always self-start"
        >
          {tracker}
        </div>
        <div
          ref={(el) => {
            slideRefs.current[1] = el;
          }}
          className="w-full min-w-0 shrink-0 snap-center snap-always self-start"
        >
          {weight}
        </div>
      </div>

      <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={i === 0 ? "Tracker" : "Gewichtsverlauf"}
            onClick={() => scrollToPage(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              page === i ? "w-5 bg-primary" : "w-1.5 bg-primary/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}
