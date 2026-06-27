import { describe, expect, it } from "vitest";
import {
  clampIndex,
  getWheelPhysicalIndex,
  getWheelSnapTarget,
  getVirtualWindow,
  indexOfValue,
  logicalIndexFromPhysical,
  modIndex,
  normalizeInfiniteScrollTop,
  physicalIndexForValue,
  snapDurationForOffset,
  WHEEL_MIDDLE_COPY_INDEX,
  WHEEL_PICKER_PRESETS,
} from "./wheelPickerUtils";

describe("wheelPickerUtils", () => {
  it("clampIndex bounds", () => {
    expect(clampIndex(-1, 10)).toBe(0);
    expect(clampIndex(9, 10)).toBe(9);
    expect(clampIndex(99, 10)).toBe(9);
  });

  it("modIndex wraps", () => {
    expect(modIndex(-1, 12)).toBe(11);
    expect(modIndex(12, 12)).toBe(0);
  });

  it("logicalIndexFromPhysical with infinite", () => {
    expect(logicalIndexFromPhysical(14, 12, true)).toBe(2);
  });

  it("physicalIndexForValue uses middle copy", () => {
    expect(physicalIndexForValue(3, 12, true)).toBe(3 + 12 * WHEEL_MIDDLE_COPY_INDEX);
  });

  it("normalizeInfiniteScrollTop shifts band", () => {
    const h = 40;
    const seg = 10;
    expect(normalizeInfiniteScrollTop(0, seg, h)).toBe(10 * h);
    expect(normalizeInfiniteScrollTop(50 * h, seg, h)).toBe(40 * h);
  });

  it("snapDurationForOffset scales with distance", () => {
    const t = WHEEL_PICKER_PRESETS.default;
    const near = snapDurationForOffset(2, 46, t);
    const far = snapDurationForOffset(20, 46, t);
    expect(far).toBeGreaterThan(near);
  });

  it("indexOfValue matches option objects by value field", () => {
    const options = [
      { value: 10, label: "10" },
      { value: 20, label: "20" },
    ];
    expect(indexOfValue(options, { value: 20, label: "other label" })).toBe(1);
  });

  it("getWheelPhysicalIndex rounds to the nearest row", () => {
    expect(getWheelPhysicalIndex(0, 46)).toBe(0);
    expect(getWheelPhysicalIndex(22, 46)).toBe(0);
    expect(getWheelPhysicalIndex(24, 46)).toBe(1);
  });

  it("getWheelSnapTarget centers infinite wheels back to middle copy", () => {
    const snap = getWheelSnapTarget(14 * 46, 46, 12, true);
    expect(snap.logicalIndex).toBe(2);
    expect(snap.physicalIndex).toBe(2 + 12 * WHEEL_MIDDLE_COPY_INDEX);
    expect(snap.top).toBe(snap.physicalIndex * 46);
  });

  it("getWheelSnapTarget clamps non-infinite wheels", () => {
    const snap = getWheelSnapTarget(9999, 46, 5, false);
    expect(snap.logicalIndex).toBe(4);
    expect(snap.physicalIndex).toBe(4);
    expect(snap.top).toBe(4 * 46);
  });

  it("getVirtualWindow spacers", () => {
    const w = getVirtualWindow(50, 100, 46, 2, 2);
    expect(w.end).toBeGreaterThan(w.start);
    expect(w.topSpacer).toBe(w.start * 46);
    expect(w.bottomSpacer).toBe((100 - w.end) * 46);
  });
});
