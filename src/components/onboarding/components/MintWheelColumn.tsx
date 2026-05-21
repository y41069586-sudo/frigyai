import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

export const WHEEL_VISIBLE_ITEMS = 5;
export const WHEEL_PAD_ITEMS = Math.floor(WHEEL_VISIBLE_ITEMS / 2);

/** Short phones (e.g. iPhone SE): tighter wheel. Most iPhones use the comfortable row height. */
const COMPACT_HEIGHT_MQ = "(max-height: 700px)";
export const WHEEL_ROW_COMPACT = 40;
export const WHEEL_ROW_COMFORT = 46;
export const WHEEL_ITEM_HEIGHT = WHEEL_ROW_COMFORT;

const SETTLE_FALLBACK_MS = 200;
const SMOOTH_SNAP_MS = 380;

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

function clampPhysical(physical: number, max: number): number {
  return Math.max(0, Math.min(physical, max));
}

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
  const isProgrammaticScrollRef = useRef(false);
  const isUserDraggingRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastHapticAtRef = useRef(0);
  const lastEmittedValueRef = useRef(value);

  const [isDragging, setIsDragging] = useState(false);
  const [snapDisabled, setSnapDisabled] = useState(false);

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
  const visualPhysicalIndexRef = useRef(visualPhysicalIndex);
  visualPhysicalIndexRef.current = visualPhysicalIndex;

  const clearSnapEndTimer = useCallback(() => {
    if (snapEndTimerRef.current !== null) {
      clearTimeout(snapEndTimerRef.current);
      snapEndTimerRef.current = null;
    }
  }, []);

  const releaseProgrammaticScroll = useCallback(
    (ms: number) => {
      clearSnapEndTimer();
      snapEndTimerRef.current = setTimeout(() => {
        snapEndTimerRef.current = null;
        isProgrammaticScrollRef.current = false;
      }, ms);
    },
    [clearSnapEndTimer],
  );

  const scrollToIndex = useCallback(
    (idx: number, smooth: boolean) => {
      const el = scrollRef.current;
      if (!el) return;

      const clamped = clampPhysical(idx, displayOptions.length - 1);
      isProgrammaticScrollRef.current = true;
      el.scrollTo({
        top: clamped * rowHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      visualPhysicalIndexRef.current = clamped;
      releaseProgrammaticScroll(smooth ? SMOOTH_SNAP_MS : 48);
    },
    [displayOptions.length, releaseProgrammaticScroll, rowHeight],
  );

  const normalizeCircularPhysical = useCallback(
    (physical: number, smoothReposition: boolean): number => {
      if (!circularActive) return physical;
      if (physical < segmentLen) {
        const target = physical + segmentLen;
        scrollToIndex(target, smoothReposition);
        return target;
      }
      if (physical >= 2 * segmentLen) {
        const target = physical - segmentLen;
        scrollToIndex(target, smoothReposition);
        return target;
      }
      return physical;
    },
    [circularActive, scrollToIndex, segmentLen],
  );

  const emitValueIfChanged = useCallback(
    (physical: number) => {
      const opt = displayOptions[physical];
      if (!opt) return;

      setVisualPhysicalIndex(physical);
      visualPhysicalIndexRef.current = physical;

      if (opt.value !== lastEmittedValueRef.current) {
        lastEmittedValueRef.current = opt.value;
        onChange(opt.value);
        const now = performance.now();
        if (now - lastHapticAtRef.current > 80) {
          haptic();
          lastHapticAtRef.current = now;
        }
      }
    },
    [displayOptions, onChange],
  );

  const commitScrollPosition = useCallback(
    (smooth: boolean) => {
      const el = scrollRef.current;
      if (!el || isProgrammaticScrollRef.current || displayOptions.length === 0) return;

      let physical = Math.round(el.scrollTop / rowHeight);
      physical = clampPhysical(physical, displayOptions.length - 1);
      physical = normalizeCircularPhysical(physical, false);

      const targetTop = physical * rowHeight;
      const drift = Math.abs(el.scrollTop - targetTop);

      setVisualPhysicalIndex(physical);

      if (drift > 0.5) {
        scrollToIndex(physical, smooth);
        const onSnapDone = () => {
          el.removeEventListener("scrollend", onSnapDone);
          emitValueIfChanged(physical);
        };
        el.addEventListener("scrollend", onSnapDone, { passive: true });
        clearSnapEndTimer();
        snapEndTimerRef.current = setTimeout(() => {
          el.removeEventListener("scrollend", onSnapDone);
          emitValueIfChanged(physical);
        }, SMOOTH_SNAP_MS + 40);
      } else {
        emitValueIfChanged(physical);
      }

      setSnapDisabled(false);
    },
    [
      clearSnapEndTimer,
      displayOptions.length,
      emitValueIfChanged,
      normalizeCircularPhysical,
      rowHeight,
      scrollToIndex,
    ],
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
        if (!isUserDraggingRef.current) {
          commitScrollPosition(smooth);
        }
      }, delayMs);
    },
    [cancelSettle, commitScrollPosition],
  );

  const updateVisualFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isProgrammaticScrollRef.current) return;

    const idx = clampPhysical(Math.round(el.scrollTop / rowHeight), displayOptions.length - 1);
    setVisualPhysicalIndex((prev) => (prev === idx ? prev : idx));
  }, [displayOptions.length, rowHeight]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    if (rafRef.current != null) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateVisualFromScroll();
    });
  }, [updateVisualFromScroll]);

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

  useEffect(() => {
    if (isUserDraggingRef.current) return;

    const targetPhysical = centerPhysicalIndex;
    if (targetPhysical === visualPhysicalIndexRef.current) return;

    lastEmittedValueRef.current = value;
    setVisualPhysicalIndex(targetPhysical);
    scrollToIndex(targetPhysical, false);
  }, [centerPhysicalIndex, scrollToIndex, value]);

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
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [cancelSettle, clearSnapEndTimer],
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
      ? 14
      : 15
    : rowHeight <= WHEEL_ROW_COMPACT
      ? 14
      : 17;
  const selectedFontPx = compactLabels
    ? rowHeight <= WHEEL_ROW_COMPACT
      ? 17
      : 18
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
                scrollSnapAlign: "center",
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
                willChange: isDragging ? "transform, opacity" : undefined,
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
