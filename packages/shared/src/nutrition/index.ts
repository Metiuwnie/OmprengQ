import {
  ALLERGENS,
  NUTRIENT_KEYS,
  type Allergen,
  type NutrientTotals,
} from "../constants/index.js";

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

/** Minimal food shape needed to compute portion nutrition (values per 100 g). */
export interface PortionFoodLike extends NutrientTotals {
  allergens: readonly Allergen[];
}

/** One ingredient line of a portion: cooked, ready-to-eat weight in grams. */
export interface PortionItemInput {
  foodId: string;
  grams: number;
}

/**
 * Total nutrition of one portion. Convention: `grams` is the cooked / ready-to-eat weight,
 * so each nutrient is `(grams / 100) * valuePer100g`. Unknown foods are skipped (safe, no throw).
 * Values are not rounded here; round only for display.
 */
export function computePortionTotals(
  items: readonly PortionItemInput[],
  foodsById: ReadonlyMap<string, PortionFoodLike> | Readonly<Record<string, PortionFoodLike>>,
): NutrientTotals {
  const lookup = (id: string): PortionFoodLike | undefined =>
    foodsById instanceof Map ? foodsById.get(id) : (foodsById as Record<string, PortionFoodLike>)[id];

  const result = createEmptyNutrientTotals();
  for (const item of items) {
    const food = lookup(item.foodId);
    if (!food) continue;
    const factor = item.grams / 100;
    for (const key of NUTRIENT_KEYS) {
      result[key] += factor * food[key];
    }
  }
  return result;
}

/** Union of allergens across all foods in a portion, deduplicated and ordered by `ALLERGENS`. */
export function collectPortionAllergens(
  items: readonly PortionItemInput[],
  foodsById: ReadonlyMap<string, PortionFoodLike> | Readonly<Record<string, PortionFoodLike>>,
): Allergen[] {
  const lookup = (id: string): PortionFoodLike | undefined =>
    foodsById instanceof Map ? foodsById.get(id) : (foodsById as Record<string, PortionFoodLike>)[id];

  const found = new Set<Allergen>();
  for (const item of items) {
    for (const allergen of lookup(item.foodId)?.allergens ?? []) {
      found.add(allergen);
    }
  }
  return ALLERGENS.filter((a) => found.has(a));
}
