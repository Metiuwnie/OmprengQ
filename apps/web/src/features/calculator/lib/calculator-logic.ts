import {
  computeDailyTargets,
  computeGap,
  findMenuAllergenWarnings,
  recommendMeals,
  splitRemainingBySlot,
  type Allergen,
  type ChildProfile,
  type EatenFraction,
  type GapResult,
  type HouseholdFoodCatalogItem,
  type Level,
  type MealSlot,
  type NutrientKey,
  type NutrientTotals,
  type Recommendation,
  type SlotTargets,
  type SportActivity,
} from "@mbg/shared";

export const NUTRIENT_UNITS: Readonly<Record<NutrientKey, string>> = {
  energyKcal: "kkal",
  proteinG: "g",
  fatG: "g",
  carbG: "g",
  fiberG: "g",
  ironMg: "mg",
};

export const PRIMARY_CHILD_NUTRIENTS: readonly NutrientKey[] = [
  "energyKcal",
  "proteinG",
  "fiberG",
  "ironMg",
];

export const EATEN_OPTIONS: ReadonlyArray<{
  value: EatenFraction;
  label: string;
  shortLabel: string;
}> = [
  { value: 1, label: "Habis (1 porsi)", shortLabel: "Habis" },
  { value: 0.75, label: "Tiga perempat", shortLabel: "¾" },
  { value: 0.5, label: "Setengah", shortLabel: "½" },
  { value: 0.25, label: "Seperempat", shortLabel: "¼" },
];

export const MEAL_SLOT_LABELS: Readonly<Record<MealSlot, string>> = {
  makan_malam: "Makan Malam",
  sarapan: "Sarapan",
  selingan: "Selingan",
};

export const SPORT_ACTIVITY_LABELS: Readonly<Record<SportActivity, string>> = {
  jalan_santai: "Jalan santai",
  bersepeda_santai: "Bersepeda santai",
  bulu_tangkis: "Bulu tangkis",
  futsal: "Futsal / Sepak bola",
  basket: "Basket",
  berenang: "Berenang",
  lari: "Lari",
};

/** Suggest default school level from child's age (4-18). */
export function suggestLevelForAge(age: number): Level {
  if (age <= 9) return "sd_low";
  if (age <= 12) return "sd_high";
  if (age <= 15) return "smp";
  return "sma";
}

export interface CalculatorSummaryInput {
  profile: ChildProfile;
  portionTotals: NutrientTotals | null | undefined;
  portionAllergens: readonly Allergen[] | null | undefined;
  mbgFoodNames: readonly string[];
  eaten: EatenFraction;
  skipAllergenPart: boolean;
  catalog: readonly HouseholdFoodCatalogItem[];
}

export interface CalculatorSummary {
  targets: NutrientTotals;
  effectiveEaten: number;
  gap: GapResult;
  slotTargets: SlotTargets;
  allergenWarnings: Allergen[];
  recommendations: Record<MealSlot, Recommendation>;
  proteinReplacements: HouseholdFoodCatalogItem[];
}

function isDislikedFood(item: HouseholdFoodCatalogItem, dislikes: readonly string[]): boolean {
  if (dislikes.length === 0) return false;
  const nameLower = item.name.toLowerCase();
  const categoryLower = item.category.toLowerCase();
  return dislikes.some((raw) => {
    const term = raw.trim().toLowerCase();
    return term.length > 0 && (nameLower.includes(term) || categoryLower.includes(term));
  });
}

/**
 * Compute daily targets, nutritional gap, allergen warnings, and household meal recommendations
 * exclusively via `@mbg/shared` pure functions (04 §2-5).
 */
export function computeCalculatorSummary({
  profile,
  portionTotals,
  portionAllergens,
  mbgFoodNames,
  eaten,
  skipAllergenPart,
  catalog,
}: CalculatorSummaryInput): CalculatorSummary {
  const targets = computeDailyTargets(profile);
  const allergenWarnings = findMenuAllergenWarnings(portionAllergens, profile.allergies);
  const effectiveEaten =
    skipAllergenPart && allergenWarnings.length > 0 ? Math.max(0, eaten - 0.25) : eaten;

  const gap = computeGap(targets, portionTotals, effectiveEaten);
  const slotTargets = splitRemainingBySlot(gap.remaining);

  const recsList = recommendMeals({
    remaining: gap.remaining,
    targets,
    profile,
    catalog,
    mbgFoodNames,
    slots: ["makan_malam", "sarapan", "selingan"],
  });

  const recommendations: Record<MealSlot, Recommendation> = {
    makan_malam: recsList.find((r) => r.slot === "makan_malam") ?? {
      slot: "makan_malam",
      items: [],
      summaryText: "",
    },
    sarapan: recsList.find((r) => r.slot === "sarapan") ?? {
      slot: "sarapan",
      items: [],
      summaryText: "",
    },
    selingan: recsList.find((r) => r.slot === "selingan") ?? {
      slot: "selingan",
      items: [],
      summaryText: "",
    },
  };

  let proteinReplacements: HouseholdFoodCatalogItem[] = [];
  if (allergenWarnings.length > 0) {
    const allergySet = new Set(profile.allergies);
    proteinReplacements = catalog
      .filter(
        (item) =>
          (item.category === "lauk_hewani" || item.category === "lauk_nabati") &&
          !item.allergens.some((a) => allergySet.has(a)) &&
          !isDislikedFood(item, profile.dislikes),
      )
      .sort((a, b) => a.priceTier - b.priceTier || a.name.localeCompare(b.name))
      .slice(0, 3);
  }

  return {
    targets,
    effectiveEaten,
    gap,
    slotTargets,
    allergenWarnings,
    recommendations,
    proteinReplacements,
  };
}
