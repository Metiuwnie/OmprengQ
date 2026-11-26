import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatLastUpdatedLabel,
  isIosSafari,
  isMenuDateStale,
  toLocalIsoDate,
} from "./pwa-helpers";

describe("PWA offline-first helpers & Workbox config (M7)", () => {
  it("formats local ISO date and detects stale menu dates", () => {
    const now = new Date(2026, 10, 26, 10, 0, 0); // 2026-11-26 local
    expect(toLocalIsoDate(now)).toBe("2026-11-26");
    expect(isMenuDateStale("2026-11-25", now)).toBe(true);
    expect(isMenuDateStale("2026-11-26", now)).toBe(false);
    expect(isMenuDateStale("2026-11-27", now)).toBe(false);
    expect(isMenuDateStale(null, now)).toBe(false);
    expect(isMenuDateStale("invalid", now)).toBe(false);
  });

  it("formats last updated timestamp cleanly", () => {
    expect(formatLastUpdatedLabel(null)).toBe("baru saja");
    const formatted = formatLastUpdatedLabel(new Date(2026, 10, 26, 8, 30, 0).getTime());
    expect(formatted.length).toBeGreaterThanOrEqual(4);
  });

  it("detects iOS Safari only when not standalone", () => {
    const iosSafariUa =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    const iosChromeUa =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1";
    const androidUa =
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

    expect(isIosSafari(iosSafariUa, false)).toBe(true);
    expect(isIosSafari(iosSafariUa, true)).toBe(false);
    expect(isIosSafari(iosChromeUa, false)).toBe(false);
    expect(isIosSafari(androidUa, false)).toBe(false);
  });

  it("configures vite-plugin-pwa with prompt update, SWR public cache, and NetworkOnly admin/auth", () => {
    const viteConfig = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");
    expect(viteConfig).toContain('registerType: "prompt"');
    expect(viteConfig).toContain("navigateFallbackDenylist");
    expect(viteConfig).toContain('handler: "NetworkOnly"');
    expect(viteConfig).toContain('handler: "StaleWhileRevalidate"');
    expect(viteConfig).toContain('handler: "CacheFirst"');
    expect(viteConfig).toContain("admin-*.js");
  });
});
