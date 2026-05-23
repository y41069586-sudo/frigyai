/**
 * Smooth wheel picker — 140ms settle pause, browser smooth scroll snap,
 * optional 3× infinite loop (demo-style), Framer Motion 3D rows.
 */
import { motion } from "framer-motion";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type NativeLikeWheelPickerProps<T> = {
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
  infinite?: boolean;
  showDefaultChrome?: boolean;
};

export type WebWheelPickerProps<T> = NativeLikeWheelPickerProps<T>;
export type IOSPerfectWheelPickerProps<T> = NativeLikeWheelPickerProps<T>;
export type IOSUltraSmoothWheelPickerProps<T> = NativeLikeWheelPickerProps<T>;
export type IOSStyleWheelPickerProps<T> = NativeLikeWheelPickerProps<T>;

const DEFAULT_ITEM_HEIGHT = 50;
const DEFAULT_VISIBLE_ITEMS = 5;
const INFINITE_COPIES = 3;
const MIDDLE_COPY_INDEX = 1;
const SETTLE_DELAY_MS = 140;

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

function modIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

function indexOfValue<T>(data: T[], value: T | undefined): number {
  if (value === undefined || data.length === 0) return 0;
  let found = data.findIndex((x) => x === value);
  if (
    found < 0 &&
    value !== null &&
    typeof value === "object" &&
    "value" in (value as object)
  ) {
    const needle = (value as { value: unknown }).value;
    found = data.findIndex(
      (x) =>
        x !== null &&
        typeof x === "object" &&
        "value" in (x as object) &&
        (x as { value: unknown }).value === needle,
    );
  }
  return found >= 0 ? found : 0;
}

