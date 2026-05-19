import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";

export const WHEEL_VISIBLE_ITEMS = 5;
export const WHEEL_PAD_ITEMS = Math.floor(WHEEL_VISIBLE_ITEMS / 2);

/** Short phones (e.g. iPhone SE): tighter wheel. Most iPhones use the comfortable row height. */
const COMPACT_HEIGHT_MQ = "(max-height: 700px)";
export const WHEEL_ROW_COMPACT = 40;
export const WHEEL_ROW_COMFORT = 46;
export const WHEEL_ITEM_HEIGHT = WHEEL_ROW_COMFORT;

export function useMintWheelRowHeight(): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(COMPACT_HEIGHT_MQ);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () =>
      typeof window !== "undefined" && window.matchMedia(COMPACT_HEIGHT_MQ).matches
        ? WHEEL_ROW_COMPACT
        : WHEEL_ROW_COMFORT,
    () => WHEEL_ROW_COMFORT,
  );
}

export type MintWheelOption = { value: number; label: string };

type MintWheelColumnProps = {
  options: MintWheelOption[];
  value: number;
  onChange: (value: number) => void;
  align?: "left" | "center" | "right";
  width?: number | string;
  ariaLabel?: string;
  /** Row height in px — must match overlay math in parent (use `useMintWheelRowHeight()`). */
  rowHeight?: number;
  /** Repeat options in a loop so short lists (e.g. 0–9) show digits above/below the ends */
  circular?: boolean;
  /** Smaller type for long labels (e.g. month names) */
  compactLabels?: boolean;
};

const haptic = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(2);
  }
};

