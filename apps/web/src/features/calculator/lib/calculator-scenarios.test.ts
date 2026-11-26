import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ChildProfile, HouseholdFoodCatalogItem } from "@mbg/shared";
import { describe, expect, it } from "vitest";
import { computeCalculatorSummary } from "./calculator-logic";

const SAMPLE_CATALOG: readonly HouseholdFoodCatalogItem[] = [
  {
    name: "Tumis kangkung",
    category: "sayur",
    urtLabel: "1 mangkuk kecil",
    grams: 75,
    energyKcal: 45,
    proteinG: 2.2,
    fatG: 2.0,
    carbG: 4.5,
    fiberG: 3.1,
    ironMg: 2.0,
    allergens: [],
    mealSlots: ["makan_malam", "sarapan"],
    priceTier: 1,
  },
  {
    name: "Tempe bacem",
    category: "lauk_nabati",
    urtLabel: "2 potong sedang",
    grams: 50,
    energyKcal: 110,
    proteinG: 9.0,
    fatG: 4.5,
    carbG: 8.0,
    fiberG: 1.8,
    ironMg: 1.5,
    allergens: ["kedelai"],
    mealSlots: ["makan_malam", "sarapan"],
    priceTier: 1,
  },
  {
    name: "Telur dadar",
    category: "lauk_hewani",
    urtLabel: "1 butir",
    grams: 55,
    energyKcal: 95,
    proteinG: 7.0,
    fatG: 7.0,
    carbG: 0.8,
    fiberG: 0,
    ironMg: 1.1,
    allergens: ["telur"],
    mealSlots: ["makan_malam", "sarapan"],
    priceTier: 1,
  },
  {
    name: "Ikan kembung goreng",
    category: "lauk_hewani",
    urtLabel: "1 potong sedang",
    grams: 60,
    energyKcal: 130,
    proteinG: 13.0,
    fatG: 8.0,
    carbG: 0,
    fiberG: 0,
    ironMg: 1.2,
    allergens: ["ikan"],
    mealSlots: ["makan_malam"],
    priceTier: 1,
  },
  {
    name: "Pisang ambon",
    category: "buah",
    urtLabel: "1 buah sedang",
    grams: 100,
    energyKcal: 99,
    proteinG: 1.1,
    fatG: 0.2,
    carbG: 25.8,
    fiberG: 2.6,
    ironMg: 0.4,
    allergens: [],
    mealSlots: ["selingan", "makan_malam", "sarapan"],
    priceTier: 1,
  },
];

const CHILD_BUDI: ChildProfile = {
  id: "child-budi",
  nickname: "Budi",
  age: 8,
  sex: "male",
  weightKg: 25,
  heightCm: 128,
  activity: "moderate",
  allergies: [],
  dislikes: [],
  level: "sd_low",
  createdAt: "2026-11-26T00:00:00.000Z",
  updatedAt: "2026-11-26T00:00:00.000Z",
};

const TEEN_SARI: ChildProfile = {
  id: "teen-sari",
  nickname: "Sari",
  age: 14,
  sex: "female",
  weightKg: 45,
  heightCm: 155,
  activity: "moderate",
  allergies: [],
  dislikes: [],
  level: "smp",
  createdAt: "2026-11-26T00:00:00.000Z",
  updatedAt: "2026-11-26T00:00:00.000Z",
};

