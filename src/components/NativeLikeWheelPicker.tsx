/**
 * Smooth wheel picker — magnetic glide to the nearest row (motion matters, not delay).
 */
import { motion } from "framer-motion";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
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
const SETTLE_DEBOUNCE_MS = 20;
const SETTLE_MAX_WAIT_MS = 100;
/** Snap right after finger lift (momentum uses short debounce above). */
const RELEASE_SETTLE_MS = 12;
/** Snap glide scales with how far we are from the row center (px). */
const SNAP_MS_MIN = 150;
const SNAP_MS_MAX = 300;

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

function modIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

/** Soft landing on the target row — feels like iOS wheel settle. */
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

function snapDurationForOffset(offsetPx: number, rowHeight: number): number {
  const fraction = Math.min(1, Math.abs(offsetPx) / (rowHeight * 0.55));
  return SNAP_MS_MIN + (SNAP_MS_MAX - SNAP_MS_MIN) * fraction;
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
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScrollAt = useRef(performance.now());
  const settleStartedAt = useRef(0);
  const settleGeneration = useRef(0);
  const isUserInteractingRef = useRef(false);
  const isSettlingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);

  const [scrollIndex, setScrollIndex] = useState(() => physicalIndexForValue(value));
  const [selectedIndex, setSelectedIndex] = useState(() => physicalIndexForValue(value));

  const logicalActiveIndex = logicalIndexFromPhysical(selectedIndex);

  const clearSettleTimer = useCallback(() => {
    if (settleTimeoutRef.current !== null) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
  }, []);

  const cancelSnapAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    isSettlingRef.current = false;
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
  }, [infiniteActive, itemHeight, segmentLen]);

  const scrollToIndexInstant = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      cancelSnapAnimation();
      isProgrammaticScrollRef.current = true;
      el.scrollTop = index * itemHeight;
      isProgrammaticScrollRef.current = false;
      setScrollIndex(index);
      setSelectedIndex(index);
    },
    [cancelSnapAnimation, itemHeight],
  );

  const commitSelection = useCallback(
    (snappedIndex: number) => {
      isSettlingRef.current = false;
      setSelectedIndex(snappedIndex);
      setScrollIndex(snappedIndex);

      const logical = logicalIndexFromPhysical(snappedIndex);
      const item = data[logical];
      if (item !== undefined) {
        onChange?.(item, logical);
      }
    },
    [data, logicalIndexFromPhysical, onChange],
  );

  const smoothSnapTo = useCallback(
    (targetTop: number, snappedIndex: number) => {
      const el = scrollRef.current;
      if (!el) return;

      const offsetPx = targetTop - el.scrollTop;

      if (Math.abs(offsetPx) < 0.5) {
        el.scrollTop = targetTop;
        commitSelection(snappedIndex);
        return;
      }

      cancelSnapAnimation();
      isSettlingRef.current = true;

      const startTop = el.scrollTop;
      const durationMs = snapDurationForOffset(offsetPx, itemHeight);
      const startTime = performance.now();

      const animate = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = easeOutQuint(progress);

        isProgrammaticScrollRef.current = true;
        el.scrollTop = startTop + offsetPx * eased;
        isProgrammaticScrollRef.current = false;
        setScrollIndex(el.scrollTop / itemHeight);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        isProgrammaticScrollRef.current = true;
        el.scrollTop = targetTop;
        isProgrammaticScrollRef.current = false;
        animationRef.current = null;
        commitSelection(snappedIndex);
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [cancelSnapAnimation, commitSelection, itemHeight],
  );

  const runSettle = useCallback(() => {
    const el = scrollRef.current;
    if (!el || segmentLen === 0) return;

    normalizeScroll();

    const rawIndex = el.scrollTop / itemHeight;
    const snappedIndex = clampIndex(Math.round(rawIndex), wheelItems.length);
    const targetTop = snappedIndex * itemHeight;

    smoothSnapTo(targetTop, snappedIndex);
  }, [normalizeScroll, itemHeight, segmentLen, smoothSnapTo, wheelItems.length]);

  const scheduleSettle = useCallback(() => {
    clearSettleTimer();
    const generation = ++settleGeneration.current;
    settleStartedAt.current = performance.now();

    const attempt = () => {
      if (generation !== settleGeneration.current) return;

      if (isUserInteractingRef.current) {
        settleTimeoutRef.current = setTimeout(attempt, 24);
        return;
      }

      const idleFor = performance.now() - lastScrollAt.current;
      const waitingFor = performance.now() - settleStartedAt.current;

      if (idleFor < SETTLE_DEBOUNCE_MS && waitingFor < SETTLE_MAX_WAIT_MS) {
        const delay = Math.max(4, SETTLE_DEBOUNCE_MS - idleFor);
        settleTimeoutRef.current = setTimeout(attempt, delay);
        return;
      }

      runSettle();
    };

    settleTimeoutRef.current = setTimeout(attempt, SETTLE_DEBOUNCE_MS);
  }, [clearSettleTimer, runSettle]);

  const beginInteraction = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isUserInteractingRef.current = true;
      settleGeneration.current += 1;
      clearSettleTimer();
      cancelSnapAnimation();
      if (e.pointerType !== "mouse" && e.currentTarget.setPointerCapture) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    },
    [cancelSnapAnimation, clearSettleTimer],
  );

  const endInteraction = useCallback(() => {
    if (!isUserInteractingRef.current) return;
    isUserInteractingRef.current = false;
    settleGeneration.current += 1;
    clearSettleTimer();
    const generation = settleGeneration.current;
    settleTimeoutRef.current = setTimeout(() => {
      if (generation !== settleGeneration.current) return;
      runSettle();
    }, RELEASE_SETTLE_MS);
  }, [clearSettleTimer, runSettle]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (isProgrammaticScrollRef.current) {
      setScrollIndex(el.scrollTop / itemHeight);
      return;
    }

    if (isSettlingRef.current) {
      cancelSnapAnimation();
    }

    lastScrollAt.current = performance.now();
    setScrollIndex(el.scrollTop / itemHeight);

    if (isUserInteractingRef.current) return;

    scheduleSettle();
  }, [cancelSnapAnimation, scheduleSettle]);

  useEffect(() => {
    if (isUserInteractingRef.current || isSettlingRef.current) return;
    const idx = physicalIndexForValue(value);
    setSelectedIndex(idx);
    setScrollIndex(idx);
    requestAnimationFrame(() => scrollToIndexInstant(idx));
  }, [physicalIndexForValue, scrollToIndexInstant, value]);

  useEffect(
    () => () => {
      clearSettleTimer();
      cancelSnapAnimation();
    },
    [cancelSnapAnimation, clearSettleTimer],
  );

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
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
        onPointerLeave={(e) => {
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            endInteraction();
          }
        }}
        className="scrollbar-hide h-full w-full overflow-y-scroll overscroll-contain rounded-2xl"
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
                  stiffness: 100,
                  damping: 22,
                  mass: 0.85,
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
