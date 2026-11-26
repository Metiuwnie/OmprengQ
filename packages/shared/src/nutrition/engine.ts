import {
  ACTIVITY_METS,
  ALLERGENS,
  NUTRIENT_FRIENDLY_NAMES,
  NUTRIENT_KEYS,
  PAL,
  REMAINING_SLOT_WEIGHT_SUM,
  REMAINING_SLOT_WEIGHTS,
  type ActivityLevel,
  type Allergen,
  type FoodCategory,
  type MealSlot,
  type NutrientKey,
  type NutrientTotals,
  type Sex,
  type SportActivity,
} from "../constants/index.js";

export interface AkgReferenceRow extends NutrientTotals {
  sex: Sex;
  ageMin: number;
  ageMax: number;
}

/**
 * Tabel AKG harian anak & remaja (usia 4-18 tahun) sesuai 04 §2.3.
 * Murni di memori agar jalan offline di browser tanpa I/O.
 */
export const AKG_REFERENCE_TABLE: readonly AkgReferenceRow[] = [
  { sex: "male", ageMin: 4, ageMax: 6, energyKcal: 1400, proteinG: 25, fatG: 50, carbG: 220, fiberG: 20, ironMg: 9 },
  { sex: "female", ageMin: 4, ageMax: 6, energyKcal: 1400, proteinG: 25, fatG: 50, carbG: 220, fiberG: 20, ironMg: 9 },
  { sex: "male", ageMin: 7, ageMax: 9, energyKcal: 1650, proteinG: 40, fatG: 55, carbG: 250, fiberG: 23, ironMg: 10 },
  { sex: "female", ageMin: 7, ageMax: 9, energyKcal: 1650, proteinG: 40, fatG: 55, carbG: 250, fiberG: 23, ironMg: 10 },
  { sex: "male", ageMin: 10, ageMax: 12, energyKcal: 2000, proteinG: 50, fatG: 65, carbG: 300, fiberG: 28, ironMg: 8 },
  { sex: "female", ageMin: 10, ageMax: 12, energyKcal: 1900, proteinG: 55, fatG: 65, carbG: 280, fiberG: 27, ironMg: 8 },
  { sex: "male", ageMin: 13, ageMax: 15, energyKcal: 2400, proteinG: 70, fatG: 80, carbG: 350, fiberG: 34, ironMg: 11 },
  { sex: "female", ageMin: 13, ageMax: 15, energyKcal: 2050, proteinG: 65, fatG: 70, carbG: 300, fiberG: 29, ironMg: 15 },
  { sex: "male", ageMin: 16, ageMax: 18, energyKcal: 2650, proteinG: 75, fatG: 85, carbG: 400, fiberG: 37, ironMg: 11 },
  { sex: "female", ageMin: 16, ageMax: 18, energyKcal: 2100, proteinG: 65, fatG: 70, carbG: 300, fiberG: 29, ironMg: 15 },
] as const;

export interface BmrInput {
  sex: Sex;
  age: number;
  weightKg: number;
}

export interface NutritionProfileInput extends BmrInput {
  activity: ActivityLevel;
  allergies: readonly Allergen[];
  dislikes: readonly string[];
}

export interface GapResult {
  consumed: NutrientTotals;
  percent: NutrientTotals;
  remaining: NutrientTotals;
}

export type SlotTargets = Record<MealSlot, NutrientTotals>;

export interface HouseholdFoodCatalogItem extends NutrientTotals {
  name: string;
  category: FoodCategory;
  urtLabel: string;
  grams: number;
  allergens: readonly Allergen[];
  mealSlots: readonly MealSlot[];
  priceTier: number;
  emoji?: string;
}

export interface RecommendedFoodItem {
  name: string;
  urtLabel: string;
  emoji?: string;
  covers: NutrientKey[];
}

export interface Recommendation {
  slot: MealSlot;
  items: RecommendedFoodItem[];
  summaryText: string;
}

