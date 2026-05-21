import {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
} from "react";

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 3;
const PAD_ITEMS = Math.floor(VISIBLE_ITEMS / 2);
const SETTLE_FALLBACK_MS = 120;
const PROGRAMMATIC_RELEASE_MS = 320;

const triggerHaptic = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(5);
  }
};

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, index));
}

function buildItems(min: number, max: number, step: number): number[] {
  if (step <= 0 || max < min) return [min];
  const items: number[] = [];
  for (let v = min; v <= max; v += step) {
    items.push(v);
  }
  return items.length > 0 ? items : [min];
}

function indexFromValue(value: number, items: number[], min: number, step: number): number {
  if (items.length === 0) return 0;
  const idx = items.indexOf(value);
  if (idx >= 0) return idx;
  const computed = Math.round((value - min) / step);
  return clampIndex(computed, items.length);
}

function indexFromScrollTop(scrollTop: number, itemCount: number): number {
  return clampIndex(Math.round(scrollTop / ITEM_HEIGHT), itemCount);
}

function scrollTopFromIndex(index: number): number {
  return index * ITEM_HEIGHT;
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
  const items = useMemo(() => buildItems(min, max, step), [min, max, step]);

  const isUserInteractingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticTokenRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastEmittedValueRef = useRef(value);
  const lastHapticIndexRef = useRef(-1);

  const [highlightIndex, setHighlightIndex] = useState(() =>
    indexFromValue(value, items, min, step),
  );

  const releaseProgrammaticScroll = useCallback((token: number, delayMs: number) => {
    window.setTimeout(() => {
      if (programmaticTokenRef.current === token) {
        isProgrammaticScrollRef.current = false;
      }
    }, delayMs);
  }, []);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "auto") => {
      const el = scrollRef.current;
      if (!el || items.length === 0) return;

      const clamped = clampIndex(index, items.length);
      const token = ++programmaticTokenRef.current;
      isProgrammaticScrollRef.current = true;

      el.scrollTo({ top: scrollTopFromIndex(clamped), behavior });

      setHighlightIndex(clamped);
      lastHapticIndexRef.current = clamped;

      releaseProgrammaticScroll(token, behavior === "smooth" ? PROGRAMMATIC_RELEASE_MS : 48);
    },
    [items.length, releaseProgrammaticScroll],
  );

  const emitValueIfChanged = useCallback(
    (index: number) => {
      const clamped = clampIndex(index, items.length);
      const nextValue = items[clamped];
      if (nextValue === undefined) return clamped;

      if (nextValue !== lastEmittedValueRef.current) {
        lastEmittedValueRef.current = nextValue;
        onChange(nextValue);
      }
      return clamped;
    },
    [items, onChange],
  );

  const snapToNearestIndex = useCallback(
    (smooth: boolean) => {
      const el = scrollRef.current;
      if (!el || items.length === 0 || isProgrammaticScrollRef.current) return;

      const rawIndex = indexFromScrollTop(el.scrollTop, items.length);
      const snappedTop = scrollTopFromIndex(rawIndex);
      const drift = Math.abs(el.scrollTop - snappedTop);

      if (drift > 0.5) {
        const token = ++programmaticTokenRef.current;
        isProgrammaticScrollRef.current = true;
        el.scrollTo({ top: snappedTop, behavior: smooth ? "smooth" : "auto" });
        releaseProgrammaticScroll(token, smooth ? PROGRAMMATIC_RELEASE_MS : 48);
      }

      const committed = emitValueIfChanged(rawIndex);
      setHighlightIndex(committed);
      lastHapticIndexRef.current = committed;
    },
    [items.length, emitValueIfChanged, releaseProgrammaticScroll],
  );

  const cancelSettle = useCallback(() => {
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const scheduleSettle = useCallback(
    (smooth: boolean, delayMs = SETTLE_FALLBACK_MS) => {
      cancelSettle();
      settleTimerRef.current = setTimeout(() => {
        settleTimerRef.current = null;
        if (!isUserInteractingRef.current) {
          snapToNearestIndex(smooth);
        }
      }, delayMs);
    },
    [cancelSettle, snapToNearestIndex],
  );

  const updateHighlightFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isProgrammaticScrollRef.current) return;

    const idx = indexFromScrollTop(el.scrollTop, items.length);
    setHighlightIndex((prev) => (prev === idx ? prev : idx));

    if (idx !== lastHapticIndexRef.current) {
      lastHapticIndexRef.current = idx;
      triggerHaptic();
    }
  }, [items.length]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;

    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateHighlightFromScroll();
      if (!isUserInteractingRef.current) {
        scheduleSettle(true, SETTLE_FALLBACK_MS);
      }
    });
  }, [updateHighlightFromScroll, scheduleSettle]);

  const beginInteraction = useCallback(() => {
    isUserInteractingRef.current = true;
    cancelSettle();
  }, [cancelSettle]);

  const endInteraction = useCallback(() => {
    isUserInteractingRef.current = false;
    scheduleSettle(true, 60);
  }, [scheduleSettle]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      beginInteraction();
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [beginInteraction],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      endInteraction();
    },
    [endInteraction],
  );

  const handleItemClick = useCallback(
    (item: number) => {
      const index = indexFromValue(item, items, min, step);
      beginInteraction();
      lastEmittedValueRef.current = item;
      onChange(item);
      scrollToIndex(index, true);
      isUserInteractingRef.current = false;
      cancelSettle();
    },
    [items, min, step, onChange, scrollToIndex, beginInteraction, cancelSettle],
  );

  useLayoutEffect(() => {
    const targetIndex = indexFromValue(value, items, min, step);
    lastEmittedValueRef.current = value;
    setHighlightIndex(targetIndex);
    lastHapticIndexRef.current = targetIndex;

    if (!isUserInteractingRef.current) {
      scrollToIndex(targetIndex, false);
    }
  }, [value, items, min, step, scrollToIndex]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      if (!isUserInteractingRef.current && !isProgrammaticScrollRef.current) {
        snapToNearestIndex(true);
      }
    };

    el.addEventListener("scrollend", onScrollEnd, { passive: true });
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [snapToNearestIndex]);

  useEffect(
    () => () => {
      cancelSettle();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    [cancelSettle],
  );

  const containerHeight = VISIBLE_ITEMS * ITEM_HEIGHT;
  const padHeight = PAD_ITEMS * ITEM_HEIGHT;

  return (
    <div className="relative mx-auto w-full" style={{ height: containerHeight }}>
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

      {/* Scroll container - optimized for iOS and Android */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll scrollbar-hide select-none"
        style={
          {
            scrollSnapType: "y mandatory",
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
        onTouchStart={beginInteraction}
        onTouchEnd={endInteraction}
        onTouchCancel={endInteraction}
      >
        {/* Top padding */}
        <div style={{ height: padHeight }} />

        {/* Items */}
        {items.map((item, index) => {
          const isSelected = index === highlightIndex;
          const distanceFromSelected = Math.abs(index - highlightIndex);
          const opacity = distanceFromSelected === 0 ? 1 : distanceFromSelected === 1 ? 0.5 : 0.25;

          return (
            <div
              key={item}
              className={`flex items-center justify-center select-none gap-1 transition-all duration-150 ${
                isSelected ? "text-primary font-bold" : "text-muted-foreground"
              }`}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
                scrollSnapStop: "always",
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

        {/* Bottom padding */}
        <div style={{ height: padHeight }} />
      </div>
    </div>
  );
};
