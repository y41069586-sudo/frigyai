import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

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
}: MintWheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPhysicalIndexRef = useRef(0);
  const isProgrammaticRef = useRef(false);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  /** Keeps fade/scale aligned with scroll position while dragging (circular wheels need this). */
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
        smooth ? 260 : 30,
      );
    },
    [rowHeight],
  );

  useEffect(() => {
    const targetPhysical = physicalOffset + selectedIndex;
    scrollToIndex(targetPhysical, false);
  }, [selectedIndex, physicalOffset, scrollToIndex, rowHeight]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isProgrammaticRef.current) return;
    if (rafRef.current != null) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      if (!scrollRef.current || isProgrammaticRef.current) return;

    const top = scrollRef.current.scrollTop;
    const idx = Math.round(top / rowHeight);
    const clamped = Math.max(0, Math.min(displayOptions.length - 1, idx));

    setVisualPhysicalIndex((prev) => (prev === clamped ? prev : clamped));

    if (clamped !== lastPhysicalIndexRef.current) {
      const now = performance.now();
      if (now - lastHapticAtRef.current > 120) {
        haptic();
        lastHapticAtRef.current = now;
      }
      lastPhysicalIndexRef.current = clamped;
    }

    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    snapTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      let physical = Math.round(scrollRef.current.scrollTop / rowHeight);
      physical = Math.max(0, Math.min(displayOptions.length - 1, physical));

      if (circularActive) {
        if (physical < segmentLen) {
          scrollToIndex(physical + segmentLen, false);
          physical += segmentLen;
        } else if (physical >= 2 * segmentLen) {
          scrollToIndex(physical - segmentLen, false);
          physical -= segmentLen;
        }
      }

      lastPhysicalIndexRef.current = physical;
      setVisualPhysicalIndex(physical);
      const nextValue = displayOptions[physical].value;
      if (nextValue !== value) {
        onChange(nextValue);
      }
      const targetTop = physical * rowHeight;
      const currentTop = scrollRef.current.scrollTop;
      if (Math.abs(currentTop - targetTop) > 0.5) {
        scrollToIndex(physical, false);
      }
    }, 190);
    });
  }, [displayOptions, onChange, scrollToIndex, circularActive, segmentLen, rowHeight, value]);

  useEffect(
    () => () => {
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
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

  const idleFontPx = rowHeight <= WHEEL_ROW_COMPACT ? 14 : 17;

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
          scrollSnapType: "y proximity",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          WebkitUserSelect: "none",
          userSelect: "none",
          willChange: "scroll-position",
          transform: "translateZ(0)",
          touchAction: "pan-y",
        }}
        onScroll={handleScroll}
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
                fontSize: `${idleFontPx}px`,
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? "#1F2937" : "#4B5563",
                opacity,
                transform: `translateZ(0) scale(${scale})`,
                letterSpacing: "-0.01em",
                transition: "transform 120ms ease-out, color 120ms, opacity 120ms",
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