export interface RecommendMealsInput {
  remaining: NutrientTotals;
  targets: NutrientTotals;
  profile: Pick<NutritionProfileInput, "age" | "sex" | "allergies" | "dislikes">;
  catalog: readonly HouseholdFoodCatalogItem[];
  mbgFoodNames?: readonly string[];
  slots?: readonly MealSlot[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function zeroTotals(): NutrientTotals {
  return {
    energyKcal: 0,
    proteinG: 0,
    fatG: 0,
    carbG: 0,
    fiberG: 0,
    ironMg: 0,
  };
}

/**
 * Schofield BMR equation (weight-only, kcal/day) per 04 §2.1.
 * Height is intentionally never used (no BMI/IMT calculation).
 */
export function computeBmr({ sex, age, weightKg }: BmrInput): number {
  const flooredAge = Math.floor(age);
  if (sex === "male") {
    return flooredAge < 10 ? 22.7 * weightKg + 495 : 17.5 * weightKg + 651;
  }
  return flooredAge < 10 ? 22.5 * weightKg + 499 : 12.2 * weightKg + 746;
}

/**
 * Look up daily AKG reference values for a given sex and age (floored, clamped to 4–18).
 */
export function getAkgReference(sex: Sex, age: number): NutrientTotals {
  const flooredAge = clamp(Math.floor(age), 4, 18);
  const row =
    AKG_REFERENCE_TABLE.find(
      (entry) => entry.sex === sex && flooredAge >= entry.ageMin && flooredAge <= entry.ageMax,
    ) ?? AKG_REFERENCE_TABLE[0]!;

  return {
    energyKcal: row.energyKcal,
    proteinG: row.proteinG,
    fatG: row.fatG,
    carbG: row.carbG,
    fiberG: row.fiberG,
    ironMg: row.ironMg,
  };
}

/**
 * Compute personalized daily nutrition targets per 04 §2.4:
 * - energy = clamp(BMR * PAL, 0.8 * AKG.energy, 1.25 * AKG.energy)
 * - fat & carb scaled proportionally by energy / AKG.energy
 * - protein, fiber, iron taken directly from AKG
 */
export function computeDailyTargets(
  profile: Pick<NutritionProfileInput, "sex" | "age" | "weightKg" | "activity">,
): NutrientTotals {
  const akg = getAkgReference(profile.sex, profile.age);
  const bmr = computeBmr(profile);
  const personalEnergy = bmr * PAL[profile.activity];
  const finalEnergy = clamp(personalEnergy, 0.8 * akg.energyKcal, 1.25 * akg.energyKcal);
  const ratio = finalEnergy / akg.energyKcal;

  return {
    energyKcal: finalEnergy,
    proteinG: akg.proteinG,
    fatG: akg.fatG * ratio,
    carbG: akg.carbG * ratio,
    fiberG: akg.fiberG,
    ironMg: akg.ironMg,
  };
}

/**
 * Compute nutritional gap between daily targets and consumed MBG menu portion (04 §3).
 * Safe when `menuTotals` is null/undefined. `remaining` is never negative.
 */
export function computeGap(
  targets: NutrientTotals,
  menuTotals: NutrientTotals | null | undefined,
  eaten = 1,
): GapResult {
  const safeEaten = Number.isFinite(eaten) ? clamp(eaten, 0, 1) : 1;
  const safeMenu = menuTotals ?? zeroTotals();

  const consumed = zeroTotals();
  const percent = zeroTotals();
  const remaining = zeroTotals();

  for (const key of NUTRIENT_KEYS) {
    const targetVal = Math.max(0, targets[key]);
    const menuVal = Math.max(0, safeMenu[key] ?? 0);
    const eatenVal = menuVal * safeEaten;

    consumed[key] = eatenVal;
    percent[key] = targetVal > 0 ? (eatenVal / targetVal) * 100 : 100;
    remaining[key] = Math.max(0, targetVal - eatenVal);
  }

  return { consumed, percent, remaining };
}

/**
 * Split remaining daily nutrition across non-MBG meal slots (04 §4.1):
 * sarapan 25/65, selingan 10/65, makan_malam 30/65.
 */
export function splitRemainingBySlot(remaining: NutrientTotals): SlotTargets {
  const slots: MealSlot[] = ["sarapan", "selingan", "makan_malam"];
  const result = {} as SlotTargets;

  for (const slot of slots) {
    const weight = REMAINING_SLOT_WEIGHTS[slot];
    const slotTotals = zeroTotals();
    for (const key of NUTRIENT_KEYS) {
      slotTotals[key] = (Math.max(0, remaining[key]) * weight) / REMAINING_SLOT_WEIGHT_SUM;
    }
    result[slot] = slotTotals;
  }

  return result;
}

/**
 * Return matching allergens between a menu and a child profile, ordered canonically by `ALLERGENS`.
 */
export function findMenuAllergenWarnings(
  menuAllergens: readonly Allergen[] | null | undefined,
  profileAllergies: readonly Allergen[],
): Allergen[] {
  if (!menuAllergens?.length || !profileAllergies.length) return [];
  const allergySet = new Set(profileAllergies);
  const menuSet = new Set(menuAllergens);
  return ALLERGENS.filter((allergen) => allergySet.has(allergen) && menuSet.has(allergen));
}

function isDisliked(item: HouseholdFoodCatalogItem, dislikes: readonly string[]): boolean {
  if (!dislikes.length) return false;
  const nameLower = item.name.toLowerCase();
  const categoryLower = item.category.toLowerCase();
  return dislikes.some((raw) => {
    const term = raw.trim().toLowerCase();
    return term.length > 0 && (nameLower.includes(term) || categoryLower.includes(term));
  });
}

function hasAllergen(item: HouseholdFoodCatalogItem, allergies: readonly Allergen[]): boolean {
  if (!allergies.length || !item.allergens.length) return false;
  const allergySet = new Set(allergies);
  return item.allergens.some((a) => allergySet.has(a));
}

function isNearlyComplete(remaining: NutrientTotals, targets: NutrientTotals): boolean {
  return NUTRIENT_KEYS.every((key) => {
    const target = targets[key];
    if (target <= 0) return true;
    const fulfilledRatio = (target - Math.max(0, remaining[key])) / target;
    return fulfilledRatio >= 0.9;
  });
}

function formatItemList(items: readonly RecommendedFoodItem[]): string {
  const labels = items.map((item) => `${item.name} (${item.urtLabel})`);
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} dan ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, dan ${labels[labels.length - 1]}`;
}

const SLOT_LABELS: Readonly<Record<MealSlot, string>> = {
  sarapan: "sarapan",
  selingan: "selingan",
  makan_malam: "makan malam di rumah",
};

/**
 * Rule-based greedy household food recommendation engine (04 §4.2–4.3).
 * Pure & deterministic: stable tie-breaking by priceTier -> novelty vs MBG -> name.
 */
export function recommendMeals({
  remaining,
  targets,
  profile,
  catalog,
  mbgFoodNames = [],
  slots = ["makan_malam"],
}: RecommendMealsInput): Recommendation[] {
  const energyPct =
    targets.energyKcal > 0
      ? Math.round(((targets.energyKcal - Math.max(0, remaining.energyKcal)) / targets.energyKcal) * 100)
      : 100;

  if (isNearlyComplete(remaining, targets)) {
    return slots.map((slot) => ({
      slot,
      items: [],
      summaryText:
        "Hari ini gizimu sudah hampir lengkap 🎉 Cukup lengkapi dengan air putih dan buah segar ya!",
    }));
  }

  const slotTargetsMap = splitRemainingBySlot(remaining);
  const mbgNamesLower = new Set(mbgFoodNames.map((n) => n.trim().toLowerCase()).filter(Boolean));
  const isFemaleTeen = profile.sex === "female" && Math.floor(profile.age) >= 10;

  // Identify 1-2 nutrients with lowest fulfillment percentage for friendly summary text.
  const lowestNutrients = [...NUTRIENT_KEYS]
    .filter((key) => targets[key] > 0 && remaining[key] > 0)
    .sort((a, b) => {
      const pctA = (targets[a] - remaining[a]) / targets[a];
      const pctB = (targets[b] - remaining[b]) / targets[b];
      if (Math.abs(pctA - pctB) > 1e-9) return pctA - pctB;
      return NUTRIENT_KEYS.indexOf(a) - NUTRIENT_KEYS.indexOf(b);
    })
    .slice(0, 2)
    .map((key) => NUTRIENT_FRIENDLY_NAMES[key]);

  const lackingText =
    lowestNutrients.length === 2
      ? `${lowestNutrients[0]} dan ${lowestNutrients[1]}`
      : lowestNutrients[0] ?? "asupan gizi";

  return slots.map((slot) => {
    const slotTarget = slotTargetsMap[slot];
    const slotRemaining: NutrientTotals = { ...slotTarget };

    // Filter eligible candidates for this slot
    const candidates = catalog.filter(
      (item) =>
        item.mealSlots.includes(slot) &&
        !hasAllergen(item, profile.allergies) &&
        !isDisliked(item, profile.dislikes),
    );

    // Priority weights per 04 §4.2 step 3
    const weights = {} as Record<NutrientKey, number>;
    for (const key of NUTRIENT_KEYS) {
      let w = targets[key] > 0 ? slotTarget[key] / targets[key] : 0;
      if (key === "fiberG") w *= 1.5;
      if (key === "ironMg" && isFemaleTeen) w *= 1.5;
      if (key === "proteinG") w *= 1.2;
      weights[key] = w;
    }

    const picked: RecommendedFoodItem[] = [];
    const usedCategories = new Set<FoodCategory>();
    const usedNames = new Set<string>();
    const MAX_ITEMS = 4;
    const SCORE_THRESHOLD = 0.05;

    for (let step = 0; step < MAX_ITEMS; step++) {
      // Stop if all slot nutrients are >= 85% covered
      const slotCovered = NUTRIENT_KEYS.every((key) => {
        if (slotTarget[key] <= 0) return true;
        return (slotTarget[key] - slotRemaining[key]) / slotTarget[key] >= 0.85;
      });
      if (slotCovered) break;

      let bestItem: HouseholdFoodCatalogItem | null = null;
      let bestScore = -1;

      for (const candidate of candidates) {
        if (usedCategories.has(candidate.category) || usedNames.has(candidate.name)) {
          continue;
        }

        let score = 0;
        for (const key of NUTRIENT_KEYS) {
          if (slotTarget[key] <= 0 || slotRemaining[key] <= 0) continue;
          const contribution = Math.min(candidate[key], slotRemaining[key]);
          score += weights[key] * (contribution / slotTarget[key]);
        }

        if (score < SCORE_THRESHOLD) continue;

        if (!bestItem) {
          bestItem = candidate;
          bestScore = score;
          continue;
        }

        const diff = score - bestScore;
        if (diff > 1e-9) {
          bestItem = candidate;
          bestScore = score;
        } else if (Math.abs(diff) <= 1e-9) {
          // Tiebreak: lower priceTier -> not in mbgFoodNames -> alphabetical name
          const betterPrice = candidate.priceTier < bestItem.priceTier;
          const samePrice = candidate.priceTier === bestItem.priceTier;
          const candInMbg = mbgNamesLower.has(candidate.name.trim().toLowerCase());
          const bestInMbg = mbgNamesLower.has(bestItem.name.trim().toLowerCase());
          if (
            betterPrice ||
            (samePrice && !candInMbg && bestInMbg) ||
            (samePrice && candInMbg === bestInMbg && candidate.name.localeCompare(bestItem.name) < 0)
          ) {
            bestItem = candidate;
            bestScore = score;
          }
        }
      }

      if (!bestItem) break;

      const covers: NutrientKey[] = [];
      for (const key of NUTRIENT_KEYS) {
        if (slotTarget[key] > 0 && slotRemaining[key] > 0) {
          const contributed = Math.min(bestItem[key], slotRemaining[key]);
          if (contributed / slotTarget[key] >= 0.1) {
            covers.push(key);
          }
          slotRemaining[key] = Math.max(0, slotRemaining[key] - bestItem[key]);
        }
      }

      usedCategories.add(bestItem.category);
      usedNames.add(bestItem.name);
      picked.push({
        name: bestItem.name,
        urtLabel: bestItem.urtLabel,
        emoji: bestItem.emoji,
        covers,
      });
    }

    const summaryText =
      picked.length > 0
        ? `Menu MBG hari ini sudah memenuhi ${energyPct}% energimu, tetapi ${lackingText} masih kurang. Untuk ${SLOT_LABELS[slot]}, tambahkan ${formatItemList(picked)} supaya kebutuhan harianmu terpenuhi.`
        : `Menu MBG hari ini sudah memenuhi ${energyPct}% energimu. Tambahkan variasi lauk, sayur, dan buah yang cocok untuk ${SLOT_LABELS[slot]} ya!`;

    return {
      slot,
      items: picked,
      summaryText,
    };
  });
}

/**
 * Optional teen activity calorie estimate (04 §6): kcal ≈ MET × weightKg × hours.
 */
export function estimateActivityKcal(
  activity: SportActivity,
  weightKg: number,
  hours: number,
): number {
  const met = ACTIVITY_METS[activity];
  return met * Math.max(0, weightKg) * Math.max(0, hours);
}
