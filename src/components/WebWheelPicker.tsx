/**
 * Web wheel picker — live selection while scrolling, smooth snap on release.
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
const SCROLL_IDLE_MS = 140;
const MIN_SNAP_MS = 200;
const MAX_SNAP_MS = 380;

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
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

  const isProgrammaticScroll = useRef(false);
  const isSettling = useRef(false);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapAnimFrameRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

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
    if (snapAnimFrameRef.current !== null) {
      cancelAnimationFrame(snapAnimFrameRef.current);
      snapAnimFrameRef.current = null;
      isProgrammaticScroll.current = false;
    }
  }, []);

  const animateToIndex = useCallback(
    (index: number): Promise<void> => {
      const el = scrollRef.current;
      if (!el || data.length === 0) return Promise.resolve();

      const targetTop = clampIndex(index, data.length) * itemHeight;
      const startTop = el.scrollTop;
      const distance = Math.abs(targetTop - startTop);

      if (distance < 0.5) {
        el.scrollTop = targetTop;
        return Promise.resolve();
      }

      cancelSnapAnimation();
      isProgrammaticScroll.current = true;

      const duration = Math.min(
        MAX_SNAP_MS,
        Math.max(MIN_SNAP_MS, distance * 0.55),
      );
      const startTime = performance.now();

      return new Promise((resolve) => {
        const step = (now: number) => {
          const elapsed = now - startTime;
          const t = Math.min(1, elapsed / duration);
          el.scrollTop = startTop + (targetTop - startTop) * easeOutCubic(t);

          if (t < 1) {
            snapAnimFrameRef.current = requestAnimationFrame(step);
          } else {
            el.scrollTop = targetTop;
            snapAnimFrameRef.current = null;
            isProgrammaticScroll.current = false;
            resolve();
          }
        };

        snapAnimFrameRef.current = requestAnimationFrame(step);
      });
    },
    [cancelSnapAnimation, data.length, itemHeight],
  );

  const scrollToIndexInstant = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el || data.length === 0) return;

      cancelSnapAnimation();
      isProgrammaticScroll.current = true;
      el.scrollTop = clampIndex(index, data.length) * itemHeight;
      requestAnimationFrame(() => {
        isProgrammaticScroll.current = false;
      });
    },
    [cancelSnapAnimation, data.length, itemHeight],
  );

  const updateSelectionFromScroll = useCallback(
    (notify: boolean) => {
      const el = scrollRef.current;
      if (!el || isProgrammaticScroll.current) return;
      applySelection(getRealIndex(el.scrollTop), notify);
    },
    [applySelection, getRealIndex],
  );

  const handleSettle = useCallback(() => {
    if (isProgrammaticScroll.current || isSettling.current) return;

    const el = scrollRef.current;
    if (!el) return;

    const target = resolveIndex(getRealIndex(el.scrollTop));
    applySelection(target, true);

    isSettling.current = true;
    void animateToIndex(target).finally(() => {
      isSettling.current = false;
      updateSelectionFromScroll(true);
    });
  }, [animateToIndex, applySelection, getRealIndex, resolveIndex, updateSelectionFromScroll]);

  const scheduleSettleCheck = useCallback(() => {
    if (isProgrammaticScroll.current) return;

    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    scrollIdleTimerRef.current = setTimeout(() => {
      scrollIdleTimerRef.current = null;
      handleSettle();
    }, SCROLL_IDLE_MS);
  }, [handleSettle]);

  const onUserScrollStart = useCallback(() => {
    if (scrollIdleTimerRef.current) {
      clearTimeout(scrollIdleTimerRef.current);
      scrollIdleTimerRef.current = null;
    }
    isSettling.current = false;
    cancelSnapAnimation();
  }, [cancelSnapAnimation]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;

    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateSelectionFromScroll(true);
      scheduleSettleCheck();
    });
  }, [scheduleSettleCheck, updateSelectionFromScroll]);

  useEffect(() => {
    if (value === undefined) return;
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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      handleSettle();
    };

    el.addEventListener("scrollend", onScrollEnd, { passive: true });
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [handleSettle]);

  useEffect(
    () => () => {
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      cancelSnapAnimation();
    },
    [cancelSnapAnimation],
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
        onPointerDown={onUserScrollStart}
        onTouchStart={onUserScrollStart}
        onWheel={onUserScrollStart}
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
