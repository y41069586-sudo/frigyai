/**
 * Web wheel picker — live highlight while scrolling, gentle snap when scrolling stops.
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
  renderItem?: (item: T, selected: boolean, index: number, activeIndex: number) => ReactNode;
  itemHeight?: number;
  visibleItems?: number;
  className?: string;
  style?: CSSProperties;
  selectionOverlay?: ReactNode | null;
  normalizeIndex?: (index: number) => number;
  getItemKey?: (item: T, index: number) => string | number;
};

const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_ITEMS = 5;
const SCROLL_SETTLE_MS = 160;
const MIN_SNAP_MS = 260;
const MAX_SNAP_MS = 420;
const SNAP_SKIP_PX = 4;
const SNAP_MIN_OFFSET_RATIO = 0.2;

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2);
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

  const isUserInteractingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapFrameRef = useRef<number | null>(null);
  const snapTokenRef = useRef(0);
  const settleTokenRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const pickerHeight = itemHeight * visibleItems;
  const verticalPadding = (pickerHeight - itemHeight) / 2;

  const getNearestIndex = useCallback(
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

  const applySelection = useCallback(
    (rawIndex: number, notify: boolean) => {
      const resolved = resolveIndex(rawIndex);
      if (resolved === selectedIndexRef.current) return resolved;

      selectedIndexRef.current = resolved;
      setSelectedIndex(resolved);

      if (notify && onChange && data[resolved] !== undefined) {
        onChange(data[resolved], resolved);
      }
      return resolved;
    },
    [data, onChange, resolveIndex],
  );

  const cancelSnapAnimation = useCallback(() => {
    snapTokenRef.current += 1;
    if (snapFrameRef.current !== null) {
      cancelAnimationFrame(snapFrameRef.current);
      snapFrameRef.current = null;
    }
    isProgrammaticScrollRef.current = false;
  }, []);

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const animateToIndex = useCallback(
    (index: number, token: number): Promise<void> => {
      const el = scrollRef.current;
      if (!el || data.length === 0) return Promise.resolve();

      const targetTop = clampIndex(index, data.length) * itemHeight;
      const startTop = el.scrollTop;
      const distance = Math.abs(targetTop - startTop);

      if (distance <= SNAP_SKIP_PX) {
        el.scrollTop = targetTop;
        return Promise.resolve();
      }

      cancelSnapAnimation();
      const snapToken = snapTokenRef.current;
      isProgrammaticScrollRef.current = true;

      const duration = Math.min(
        MAX_SNAP_MS,
        Math.max(MIN_SNAP_MS, distance * 0.7),
      );
      const startTime = performance.now();

      return new Promise((resolve) => {
        const step = (now: number) => {
          if (snapTokenRef.current !== snapToken || settleTokenRef.current !== token) {
            isProgrammaticScrollRef.current = false;
            snapFrameRef.current = null;
            resolve();
            return;
          }

          const elapsed = now - startTime;
          const t = Math.min(1, elapsed / duration);
          el.scrollTop = startTop + (targetTop - startTop) * easeOutSine(t);

          if (t < 1) {
            snapFrameRef.current = requestAnimationFrame(step);
            return;
          }

          el.scrollTop = targetTop;
          snapFrameRef.current = null;
          isProgrammaticScrollRef.current = false;
          resolve();
        };

        snapFrameRef.current = requestAnimationFrame(step);
      });
    },
    [cancelSnapAnimation, data.length, itemHeight],
  );

  const scrollToIndexInstant = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el || data.length === 0) return;

      cancelSnapAnimation();
      clearSettleTimer();
      isProgrammaticScrollRef.current = true;
      el.scrollTop = clampIndex(index, data.length) * itemHeight;
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    },
    [cancelSnapAnimation, clearSettleTimer, data.length, itemHeight],
  );

  const updateHighlightFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isProgrammaticScrollRef.current) return;
    applySelection(getNearestIndex(el.scrollTop), false);
  }, [applySelection, getNearestIndex]);

  const handleSettle = useCallback(() => {
    if (!isUserInteractingRef.current) return;

    const el = scrollRef.current;
    if (!el) return;

    const token = ++settleTokenRef.current;
    const target = resolveIndex(getNearestIndex(el.scrollTop));
    const targetTop = clampIndex(target, data.length) * itemHeight;
    const offset = Math.abs(el.scrollTop - targetTop);
    const needsSnap = offset > Math.max(SNAP_SKIP_PX, itemHeight * SNAP_MIN_OFFSET_RATIO);

    const finish = () => {
      if (settleTokenRef.current !== token) return;

      isUserInteractingRef.current = false;
      applySelection(target, true);

      const node = scrollRef.current;
      if (node) {
        node.scrollTop = clampIndex(target, data.length) * itemHeight;
      }
    };

    if (!needsSnap) {
      el.scrollTop = targetTop;
      finish();
      return;
    }

    void animateToIndex(target, token).then(finish);
  }, [animateToIndex, applySelection, data.length, getNearestIndex, itemHeight, resolveIndex]);

  const scheduleSettle = useCallback(() => {
    if (!isUserInteractingRef.current) return;

    clearSettleTimer();
    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null;
      handleSettle();
    }, SCROLL_SETTLE_MS);
  }, [clearSettleTimer, handleSettle]);

  const beginUserInteraction = useCallback(() => {
    isUserInteractingRef.current = true;
    settleTokenRef.current += 1;
    clearSettleTimer();
    cancelSnapAnimation();
  }, [cancelSnapAnimation, clearSettleTimer]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;

    if (!isUserInteractingRef.current) {
      isUserInteractingRef.current = true;
    }

    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      updateHighlightFromScroll();
      scheduleSettle();
    });
  }, [scheduleSettle, updateHighlightFromScroll]);

  useEffect(() => {
    if (value === undefined || isUserInteractingRef.current) return;
    const index = indexFromValue(value);
    if (index !== selectedIndexRef.current) {
      selectedIndexRef.current = index;
      setSelectedIndex(index);
      scrollToIndexInstant(index);
    }
  }, [value, data, indexFromValue, scrollToIndexInstant]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const idx = indexFromValue(value);
      selectedIndexRef.current = idx;
      setSelectedIndex(idx);
      scrollToIndexInstant(idx);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  useEffect(
    () => () => {
      clearSettleTimer();
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
      cancelSnapAnimation();
    },
    [cancelSnapAnimation, clearSettleTimer],
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
          scrollSnapType: "none",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
        }}
        onPointerDown={beginUserInteraction}
        onTouchStart={beginUserInteraction}
        onWheel={beginUserInteraction}
        onScroll={handleScroll}
      >
        {data.map((item, index) => {
          const selected = index === selectedIndex;
          const key = getItemKey ? getItemKey(item, index) : index;

          return (
            <div
              key={key}
              className="flex items-center justify-center"
              style={{ height: itemHeight }}
            >
              {renderItem ? (
                renderItem(item, selected, index, selectedIndex)
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
