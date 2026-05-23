/**
 * Native-like wheel picker — real momentum, soft magnetic settle, no aggressive snap.
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

const DEFAULT_ITEM_HEIGHT = 48;
const DEFAULT_VISIBLE_ITEMS = 5;
const INFINITE_COPIES = 7;
const MIDDLE_COPY_INDEX = 3;
const SETTLE_DELAY_MS = 180;
const VELOCITY_THRESHOLD = 0.02;
const SETTLE_EASE = 0.065;
const SETTLE_STOP_PX = 0.08;

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

function modIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const settleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollTop = useRef(0);
  const velocity = useRef(0);
  const lastMoveTime = useRef(performance.now());
  const isUserInteractingRef = useRef(false);

  const segmentLen = data.length;

  const infiniteItems = useMemo(() => {
    if (!infinite || segmentLen === 0) return data;
    return Array.from({ length: INFINITE_COPIES }, () => data).flat();
  }, [data, infinite, segmentLen]);

  const pickerHeight = itemHeight * visibleItems;
  const centerOffset = pickerHeight / 2 - itemHeight / 2;

  const indexFromValue = useCallback(
    (v: T | undefined) => {
      if (v === undefined || segmentLen === 0) return 0;
      const found = data.findIndex((x) => x === v);
      const base = found >= 0 ? found : 0;
      return infinite ? base + segmentLen * MIDDLE_COPY_INDEX : base;
    },
    [data, infinite, segmentLen],
  );

  const [activeIndex, setActiveIndex] = useState(() => indexFromValue(value));

  const resolveLogicalIndex = useCallback(
    (physicalIndex: number) => {
      if (segmentLen === 0) return 0;
      const rounded = Math.round(physicalIndex);
      const normalized = normalizeIndex
        ? normalizeIndex(rounded)
        : infinite
          ? modIndex(rounded, segmentLen)
          : clampIndex(rounded, segmentLen);
      return clampIndex(normalized, segmentLen);
    },
    [infinite, normalizeIndex, segmentLen],
  );

  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const clearSettleTimer = useCallback(() => {
    if (settleTimeout.current !== null) {
      clearTimeout(settleTimeout.current);
      settleTimeout.current = null;
    }
  }, []);

  const scrollToPhysical = useCallback(
    (physicalIndex: number) => {
      const el = containerRef.current;
      if (!el) return;
      cancelAnimation();
      el.scrollTop = physicalIndex * itemHeight;
      setActiveIndex(physicalIndex);
      lastScrollTop.current = el.scrollTop;
    },
    [cancelAnimation, itemHeight],
  );

  const settleToNearest = useCallback(() => {
    const el = containerRef.current;
    if (!el || segmentLen === 0) return;

    const current = el.scrollTop / itemHeight;
    const targetIndex = Math.round(current);
    const clampedPhysical = clampIndex(targetIndex, infiniteItems.length);
    const target = clampedPhysical * itemHeight;

    let currentPos = el.scrollTop;
    cancelAnimation();

    const finish = (finalPhysical: number) => {
      const realIndex = resolveLogicalIndex(finalPhysical);
      isUserInteractingRef.current = false;

      if (infinite && segmentLen > 0) {
        const normalized = realIndex + segmentLen * MIDDLE_COPY_INDEX;
        el.scrollTop = normalized * itemHeight;
        setActiveIndex(normalized);
        lastScrollTop.current = el.scrollTop;
        if (onChange && data[realIndex] !== undefined) {
          onChange(data[realIndex], realIndex);
        }
        return;
      }

      setActiveIndex(finalPhysical);
      lastScrollTop.current = el.scrollTop;
      if (onChange && data[realIndex] !== undefined) {
        onChange(data[realIndex], realIndex);
      }
    };

    const animate = () => {
      const diff = target - currentPos;
      currentPos += diff * SETTLE_EASE;

      if (Math.abs(diff) < SETTLE_STOP_PX) {
        el.scrollTop = target;
        animationRef.current = null;
        finish(clampedPhysical);
        return;
      }

      el.scrollTop = currentPos;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [
    cancelAnimation,
    data,
    infinite,
    infiniteItems.length,
    itemHeight,
    onChange,
    resolveLogicalIndex,
    segmentLen,
  ]);

  const scheduleSettle = useCallback(() => {
    clearSettleTimer();

    const trySettle = () => {
      if (Math.abs(velocity.current) > VELOCITY_THRESHOLD) {
        settleTimeout.current = setTimeout(trySettle, 60);
        return;
      }
      settleToNearest();
    };

    settleTimeout.current = setTimeout(trySettle, SETTLE_DELAY_MS);
  }, [clearSettleTimer, settleToNearest]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const now = performance.now();
    const delta = el.scrollTop - lastScrollTop.current;
    const dt = now - lastMoveTime.current;

    velocity.current = delta / (dt || 1);
    lastScrollTop.current = el.scrollTop;
    lastMoveTime.current = now;

    setActiveIndex(el.scrollTop / itemHeight);
    scheduleSettle();
  }, [itemHeight, scheduleSettle]);

  const beginInteraction = useCallback(() => {
    isUserInteractingRef.current = true;
    cancelAnimation();
    clearSettleTimer();
    velocity.current = 0;
    lastMoveTime.current = performance.now();
    lastScrollTop.current = containerRef.current?.scrollTop ?? 0;
  }, [cancelAnimation, clearSettleTimer]);

  useEffect(() => {
    if (isUserInteractingRef.current) return;
    const idx = indexFromValue(value);
    setActiveIndex(idx);
    requestAnimationFrame(() => scrollToPhysical(idx));
  }, [indexFromValue, scrollToPhysical, value]);

  useEffect(() => {
    requestAnimationFrame(() => scrollToPhysical(indexFromValue(value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  useEffect(
    () => () => {
      cancelAnimation();
      clearSettleTimer();
    },
    [cancelAnimation, clearSettleTimer],
  );

  const logicalActiveIndex = resolveLogicalIndex(activeIndex);

  const containerStyle: CSSProperties = useMemo(
    () => ({
      position: "relative",
      height: pickerHeight,
      overflow: "hidden",
      width: "100%",
      touchAction: "pan-y",
      overscrollBehavior: "contain",
      WebkitUserSelect: "none",
      userSelect: "none",
      ...style,
    }),
    [pickerHeight, style],
  );

  return (
    <div className={className} style={containerStyle}>
      {selectionOverlay}

      {showDefaultChrome && (
        <>
          <div
            style={{
              position: "absolute",
              top: centerOffset,
              left: 0,
              right: 0,
              height: itemHeight,
              borderTop: "1px solid rgba(255,255,255,0.12)",
              borderBottom: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(8px)",
              zIndex: 20,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: centerOffset + 20,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.88), transparent)",
              zIndex: 20,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: centerOffset + 20,
              background: "linear-gradient(to top, rgba(0,0,0,0.88), transparent)",
              zIndex: 20,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={beginInteraction}
        onTouchStart={beginInteraction}
        onWheel={beginInteraction}
        className="h-full overflow-y-scroll scrollbar-hide"
        style={{
          overflowX: "hidden",
          paddingTop: centerOffset,
          paddingBottom: centerOffset,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          transform: "translate3d(0,0,0)",
          willChange: "scroll-position",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        }}
      >
        {infiniteItems.map((item, index) => {
          const distance = Math.abs(index - activeIndex);
          const scale = Math.max(1 - distance * 0.08, 0.74);
          const opacity = Math.max(1 - distance * 0.16, 0.12);
          const rotate = Math.min(distance * 16, 75);
          const isAbove = index < activeIndex;
          const logicalIndex = infinite ? modIndex(index, segmentLen) : index;
          const selected = logicalIndex === logicalActiveIndex;

          const key = getItemKey
            ? getItemKey(item, index)
            : infinite
              ? `wheel-${index}-${logicalIndex}`
              : logicalIndex;

          return (
            <div
              key={key}
              style={{
                height: itemHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `
                  perspective(1000px)
                  rotateX(${isAbove ? rotate : -rotate}deg)
                  scale(${scale})
                `,
                opacity: renderItem ? 1 : opacity,
                transition: "transform 120ms linear, opacity 120ms linear",
                backfaceVisibility: "hidden",
                transformStyle: "preserve-3d",
                WebkitFontSmoothing: "antialiased",
                pointerEvents: "none",
              }}
            >
              {renderItem ? (
                renderItem(item, selected, logicalIndex, logicalActiveIndex)
              ) : (
                <span
                  style={{
                    fontSize: selected ? 20 : 17,
                    fontWeight: selected ? 600 : 500,
                    color: selected ? "#1F2937" : "#6B7280",
                    opacity,
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

export default NativeLikeWheelPicker;
