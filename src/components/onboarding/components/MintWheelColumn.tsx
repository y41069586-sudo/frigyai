import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

export const WHEEL_VISIBLE_ITEMS = 5;
export const WHEEL_PAD_ITEMS = Math.floor(WHEEL_VISIBLE_ITEMS / 2);

/** Short phones (e.g. iPhone SE): tighter wheel. Most iPhones use the comfortable row height. */
const COMPACT_HEIGHT_MQ = "(max-height: 700px)";
export const WHEEL_ROW_COMPACT = 40;
export const WHEEL_ROW_COMFORT = 46;

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
  rowHeight: number;
  /** Repeat options in a loop so short lists (e.g. 0–9) show digits above/below the ends */
  circular?: boolean;
};

const haptic = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(4);
  }
};

export function MintWheelColumn({
  options,
  value,
  onChange,
  align = "center",
  width = "100%",
  ariaLabel,
  rowHeight,
  circular = false,
}: MintWheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPhysicalIndexRef = useRef(0);
  const isProgrammaticRef = useRef(false);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const top = scrollRef.current.scrollTop;
    const idx = Math.round(top / rowHeight);
    const clamped = Math.max(0, Math.min(displayOptions.length - 1, idx));

    setVisualPhysicalIndex((prev) => (prev === clamped ? prev : clamped));

    if (clamped !== lastPhysicalIndexRef.current) {
      haptic();
      lastPhysicalIndexRef.current = clamped;
      onChange(displayOptions[clamped].value);
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
      const targetTop = physical * rowHeight;
      const currentTop = scrollRef.current.scrollTop;
      if (Math.abs(currentTop - targetTop) > 0.5) {
        scrollToIndex(physical, true);
      }
    }, 90);
  }, [displayOptions, onChange, scrollToIndex, circularActive, segmentLen, rowHeight]);

  useEffect(
    () => () => {
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    },
    [],
  );

  const containerHeight = WHEEL_VISIBLE_ITEMS * rowHeight;
  const textAlignClass =
    align === "left"
      ? "justify-start pl-2"
      : align === "right"
        ? "justify-end pr-2"
        : "justify-center";

  const selectedFontPx = rowHeight <= WHEEL_ROW_COMPACT ? 19 : 24;
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
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          WebkitUserSelect: "none",
          userSelect: "none",
          willChange: "scroll-position",
          transform: "translateZ(0)",
        }}
        onScroll={handleScroll}
      >
        <div style={{ height: WHEEL_PAD_ITEMS * rowHeight }} />
        {displayOptions.map((opt, idx) => {
          const distance = Math.abs(idx - visualPhysicalIndex);
          const isSelected = idx === visualPhysicalIndex;
          const opacity =
            distance === 0 ? 1 : distance === 1 ? 0.78 : distance === 2 ? 0.52 : 0.34;
          return (
            <div
              key={circularActive ? `wheel-${idx}` : opt.value}
              role="option"
              aria-selected={isSelected}
              className={`flex items-center ${textAlignClass}`}
              style={{
                height: rowHeight,
                scrollSnapAlign: "center",
                fontSize: isSelected ? `${selectedFontPx}px` : `${idleFontPx}px`,
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? "#1F2937" : "#4B5563",
                opacity,
                letterSpacing: "-0.01em",
                transition:
                  "font-size 160ms cubic-bezier(0.4,0,0.2,1), color 160ms, opacity 160ms",
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
