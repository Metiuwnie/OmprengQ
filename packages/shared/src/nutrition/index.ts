import { NUTRIENT_KEYS, type NutrientTotals } from "../constants/index.js";

/** Create a zeroed NutrientTotals object. */
export function createEmptyNutrientTotals(): NutrientTotals {
  return {
    energyKcal: 0,
    proteinG: 0,
    fatG: 0,
    carbG: 0,
    fiberG: 0,
    ironMg: 0,
  };
}

/** Sum an array of NutrientTotals into a single NutrientTotals object. */
export function sumNutrientTotals(items: readonly NutrientTotals[]): NutrientTotals {
  const result = createEmptyNutrientTotals();
  for (const item of items) {
    for (const key of NUTRIENT_KEYS) {
      result[key] += item[key];
    }
  }
  return result;
}
