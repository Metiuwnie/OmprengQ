export const LEVELS = ["sd_low", "sd_high", "smp", "sma"] as const;
export type Level = (typeof LEVELS)[number];

export const ROLES = ["super_admin", "sppg_admin", "school_admin"] as const;
export type Role = (typeof ROLES)[number];

export const ALLERGENS = [
  "telur",
  "ikan",
  "kacang",
  "susu",
  "udang",
  "gluten",
  "kedelai",
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const NUTRIENT_KEYS = [
  "energyKcal",
  "proteinG",
  "fatG",
  "carbG",
  "fiberG",
  "ironMg",
] as const;
export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

export type NutrientTotals = Record<NutrientKey, number>;
