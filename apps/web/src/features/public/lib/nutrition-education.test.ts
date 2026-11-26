import { describe, expect, it } from "vitest";
import {
  estimateLunchAkgShare,
  getCategoryBenefit,
  getLevelEducationGuide,
  getPlateGroupChecklist,
} from "./nutrition-education";

describe("nutrition-education helpers", () => {
  it("returns age-appropriate Indonesian benefits per category and mode", () => {
    const childBenefit = getCategoryBenefit("karbohidrat", "anak");
    const teenBenefit = getCategoryBenefit("karbohidrat", "remaja");
    expect(childBenefit).toContain("tenaga");
    expect(teenBenefit).toContain("glukosa");
    expect(getCategoryBenefit("unknown_category", "anak")).toBeTruthy();
  });

  it("estimates lunch share of daily AKG energy per level", () => {
    expect(estimateLunchAkgShare(550, "sd_low")).toBe(33);
    expect(estimateLunchAkgShare(700, "sd_high")).toBe(35);
    expect(estimateLunchAkgShare(0, "smp")).toBe(0);
    expect(estimateLunchAkgShare(5000, "sma")).toBe(100);
  });

  it("checks Isi Piringku groups accurately", () => {
    const checklist = getPlateGroupChecklist(["karbohidrat", "lauk_hewani", "sayur"]);
    expect(checklist.find((item) => item.id === "pokok")?.present).toBe(true);
    expect(checklist.find((item) => item.id === "lauk")?.present).toBe(true);
    expect(checklist.find((item) => item.id === "sayur")?.present).toBe(true);
    expect(checklist.find((item) => item.id === "buah_susu")?.present).toBe(false);
  });

  it("provides magazine-style nutrition facts and quick habits for all 4 levels", () => {
    for (const level of ["sd_low", "sd_high", "smp", "sma"] as const) {
      const guide = getLevelEducationGuide(level);
      expect(guide.audienceLabel.length).toBeGreaterThan(0);
      expect(guide.energyBadge.length).toBeGreaterThan(0);
      expect(guide.magazineTitle.length).toBeGreaterThan(0);
      expect(guide.magazineBody.length).toBeGreaterThan(0);
      expect(guide.quickHabit.length).toBeGreaterThan(0);
    }
    expect(getLevelEducationGuide("sma").audienceLabel).toBe("SMA / SMK");
  });
});
