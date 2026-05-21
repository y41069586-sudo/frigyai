/**
 * Web port of React Native FlatList WheelPicker (snapToInterval + momentum settle).
 * Use via WheelPicker (numeric) or MintWheelColumn (onboarding).
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
  renderItem?: (item: T, selected: boolean, index: number, selectedIndex: number) => ReactNode;
  itemHeight?: number;
  visibleItems?: number;
  className?: string;
  style?: CSSProperties;
  /** Optional overlay (selection band) — absolute inside container */
  selectionOverlay?: ReactNode;
  /** Transform index before commit (e.g. circular wheel) */
  normalizeIndex?: (index: number) => number;
  getItemKey?: (item: T, index: number) => string | number;
};

const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_ITEMS = 5;
const PROGRAMMATIC_SCROLL_MS = 320;

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

  const indexFromValue = useCallback(
    (v: T | undefined) => {
      if (v === undefined || data.length === 0) return 0;
      const index = data.findIndex((x) => x === v);
      return index >= 0 ? index : 0;
    },
    [data],
  );

  const [selectedIndex, setSelectedIndex] = useState(() => indexFromValue(value));

  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const pickerHeight = itemHeight * visibleItems;
  const verticalPadding = (pickerHeight - itemHeight) / 2;
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

      window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, animated ? PROGRAMMATIC_SCROLL_MS : 48);
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
      setSelectedIndex((prev) => {
        if (prev === index) return prev;
        if (onChange && data[index] !== undefined) {
          onChange(data[index], index);
        }
        return index;
      });
    },
    [data, onChange],
  );

  const handleMomentumEnd = useCallback(() => {
    if (isProgrammaticScroll.current) return;

    const el = scrollRef.current;
    if (!el) return;

    const index = resolveIndex(getRealIndex(el.scrollTop));
    scrollToIndex(index, true);
    updateSelectedIndex(index);
  }, [getRealIndex, resolveIndex, scrollToIndex, updateSelectedIndex]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;

    const el = scrollRef.current;
    if (!el) return;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      scrollTimeout.current = null;
      updateSelectedIndex(resolveIndex(getRealIndex(el.scrollTop)));
    }, 10);
  }, [getRealIndex, resolveIndex, updateSelectedIndex]);

  useEffect(() => {
    if (value === undefined) return;

    const index = indexFromValue(value);
    if (index !== selectedIndexRef.current) {
      setSelectedIndex(index);
      scrollToIndex(index, false);
    }
  }, [value, data, indexFromValue, scrollToIndex]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToIndex(selectedIndexRef.current, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount align
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
          color: selected ? "inherit" : "#777",
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

  return (
    <div className={className} style={containerStyle}>
      {selectionOverlay}

      <div
        ref={scrollRef}
        className="h-full overflow-y-scroll scrollbar-hide select-none"
        style={{
          paddingTop: verticalPadding,
          paddingBottom: verticalPadding,
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          scrollBehavior: "auto",
          touchAction: "pan-y",
        }}
        onScroll={handleScroll}
      >
        {data.map((item, index) => {
          const selected = index === selectedIndex;
          const key = getItemKey ? getItemKey(item, index) : index;

          return (
            <div
              key={key}
              className="flex items-center justify-center"
              style={{
                height: itemHeight,
                scrollSnapAlign: "center",
                scrollSnapStop: "always",
              }}
            >
              {renderItem
                ? renderItem(item, selected, index, selectedIndex)
                : defaultRenderItem(item, selected)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
