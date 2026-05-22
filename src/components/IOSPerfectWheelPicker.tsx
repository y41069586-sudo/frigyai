/**
 * iOS-perfect wheel picker — momentum-friendly, soft magnetic lock, UIDatePicker feel.
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

export type IOSPerfectWheelPickerProps<T> = {
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

export type IOSUltraSmoothWheelPickerProps<T> = IOSPerfectWheelPickerProps<T>;
export type IOSStyleWheelPickerProps<T> = IOSPerfectWheelPickerProps<T>;

const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_ITEMS = 5;
const INFINITE_COPIES = 5;
const MIDDLE_COPY_INDEX = 2;
const TOUCH_SETTLE_MS = 260;
const DESKTOP_SETTLE_MS = 180;
const REPOSITION_MS = 500;
const SNAP_EASE = 0.095;
const SNAP_STOP_PX = 0.15;

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

function modIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

export function IOSPerfectWheelPicker<T>({
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
  infinite = true,
  showDefaultChrome = false,
}: IOSPerfectWheelPickerProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrame = useRef<number | null>(null);
  const scrollEndTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const isUserInteractingRef = useRef(false);

  const segmentLen = data.length;

  const extendedItems = useMemo(() => {
    if (!infinite || segmentLen === 0) return data;
    return Array.from({ length: INFINITE_COPIES }, () => data).flat();
  }, [data, infinite, segmentLen]);

  const centerOffset = Math.floor(visibleItems / 2) * itemHeight;
  const pickerHeight = itemHeight * visibleItems;

  const indexFromValue = useCallback(
    (v: T | undefined) => {
      if (v === undefined || segmentLen === 0) return 0;
      const found = data.findIndex((x) => x === v);
      const base = found >= 0 ? found : 0;
      return infinite ? base + segmentLen * MIDDLE_COPY_INDEX : base;
    },
    [data, infinite, segmentLen],
  );

  const [selectedIndex, setSelectedIndex] = useState(() => indexFromValue(value));

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

  const cancelSnapAnimation = useCallback(() => {
    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  }, []);

  const smoothSnapTo = useCallback((target: number) => {
    const el = containerRef.current;
    if (!el) return;

    cancelSnapAnimation();

    let current = el.scrollTop;

    const animate = () => {
      const diff = target - current;
      current += diff * SNAP_EASE;

      if (Math.abs(diff) < SNAP_STOP_PX) {
        el.scrollTop = target;
        animationFrame.current = null;
        return;
      }

      el.scrollTop = current;
      animationFrame.current = requestAnimationFrame(animate);
    };

    animate();
  }, [cancelSnapAnimation]);

  const repositionInfinite = useCallback(
    (nearestIndex: number, realIndex: number) => {
      const el = containerRef.current;
      if (!el || !infinite || segmentLen === 0) return;

      const total = segmentLen;
      if (nearestIndex < total || nearestIndex > total * 4) {
        const normalized = realIndex + total * MIDDLE_COPY_INDEX;
        el.scrollTop = normalized * itemHeight;
        setSelectedIndex(normalized);
      }
    },
    [infinite, itemHeight, segmentLen],
  );

  const snapToNearest = useCallback(() => {
    const el = containerRef.current;
    if (!el || segmentLen === 0) return;

    const rawIndex = el.scrollTop / itemHeight;
    const nearestIndex = Math.round(rawIndex);
    const clampedPhysical = clampIndex(nearestIndex, extendedItems.length);
    const target = clampedPhysical * itemHeight;

    smoothSnapTo(target);
    setSelectedIndex(clampedPhysical);

    const realIndex = resolveLogicalIndex(clampedPhysical);
    isUserInteractingRef.current = false;

    if (onChange && data[realIndex] !== undefined) {
      onChange(data[realIndex], realIndex);
    }

    if (infinite) {
      setTimeout(() => {
        repositionInfinite(clampedPhysical, realIndex);
      }, REPOSITION_MS);
    }
  }, [
    data,
    extendedItems.length,
    infinite,
    itemHeight,
    onChange,
    repositionInfinite,
    resolveLogicalIndex,
    segmentLen,
    smoothSnapTo,
  ]);

  const scheduleSnapAfterSettle = useCallback(
    (delayMs: number) => {
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current);
      }
      scrollEndTimeout.current = setTimeout(() => {
        scrollEndTimeout.current = null;
        snapToNearest();
      }, delayMs);
    },
    [snapToNearest],
  );

  const handleInteractionStart = useCallback(() => {
    isDragging.current = true;
    isUserInteractingRef.current = true;
    cancelSnapAnimation();
    if (scrollEndTimeout.current) {
      clearTimeout(scrollEndTimeout.current);
      scrollEndTimeout.current = null;
    }
  }, [cancelSnapAnimation]);

  const handleInteractionEnd = useCallback(() => {
    isDragging.current = false;
    scheduleSnapAfterSettle(TOUCH_SETTLE_MS);
  }, [scheduleSnapAfterSettle]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    setSelectedIndex(el.scrollTop / itemHeight);

    if (!isDragging.current) {
      scheduleSnapAfterSettle(DESKTOP_SETTLE_MS);
    }
  }, [scheduleSnapAfterSettle]);

  const scrollToPhysical = useCallback(
    (physicalIndex: number) => {
      const el = containerRef.current;
      if (!el) return;
      cancelSnapAnimation();
      el.scrollTop = physicalIndex * itemHeight;
      setSelectedIndex(physicalIndex);
    },
    [cancelSnapAnimation, itemHeight],
  );

  useEffect(() => {
    if (isUserInteractingRef.current) return;
    const idx = indexFromValue(value);
    setSelectedIndex(idx);
    requestAnimationFrame(() => scrollToPhysical(idx));
  }, [indexFromValue, scrollToPhysical, value]);

  useEffect(() => {
    requestAnimationFrame(() => scrollToPhysical(indexFromValue(value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  useEffect(
    () => () => {
      cancelSnapAnimation();
      if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
    },
    [cancelSnapAnimation],
  );

  const logicalActiveIndex = resolveLogicalIndex(selectedIndex);

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
      transform: "translateZ(0)",
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
              backdropFilter: "blur(10px)",
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
              height: centerOffset + 10,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.82), rgba(0,0,0,0.45), transparent)",
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
              height: centerOffset + 10,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.45), transparent)",
              zIndex: 20,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      <div
        ref={containerRef}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onTouchCancel={handleInteractionEnd}
        onPointerDown={handleInteractionStart}
        onPointerUp={handleInteractionEnd}
        onPointerCancel={handleInteractionEnd}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll scrollbar-hide"
        style={{
          overflowX: "hidden",
          paddingTop: centerOffset,
          paddingBottom: centerOffset,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
          transform: "translate3d(0,0,0)",
          willChange: "transform",
          contain: "layout paint style",
        }}
      >
        {extendedItems.map((item, index) => {
          const distance = Math.abs(index - selectedIndex);
          const scale = Math.max(1 - distance * 0.08, 0.72);
          const opacity = Math.max(1 - distance * 0.16, 0.15);
          const rotate = Math.min(distance * 18, 80);
          const translateY = distance * 1.5;
          const isAbove = index < selectedIndex;
          const logicalIndex = infinite ? modIndex(index, segmentLen) : index;
          const selected = logicalIndex === logicalActiveIndex;

          const rowStyle: CSSProperties = {
            height: itemHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `
              perspective(1000px)
              rotateX(${isAbove ? rotate : -rotate}deg)
              scale(${scale})
              translateY(${isAbove ? translateY : -translateY}px)
            `,
            opacity: renderItem ? 1 : opacity,
            transition:
              "transform 180ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms cubic-bezier(0.22, 1, 0.36, 1)",
            backfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
            WebkitFontSmoothing: "antialiased",
            willChange: "transform",
            contain: "layout paint style",
            pointerEvents: "none",
          };

          const key = getItemKey
            ? getItemKey(item, index)
            : infinite
              ? `wheel-${index}-${logicalIndex}`
              : logicalIndex;

          return (
            <div key={key} style={rowStyle}>
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

export default IOSPerfectWheelPicker;
