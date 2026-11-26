import { describe, expect, it } from "vitest";
import {
  buildWhatsAppMessage,
  buildWhatsAppShareUrl,
  MAX_WA_MESSAGE_LENGTH,
} from "./whatsapp";

describe("WhatsApp message builder (M6)", () => {
  it("matches expected snapshot for a daily menu with nutrition & allergens", () => {
    const message = buildWhatsAppMessage(
      {
        date: "2026-11-24",
        name: "Nasi, Ayam Goreng, Perkedel, Tumis Kangkung",
        totals: {
          energyKcal: 520,
          proteinG: 22,
          fatG: 16,
          carbG: 70,
          fiberG: 4,
          ironMg: 2.4,
        },
        allergens: ["telur"],
      },
      { name: "SDN 01 Demo", slug: "sdn-01-demo" },
      "https://omprengq.example.id",
    );

    expect(message).toMatchInlineSnapshot(`
      "🍱 Menu MBG hari ini - Selasa, 24 November 2026
      Nasi, Ayam Goreng, Perkedel, Tumis Kangkung

      ✨ Sorotan gizi: energi 520 kkal • protein 22.0 g • serat 4.0 g
      ⚠️ Mengandung: telur

      Cek kebutuhan gizi anak & saran menu di rumah:
      https://omprengq.example.id/api/og/s/sdn-01-demo/hari-ini?to=kalkulator"
    `);
  });

  it("safely encodes &, #, and newlines inside wa.me share URL", () => {
    const message = buildWhatsAppMessage(
      {
        date: "2026-11-24",
        name: "Nasi & Sayur #1\nSpesial Anak",
        totals: {
          energyKcal: 480,
          proteinG: 18,
          fatG: 12,
          carbG: 65,
          fiberG: 5,
          ironMg: 2,
        },
        allergens: [],
      },
      { name: "SDN 01 Demo", slug: "sdn-01-demo" },
      "https://omprengq.example.id/",
    );

    const shareUrl = buildWhatsAppShareUrl(message);
    expect(shareUrl.startsWith("https://wa.me/?text=")).toBe(true);
    expect(shareUrl).not.toContain("#1");
    expect(shareUrl).not.toContain("&Sayur");

    const encodedPart = shareUrl.slice("https://wa.me/?text=".length);
    expect(decodeURIComponent(encodedPart)).toBe(message);
  });

  it("caps very long menu names at <= 700 chars while preserving the calculator URL", () => {
    const longMenuName = Array.from({ length: 40 }, (_, idx) => `Menu Panjang Nomor ${idx + 1}`).join(
      ", ",
    );
    const message = buildWhatsAppMessage(
      {
        date: "2026-11-24",
        name: longMenuName,
        totals: {
          energyKcal: 550,
          proteinG: 24,
          fatG: 15,
          carbG: 72,
          fiberG: 6,
          ironMg: 3,
        },
        allergens: ["telur", "ikan"],
      },
      { name: "SMPN 01 Demo", slug: "smpn-01-demo" },
      "https://omprengq.example.id",
    );

    expect(message.length).toBeLessThanOrEqual(MAX_WA_MESSAGE_LENGTH);
    expect(message).toContain("…");
    expect(message).toContain(
      "https://omprengq.example.id/api/og/s/smpn-01-demo/hari-ini?to=kalkulator",
    );
  });

  it("returns a neutral message with calculator link when menu is null", () => {
    const message = buildWhatsAppMessage(
      null,
      { name: "SDN 01 Demo", slug: "sdn-01-demo" },
      "https://omprengq.example.id",
    );

    expect(message).toContain("SDN 01 Demo");
    expect(message).toContain("belum ada jadwal menu MBG");
    expect(message).toContain(
      "https://omprengq.example.id/api/og/s/sdn-01-demo/hari-ini?to=kalkulator",
    );
  });
});
