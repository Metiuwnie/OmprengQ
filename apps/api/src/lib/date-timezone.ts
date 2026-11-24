const FALLBACK_TIMEZONE = "Asia/Jakarta";

/** Return `YYYY-MM-DD` for `now` in the school's IANA timezone (server-side, never client clock). */
export function getTodayInTimezone(timezone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: FALLBACK_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
}

function parseIsoUtc(isoDate: string): Date {
  const [y = 2026, m = 1, d = 1] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatIsoUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Shift a `YYYY-MM-DD` string by `days`. */
export function addDaysIso(isoDate: string, days: number): string {
  const d = parseIsoUtc(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return formatIsoUtc(d);
}

/** Return the Monday `YYYY-MM-DD` of the week containing `isoDate`. */
export function getMondayOfWeek(isoDate: string): string {
  const d = parseIsoUtc(isoDate);
  const mondayOffset = (d.getUTCDay() + 6) % 7;
  return addDaysIso(isoDate, -mondayOffset);
}
