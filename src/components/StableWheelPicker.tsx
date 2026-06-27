import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  getWheelSnapTarget,
  indexOfValue,
  logicalIndexFromPhysical,
  mergeWheelPickerTuning,
  modIndex,
  physicalIndexForValue,
  snapDurationForOffset,
  triggerWheelHaptic,
  WHEEL_INFINITE_COPIES,
  type WheelPickerSnapPreset,
  type WheelPickerTuning,
} from "@/lib/wheelPickerUtils";

export type StableWheelPickerProps<T> = {
  data: T[];
  value?: T;
  onChange?: (item: T, index: number) => void;
  renderItem?: (
    item: T,
    selected: boolean,
    index: number,
    activeIndex: number,
    isCenter: boolean,
  ) => ReactNode;
  itemHeight?: number;
  visibleItems?: number;
  className?: string;
  style?: CSSProperties;
  selectionOverlay?: ReactNode | null;
  showDefaultChrome?: boolean;
  getItemKey?: (item: T, index: number) => string | number;
  infinite?: boolean;
  snapPreset?: WheelPickerSnapPreset;
  tuning?: Partial<WheelPickerTuning>;
  enableHaptics?: boolean;
  tapToSelect?: boolean;
  ariaLabel?: string;
  formatLiveLabel?: (item: T) => string;
  normalizeIndex?: (index: number) => number;
  onSettleStart?: () => void;
};

const DEFAULT_ITEM_HEIGHT = 56;
const DEFAULT_VISIBLE_ITEMS = 5;

