import { describe, expect, it } from "vitest";
import {
  clampIndex,
  getVirtualWindow,
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

  it("getVirtualWindow spacers", () => {
    const w = getVirtualWindow(50, 100, 46, 2, 2);
    expect(w.end).toBeGreaterThan(w.start);
    expect(w.topSpacer).toBe(w.start * 46);
    expect(w.bottomSpacer).toBe((100 - w.end) * 46);
  });
});
