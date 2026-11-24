import { describe, expect, it } from "vitest";
import {
  buildSchoolTodayUrl,
  clampQrSize,
  generateSchoolQr,
  QR_DEFAULT_SIZE,
  QR_MAX_SIZE,
  QR_MIN_SIZE,
} from "./qr.js";

describe("school QR service", () => {
  it("builds the public today-menu URL", () => {
    expect(buildSchoolTodayUrl("sdn-01-demo", "https://omprengq.example")).toBe(
      "https://omprengq.example/s/sdn-01-demo/hari-ini",
    );
    expect(buildSchoolTodayUrl("sdn-01-demo", "https://omprengq.example/")).toBe(
      "https://omprengq.example/s/sdn-01-demo/hari-ini",
    );
  });

  it("clamps QR size into the allowed range", () => {
    expect(clampQrSize(undefined)).toBe(QR_DEFAULT_SIZE);
    expect(clampQrSize(10)).toBe(QR_MIN_SIZE);
    expect(clampQrSize(99999)).toBe(QR_MAX_SIZE);
    expect(clampQrSize(400)).toBe(400);
  });

  it("generates a PNG buffer with the PNG signature", async () => {
    const png = await generateSchoolQr({ slug: "sdn-01-demo", format: "png", baseUrl: "https://x.test" });
    expect(Buffer.isBuffer(png)).toBe(true);
    expect((png as Buffer).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  it("generates an SVG string", async () => {
    const svg = await generateSchoolQr({ slug: "sdn-01-demo", format: "svg", baseUrl: "https://x.test" });
    expect(typeof svg).toBe("string");
    expect(svg as string).toContain("<svg");
  });
});
