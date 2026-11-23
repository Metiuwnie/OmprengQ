import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "../schemas/index.js";
import { createEmptyNutrientTotals, sumNutrientTotals } from "./index.js";

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
