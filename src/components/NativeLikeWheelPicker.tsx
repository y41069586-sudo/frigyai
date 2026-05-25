/**
 * Smooth wheel picker — snap glide, a11y, virtualization, haptics.
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
  type WheelEvent as ReactWheelEvent,
} from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  clampIndex,
  easeOutQuint,
  getVirtualWindow,
  indexOfValue,
  logicalIndexFromPhysical,
  mergeWheelPickerTuning,
  modIndex,
  normalizeInfiniteScrollTop,
  physicalIndexForValue,
  snapDurationForOffset,
  triggerWheelHaptic,
  WHEEL_INFINITE_COPIES,
  type WheelPickerSnapPreset,
  type WheelPickerTuning,
} from "@/lib/wheelPickerUtils";

export type { WheelPickerSnapPreset, WheelPickerTuning } from "@/lib/wheelPickerUtils";

export type NativeLikeWheelPickerProps<T> = {
  data: T[];
  value?: T;
  onChange?: (item: T, index: number) => void;
  /** Committed selection vs center row while scrolling. */
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
  normalizeIndex?: (index: number) => number;
  getItemKey?: (item: T, index: number) => string | number;
  infinite?: boolean;
  showDefaultChrome?: boolean;
  snapPreset?: WheelPickerSnapPreset;
  tuning?: Partial<WheelPickerTuning>;
  enableHaptics?: boolean;
  tapToSelect?: boolean;
  virtualizeThreshold?: number;
  ariaLabel?: string;
  /** Screen reader announcement on settle (e.g. "72 Kilogramm"). */
  formatLiveLabel?: (item: T) => string;
  onSettleStart?: () => void;
};

/** @deprecated Use NativeLikeWheelPickerProps */
export type WebWheelPickerProps<T> = NativeLikeWheelPickerProps<T>;
export type IOSPerfectWheelPickerProps<T> = NativeLikeWheelPickerProps<T>;
export type IOSUltraSmoothWheelPickerProps<T> = NativeLikeWheelPickerProps<T>;
export type IOSStyleWheelPickerProps<T> = NativeLikeWheelPickerProps<T>;

