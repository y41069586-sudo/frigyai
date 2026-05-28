import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TrackerWidgetCarouselProps = {
  tracker: ReactNode;
  weight: ReactNode;
  className?: string;
};

export function TrackerWidgetCarousel({ tracker, weight, className }: TrackerWidgetCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

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
    <div className={cn("relative", className)}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none touch-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="w-full shrink-0 snap-center snap-always">{tracker}</div>
        <div className="w-full shrink-0 snap-center snap-always">{weight}</div>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
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