export function NativeLikeWheelPicker<T>({
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
  infinite = false,
  showDefaultChrome = false,
}: NativeLikeWheelPickerProps<T>) {
  const segmentLen = data.length;
  const padItems = Math.floor(visibleItems / 2);
  const containerHeight = itemHeight * visibleItems;
  const verticalPad = padItems * itemHeight;

  const infiniteActive = Boolean(infinite && segmentLen > 1);

  const wheelItems = useMemo(() => {
    if (!infiniteActive || segmentLen === 0) return data;
    return Array.from({ length: INFINITE_COPIES }, () => data).flat();
  }, [data, infiniteActive, segmentLen]);

  const middleStart = infiniteActive ? segmentLen * MIDDLE_COPY_INDEX : 0;

  const logicalIndexFromPhysical = useCallback(
    (physicalIndex: number) => {
      const rounded = Math.round(physicalIndex);
      if (segmentLen === 0) return 0;
      const normalized = normalizeIndex
        ? normalizeIndex(rounded)
        : infiniteActive
          ? modIndex(rounded, segmentLen)
          : clampIndex(rounded, segmentLen);
      return clampIndex(normalized, segmentLen);
    },
    [infiniteActive, normalizeIndex, segmentLen],
  );

  const physicalIndexForValue = useCallback(
    (v: T | undefined) => {
      const logical = indexOfValue(data, v);
      return infiniteActive ? logical + segmentLen * MIDDLE_COPY_INDEX : logical;
    },
    [data, infiniteActive, segmentLen],
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserInteractingRef = useRef(false);

  const [scrollIndex, setScrollIndex] = useState(() => physicalIndexForValue(value));
  const [selectedIndex, setSelectedIndex] = useState(() => physicalIndexForValue(value));

  const logicalActiveIndex = logicalIndexFromPhysical(selectedIndex);

  const clearSettleTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const normalizeScroll = useCallback(() => {
    if (!infiniteActive || segmentLen === 0) return;
    const el = scrollRef.current;
    if (!el) return;

    const totalHeight = segmentLen * itemHeight;

    if (el.scrollTop <= totalHeight * 0.5) {
      el.scrollTop += totalHeight;
    } else if (el.scrollTop >= totalHeight * 2.5) {
      el.scrollTop -= totalHeight;
    }

    const idx = el.scrollTop / itemHeight;
    setScrollIndex(idx);
  }, [infiniteActive, itemHeight, segmentLen]);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "auto") => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: index * itemHeight, behavior });
      setScrollIndex(index);
      setSelectedIndex(index);
    },
    [itemHeight],
  );

  const beginInteraction = useCallback(() => {
    isUserInteractingRef.current = true;
    clearSettleTimer();
  }, [clearSettleTimer]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    normalizeScroll();
    setScrollIndex(el.scrollTop / itemHeight);

    clearSettleTimer();

    timeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;

      const rawIndex = scrollRef.current.scrollTop / itemHeight;
      let snappedIndex = Math.round(rawIndex);

      if (!infiniteActive) {
        snappedIndex = clampIndex(snappedIndex, wheelItems.length);
      } else {
        snappedIndex = clampIndex(snappedIndex, wheelItems.length);
      }

      const snappedPosition = snappedIndex * itemHeight;

      scrollRef.current.scrollTo({
        top: snappedPosition,
        behavior: "smooth",
      });

      setSelectedIndex(snappedIndex);
      setScrollIndex(snappedIndex);
      isUserInteractingRef.current = false;

      const logical = logicalIndexFromPhysical(snappedIndex);
      const item = data[logical];
      if (item !== undefined) {
        onChange?.(item, logical);
      }
    }, SETTLE_DELAY_MS);
  }, [
    clearSettleTimer,
    data,
    infiniteActive,
    itemHeight,
    logicalIndexFromPhysical,
    normalizeScroll,
    onChange,
    segmentLen,
    wheelItems.length,
  ]);

  useEffect(() => {
    if (isUserInteractingRef.current) return;
    const idx = physicalIndexForValue(value);
    setSelectedIndex(idx);
    setScrollIndex(idx);
    requestAnimationFrame(() => scrollToIndex(idx, "auto"));
  }, [physicalIndexForValue, scrollToIndex, value]);

  useEffect(() => () => clearSettleTimer(), [clearSettleTimer]);

  const containerStyle: CSSProperties = useMemo(
    () => ({
      position: "relative",
      height: containerHeight,
      width: "100%",
      touchAction: "pan-y",
      overscrollBehavior: "contain",
      WebkitUserSelect: "none",
      userSelect: "none",
      ...style,
    }),
    [containerHeight, style],
  );

  const currentScroll = scrollIndex;

  return (
    <div className={className} style={containerStyle}>
      {selectionOverlay}

      {showDefaultChrome && (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 rounded-xl border border-cyan-400/40 bg-cyan-400/10 backdrop-blur-sm"
          style={{
            top: containerHeight / 2 - itemHeight / 2,
            height: itemHeight,
          }}
        />
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={beginInteraction}
        onTouchStart={beginInteraction}
        className="h-full w-full overflow-y-scroll overscroll-contain scrollbar-hide rounded-2xl"
        style={{
          perspective: "1000px",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div style={{ paddingTop: verticalPad, paddingBottom: verticalPad }}>
          {wheelItems.map((item, index) => {
            const distance = Math.abs(index - currentScroll);
            const scale = Math.max(0.75, 1 - distance * 0.08);
            const opacity = Math.max(0.2, 1 - distance * 0.18);
            const rotateX = Math.min(distance * 12, 75);
            const isAbove = index < currentScroll;
            const logicalIndex = infiniteActive ? modIndex(index, segmentLen) : index;
            const selected = logicalIndex === logicalActiveIndex;
            const isCenterRow = Math.round(currentScroll) === index;

            const key = getItemKey
              ? getItemKey(item, index)
              : infiniteActive
                ? `wheel-${index}-${logicalIndex}`
                : logicalIndex;

            return (
              <motion.div
                key={key}
                className="flex items-center justify-center font-medium"
                animate={{
                  scale,
                  opacity: renderItem ? 1 : opacity,
                  rotateX: isAbove ? rotateX : -rotateX,
                }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 18,
                }}
                style={{
                  height: itemHeight,
                  transformStyle: "preserve-3d",
                  pointerEvents: "none",
                }}
              >
                {renderItem ? (
                  renderItem(item, selected, logicalIndex, logicalActiveIndex)
                ) : (
                  <div
                    className={`transition-all duration-200 ${
                      isCenterRow
                        ? "text-xl font-bold text-cyan-300"
                        : "text-lg text-zinc-500"
                    }`}
                  >
                    {String(item)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default NativeLikeWheelPicker;
