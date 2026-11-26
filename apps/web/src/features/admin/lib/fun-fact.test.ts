import { describe, expect, it } from "vitest";
import { buildMenuNameFromFoods, generateNutritionFunFact } from "./fun-fact";

describe("admin menu auto fun-fact and name derivation from TKPI foods", () => {
  it("builds deduplicated menu name from TKPI foods", () => {
    expect(
      buildMenuNameFromFoods([
        { name: "Nasi putih" },
        { name: "Ayam goreng" },
        { name: "Nasi putih" },
        { name: "Sayur bayam" },
      ]),
    ).toBe("Nasi putih, Ayam goreng, Sayur bayam");
  });

  it("generates iron & protein highlights from TKPI nutrient values", () => {
    const fact = generateNutritionFunFact([
      {
        name: "Bayam rebus",
        category: "sayur",
        energyKcal: 36,
        proteinG: 2.5,
        fatG: 0.4,
        carbG: 6.5,
        fiberG: 3.5,
        ironMg: 3.9,
      },
      {
        name: "Ayam panggang",
        category: "lauk_hewani",
        energyKcal: 210,
        proteinG: 25,
        fatG: 11,
        carbG: 0,
        fiberG: 0,
        ironMg: 1.5,
      },
    ]);
    expect(fact).toContain("Bayam rebus");
    expect(fact).toContain("zat besi");
    expect(fact).toContain("Ayam panggang");
    expect(fact).toContain("protein");
  });

  it("returns empty string when no foods are selected", () => {
    expect(generateNutritionFunFact([])).toBe("");
  });
});
