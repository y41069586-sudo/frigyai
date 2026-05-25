import { useRef, useState, type ReactNode } from "react";
import { motion, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

type TrackerWidgetCarouselProps = {
  tracker: ReactNode;
  weight: ReactNode;
  className?: string;
};

export function TrackerWidgetCarousel({ tracker, weight, className }: TrackerWidgetCarouselProps) {
  const [page, setPage] = useState(0);
  const dragStart = useRef(0);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const dx = info.offset.x;
    if (dx < -48 && page === 0) setPage(1);
    else if (dx > 48 && page === 1) setPage(0);
  };

  return (
    <motion.div
      className={cn("relative overflow-hidden touch-pan-y", className)}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.08}
      dragMomentum={false}
      dragDirectionLock
      onDragStart={() => {
        dragStart.current = page;
      }}
      onDragEnd={onDragEnd}
    >
      <motion.div
        className="flex will-change-transform"
        animate={{ x: page === 0 ? "0%" : "-100%" }}
        transition={{ type: "spring", stiffness: 220, damping: 30, mass: 0.9 }}
      >
        <motion.div className="w-full shrink-0">{tracker}</motion.div>
        <motion.div className="w-full shrink-0">{weight}</motion.div>
      </motion.div>

      <motion.div className="mt-3 flex justify-center gap-1.5">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={i === 0 ? "Tracker" : "Gewichtsverlauf"}
            onClick={() => setPage(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              page === i ? "w-5 bg-primary" : "w-1.5 bg-primary/30",
            )}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
