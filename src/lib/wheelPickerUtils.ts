/** Shared wheel-picker math & tuning (unit-testable). */

export const WHEEL_INFINITE_COPIES = 5;
export const WHEEL_MIDDLE_COPY_INDEX = 2;

export type WheelPickerTuning = {
  settleDebounceMs: number;
  settleMaxWaitMs: number;
  releaseSettleMs: number;
  snapMsMin: number;
  snapMsMax: number;
};

export type WheelPickerSnapPreset = "default" | "gentle" | "quick";

export const WHEEL_PICKER_PRESETS: Record<WheelPickerSnapPreset, WheelPickerTuning> = {
  default: {
    settleDebounceMs: 20,
    settleMaxWaitMs: 100,
    releaseSettleMs: 12,
    snapMsMin: 150,
    snapMsMax: 300,
  },
  gentle: {
    settleDebounceMs: 28,
    settleMaxWaitMs: 140,
    releaseSettleMs: 16,
    snapMsMin: 200,
    snapMsMax: 380,
  },
  quick: {
    settleDebounceMs: 12,
    settleMaxWaitMs: 72,
    releaseSettleMs: 8,
    snapMsMin: 100,
    snapMsMax: 220,
  },
};

export function mergeWheelPickerTuning(
  preset: WheelPickerSnapPreset = "default",
  overrides?: Partial<WheelPickerTuning>,
): WheelPickerTuning {
  return { ...WHEEL_PICKER_PRESETS[preset], ...overrides };
}

export function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

export function modIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export function snapDurationForOffset(
  offsetPx: number,
  rowHeight: number,
  tuning: Pick<WheelPickerTuning, "snapMsMin" | "snapMsMax">,
): number {
  const fraction = Math.min(1, Math.abs(offsetPx) / (rowHeight * 0.55));
  return tuning.snapMsMin + (tuning.snapMsMax - tuning.snapMsMin) * fraction;
}

export function indexOfValue<T>(data: T[], value: T | undefined): number {
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

export function logicalIndexFromPhysical(
  physicalIndex: number,
  segmentLen: number,
  infiniteActive: boolean,
  normalizeIndex?: (index: number) => number,
): number {
  const rounded = Math.round(physicalIndex);
  if (segmentLen === 0) return 0;
  const normalized = normalizeIndex
    ? normalizeIndex(rounded)
    : infiniteActive
      ? modIndex(rounded, segmentLen)
      : clampIndex(rounded, segmentLen);
  return clampIndex(normalized, segmentLen);
}

export function physicalIndexForValue(
  logicalIndex: number,
  segmentLen: number,
  infiniteActive: boolean,
): number {
  return infiniteActive ? logicalIndex + segmentLen * WHEEL_MIDDLE_COPY_INDEX : logicalIndex;
}

/** Keep infinite scroll in the middle copy band. */
export function normalizeInfiniteScrollTop(
  scrollTop: number,
  segmentLen: number,
  itemHeight: number,
): number {
  const totalHeight = segmentLen * itemHeight;
  const low = totalHeight * (WHEEL_MIDDLE_COPY_INDEX - 0.5);
  const high = totalHeight * (WHEEL_MIDDLE_COPY_INDEX + 0.5);

  if (scrollTop <= low) return scrollTop + totalHeight;
  if (scrollTop >= high) return scrollTop - totalHeight;
  return scrollTop;
}

export type VirtualWindow = { start: number; end: number; topSpacer: number; bottomSpacer: number };

export function getVirtualWindow(
  scrollIndex: number,
  totalItems: number,
  itemHeight: number,
  padItems: number,
  buffer = 3,
): VirtualWindow {
  if (totalItems === 0) {
    return { start: 0, end: 0, topSpacer: 0, bottomSpacer: 0 };
  }
  const start = Math.max(0, Math.floor(scrollIndex) - padItems - buffer);
  const end = Math.min(totalItems, Math.ceil(scrollIndex) + padItems + buffer + 1);
  return {
    start,
    end,
    topSpacer: start * itemHeight,
    bottomSpacer: (totalItems - end) * itemHeight,
  };
}

export function triggerWheelHaptic(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(5);
    } catch {
      /* ignore */
    }
  }
}
