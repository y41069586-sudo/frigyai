/**
 * iOS-style wheel picker — smooth momentum scroll, 3D row effect, optional infinite loop.
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

export type IOSStyleWheelPickerProps<T> = {
  data: T[];
  value?: T;
  onChange?: (item: T, index: number) => void;
  renderItem?: (item: T, selected: boolean, index: number, activeIndex: number) => ReactNode;
  itemHeight?: number;
  visibleItems?: number;
  className?: string;
  style?: CSSProperties;
  selectionOverlay?: ReactNode | null;
  /** Maps physical scroll index (e.g. middle copy in a duplicated list). */
  normalizeIndex?: (index: number) => number;
  getItemKey?: (item: T, index: number) => string | number;
  momentum?: boolean;
  infinite?: boolean;
  /** Default iOS selection lines + dark fades (off for onboarding mint UI). */
  showDefaultChrome?: boolean;
};

const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_ITEMS = 5;
const INFINITE_COPIES = 5;
const MIDDLE_COPY_INDEX = 2;
const SNAP_DEBOUNCE_MS = 80;
const REPOSITION_MS = 150;

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

function modIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

export function IOSStyleWheelPicker<T>({
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
  momentum = true,
  infinite = false,
  showDefaultChrome = false,
}: IOSStyleWheelPickerProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserInteractingRef = useRef(false);
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const resolveLogicalIndex = useCallback(
    (physicalIndex: number) => {
      if (segmentLen === 0) return 0;
      const normalized = normalizeIndex
        ? normalizeIndex(physicalIndex)
        : infinite
          ? modIndex(physicalIndex, segmentLen)
          : clampIndex(physicalIndex, segmentLen);
      return clampIndex(normalized, segmentLen);
    },
    [infinite, normalizeIndex, segmentLen],
  );

  const scrollToPhysical = useCallback(
    (physicalIndex: number, behavior: ScrollBehavior = "auto") => {
      const el = containerRef.current;
      if (!el) return;
      const top = physicalIndex * itemHeight;
      if (behavior === "auto") {
        isProgrammaticScroll.current = true;
        el.scrollTop = top;
        requestAnimationFrame(() => {
          isProgrammaticScroll.current = false;
        });
      } else {
        isProgrammaticScroll.current = true;
        el.scrollTo({ top, behavior });
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, REPOSITION_MS);
      }
    },
    [itemHeight],
  );

  const repositionInfiniteIfNeeded = useCallback(
    (physicalIndex: number) => {
      if (!infinite || segmentLen === 0) return physicalIndex;

      const logical = modIndex(physicalIndex, segmentLen);
      const needsReposition =
        physicalIndex < segmentLen || physicalIndex > segmentLen * (INFINITE_COPIES - 2);

      if (!needsReposition) return physicalIndex;

      const centered = logical + segmentLen * MIDDLE_COPY_INDEX;
      scrollToPhysical(centered, "auto");
      return centered;
    },
    [infinite, scrollToPhysical, segmentLen],
  );

  const emitChange = useCallback(
    (physicalIndex: number) => {
      if (segmentLen === 0) return;
      const logical = resolveLogicalIndex(physicalIndex);
      if (onChange && data[logical] !== undefined) {
        onChange(data[logical], logical);
      }
    },
    [data, onChange, resolveLogicalIndex, segmentLen],
  );

  const snapToNearest = useCallback(() => {
    const el = containerRef.current;
    if (!el || segmentLen === 0) return;

    const nearestIndex = Math.round(el.scrollTop / itemHeight);
    const clampedPhysical = clampIndex(nearestIndex, extendedItems.length);

    isProgrammaticScroll.current = true;
    el.scrollTo({
      top: clampedPhysical * itemHeight,
      behavior: "smooth",
    });

    setSelectedIndex(clampedPhysical);

    const finalPhysical = repositionInfiniteIfNeeded(clampedPhysical);
    setSelectedIndex(finalPhysical);

    isUserInteractingRef.current = false;
    emitChange(finalPhysical);

    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, REPOSITION_MS);
  }, [emitChange, extendedItems.length, itemHeight, repositionInfiniteIfNeeded, segmentLen]);

  const updateHighlightFromScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || isProgrammaticScroll.current) return;

    const nearest = Math.round(el.scrollTop / itemHeight);
    const clamped = clampIndex(nearest, extendedItems.length);
    if (clamped !== selectedIndexRef.current) {
      selectedIndexRef.current = clamped;
      setSelectedIndex(clamped);
    }
  }, [extendedItems.length, itemHeight]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;

    if (!isUserInteractingRef.current) {
      isUserInteractingRef.current = true;
    }

    updateHighlightFromScroll();

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(
      () => {
        scrollTimeout.current = null;
        snapToNearest();
      },
      momentum ? SNAP_DEBOUNCE_MS : 0,
    );
  }, [momentum, snapToNearest, updateHighlightFromScroll]);

  const beginInteraction = useCallback(() => {
    isUserInteractingRef.current = true;
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    const idx = indexFromValue(value);
    selectedIndexRef.current = idx;
    setSelectedIndex(idx);
    requestAnimationFrame(() => scrollToPhysical(idx, "auto"));
  }, [indexFromValue, scrollToPhysical, value]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const idx = indexFromValue(value);
      scrollToPhysical(idx, "auto");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  useEffect(
    () => () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    },
    [],
  );

  const logicalActiveIndex = resolveLogicalIndex(selectedIndex);

  const containerStyle: CSSProperties = useMemo(
    () => ({
      position: "relative",
      height: pickerHeight,
      overflow: "hidden",
      width: "100%",
      touchAction: "pan-y",
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
              pointerEvents: "none",
              borderTop: "1px solid rgba(255,255,255,0.15)",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: centerOffset,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: centerOffset,
              background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
              pointerEvents: "none",
              zIndex: 10,
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
        className="h-full overflow-y-scroll scrollbar-hide select-none"
        style={{
          overflowX: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingTop: centerOffset,
          paddingBottom: centerOffset,
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          WebkitMaskImage: showDefaultChrome
            ? "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)"
            : undefined,
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      >
        {extendedItems.map((item, index) => {
          const distance = Math.abs(index - selectedIndex);
          const scale = Math.max(1 - distance * 0.08, 0.75);
          const opacity = Math.max(1 - distance * 0.15, 0.2);
          const rotate = Math.min(distance * 18, 75);
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
            `,
            opacity: renderItem ? 1 : opacity,
            transition: "transform 120ms linear, opacity 120ms linear",
            backfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
            WebkitFontSmoothing: "antialiased",
            contain: "layout paint style",
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

export default IOSStyleWheelPicker;
