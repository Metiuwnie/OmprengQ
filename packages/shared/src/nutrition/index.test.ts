import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "../schemas/index.js";
import {
  collectPortionAllergens,
  computePortionTotals,
  createEmptyNutrientTotals,
  sumNutrientTotals,
  type PortionFoodLike,
} from "./index.js";

describe("shared nutrition utilities", () => {
  it("creates empty nutrient totals with all keys set to zero", () => {
    expect(createEmptyNutrientTotals()).toEqual({
      energyKcal: 0,
      proteinG: 0,
      fatG: 0,
      carbG: 0,
      fiberG: 0,
      ironMg: 0,
    });
  });

  it("sums multiple nutrient total entries accurately", () => {
    const total = sumNutrientTotals([
      { energyKcal: 200, proteinG: 8.5, fatG: 4, carbG: 32, fiberG: 1.5, ironMg: 0.8 },
      { energyKcal: 320, proteinG: 13.5, fatG: 12, carbG: 38, fiberG: 2.6, ironMg: 1.6 },
    ]);
    expect(total.energyKcal).toBe(520);
    expect(total.proteinG).toBe(22);
    expect(total.ironMg).toBeCloseTo(2.4);
  });

  it("validates health response schema", () => {
    expect(healthResponseSchema.parse({ ok: true })).toEqual({ ok: true });
    expect(() => healthResponseSchema.parse({ ok: false })).toThrow();
  });
});

const foods = new Map<string, PortionFoodLike>([
  [
    "rice",
    { energyKcal: 180, proteinG: 3, fatG: 0.3, carbG: 39.8, fiberG: 0.3, ironMg: 0.4, allergens: [] },
  ],
  [
    "egg",
    { energyKcal: 150, proteinG: 12.4, fatG: 10.8, carbG: 0.7, fiberG: 0, ironMg: 2.7, allergens: ["telur"] },
  ],
  [
    "tempe",
    { energyKcal: 150, proteinG: 15, fatG: 6, carbG: 15, fiberG: 1.4, ironMg: 4, allergens: ["kedelai"] },
  ],
]);

describe("computePortionTotals", () => {
  it("returns zeros for an empty portion", () => {
    expect(computePortionTotals([], foods)).toEqual(createEmptyNutrientTotals());
  });

  it("computes (grams / 100) x per-100g values and matches a manual sample", () => {
    const totals = computePortionTotals(
      [
        { foodId: "rice", grams: 150 },
        { foodId: "egg", grams: 55 },
      ],
      foods,
    );
    // 150g rice: 270 kcal, 4.5 protein; 55g egg: 82.5 kcal, 6.82 protein
    expect(totals.energyKcal).toBeCloseTo(352.5, 3);
    expect(totals.proteinG).toBeCloseTo(11.32, 3);
    expect(totals.ironMg).toBeCloseTo(0.6 + 1.485, 3);
  });

  it("skips unknown foods without throwing", () => {
    const totals = computePortionTotals(
      [
        { foodId: "missing", grams: 100 },
        { foodId: "rice", grams: 100 },
      ],
      foods,
    );
    expect(totals.energyKcal).toBe(180);
  });

  it("accepts a plain record as lookup", () => {
    const record = Object.fromEntries(foods);
    expect(computePortionTotals([{ foodId: "rice", grams: 100 }], record).energyKcal).toBe(180);
  });
});

describe("collectPortionAllergens", () => {
  it("returns the deduplicated union ordered by ALLERGENS", () => {
    const result = collectPortionAllergens(
      [
        { foodId: "tempe", grams: 50 },
        { foodId: "egg", grams: 55 },
        { foodId: "egg", grams: 20 },
        { foodId: "rice", grams: 100 },
      ],
      foods,
    );
    expect(result).toEqual(["telur", "kedelai"]);
  });

  it("returns an empty list when no allergens are present", () => {
    expect(collectPortionAllergens([{ foodId: "rice", grams: 100 }], foods)).toEqual([]);
  });
});