const DEFAULT_ITEM_HEIGHT = 56;
const DEFAULT_VISIBLE_ITEMS = 5;
const DEFAULT_VIRTUALIZE_THRESHOLD = 48;

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
  snapPreset = "default",
  tuning: tuningOverrides,
  enableHaptics = true,
  tapToSelect = true,
  virtualizeThreshold = DEFAULT_VIRTUALIZE_THRESHOLD,
  ariaLabel,
  formatLiveLabel,
  onSettleStart,
}: NativeLikeWheelPickerProps<T>) {
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

  const useVirtual = wheelItems.length > virtualizeThreshold;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<number | null>(null);
  const scrollIndexRafRef = useRef<number | null>(null);
  const pendingScrollIndexRef = useRef(0);
  const lastScrollAt = useRef(performance.now());
  const settleStartedAt = useRef(0);
  const settleGeneration = useRef(0);
  const isUserInteractingRef = useRef(false);
  const isSettlingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const lastHapticLogicalRef = useRef(-1);

  const initialPhysical = physicalIndexForValue(indexOfValue(data, value), segmentLen, infiniteActive);

  const [scrollIndex, setScrollIndex] = useState(initialPhysical);
  const [selectedIndex, setSelectedIndex] = useState(initialPhysical);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const logicalActiveIndex = logicalIndexFromPhysical(
    selectedIndex,
    segmentLen,
    infiniteActive,
    normalizeIndex,
  );
  const centerLogicalIndex = logicalIndexFromPhysical(
    scrollIndex,
    segmentLen,
    infiniteActive,
    normalizeIndex,
  );

  const queueScrollIndex = useCallback((index: number) => {
    pendingScrollIndexRef.current = index;
    if (scrollIndexRafRef.current !== null) return;
    scrollIndexRafRef.current = requestAnimationFrame(() => {
      setScrollIndex(pendingScrollIndexRef.current);
      scrollIndexRafRef.current = null;
    });
  }, []);

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

  const applyNormalizeInfinite = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !infiniteActive || segmentLen === 0) return;
    const next = normalizeInfiniteScrollTop(el.scrollTop, segmentLen, itemHeight);
    if (next !== el.scrollTop) {
      isProgrammaticScrollRef.current = true;
      el.scrollTop = next;
      isProgrammaticScrollRef.current = false;
    }
  }, [infiniteActive, itemHeight, segmentLen]);

  const announce = useCallback(
    (item: T, logical: number) => {
      const text = formatLiveLabel ? formatLiveLabel(item) : String(item);
      setLiveAnnouncement(text);
      if (enableHaptics && logical !== lastHapticLogicalRef.current) {
        triggerWheelHaptic();
        lastHapticLogicalRef.current = logical;
      }
    },
    [enableHaptics, formatLiveLabel],
  );

  const commitSelection = useCallback(
    (snappedIndex: number) => {
      isSettlingRef.current = false;
      setSelectedIndex(snappedIndex);
      queueScrollIndex(snappedIndex);

      const logical = logicalIndexFromPhysical(
        snappedIndex,
        segmentLen,
        infiniteActive,
        normalizeIndex,
      );
      const item = data[logical];
      if (item !== undefined) {
        announce(item, logical);
        onChange?.(item, logical);
      }
    },
    [announce, data, infiniteActive, normalizeIndex, onChange, queueScrollIndex, segmentLen],
  );

  const scrollToPhysicalInstant = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      cancelSnapAnimation();
      isProgrammaticScrollRef.current = true;
      el.scrollTop = index * itemHeight;
      isProgrammaticScrollRef.current = false;
      queueScrollIndex(index);
      setSelectedIndex(index);
    },
    [cancelSnapAnimation, itemHeight, queueScrollIndex],
  );

  const smoothSnapTo = useCallback(
    (targetTop: number, snappedIndex: number) => {
      const el = scrollRef.current;
      if (!el) return;

      const offsetPx = targetTop - el.scrollTop;

      if (Math.abs(offsetPx) < 0.5 || reducedMotion) {
        isProgrammaticScrollRef.current = true;
        el.scrollTop = targetTop;
        isProgrammaticScrollRef.current = false;
        commitSelection(snappedIndex);
        return;
      }

      onSettleStart?.();
      cancelSnapAnimation();
      isSettlingRef.current = true;

      const startTop = el.scrollTop;
      const durationMs = snapDurationForOffset(offsetPx, itemHeight, tuning);
      const startTime = performance.now();

      const animate = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = easeOutQuint(progress);

        isProgrammaticScrollRef.current = true;
        el.scrollTop = startTop + offsetPx * eased;
        isProgrammaticScrollRef.current = false;
        queueScrollIndex(el.scrollTop / itemHeight);

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
    [cancelSnapAnimation, commitSelection, itemHeight, onSettleStart, queueScrollIndex, reducedMotion, tuning],
  );

  const runSettle = useCallback(() => {
    const el = scrollRef.current;
    if (!el || segmentLen === 0) return;

    applyNormalizeInfinite();

    const rawIndex = el.scrollTop / itemHeight;
    const snappedIndex = clampIndex(Math.round(rawIndex), wheelItems.length);
    const targetTop = snappedIndex * itemHeight;

    smoothSnapTo(targetTop, snappedIndex);
  }, [applyNormalizeInfinite, itemHeight, segmentLen, smoothSnapTo, wheelItems.length]);

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

      if (idleFor < tuning.settleDebounceMs && waitingFor < tuning.settleMaxWaitMs) {
        const delay = Math.max(4, tuning.settleDebounceMs - idleFor);
        settleTimeoutRef.current = setTimeout(attempt, delay);
        return;
      }

      runSettle();
    };

    settleTimeoutRef.current = setTimeout(attempt, tuning.settleDebounceMs);
  }, [clearSettleTimer, runSettle, tuning.settleDebounceMs, tuning.settleMaxWaitMs]);

  const snapToPhysicalIndex = useCallback(
    (physicalIndex: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const clamped = clampIndex(physicalIndex, wheelItems.length);
      isUserInteractingRef.current = false;
      settleGeneration.current += 1;
      clearSettleTimer();
      smoothSnapTo(clamped * itemHeight, clamped);
    },
    [clearSettleTimer, itemHeight, smoothSnapTo, wheelItems.length],
  );

  const beginInteraction = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
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
    }, tuning.releaseSettleMs);
  }, [clearSettleTimer, runSettle, tuning.releaseSettleMs]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (isProgrammaticScrollRef.current) {
      queueScrollIndex(el.scrollTop / itemHeight);
      return;
    }

    if (isSettlingRef.current) {
      cancelSnapAnimation();
    }

    lastScrollAt.current = performance.now();
    queueScrollIndex(el.scrollTop / itemHeight);

    if (isUserInteractingRef.current) return;

    scheduleSettle();
  }, [cancelSnapAnimation, queueScrollIndex, scheduleSettle]);

  const handleWheel = useCallback(
    (e: ReactWheelEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      if (!el) return;
      e.preventDefault();
      settleGeneration.current += 1;
      clearSettleTimer();
      cancelSnapAnimation();
      isProgrammaticScrollRef.current = true;
      el.scrollTop += e.deltaY;
      isProgrammaticScrollRef.current = false;
      lastScrollAt.current = performance.now();
      queueScrollIndex(el.scrollTop / itemHeight);
      scheduleSettle();
    },
    [cancelSnapAnimation, clearSettleTimer, queueScrollIndex, scheduleSettle],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.key === "PageUp" || e.key === "PageDown" ? 3 : 1;
      let next = selectedIndex;

      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        next = selectedIndex - step;
      } else if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        next = selectedIndex + step;
      } else if (e.key === "Home") {
        e.preventDefault();
        next = infiniteActive ? segmentLen * 2 : 0;
      } else if (e.key === "End") {
        e.preventDefault();
        next = infiniteActive ? segmentLen * 2 + segmentLen - 1 : wheelItems.length - 1;
      } else {
        return;
      }

      snapToPhysicalIndex(next);
    },
    [infiniteActive, segmentLen, selectedIndex, snapToPhysicalIndex, wheelItems.length],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !("onscrollend" in el)) return;
    const onScrollEnd = () => {
      if (!isUserInteractingRef.current && !isSettlingRef.current) {
        runSettle();
      }
    };
    el.addEventListener("scrollend", onScrollEnd as EventListener);
    return () => el.removeEventListener("scrollend", onScrollEnd as EventListener);
  }, [runSettle]);

  useEffect(() => {
    if (isUserInteractingRef.current || isSettlingRef.current) return;
    const logical = indexOfValue(data, value);
    const idx = physicalIndexForValue(logical, segmentLen, infiniteActive);
    setSelectedIndex(idx);
    queueScrollIndex(idx);
    requestAnimationFrame(() => scrollToPhysicalInstant(idx));
  }, [data, infiniteActive, queueScrollIndex, scrollToPhysicalInstant, segmentLen, value]);

  useEffect(
    () => () => {
      clearSettleTimer();
      cancelSnapAnimation();
      if (scrollIndexRafRef.current !== null) {
        cancelAnimationFrame(scrollIndexRafRef.current);
      }
    },
    [cancelSnapAnimation, clearSettleTimer],
  );

  const virtualWindow = useMemo(
    () =>
      useVirtual
        ? getVirtualWindow(scrollIndex, wheelItems.length, itemHeight, padItems)
        : { start: 0, end: wheelItems.length, topSpacer: 0, bottomSpacer: 0 },
    [itemHeight, padItems, scrollIndex, useVirtual, wheelItems.length],
  );

  const rowsToRender = useMemo(
    () => wheelItems.slice(virtualWindow.start, virtualWindow.end),
    [virtualWindow.end, virtualWindow.start, wheelItems],
  );

  const currentScroll = scrollIndex;

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

  const renderRow = (item: T, index: number) => {
    const distance = Math.abs(index - currentScroll);
    const scale = reducedMotion ? 1 : Math.max(0.8, 1.15 - distance * 0.075);
    const opacity = reducedMotion ? 1 : Math.max(0.3, 1 - distance * 0.175);
    const rotateX = reducedMotion ? 0 : Math.min(distance * 12, 75);
    const isAbove = index < currentScroll;
    const logicalIndex = infiniteActive ? modIndex(index, segmentLen) : index;
    const selected = logicalIndex === logicalActiveIndex;
    const isCenter = logicalIndex === centerLogicalIndex;

    const key = getItemKey
      ? getItemKey(item, index)
      : infiniteActive
        ? `wheel-${index}-${logicalIndex}`
        : logicalIndex;

    const rowBody = renderItem ? (
      renderItem(item, selected, logicalIndex, logicalActiveIndex, isCenter)
    ) : (
      <div
        className={`transition-all duration-200 ${
          isCenter ? "text-xl font-bold text-cyan-300" : "text-lg text-zinc-500"
        }`}
      >
        {String(item)}
      </div>
    );

    const rowStyle: CSSProperties = {
      height: itemHeight,
      transformStyle: reducedMotion ? undefined : "preserve-3d",
    };

    if (tapToSelect) {
      return (
        <button
          key={key}
          type="button"
          className="flex w-full items-center justify-center border-0 bg-transparent p-0 font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#75FBB2]/60"
          style={rowStyle}
          onClick={() => snapToPhysicalIndex(index)}
          tabIndex={-1}
        >
          {reducedMotion ? (
            rowBody
          ) : (
            <motion.div
              animate={{
                scale,
                opacity: renderItem ? 1 : opacity,
                rotateX: isAbove ? rotateX : -rotateX,
              }}
              transition={{ type: "spring", stiffness: 100, damping: 22, mass: 0.85 }}
              style={{ transformStyle: "preserve-3d", width: "100%" }}
            >
              {rowBody}
            </motion.div>
          )}
        </button>
      );
    }

    return (
      <motion.div
        key={key}
        className="flex items-center justify-center font-medium"
        animate={{
          scale,
          opacity: renderItem ? 1 : opacity,
          rotateX: isAbove ? rotateX : -rotateX,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 22, mass: 0.85 }}
        style={{ ...rowStyle, pointerEvents: "none" }}
      >
        {rowBody}
      </motion.div>
    );
  };

  return (
    <div className={className} style={containerStyle}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {selectionOverlay}

      {showDefaultChrome && (
        <motion.div
          className="pointer-events-none absolute inset-x-5 z-20 rounded-[14px] border-2 border-white/20 bg-white/[0.07]"
          style={{
            top: containerHeight / 2 - itemHeight / 2,
            height: itemHeight,
          }}
        />
      )}

      <div
        ref={scrollRef}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onPointerDown={beginInteraction}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
        onPointerLeave={(e) => {
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            endInteraction();
          }
        }}
        className="scrollbar-hide h-full w-full overflow-y-scroll overscroll-contain rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#75FBB2]/50"
        style={{
          perspective: reducedMotion ? undefined : "1000px",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div style={{ paddingTop: verticalPad, paddingBottom: verticalPad }}>
          {useVirtual && virtualWindow.topSpacer > 0 && (
            <div aria-hidden style={{ height: virtualWindow.topSpacer }} />
          )}
          {rowsToRender.map((item, i) => renderRow(item, virtualWindow.start + i))}
          {useVirtual && virtualWindow.bottomSpacer > 0 && (
            <div aria-hidden style={{ height: virtualWindow.bottomSpacer }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default NativeLikeWheelPicker;