describe("M5 calculator scenarios", () => {
  it("recommends sayur and lauk_nabati for dinner in a fiber-deficit scenario", () => {
    const summary = computeCalculatorSummary({
      profile: CHILD_BUDI,
      portionTotals: {
        energyKcal: 480,
        proteinG: 18,
        fatG: 14,
        carbG: 68,
        fiberG: 1.2,
        ironMg: 1.5,
      },
      portionAllergens: [],
      mbgFoodNames: ["Nasi putih", "Ayam goreng"],
      eaten: 1,
      skipAllergenPart: false,
      catalog: SAMPLE_CATALOG,
    });

    const dinnerNames = summary.recommendations.makan_malam.items.map((item) => item.name);
    expect(dinnerNames).toContain("Tumis kangkung");
    expect(dinnerNames).toContain("Tempe bacem");
    expect(summary.recommendations.makan_malam.summaryText).toContain("serat");
  });

  it("activates egg allergy warning, adjusts eaten fraction, and excludes egg from recommendations", () => {
    const eggAllergicChild: ChildProfile = {
      ...CHILD_BUDI,
      allergies: ["telur"],
    };

    const summary = computeCalculatorSummary({
      profile: eggAllergicChild,
      portionTotals: {
        energyKcal: 520,
        proteinG: 20,
        fatG: 16,
        carbG: 72,
        fiberG: 3.0,
        ironMg: 2.0,
      },
      portionAllergens: ["telur"],
      mbgFoodNames: ["Nasi putih", "Telur balado"],
      eaten: 1,
      skipAllergenPart: true,
      catalog: SAMPLE_CATALOG,
    });

    expect(summary.allergenWarnings).toEqual(["telur"]);
    expect(summary.effectiveEaten).toBe(0.75);
    expect(summary.gap.consumed.energyKcal).toBeCloseTo(390, 5);

    for (const slot of ["makan_malam", "sarapan", "selingan"] as const) {
      const names = summary.recommendations[slot].items.map((i) => i.name);
      expect(names).not.toContain("Telur dadar");
    }
    expect(summary.proteinReplacements.some((item) => item.allergens.includes("telur"))).toBe(false);
  });

  it("updates percentages and remaining needs when eaten fraction changes", () => {
    const full = computeCalculatorSummary({
      profile: CHILD_BUDI,
      portionTotals: {
        energyKcal: 520,
        proteinG: 20,
        fatG: 15,
        carbG: 70,
        fiberG: 4,
        ironMg: 2,
      },
      portionAllergens: [],
      mbgFoodNames: ["Nasi putih"],
      eaten: 1,
      skipAllergenPart: false,
      catalog: SAMPLE_CATALOG,
    });

    const half = computeCalculatorSummary({
      profile: CHILD_BUDI,
      portionTotals: {
        energyKcal: 520,
        proteinG: 20,
        fatG: 15,
        carbG: 70,
        fiberG: 4,
        ironMg: 2,
      },
      portionAllergens: [],
      mbgFoodNames: ["Nasi putih"],
      eaten: 0.5,
      skipAllergenPart: false,
      catalog: SAMPLE_CATALOG,
    });

    expect(half.gap.consumed.energyKcal).toBeCloseTo(full.gap.consumed.energyKcal / 2, 5);
    expect(half.gap.percent.energyKcal).toBeLessThan(full.gap.percent.energyKcal);
    expect(half.gap.remaining.energyKcal).toBeGreaterThan(full.gap.remaining.energyKcal);
  });

  it("changes daily targets and gap results when switching child profiles", () => {
    const portionTotals = {
      energyKcal: 520,
      proteinG: 20,
      fatG: 15,
      carbG: 70,
      fiberG: 4,
      ironMg: 2,
    };

    const budiResult = computeCalculatorSummary({
      profile: CHILD_BUDI,
      portionTotals,
      portionAllergens: [],
      mbgFoodNames: [],
      eaten: 1,
      skipAllergenPart: false,
      catalog: SAMPLE_CATALOG,
    });

    const sariResult = computeCalculatorSummary({
      profile: TEEN_SARI,
      portionTotals,
      portionAllergens: [],
      mbgFoodNames: [],
      eaten: 1,
      skipAllergenPart: false,
      catalog: SAMPLE_CATALOG,
    });

    expect(sariResult.targets.energyKcal).toBeGreaterThan(budiResult.targets.energyKcal);
    expect(sariResult.targets.ironMg).toBe(15);
    expect(budiResult.targets.ironMg).toBe(10);
    expect(sariResult.gap.remaining.ironMg).toBeGreaterThan(budiResult.gap.remaining.ironMg);
  });

  it("UX & privacy guard: zero forbidden nutrition labels and zero profile uploads in calculator files", () => {
    const forbidden = new RegExp(
      ["obes" + "itas", "kur" + "us", "gem" + "uk", "stunt" + "ing", "gizi\\s+bur" + "uk", "\\bIM" + "T\\b"].join("|"),
      "i",
    );

    const dirs = [
      resolve(process.cwd(), "src/features/calculator/components"),
      resolve(process.cwd(), "src/features/calculator/hooks"),
      resolve(process.cwd(), "src/features/calculator/lib"),
    ];
    const files = [
      resolve(process.cwd(), "src/routes/calculator.tsx"),
      resolve(process.cwd(), "src/routes/calculator-profiles.tsx"),
    ];

    for (const dir of dirs) {
      for (const entry of readdirSync(dir)) {
        if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
          files.push(resolve(dir, entry));
        }
      }
    }

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(content, `Forbidden word check failed in ${file}`).not.toMatch(forbidden);
      expect(content, `Unexpected POST/PUT/PATCH in ${file}`).not.toMatch(/method:\s*["'](POST|PUT|PATCH)["']/i);
    }
  });
});
