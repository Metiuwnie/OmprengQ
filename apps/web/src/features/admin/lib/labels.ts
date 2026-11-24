import type { Allergen, FoodCategory, Level } from "@mbg/shared";

export const LEVEL_LABELS: Record<Level, string> = {
  sd_low: "SD Kelas 1–3",
  sd_high: "SD Kelas 4–6",
  smp: "SMP",
  sma: "SMA / SMK",
};

export const LEVEL_SHORT_LABELS: Record<Level, string> = {
  sd_low: "SD 1–3",
  sd_high: "SD 4–6",
  smp: "SMP",
  sma: "SMA",
};

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  telur: "Telur",
  ikan: "Ikan",
  kacang: "Kacang",
  susu: "Susu",
  udang: "Udang",
  gluten: "Gluten",
  kedelai: "Kedelai",
};

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  karbohidrat: "Karbohidrat",
  lauk_hewani: "Lauk Hewani",
  lauk_nabati: "Lauk Nabati",
  sayur: "Sayur",
  buah: "Buah",
  susu: "Susu",
  lainnya: "Lainnya",
};

export function getFoodCategoryLabel(category: string): string {
  return FOOD_CATEGORY_LABELS[category as FoodCategory] ?? category;
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a local Date into `YYYY-MM-DD`. */
export function toIsoDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Parse `YYYY-MM-DD` as UTC midnight for deterministic calendar arithmetic. */
function parseUtcDate(iso: string): Date {
  const [y = 2026, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function utcDateToIso(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Shift `YYYY-MM-DD` by `days` (positive or negative). */
export function shiftIsoDate(iso: string, days: number): string {
  const d = parseUtcDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDateToIso(d);
}

/** Format `YYYY-MM-DD` as `"Selasa, 24 Nov 2026"`. */
export function formatDateId(iso: string, fullMonth = false): string {
  const d = parseUtcDate(iso);
  const dayName = DAY_NAMES[d.getUTCDay()] ?? "";
  const monthName = (fullMonth ? MONTH_NAMES : MONTH_SHORT)[d.getUTCMonth()] ?? "";
  return `${dayName}, ${d.getUTCDate()} ${monthName} ${d.getUTCFullYear()}`;
}

export function formatMonthYearId(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex] ?? ""} ${year}`;
}

/** Return the 7 Monday-to-Sunday `YYYY-MM-DD` dates containing `anchorIso`. */
export function getWeekDates(anchorIso: string): string[] {
  const d = parseUtcDate(anchorIso);
  const mondayOffset = (d.getUTCDay() + 6) % 7;
  const monday = shiftIsoDate(anchorIso, -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => shiftIsoDate(monday, i));
}

export interface MonthCell {
  iso: string;
  dayNumber: number;
  inMonth: boolean;
}

/** Return 35 or 42 Monday-first calendar cells for `(year, monthIndex)` where `monthIndex` is 0..11. */
export function getMonthCalendarCells(year: number, monthIndex: number): MonthCell[] {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const leading = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;
  const gridStart = shiftIsoDate(utcDateToIso(first), -leading);

  return Array.from({ length: totalCells }, (_, idx) => {
    const iso = shiftIsoDate(gridStart, idx);
    const d = parseUtcDate(iso);
    return {
      iso,
      dayNumber: d.getUTCDate(),
      inMonth: d.getUTCFullYear() === year && d.getUTCMonth() === monthIndex,
    };
  });
}
