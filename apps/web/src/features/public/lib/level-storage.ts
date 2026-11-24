import type { Level } from "@mbg/shared";

export const LEVEL_STORAGE_KEY = "mbg.level";

export type DisplayMode = "anak" | "remaja";

export function readStoredLevel(allowed: readonly Level[]): Level | null {
  try {
    const raw = window.localStorage.getItem(LEVEL_STORAGE_KEY) as Level | null;
    if (raw && allowed.includes(raw)) return raw;
  } catch {
    // Ignore private-mode storage restrictions.
  }
  return null;
}

export function writeStoredLevel(level: Level): void {
  try {
    window.localStorage.setItem(LEVEL_STORAGE_KEY, level);
  } catch {
    // Ignore private-mode storage restrictions.
  }
}

export function getDefaultDisplayMode(level: Level): DisplayMode {
  return level === "sd_low" || level === "sd_high" ? "anak" : "remaja";
}
