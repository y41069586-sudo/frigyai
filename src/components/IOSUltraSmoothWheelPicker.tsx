/**
 * Ultra-smooth iOS-like wheel picker — soft magnetic snap, infinite loop, 3D depth.
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

export type IOSUltraSmoothWheelPickerProps<T> = {
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
  /** iOS selection band + fades (off for mint onboarding). */
  showDefaultChrome?: boolean;
  /** Scroll settle delay before snap (ms). */
  snapDelayMs?: number;
};

/** @deprecated Alias for WebWheelPicker compatibility */
export type IOSStyleWheelPickerProps<T> = IOSUltraSmoothWheelPickerProps<T>;

const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_ITEMS = 5;
const INFINITE_COPIES = 5;
const MIDDLE_COPY_INDEX = 2;
const SNAP_DELAY_MS = 140;
const REPOSITION_MS = 450;
const SNAP_EASE = 0.115;
const SNAP_STOP_PX = 0.25;

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

function modIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

export function IOSUltraSmoothWheelPicker<T>({
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
  snapDelayMs = SNAP_DELAY_MS,
}: IOSUltraSmoothWheelPickerProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrame = useRef<number | null>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSnapping = useRef(false);
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
    isSnapping.current = false;
  }, []);

  const smoothSnapTo = useCallback(
    (target: number, onDone?: () => void) => {
      const el = containerRef.current;
      if (!el) return;

      cancelSnapAnimation();
      isSnapping.current = true;

      let current = el.scrollTop;

      const animate = () => {
        const diff = target - current;
        current += diff * SNAP_EASE;

        if (Math.abs(diff) < SNAP_STOP_PX) {
          el.scrollTop = target;
          isSnapping.current = false;
          animationFrame.current = null;
          onDone?.();
          return;
        }

        el.scrollTop = current;
        animationFrame.current = requestAnimationFrame(animate);
      };

      animate();
    },
    [cancelSnapAnimation],
  );

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

    if (isSnapping.current) return;

    const rawIndex = el.scrollTop / itemHeight;
    const nearestIndex = Math.round(rawIndex);
    const clampedPhysical = clampIndex(nearestIndex, extendedItems.length);
    const target = clampedPhysical * itemHeight;

    setSelectedIndex(clampedPhysical);

    const realIndex = resolveLogicalIndex(clampedPhysical);

    smoothSnapTo(target, () => {
      isUserInteractingRef.current = false;
      if (onChange && data[realIndex] !== undefined) {
        onChange(data[realIndex], realIndex);
      }
      if (infinite) {
        setTimeout(() => {
          repositionInfinite(clampedPhysical, realIndex);
        }, REPOSITION_MS);
      }
    });
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

  const handleScroll = useCallback(() => {
    if (isSnapping.current) return;

    if (!isUserInteractingRef.current) {
      isUserInteractingRef.current = true;
    }

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      scrollTimeout.current = null;
      snapToNearest();
    }, snapDelayMs);

    const el = containerRef.current;
    if (!el) return;

    setSelectedIndex(el.scrollTop / itemHeight);
  }, [snapDelayMs, snapToNearest]);

  const beginInteraction = useCallback(() => {
    isUserInteractingRef.current = true;
    cancelSnapAnimation();
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = null;
    }
  }, [cancelSnapAnimation]);

  const scrollToPhysical = useCallback(
    (physicalIndex: number) => {
      const el = containerRef.current;
      if (!el) return;
      cancelSnapAnimation();
      el.scrollTop = physicalIndex * itemHeight;
      setSelectedIndex(physicalIndex);
    },
    [cancelSnapAnimation],
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
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
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
              pointerEvents: "none",
              zIndex: 20,
              backdropFilter: "blur(8px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: centerOffset + 8,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.78), rgba(0,0,0,0.45), transparent)",
              pointerEvents: "none",
              zIndex: 20,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: centerOffset + 8,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.45), transparent)",
              pointerEvents: "none",
              zIndex: 20,
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
          scrollSnapType: "y proximity",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
          willChange: "transform",
          transform: "translate3d(0,0,0)",
          contain: "layout paint style",
        }}
      >
        {extendedItems.map((item, index) => {
          const distance = Math.abs(index - selectedIndex);
          const scale = Math.max(1 - distance * 0.08, 0.72);
          const opacity = Math.max(1 - distance * 0.16, 0.18);
          const rotate = Math.min(distance * 18, 80);
          const translateY = distance * 1.5;
          const isAbove = index < selectedIndex;
          const logicalIndex = infinite ? modIndex(index, segmentLen) : index;
          const selected = logicalIndex === logicalActiveIndex;

          const itemStyle: CSSProperties = {
            height: itemHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scrollSnapAlign: "center",
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
            <div key={key} style={itemStyle}>
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

export default IOSUltraSmoothWheelPicker;
