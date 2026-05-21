import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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

/** Matches existing layout (do not change visual design). */
const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 3;
const PAD_ITEMS = Math.floor(VISIBLE_ITEMS / 2);
const SCROLL_DEBOUNCE_MS = 10;
const PROGRAMMATIC_SCROLL_MS = 300;

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

/**
 * Web port of RN FlatList wheel logic:
 * index = round(offsetY / itemHeight), clamped to data bounds.
 */
function getRealIndex(offsetY: number, itemCount: number, itemHeight: number): number {
  if (itemCount <= 0) return 0;
  const index = Math.round(offsetY / itemHeight);
  return Math.max(0, Math.min(index, itemCount - 1));
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

  const [selectedIndex, setSelectedIndex] = useState(() => indexFromValue(value, data));

  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHapticIndexRef = useRef(-1);
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const pickerHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
  const padHeight = PAD_ITEMS * ITEM_HEIGHT;

  const getIndexFromScroll = useCallback(
    (offsetY: number) => getRealIndex(offsetY, data.length, ITEM_HEIGHT),
    [data.length],
  );

  const scrollToIndex = useCallback((index: number, animated = true) => {
    const el = scrollRef.current;
    if (!el || data.length === 0) return;

    const clamped = Math.max(0, Math.min(index, data.length - 1));
    isProgrammaticScroll.current = true;

    el.scrollTo({
      top: clamped * ITEM_HEIGHT,
      behavior: animated ? "smooth" : "auto",
    });

    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, animated ? PROGRAMMATIC_SCROLL_MS : 48);
  }, [data.length]);

  const updateSelectedIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, data.length - 1));

      setSelectedIndex((prev) => {
        if (prev === clamped) return prev;

        if (clamped !== lastHapticIndexRef.current) {
          lastHapticIndexRef.current = clamped;
          triggerHaptic();
        }

        const item = data[clamped];
        if (item !== undefined) {
          onChange(item);
        }

        return clamped;
      });

      return clamped;
    },
    [onChange, data],
  );

  /** RN: onMomentumScrollEnd */
  const handleMomentumEnd = useCallback(() => {
    if (isProgrammaticScroll.current) return;

    const el = scrollRef.current;
    if (!el) return;

    const index = getIndexFromScroll(el.scrollTop);
    scrollToIndex(index, true);
    updateSelectedIndex(index);
  }, [getIndexFromScroll, scrollToIndex, updateSelectedIndex]);

  /** RN: onScroll + 10ms debounce */
  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;

    const el = scrollRef.current;
    if (!el) return;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      scrollTimeout.current = null;
      const index = getIndexFromScroll(el.scrollTop);
      updateSelectedIndex(index);
    }, SCROLL_DEBOUNCE_MS);
  }, [getIndexFromScroll, updateSelectedIndex]);

  const handleItemClick = useCallback(
    (item: number) => {
      const index = indexFromValue(item, data);
      scrollToIndex(index, true);
      setSelectedIndex(index);
      lastHapticIndexRef.current = index;
      onChange(item);
    },
    [data, onChange, scrollToIndex],
  );

  /** RN: sync when controlled `value` changes */
  useEffect(() => {
    const index = indexFromValue(value, data);
    if (index !== selectedIndexRef.current) {
      setSelectedIndex(index);
      lastHapticIndexRef.current = index;
      scrollToIndex(index, false);
    }
  }, [value, data, scrollToIndex]);

  /** RN: initial scroll to selected index */
  useEffect(() => {
    const index = indexFromValue(value, data);
    requestAnimationFrame(() => {
      scrollToIndex(index, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scrollend", handleMomentumEnd, { passive: true });
    return () => el.removeEventListener("scrollend", handleMomentumEnd);
  }, [handleMomentumEnd]);

  useEffect(
    () => () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    },
    [],
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

      {/* Scroll container — RN: FlatList + snapToInterval + decelerationRate fast */}
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
      >
        <div style={{ height: padHeight }} />

        {data.map((item, index) => {
          const isSelected = index === selectedIndex;
          const distanceFromSelected = Math.abs(index - selectedIndex);
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
