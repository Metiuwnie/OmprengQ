import { describe, expect, it } from "vitest";
import { addDaysIso, getMondayOfWeek, getTodayInTimezone } from "./date-timezone.js";

describe("server timezone date logic", () => {
  it("resolves different Indonesian calendar dates across WIB, WITA, and WIT near midnight", () => {
    // 2026-11-24T15:30:00Z =>
    // WIB  (UTC+7): 22:30 on 2026-11-24
    // WITA (UTC+8): 23:30 on 2026-11-24
    // WIT  (UTC+9): 00:30 on 2026-11-25
    const t1 = new Date("2026-11-24T15:30:00Z");
    expect(getTodayInTimezone("Asia/Jakarta", t1)).toBe("2026-11-24");
    expect(getTodayInTimezone("Asia/Makassar", t1)).toBe("2026-11-24");
    expect(getTodayInTimezone("Asia/Jayapura", t1)).toBe("2026-11-25");

    // 2026-11-24T16:30:00Z =>
    // WIB  (UTC+7): 23:30 on 2026-11-24
    // WITA (UTC+8): 00:30 on 2026-11-25
    // WIT  (UTC+9): 01:30 on 2026-11-25
    const t2 = new Date("2026-11-24T16:30:00Z");
    expect(getTodayInTimezone("Asia/Jakarta", t2)).toBe("2026-11-24");
    expect(getTodayInTimezone("Asia/Makassar", t2)).toBe("2026-11-25");
    expect(getTodayInTimezone("Asia/Jayapura", t2)).toBe("2026-11-25");

    // 2026-11-24T17:30:00Z => all 3 are 2026-11-25
    const t3 = new Date("2026-11-24T17:30:00Z");
    expect(getTodayInTimezone("Asia/Jakarta", t3)).toBe("2026-11-25");
    expect(getTodayInTimezone("Asia/Makassar", t3)).toBe("2026-11-25");
    expect(getTodayInTimezone("Asia/Jayapura", t3)).toBe("2026-11-25");
  });

  it("falls back safely to Asia/Jakarta for invalid timezone strings", () => {
    const t = new Date("2026-11-24T15:30:00Z");
    expect(getTodayInTimezone("Invalid/Zone", t)).toBe("2026-11-24");
  });

  it("computes Monday of the week and shifts dates accurately", () => {
    expect(getMondayOfWeek("2026-11-24")).toBe("2026-11-23");
    expect(addDaysIso("2026-11-23", 6)).toBe("2026-11-29");
  });
});
