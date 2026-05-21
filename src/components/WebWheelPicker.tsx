/**
 * Web port of React Native FlatList WheelPicker (1:1 logic).
 * @see https://reactnative.dev/docs/flatlist — snapToInterval, onMomentumScrollEnd, padded rows
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type WebWheelPickerProps<T> = {
  data: T[];
  value?: T;
  onChange?: (item: T, index: number) => void;
  renderItem?: (item: T, selected: boolean) => ReactNode;
  itemHeight?: number;
  visibleItems?: number;
  className?: string;
  style?: CSSProperties;
  selectionOverlay?: ReactNode;
  /** Map data index before commit (e.g. circular wheel) */
  normalizeIndex?: (index: number) => number;
  getItemKey?: (item: T, index: number) => string | number;
};

const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_ITEMS = 5;

type PaddedRow<T> = T | null;

export function WebWheelPicker<T>({
  data,
  value,
  onChange,
  renderItem,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  visibleItems = DEFAULT_VISIBLE_ITEMS,
  className,
  style,
  selectionOverlay,
  normalizeIndex,
  getItemKey,
}: WebWheelPickerProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const padCount = Math.floor(visibleItems / 2);

  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (value === undefined || data.length === 0) return 0;
    const index = data.findIndex((x) => x === value);
    return index >= 0 ? index : 0;
  });

  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const pickerHeight = itemHeight * visibleItems;
  const verticalPadding = (pickerHeight - itemHeight) / 2;

  const paddedData = useMemo((): PaddedRow<T>[] => {
    return [
      ...Array<PaddedRow<T>>(padCount).fill(null),
      ...data,
      ...Array<PaddedRow<T>>(padCount).fill(null),
    ];
  }, [data, padCount]);

  const getRealIndex = useCallback(
    (offsetY: number) => {
      const index = Math.round(offsetY / itemHeight);
      return Math.max(0, Math.min(index, data.length - 1));
    },
    [data.length, itemHeight],
  );

  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      const el = scrollRef.current;
      if (!el || data.length === 0) return;

      const clamped = Math.max(0, Math.min(index, data.length - 1));
      isProgrammaticScroll.current = true;

      el.scrollTo({
        top: clamped * itemHeight,
        behavior: animated ? "smooth" : "auto",
      });

      requestAnimationFrame(() => {
        isProgrammaticScroll.current = false;
      });
    },
    [data.length, itemHeight],
  );

  const resolveIndex = useCallback(
    (rawIndex: number) => {
      const clamped = Math.max(0, Math.min(rawIndex, data.length - 1));
      return normalizeIndex ? normalizeIndex(clamped) : clamped;
    },
    [data.length, normalizeIndex],
  );

  const updateSelectedIndex = useCallback(
    (index: number) => {
      const resolved = resolveIndex(index);
      setSelectedIndex((prev) => {
        if (prev === resolved) return prev;
        if (onChange && data[resolved] !== undefined) {
          onChange(data[resolved], resolved);
        }
        return resolved;
      });
    },
    [data, onChange, resolveIndex],
  );

  const handleMomentumEnd = useCallback(() => {
    if (isProgrammaticScroll.current) return;

    const el = scrollRef.current;
    if (!el) return;

    const index = getRealIndex(el.scrollTop);
    scrollToIndex(index, true);
    updateSelectedIndex(index);
  }, [getRealIndex, scrollToIndex, updateSelectedIndex]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;

    const el = scrollRef.current;
    if (!el) return;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      scrollTimeout.current = null;
      updateSelectedIndex(getRealIndex(el.scrollTop));
    }, 10);
  }, [getRealIndex, updateSelectedIndex]);

  useEffect(() => {
    if (value === undefined) return;

    const index = data.findIndex((x) => x === value);
    if (index >= 0 && index !== selectedIndexRef.current) {
      setSelectedIndex(index);
      scrollToIndex(index, false);
    }
  }, [value, data, scrollToIndex]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToIndex(selectedIndexRef.current, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scrollend", handleMomentumEnd, { passive: true });
    return () => el.removeEventListener("scrollend", handleMomentumEnd);
  }, [handleMomentumEnd]);

  useEffect(
    () => () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    },
    [],
  );

  const defaultRenderItem = useCallback(
    (item: T, selected: boolean) => (
      <span
        style={{
          fontSize: selected ? 24 : 20,
          fontWeight: selected ? 700 : 400,
          color: selected ? "#777" : "#777",
        }}
      >
        {String(item)}
      </span>
    ),
    [],
  );

  const containerStyle: CSSProperties = useMemo(
    () => ({
      height: pickerHeight,
      overflow: "hidden",
      width: "100%",
      position: "relative",
      ...style,
    }),
    [pickerHeight, style],
  );

  const defaultOverlay = (
    <div
      className="pointer-events-none absolute inset-x-0 z-10"
      style={{
        top: verticalPadding,
        height: itemHeight,
        borderTop: "1px solid #444",
        borderBottom: "1px solid #444",
      }}
    />
  );

  return (
    <div className={className} style={containerStyle}>
      {selectionOverlay ?? defaultOverlay}

      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll scrollbar-hide select-none"
        style={{
          paddingTop: verticalPadding,
          paddingBottom: verticalPadding,
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "none",
          touchAction: "pan-y",
        }}
        onScroll={handleScroll}
      >
        {paddedData.map((item, flatIndex) => {
          const realIndex = flatIndex - padCount;

          if (item === null) {
            return <div key={`pad-${flatIndex}`} style={{ height: itemHeight }} />;
          }

          const selected = realIndex === selectedIndex;
          const key = getItemKey ? getItemKey(item, realIndex) : realIndex;

          return (
            <div
              key={key}
              className="flex items-center justify-center"
              style={{
                height: itemHeight,
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
              }}
            >
              {renderItem ? renderItem(item, selected) : defaultRenderItem(item, selected)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