export function MintWheelColumn({
  options,
  value,
  onChange,
  align = "center",
  width = "100%",
  ariaLabel,
  rowHeight = WHEEL_ROW_COMFORT,
  circular = false,
  compactLabels = false,
}: MintWheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPhysicalIndexRef = useRef(0);
  const isProgrammaticRef = useRef(false);
  const isUserDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastHapticAtRef = useRef(0);

  const segmentLen = options.length;
  const circularActive = Boolean(circular && segmentLen > 1);

  const displayOptions = useMemo(() => {
    if (circularActive) {
      return [...options, ...options, ...options];
    }
    return options;
  }, [options, circularActive]);

  const physicalOffset = circularActive ? segmentLen : 0;

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  }, [options, value]);

  const centerPhysicalIndex = physicalOffset + selectedIndex;

  const [visualPhysicalIndex, setVisualPhysicalIndex] = useState(centerPhysicalIndex);

  useEffect(() => {
    setVisualPhysicalIndex(centerPhysicalIndex);
  }, [centerPhysicalIndex]);

  const scrollToIndex = useCallback(
    (idx: number, smooth: boolean) => {
      if (!scrollRef.current) return;
      isProgrammaticRef.current = true;
      scrollRef.current.scrollTo({
        top: idx * rowHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      lastPhysicalIndexRef.current = idx;
      setTimeout(
        () => {
          isProgrammaticRef.current = false;
        },
        smooth ? 280 : 40,
      );
    },
    [rowHeight],
  );

  const normalizeCircularPhysical = useCallback(
    (physical: number): number => {
      if (!circularActive) return physical;
      if (physical < segmentLen) {
        scrollToIndex(physical + segmentLen, false);
        return physical + segmentLen;
      }
      if (physical >= 2 * segmentLen) {
        scrollToIndex(physical - segmentLen, false);
        return physical - segmentLen;
      }
      return physical;
    },
    [circularActive, scrollToIndex, segmentLen],
  );

  const commitScrollPosition = useCallback(
    (smooth: boolean) => {
      if (!scrollRef.current || isProgrammaticRef.current) return;

      let physical = Math.round(scrollRef.current.scrollTop / rowHeight);
      physical = Math.max(0, Math.min(displayOptions.length - 1, physical));
      physical = normalizeCircularPhysical(physical);

      const targetTop = physical * rowHeight;
      const currentTop = scrollRef.current.scrollTop;

      lastPhysicalIndexRef.current = physical;
      setVisualPhysicalIndex(physical);

      const nextValue = displayOptions[physical].value;
      if (nextValue !== value) {
        onChange(nextValue);
        const now = performance.now();
        if (now - lastHapticAtRef.current > 80) {
          haptic();
          lastHapticAtRef.current = now;
        }
      }

      if (Math.abs(currentTop - targetTop) > 0.5) {
        scrollToIndex(physical, smooth);
      }
    },
    [displayOptions, normalizeCircularPhysical, onChange, rowHeight, scrollToIndex, value],
  );

  const scheduleSettle = useCallback(
    (delayMs: number, smooth: boolean) => {
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(() => {
        if (isUserDraggingRef.current) return;
        commitScrollPosition(smooth);
      }, delayMs);
    },
    [commitScrollPosition],
  );

  useEffect(() => {
    const targetPhysical = physicalOffset + selectedIndex;
    scrollToIndex(targetPhysical, false);
  }, [selectedIndex, physicalOffset, scrollToIndex]);

  const beginDrag = useCallback(() => {
    isUserDraggingRef.current = true;
    setIsDragging(true);
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
  }, []);

  const endDrag = useCallback(() => {
    isUserDraggingRef.current = false;
    setIsDragging(false);
    scheduleSettle(40, true);
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

  const updateVisualFromScroll = useCallback(() => {
    if (!scrollRef.current || isProgrammaticRef.current) return;
    const top = scrollRef.current.scrollTop;
    const idx = Math.round(top / rowHeight);
    const clamped = Math.max(0, Math.min(displayOptions.length - 1, idx));
    setVisualPhysicalIndex((prev) => (prev === clamped ? prev : clamped));
  }, [displayOptions.length, rowHeight]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isProgrammaticRef.current) return;
    if (rafRef.current != null) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateVisualFromScroll();
    });
  }, [updateVisualFromScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      if (!isUserDraggingRef.current) commitScrollPosition(true);
    };

    el.addEventListener("scrollend", onScrollEnd);
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [commitScrollPosition]);

  useEffect(
    () => () => {
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const containerHeight = WHEEL_VISIBLE_ITEMS * rowHeight;
  const textAlignClass =
    align === "left"
      ? "justify-start pl-1"
      : align === "right"
        ? "justify-end pr-1"
        : "justify-center";

  const idleFontPx = compactLabels
    ? rowHeight <= WHEEL_ROW_COMPACT
      ? 12
      : 13
    : rowHeight <= WHEEL_ROW_COMPACT
      ? 14
      : 17;
  const selectedFontPx = compactLabels
    ? rowHeight <= WHEEL_ROW_COMPACT
      ? 14
      : 15
    : rowHeight <= WHEEL_ROW_COMPACT
      ? 18
      : 22;

  return (
    <div
      className="relative shrink-0"
      style={{ height: containerHeight, width }}
      role="listbox"
      aria-label={ariaLabel}
    >
      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll scrollbar-hide select-none"
        style={{
          scrollSnapType: "none",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          WebkitUserSelect: "none",
          userSelect: "none",
          willChange: "scroll-position",
          transform: "translateZ(0)",
          touchAction: "pan-y",
        }}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={beginDrag}
        onTouchEnd={endDrag}
        onTouchCancel={endDrag}
      >
        <div style={{ height: WHEEL_PAD_ITEMS * rowHeight }} />
        {displayOptions.map((opt, idx) => {
          const distance = Math.abs(idx - visualPhysicalIndex);
          const isSelected = idx === visualPhysicalIndex;
          const opacity =
            distance === 0 ? 1 : distance === 1 ? 0.78 : distance === 2 ? 0.52 : 0.34;
          const scale = distance === 0 ? 1.12 : distance === 1 ? 0.98 : 0.9;
          return (
            <div
              key={circularActive ? `wheel-${idx}` : opt.value}
              role="option"
              aria-selected={isSelected}
              className={`flex items-center ${textAlignClass}`}
              style={{
                height: rowHeight,
                fontSize: `${isSelected ? selectedFontPx : idleFontPx}px`,
                fontWeight: isSelected ? 600 : 400,
                lineHeight: 1,
                color: isSelected ? "#1F2937" : "#4B5563",
                opacity,
                transform: `translateZ(0) scale(${isSelected ? 1 : scale})`,
                letterSpacing: "-0.01em",
                transition: isDragging
                  ? "none"
                  : "transform 120ms ease-out, color 120ms, opacity 120ms",
                willChange: "transform, opacity",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {opt.label}
            </div>
          );
        })}
        <div style={{ height: WHEEL_PAD_ITEMS * rowHeight }} />
      </div>
    </div>
  );
}