export function StableWheelPicker<T>({
  data,
  value,
  onChange,
  renderItem,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  visibleItems = DEFAULT_VISIBLE_ITEMS,
  className,
  style,
  selectionOverlay = null,
  showDefaultChrome = false,
  getItemKey,
  infinite = false,
  snapPreset = "default",
  tuning: tuningOverrides,
  enableHaptics = true,
  tapToSelect = true,
  ariaLabel,
  formatLiveLabel,
  normalizeIndex,
  onSettleStart,
}: StableWheelPickerProps<T>) {
  const reducedMotion = usePrefersReducedMotion();
  const tuning = useMemo(
    () => mergeWheelPickerTuning(snapPreset, tuningOverrides),
    [snapPreset, tuningOverrides],
  );

  const segmentLen = data.length;
  const padItems = Math.floor(visibleItems / 2);
  const containerHeight = itemHeight * visibleItems;
  const verticalPad = padItems * itemHeight;
  const infiniteActive = Boolean(infinite && segmentLen > 1);

  const wheelItems = useMemo(() => {
    if (!infiniteActive || segmentLen === 0) return data;
    return Array.from({ length: WHEEL_INFINITE_COPIES }, () => data).flat();
  }, [data, infiniteActive, segmentLen]);

  const selectedLogicalFromValue = useMemo(
    () => indexOfValue(data, value),
    [data, value],
  );
  const initialPhysical = useMemo(
    () => physicalIndexForValue(selectedLogicalFromValue, segmentLen, infiniteActive),
    [selectedLogicalFromValue, segmentLen, infiniteActive],
  );

  const [scrollIndex, setScrollIndex] = useState(initialPhysical);
  const [selectedPhysicalIndex, setSelectedPhysicalIndex] = useState(initialPhysical);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const lastCommittedLogicalRef = useRef(-1);
  const lastHapticLogicalRef = useRef(-1);

  const activeLogicalIndex = logicalIndexFromPhysical(
    scrollIndex,
    segmentLen,
    infiniteActive,
    normalizeIndex,
  );
  const selectedLogicalIndex = logicalIndexFromPhysical(
    selectedPhysicalIndex,
    segmentLen,
    infiniteActive,
    normalizeIndex,
  );

  const clearTimers = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  }, []);

  const announce = useCallback(
    (logicalIndex: number) => {
      const item = data[logicalIndex];
      if (item === undefined) return;

      setLiveAnnouncement(formatLiveLabel ? formatLiveLabel(item) : String(item));
      if (enableHaptics && logicalIndex !== lastHapticLogicalRef.current) {
        triggerWheelHaptic();
        lastHapticLogicalRef.current = logicalIndex;
      }
    },
    [data, enableHaptics, formatLiveLabel],
  );

  const applyPhysicalIndex = useCallback(
    (physicalIndex: number, emitChange: boolean, behavior: ScrollBehavior = "auto") => {
      const el = scrollRef.current;
      const logicalIndex = logicalIndexFromPhysical(
        physicalIndex,
        segmentLen,
        infiniteActive,
        normalizeIndex,
      );
      const item = data[logicalIndex];

      setScrollIndex(physicalIndex);
      setSelectedPhysicalIndex(physicalIndex);

      if (el) {
        el.scrollTo({
          top: physicalIndex * itemHeight,
          behavior: reducedMotion ? "auto" : behavior,
        });
      }

      if (item !== undefined) {
        announce(logicalIndex);
        if (emitChange && logicalIndex !== lastCommittedLogicalRef.current) {
          lastCommittedLogicalRef.current = logicalIndex;
          onChange?.(item, logicalIndex);
        } else if (!emitChange) {
          lastCommittedLogicalRef.current = logicalIndex;
        }
      }
    },
    [
      announce,
      data,
      infiniteActive,
      itemHeight,
      normalizeIndex,
      onChange,
      reducedMotion,
      segmentLen,
    ],
  );

  const settleToNearest = useCallback(
    (delayMs: number) => {
      if (segmentLen === 0) return;

      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => {
        const el = scrollRef.current;
        if (!el) return;

        const snap = getWheelSnapTarget(
          el.scrollTop,
          itemHeight,
          segmentLen,
          infiniteActive,
          normalizeIndex,
        );
        const duration = reducedMotion
          ? 0
          : snapDurationForOffset(snap.top - el.scrollTop, itemHeight, tuning);

        onSettleStart?.();
        el.scrollTo({
          top: snap.top,
          behavior: reducedMotion ? "auto" : "smooth",
        });

        if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
        commitTimerRef.current = setTimeout(() => {
          applyPhysicalIndex(snap.physicalIndex, true, "auto");
        }, duration + tuning.releaseSettleMs);
      }, delayMs);
    },
    [
      applyPhysicalIndex,
      infiniteActive,
      itemHeight,
      normalizeIndex,
      onSettleStart,
      reducedMotion,
      segmentLen,
      tuning,
    ],
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || segmentLen === 0) return;

    const nextPhysical = Math.round(el.scrollTop / itemHeight);
    setScrollIndex(nextPhysical);
    settleToNearest(tuning.settleDebounceMs);
  }, [itemHeight, segmentLen, settleToNearest, tuning.settleDebounceMs]);

  const handleKeyboardStep = useCallback(
    (delta: number) => {
      if (segmentLen === 0) return;
      const nextLogical = infiniteActive
        ? modIndex(selectedLogicalIndex + delta, segmentLen)
        : Math.max(0, Math.min(segmentLen - 1, selectedLogicalIndex + delta));
      const nextPhysical = physicalIndexForValue(nextLogical, segmentLen, infiniteActive);
      applyPhysicalIndex(nextPhysical, true, reducedMotion ? "auto" : "smooth");
    },
    [
      applyPhysicalIndex,
      infiniteActive,
      reducedMotion,
      segmentLen,
      selectedLogicalIndex,
    ],
  );

  useEffect(() => {
    if (segmentLen === 0) {
      setScrollIndex(0);
      setSelectedPhysicalIndex(0);
      setLiveAnnouncement("");
      lastCommittedLogicalRef.current = -1;
      return;
    }

    const nextPhysical = physicalIndexForValue(selectedLogicalFromValue, segmentLen, infiniteActive);

    if (!mountedRef.current) {
      mountedRef.current = true;
      requestAnimationFrame(() => {
        applyPhysicalIndex(nextPhysical, false, "auto");
      });
      return;
    }

    if (selectedLogicalIndex !== selectedLogicalFromValue) {
      applyPhysicalIndex(nextPhysical, false, "auto");
    }
  }, [
    applyPhysicalIndex,
    infiniteActive,
    segmentLen,
    selectedLogicalFromValue,
    selectedLogicalIndex,
  ]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const overlayNode =
    selectionOverlay !== null ? (
      selectionOverlay
    ) : showDefaultChrome ? (
      <div
        className="pointer-events-none absolute inset-x-0 z-10 rounded-xl border border-primary/15 bg-primary/[0.06]"
        style={{
          top: verticalPad,
          height: itemHeight,
        }}
      />
    ) : null;

  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{
        height: containerHeight,
        ...style,
      }}
    >
      {overlayNode}
      <div
        ref={scrollRef}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        className="relative h-full overflow-y-auto overscroll-contain snap-y snap-mandatory touch-pan-y outline-none"
        style={{
          scrollBehavior: reducedMotion ? "auto" : "smooth",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onScroll={handleScroll}
        onPointerUp={() => settleToNearest(tuning.releaseSettleMs)}
        onPointerCancel={() => settleToNearest(tuning.releaseSettleMs)}
        onKeyDown={(event) => {
          switch (event.key) {
            case "ArrowUp":
              event.preventDefault();
              handleKeyboardStep(-1);
              break;
            case "ArrowDown":
              event.preventDefault();
              handleKeyboardStep(1);
              break;
            case "PageUp":
              event.preventDefault();
              handleKeyboardStep(-5);
              break;
            case "PageDown":
              event.preventDefault();
              handleKeyboardStep(5);
              break;
            case "Home":
              if (!infiniteActive && segmentLen > 0) {
                event.preventDefault();
                applyPhysicalIndex(0, true, reducedMotion ? "auto" : "smooth");
              }
              break;
            case "End":
              if (!infiniteActive && segmentLen > 0) {
                event.preventDefault();
                applyPhysicalIndex(segmentLen - 1, true, reducedMotion ? "auto" : "smooth");
              }
              break;
            default:
              break;
          }
        }}
      >
        <div style={{ height: verticalPad }} />
        {wheelItems.map((item, physicalIndex) => {
          const logicalIndex = infiniteActive ? modIndex(physicalIndex, segmentLen) : physicalIndex;
          const selected = logicalIndex === selectedLogicalIndex;
          const isCenter = logicalIndex === activeLogicalIndex;
          const content = renderItem ? (
            renderItem(item, selected, logicalIndex, activeLogicalIndex, isCenter)
          ) : (
            <div
              className={`flex h-full items-center justify-center ${
                selected || isCenter ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {String(item)}
            </div>
          );

          return (
            <div
              key={
                getItemKey
                  ? `${physicalIndex}-${String(getItemKey(item, logicalIndex))}`
                  : `${physicalIndex}-${logicalIndex}`
              }
              role="option"
              aria-selected={selected}
              className="snap-center"
              style={{
                height: itemHeight,
              }}
              onClick={() => {
                if (!tapToSelect) return;
                applyPhysicalIndex(physicalIndex, true, reducedMotion ? "auto" : "smooth");
              }}
            >
              {content}
            </div>
          );
        })}
        <div style={{ height: verticalPad }} />
      </div>
      <span className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </span>
    </div>
  );
}

export default StableWheelPicker;
