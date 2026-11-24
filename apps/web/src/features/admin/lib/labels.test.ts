import { describe, expect, it } from "vitest";
import {
  formatDateId,
  getMonthCalendarCells,
  getWeekDates,
  shiftIsoDate,
} from "./labels";

describe("admin calendar & label helpers", () => {
  it("shifts ISO dates across month boundaries", () => {
    expect(shiftIsoDate("2026-11-30", 1)).toBe("2026-12-01");
    expect(shiftIsoDate("2026-11-01", -1)).toBe("2026-10-31");
  });

  it("formats Indonesian dates cleanly", () => {
    expect(formatDateId("2026-11-24")).toBe("Selasa, 24 Nov 2026");
    expect(formatDateId("2026-11-24", true)).toBe("Selasa, 24 November 2026");
  });

  it("computes Monday-to-Sunday week dates", () => {
    const week = getWeekDates("2026-11-24"); // Tuesday
    expect(week).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ]);
  });

  it("builds Monday-first month cells covering all days in month", () => {
    const cells = getMonthCalendarCells(2026, 10); // Nov 2026 (starts Sunday -> 6 leading days)
    expect(cells.length).toBe(42);
    expect(cells[0]?.iso).toBe("2026-10-26");
    expect(cells.filter((c) => c.inMonth)).toHaveLength(30);
  });
});
