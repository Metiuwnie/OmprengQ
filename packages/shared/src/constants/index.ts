export const LEVELS = ["sd_low", "sd_high", "smp", "sma"] as const;
export type Level = (typeof LEVELS)[number];

export const ROLES = ["super_admin", "sppg_admin", "school_admin"] as const;
export type Role = (typeof ROLES)[number];

export const SEXES = ["male", "female"] as const;
export type Sex = (typeof SEXES)[number];

export const FOOD_CATEGORIES = [
  "karbohidrat",
  "lauk_hewani",
  "lauk_nabati",
  "sayur",
  "buah",
  "susu",
  "lainnya",
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const MEAL_SLOTS = ["sarapan", "makan_malam", "selingan"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MENU_STATUSES = ["draft", "published"] as const;
export type MenuStatus = (typeof MENU_STATUSES)[number];

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

export const ACTIVITIES = ["light", "moderate", "active"] as const;
export type ActivityLevel = (typeof ACTIVITIES)[number];

/** Physical Activity Level (PAL) multipliers per 04 §2.2. */
export const PAL: Readonly<Record<ActivityLevel, number>> = {
  light: 1.4,
  moderate: 1.6,
  active: 1.8,
} as const;

export const ACTIVITY_LABELS: Readonly<Record<ActivityLevel, string>> = {
  light: "Ringan",
  moderate: "Sedang",
  active: "Aktif olahraga",
} as const;

/** Default daily energy/nutrient split (%) per 04 §4.1. */
export const MEAL_SPLIT = {
  sarapan: 25,
  mbg: 35,
  selingan: 10,
  makan_malam: 30,
} as const;

/** Normalized weights for remaining non-MBG meal slots (sum = 65). */
export const REMAINING_SLOT_WEIGHTS: Readonly<Record<MealSlot, number>> = {
  sarapan: MEAL_SPLIT.sarapan,
  selingan: MEAL_SPLIT.selingan,
  makan_malam: MEAL_SPLIT.makan_malam,
} as const;

export const REMAINING_SLOT_WEIGHT_SUM =
  MEAL_SPLIT.sarapan + MEAL_SPLIT.selingan + MEAL_SPLIT.makan_malam;

export const EATEN_FRACTIONS = [1, 0.75, 0.5, 0.25] as const;
export type EatenFraction = (typeof EATEN_FRACTIONS)[number];

/** Friendly Indonesian nutrient names for positive UI copy & templates. */
export const NUTRIENT_FRIENDLY_NAMES: Readonly<Record<NutrientKey, string>> = {
  energyKcal: "energi",
  proteinG: "protein",
  fatG: "lemak",
  carbG: "karbohidrat",
  fiberG: "serat",
  ironMg: "zat besi",
} as const;

export const ALLERGEN_LABELS: Readonly<Record<Allergen, string>> = {
  telur: "Telur",
  ikan: "Ikan",
  kacang: "Kacang",
  susu: "Susu",
  udang: "Udang",
  gluten: "Gluten",
  kedelai: "Kedelai",
} as const;

/** Approximate MET values for optional teen activity kcal estimation (04 §6). */
export const ACTIVITY_METS = {
  jalan_santai: 3.5,
  bersepeda_santai: 6,
  bulu_tangkis: 5,
  futsal: 7,
  basket: 6.5,
  berenang: 6,
  lari: 8,
} as const;
export type SportActivity = keyof typeof ACTIVITY_METS;
