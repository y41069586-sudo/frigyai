import { describe, expect, it } from "vitest";
import { buildWaterSchedule, waterReminderCount } from "./notifications";

describe("waterReminderCount", () => {
  it("returns minimum 2 reminders for the least frequent setting", () => {
    expect(waterReminderCount(4)).toBe(2);
    expect(waterReminderCount(5)).toBe(2);
  });

  it("returns 3 reminders for the default interval", () => {
    expect(waterReminderCount(3)).toBe(3);
  });

  it("returns 4 reminders for the most frequent setting", () => {
    expect(waterReminderCount(2)).toBe(4);
    expect(waterReminderCount(1)).toBe(4);
  });
});

describe("buildWaterSchedule", () => {
  it("returns spaced slots matching the chosen count", () => {
    expect(buildWaterSchedule(4)).toHaveLength(2);
    expect(buildWaterSchedule(3)).toHaveLength(3);
    expect(buildWaterSchedule(2)).toHaveLength(4);
  });

  it("keeps the first slots from the default schedule", () => {
    const twoPerDay = buildWaterSchedule(4);
    expect(twoPerDay[0]).toEqual({ hour: 10, minute: 45 });
    expect(twoPerDay[1]).toEqual({ hour: 14, minute: 15 });
  });
});
