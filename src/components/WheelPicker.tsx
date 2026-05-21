import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

/** Matches existing layout (do not change visual design). */
const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 3;
const PAD_ITEMS = Math.floor(VISIBLE_ITEMS / 2);
const SETTLE_FALLBACK_MS = 200;
const SMOOTH_SNAP_MS = 380;

const triggerHaptic = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(5);
  }
};

function buildItems(min: number, max: number, step: number): number[] {
  if (step <= 0 || max < min) return [min];
  const items: number[] = [];
  for (let v = min; v <= max; v += step) {
    items.push(v);
  }
  return items.length > 0 ? items : [min];
}

function indexFromValue(value: number, items: number[]): number {
  if (items.length === 0) return 0;
  const idx = items.indexOf(value);
  return idx >= 0 ? idx : 0;
}

function getRealIndex(offsetY: number, itemCount: number, itemHeight: number): number {
  if (itemCount <= 0) return 0;
  const index = Math.round(offsetY / itemHeight);
  return Math.max(0, Math.min(index, itemCount - 1));
}

function scrollTopForIndex(index: number, itemHeight: number): number {
  return index * itemHeight;
}

export const WheelPicker = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
}: WheelPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const data = useMemo(() => buildItems(min, max, step), [min, max, step]);

  const [highlightIndex, setHighlightIndex] = useState(() => indexFromValue(value, data));
  const [isDragging, setIsDragging] = useState(false);
  const [snapDisabled, setSnapDisabled] = useState(false);

  const isUserDraggingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastHapticIndexRef = useRef(-1);
  const lastEmittedValueRef = useRef(value);
  const highlightIndexRef = useRef(highlightIndex);
  highlightIndexRef.current = highlightIndex;

  const pickerHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
  const padHeight = PAD_ITEMS * ITEM_HEIGHT;

  const getIndexFromScroll = useCallback(
    (offsetY: number) => getRealIndex(offsetY, data.length, ITEM_HEIGHT),
    [data.length],
  );

  const clearSnapEndTimer = useCallback(() => {
    if (snapEndTimerRef.current !== null) {
      clearTimeout(snapEndTimerRef.current);
      snapEndTimerRef.current = null;
    }
  }, []);

  const releaseProgrammaticScroll = useCallback((ms: number) => {
    clearSnapEndTimer();
    snapEndTimerRef.current = setTimeout(() => {
      snapEndTimerRef.current = null;
      isProgrammaticScrollRef.current = false;
    }, ms);
  }, [clearSnapEndTimer]);

  const emitValueIfChanged = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      const item = data[clamped];
      if (item === undefined) return clamped;

      setHighlightIndex(clamped);
      highlightIndexRef.current = clamped;
      lastHapticIndexRef.current = clamped;

      if (item !== lastEmittedValueRef.current) {
        lastEmittedValueRef.current = item;
        onChange(item);
      }
      return clamped;
    },
    [data, onChange],
  );

  const scrollToIndex = useCallback(
    (index: number, smooth: boolean) => {
      const el = scrollRef.current;
      if (!el || data.length === 0) return;

      const clamped = Math.max(0, Math.min(index, data.length - 1));
      const targetTop = scrollTopForIndex(clamped, ITEM_HEIGHT);

      isProgrammaticScrollRef.current = true;
      el.scrollTo({
        top: targetTop,
        behavior: smooth ? "smooth" : "auto",
      });

      releaseProgrammaticScroll(smooth ? SMOOTH_SNAP_MS : 48);
      return clamped;
    },
    [data.length, releaseProgrammaticScroll],
  );

  /** Snap + emit only after release / inertia end — smooth, not instant jerk. */
  const commitScrollPosition = useCallback(
    (smooth: boolean) => {
      const el = scrollRef.current;
      if (!el || isProgrammaticScrollRef.current || data.length === 0) return;

      const index = getIndexFromScroll(el.scrollTop);
      const targetTop = scrollTopForIndex(index, ITEM_HEIGHT);
      const drift = Math.abs(el.scrollTop - targetTop);

      setHighlightIndex(index);

      if (drift > 0.5) {
        scrollToIndex(index, smooth);
        const onSnapDone = () => {
          el.removeEventListener("scrollend", onSnapDone);
          emitValueIfChanged(index);
        };
        el.addEventListener("scrollend", onSnapDone, { passive: true });
        clearSnapEndTimer();
        snapEndTimerRef.current = setTimeout(() => {
          el.removeEventListener("scrollend", onSnapDone);
          emitValueIfChanged(index);
        }, SMOOTH_SNAP_MS + 40);
      } else {
        emitValueIfChanged(index);
      }

      setSnapDisabled(false);
    },
    [clearSnapEndTimer, data.length, emitValueIfChanged, getIndexFromScroll, scrollToIndex],
  );

  const cancelSettle = useCallback(() => {
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const scheduleSettle = useCallback(
    (smooth: boolean, delayMs = SETTLE_DELAY_MS) => {
      cancelSettle();
      settleTimerRef.current = setTimeout(() => {
        settleTimerRef.current = null;
        if (!isUserDraggingRef.current) {
          commitScrollPosition(smooth);
        }
      }, delayMs);
    },
    [cancelSettle, commitScrollPosition],
  );

  const updateHighlightFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isProgrammaticScrollRef.current) return;

    const idx = getIndexFromScroll(el.scrollTop);
    setHighlightIndex((prev) => (prev === idx ? prev : idx));

    if (idx !== lastHapticIndexRef.current) {
      lastHapticIndexRef.current = idx;
      triggerHaptic();
    }
  }, [getIndexFromScroll]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;

    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateHighlightFromScroll();
    });
  }, [updateHighlightFromScroll]);

  const beginDrag = useCallback(() => {
    isUserDraggingRef.current = true;
    setIsDragging(true);
    setSnapDisabled(true);
    cancelSettle();
    clearSnapEndTimer();
  }, [cancelSettle, clearSnapEndTimer]);

  const endDrag = useCallback(() => {
    isUserDraggingRef.current = false;
    setIsDragging(false);
    scheduleSettle(true, SETTLE_FALLBACK_MS);
  }, [scheduleSettle]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      beginDrag();
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [beginDrag],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      endDrag();
    },
    [endDrag],
  );

  const handleItemClick = useCallback(
    (item: number) => {
      const index = indexFromValue(item, data);
      lastEmittedValueRef.current = item;
      setHighlightIndex(index);
      lastHapticIndexRef.current = index;
      onChange(item);
      scrollToIndex(index, true);
    },
    [data, onChange, scrollToIndex],
  );

  useEffect(() => {
    const index = indexFromValue(value, data);
    lastEmittedValueRef.current = value;

    if (isUserDraggingRef.current) return;
    if (index === highlightIndexRef.current) return;

    setHighlightIndex(index);
    lastHapticIndexRef.current = index;
    scrollToIndex(index, false);
  }, [value, data, scrollToIndex]);

  useEffect(() => {
    const index = indexFromValue(value, data);
    requestAnimationFrame(() => scrollToIndex(index, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      cancelSettle();
      if (!isUserDraggingRef.current && !isProgrammaticScrollRef.current) {
        commitScrollPosition(true);
      }
    };

    el.addEventListener("scrollend", onScrollEnd, { passive: true });
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [cancelSettle, commitScrollPosition]);

  useEffect(
    () => () => {
      cancelSettle();
      clearSnapEndTimer();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    [cancelSettle, clearSnapEndTimer],
  );

  return (
    <div className="relative mx-auto w-full" style={{ height: pickerHeight }}>
      {/* Top gradient */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{
          height: padHeight,
          background:
            "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.5) 50%, transparent 100%)",
        }}
      />

      {/* Bottom gradient */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          height: padHeight,
          background:
            "linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.5) 50%, transparent 100%)",
        }}
      />

      {/* Selection indicator */}
      <div
        className="absolute inset-x-2 z-0 pointer-events-none border-2 border-primary/50 bg-primary/10 rounded-xl"
        style={{
          top: padHeight,
          height: ITEM_HEIGHT,
        }}
      />

      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll scrollbar-hide select-none"
        style={
          {
            scrollSnapType: snapDisabled ? "none" : "y proximity",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            scrollBehavior: "auto",
            WebkitUserSelect: "none",
            userSelect: "none",
            willChange: "scroll-position",
            transform: "translateZ(0)",
            touchAction: "pan-y",
          } as CSSProperties
        }
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={beginDrag}
        onTouchEnd={endDrag}
        onTouchCancel={endDrag}
      >
        <div style={{ height: padHeight }} />

        {data.map((item, index) => {
          const isSelected = index === highlightIndex;
          const distanceFromSelected = Math.abs(index - highlightIndex);
          const opacity = distanceFromSelected === 0 ? 1 : distanceFromSelected === 1 ? 0.5 : 0.25;

          return (
            <div
              key={item}
              className={`flex items-center justify-center select-none gap-1 ${
                isDragging ? "" : "transition-all duration-150"
              } ${isSelected ? "text-primary font-bold" : "text-muted-foreground"}`}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
                fontSize: isSelected ? "1.5rem" : "1rem",
                opacity,
                transform: isSelected ? "scale(1.05)" : "scale(0.9)",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
              onClick={() => handleItemClick(item)}
            >
              <span>{item}</span>
              <span
                className={`${isSelected ? "text-sm text-primary/70" : "text-xs text-muted-foreground/60"}`}
              >
                {unit}
              </span>
            </div>
          );
        })}

        <div style={{ height: padHeight }} />
      </div>
    </div>
  );
};
