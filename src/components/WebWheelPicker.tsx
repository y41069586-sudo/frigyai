/**
 * Web wheel picker — iOS-like momentum + center-aligned selection.
 * Padding centers rows; highlight follows scroll; value commits on settle.
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
  renderItem?: (item: T, selected: boolean, index: number, highlightIndex: number) => ReactNode;
  itemHeight?: number;
  visibleItems?: number;
  className?: string;
  style?: CSSProperties;
  /** Parent provides green band (onboarding) — no default borders */
  selectionOverlay?: ReactNode | null;
  normalizeIndex?: (index: number) => number;
  getItemKey?: (item: T, index: number) => string | number;
};

const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_ITEMS = 5;
const PROGRAMMATIC_SCROLL_MS = 320;

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

export function WebWheelPicker<T>({
  data,
  value,
  onChange,
  renderItem,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  visibleItems = DEFAULT_VISIBLE_ITEMS,
  className,
  style,
  selectionOverlay = null,
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
  const [highlightIndex, setHighlightIndex] = useState(() => indexFromValue(value));

  const isProgrammaticScroll = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const selectedIndexRef = useRef(selectedIndex);
  const highlightIndexRef = useRef(highlightIndex);
  selectedIndexRef.current = selectedIndex;
  highlightIndexRef.current = highlightIndex;

  const pickerHeight = itemHeight * visibleItems;
  const verticalPadding = (pickerHeight - itemHeight) / 2;

  const getRealIndex = useCallback(
    (offsetY: number) => {
      const index = Math.round(offsetY / itemHeight);
      return clampIndex(index, data.length);
    },
    [data.length, itemHeight],
  );

  const resolveIndex = useCallback(
    (rawIndex: number) => {
      const clamped = clampIndex(rawIndex, data.length);
      return normalizeIndex ? normalizeIndex(clamped) : clamped;
    },
    [data.length, normalizeIndex],
  );

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      const el = scrollRef.current;
      if (!el || data.length === 0) return;

      const clamped = clampIndex(index, data.length);
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

  const commitIndex = useCallback(
    (rawIndex: number, animated: boolean) => {
      const resolved = resolveIndex(rawIndex);
      highlightIndexRef.current = resolved;
      setHighlightIndex(resolved);

      const targetTop = resolved * itemHeight;
      const el = scrollRef.current;
      const drift = el ? Math.abs(el.scrollTop - targetTop) : 0;

      if (drift > 0.5) {
        scrollToIndex(resolved, animated);
      }

      if (resolved !== selectedIndexRef.current) {
        selectedIndexRef.current = resolved;
        setSelectedIndex(resolved);
        if (onChange && data[resolved] !== undefined) {
          onChange(data[resolved], resolved);
        }
      }
    },
    [data, onChange, resolveIndex, scrollToIndex],
  );

  const updateHighlightFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isProgrammaticScroll.current) return;

    const idx = getRealIndex(el.scrollTop);
    setHighlightIndex((prev) => {
      if (prev === idx) return prev;
      highlightIndexRef.current = idx;
      return idx;
    });
  }, [getRealIndex]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;

    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateHighlightFromScroll();
    });
  }, [updateHighlightFromScroll]);

  const handleSettle = useCallback(() => {
    if (isProgrammaticScroll.current) return;
    const el = scrollRef.current;
    if (!el) return;
    commitIndex(getRealIndex(el.scrollTop), true);
  }, [commitIndex, getRealIndex]);

  const scheduleSettle = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null;
      handleSettle();
    }, 80);
  }, [handleSettle]);

  useEffect(() => {
    if (value === undefined) return;
    const index = indexFromValue(value);
    if (index !== selectedIndexRef.current) {
      setSelectedIndex(index);
      setHighlightIndex(index);
      highlightIndexRef.current = index;
      scrollToIndex(index, false);
    }
  }, [value, data, indexFromValue, scrollToIndex]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const idx = indexFromValue(value);
      scrollToIndex(idx, false);
      setHighlightIndex(idx);
      highlightIndexRef.current = idx;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      handleSettle();
    };

    el.addEventListener("scrollend", onScrollEnd, { passive: true });
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [handleSettle]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
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
          scrollSnapType: "y proximity",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
        }}
        onScroll={() => {
          handleScroll();
          scheduleSettle();
        }}
      >
        {data.map((item, index) => {
          const selected = index === highlightIndex;
          const key = getItemKey ? getItemKey(item, index) : index;

          return (
            <div
              key={key}
              className="flex items-center justify-center"
              style={{
                height: itemHeight,
                scrollSnapAlign: "center",
              }}
            >
              {renderItem ? (
                renderItem(item, selected, index, highlightIndex)
              ) : (
                <span
                  style={{
                    fontSize: selected ? 18 : 15,
                    fontWeight: selected ? 600 : 400,
                    color: selected ? "#1F2937" : "#6B7280",
                  }}
                >
                  {String(item)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
