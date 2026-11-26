import { describe, expect, it } from "vitest";
import {
  ChildProfileSchema,
  validateChildProfile,
  validateProfileExport,
} from "../schemas/index.js";
import type { NutrientTotals } from "../constants/index.js";
import {
  computeBmr,
  computeDailyTargets,
  computeGap,
  estimateActivityKcal,
  findMenuAllergenWarnings,
  getAkgReference,
  recommendMeals,
  splitRemainingBySlot,
  type HouseholdFoodCatalogItem,
  type NutritionProfileInput,
} from "./engine.js";

const SAMPLE_CATALOG: HouseholdFoodCatalogItem[] = [
  {
    name: "Nasi putih hangat",
    category: "karbohidrat",
    urtLabel: "1 centong penuh",
    grams: 100,
    energyKcal: 180,
    proteinG: 3,
    fatG: 0.3,
    carbG: 39.8,
    fiberG: 0.3,
    ironMg: 0.4,
    allergens: [],
    mealSlots: ["sarapan", "makan_malam"],
    priceTier: 1,
    emoji: "🍚",
  },
  {
    name: "Telur dadar",
    category: "lauk_hewani",
    urtLabel: "1 butir sedang",
    grams: 55,
    energyKcal: 110,
    proteinG: 7,
    fatG: 8,
    carbG: 0.5,
    fiberG: 0,
    ironMg: 1.5,
    allergens: ["telur"],
    mealSlots: ["sarapan", "makan_malam"],
    priceTier: 1,
    emoji: "🍳",
  },
  {
    name: "Ayam panggang kecap",
    category: "lauk_hewani",
    urtLabel: "1 potong sedang",
    grams: 60,
    energyKcal: 140,
    proteinG: 15,
    fatG: 7,
    carbG: 3,
    fiberG: 0,
    ironMg: 1.2,
    allergens: [],
    mealSlots: ["makan_malam"],
    priceTier: 2,
    emoji: "🍗",
  },
  {
    name: "Tempe bacem",
    category: "lauk_nabati",
    urtLabel: "2 potong sedang",
    grams: 50,
    energyKcal: 75,
    proteinG: 7.5,
    fatG: 3,
    carbG: 7.5,
    fiberG: 0.7,
    ironMg: 2.0,
    allergens: ["kedelai"],
    mealSlots: ["sarapan", "makan_malam"],
    priceTier: 1,
    emoji: "🟫",
  },
  {
    name: "Sayur bayam bening",
    category: "sayur",
    urtLabel: "1 mangkuk sedang",
    grams: 100,
    energyKcal: 36,
    proteinG: 2.5,
    fatG: 0.4,
    carbG: 6.5,
    fiberG: 3.5,
    ironMg: 3.9,
    allergens: [],
    mealSlots: ["sarapan", "makan_malam"],
    priceTier: 1,
    emoji: "🥬",
  },
  {
    name: "Tumis kangkung",
    category: "sayur",
    urtLabel: "1 mangkuk sedang",
    grams: 100,
    energyKcal: 55,
    proteinG: 2.2,
    fatG: 2.5,
    carbG: 6,
    fiberG: 3.2,
    ironMg: 2.5,
    allergens: [],
    mealSlots: ["makan_malam"],
    priceTier: 1,
    emoji: "🥦",
  },
  {
    name: "Pepaya potong",
    category: "buah",
    urtLabel: "1 potong besar",
    grams: 110,
    energyKcal: 46,
    proteinG: 0.5,
    fatG: 0.1,
    carbG: 12,
    fiberG: 2.0,
    ironMg: 0.3,
    allergens: [],
    mealSlots: ["sarapan", "selingan", "makan_malam"],
    priceTier: 1,
    emoji: "🍈",
  },
  {
    name: "Pisang ambon",
    category: "buah",
    urtLabel: "1 buah sedang",
    grams: 100,
    energyKcal: 99,
    proteinG: 1.2,
    fatG: 0.2,
    carbG: 25.8,
    fiberG: 2.6,
    ironMg: 0.5,
    allergens: [],
    mealSlots: ["sarapan", "selingan", "makan_malam"],
    priceTier: 2,
    emoji: "🍌",
  },
];

describe("Nutritional Gap Engine (04 §7 mandatory test cases)", () => {
  it("BMR laki-laki 8 th, BB 25 kg -> 1062.5 kkal", () => {
    expect(computeBmr({ sex: "male", age: 8, weightKg: 25 })).toBeCloseTo(1062.5, 4);
  });

  it("Energi laki-laki 8 th sedang (BB 25, PAL 1.6) -> 1700 kkal (dalam rentang AKG 1650)", () => {
    const profile: NutritionProfileInput = {
      sex: "male",
      age: 8,
      weightKg: 25,
      activity: "moderate",
      allergies: [],
      dislikes: [],
    };
    const targets = computeDailyTargets(profile);
    expect(targets.energyKcal).toBeCloseTo(1700, 4);
    // Fat & carb scaled by ratio 1700/1650; protein, fiber, iron stay exact AKG
    const ratio = 1700 / 1650;
    expect(targets.fatG).toBeCloseTo(55 * ratio, 4);
    expect(targets.carbG).toBeCloseTo(250 * ratio, 4);
    expect(targets.proteinG).toBe(40);
    expect(targets.fiberG).toBe(23);
    expect(targets.ironMg).toBe(10);
  });

  it("BMR perempuan 14 th, BB 45 kg -> 1295 kkal; x1.6 = 2072 kkal", () => {
    expect(computeBmr({ sex: "female", age: 14, weightKg: 45 })).toBeCloseTo(1295, 4);
    const targets = computeDailyTargets({
      sex: "female",
      age: 14,
      weightKg: 45,
      activity: "moderate",
    });
    expect(targets.energyKcal).toBeCloseTo(2072, 4);
    expect(targets.ironMg).toBe(15);
  });

  it("Clamp: energi hitung 3000 untuk AKG 2000 -> 2500 (1.25x), dan clamp bawah 0.8x", () => {
    // Male 11 yo has AKG 2000 kcal. Weight 80 kg, active (1.8):
    // BMR = 17.5*80 + 651 = 2051; 2051 * 1.8 = 3691.8 > 2500 -> clamped to 2500
    const highTargets = computeDailyTargets({
      sex: "male",
      age: 11,
      weightKg: 80,
      activity: "active",
    });
    expect(highTargets.energyKcal).toBe(2500);

    // Low weight clamp: Male 11 yo (AKG 2000), weight 15 kg, light (1.4):
    // BMR = 17.5*15 + 651 = 913.5; * 1.4 = 1278.9 < 1600 -> clamped to 1600
    const lowTargets = computeDailyTargets({
      sex: "male",
      age: 11,
      weightKg: 15,
      activity: "light",
    });
    expect(lowTargets.energyKcal).toBe(1600);
  });

  it("Selisih tidak negatif: konsumsi > target -> remaining = 0", () => {
    const targets: NutrientTotals = {
      energyKcal: 1400,
      proteinG: 25,
      fatG: 50,
      carbG: 220,
      fiberG: 20,
      ironMg: 9,
    };
    const menuTotals: NutrientTotals = {
      energyKcal: 1600,
      proteinG: 35,
      fatG: 60,
      carbG: 250,
      fiberG: 25,
      ironMg: 12,
    };
    const gap = computeGap(targets, menuTotals, 1);
    expect(gap.remaining).toEqual({
      energyKcal: 0,
      proteinG: 0,
      fatG: 0,
      carbG: 0,
      fiberG: 0,
      ironMg: 0,
    });
    expect(gap.percent.energyKcal).toBeGreaterThan(100);
  });

  it("Porsi dimakan 0.5: menu 520 kkal -> konsumsi 260 kkal", () => {
    const targets: NutrientTotals = {
      energyKcal: 1700,
      proteinG: 40,
      fatG: 55,
      carbG: 250,
      fiberG: 23,
      ironMg: 10,
    };
    const menuTotals: NutrientTotals = {
      energyKcal: 520,
      proteinG: 20,
      fatG: 16,
      carbG: 70,
      fiberG: 4,
      ironMg: 3,
    };
    const gap = computeGap(targets, menuTotals, 0.5);
    expect(gap.consumed.energyKcal).toBeCloseTo(260, 4);
    expect(gap.consumed.proteinG).toBeCloseTo(10, 4);
    expect(gap.remaining.energyKcal).toBeCloseTo(1440, 4);
  });

  it("Alergen: profil alergi telur, menu ada telur -> peringatan aktif; rekomendasi tidak memuat telur", () => {
    const profile: NutritionProfileInput = {
      sex: "male",
      age: 8,
      weightKg: 25,
      activity: "moderate",
      allergies: ["telur"],
      dislikes: [],
    };
    const warnings = findMenuAllergenWarnings(["telur", "kedelai"], profile.allergies);
    expect(warnings).toEqual(["telur"]);

    const targets = computeDailyTargets(profile);
    const gap = computeGap(
      targets,
      { energyKcal: 500, proteinG: 18, fatG: 14, carbG: 70, fiberG: 4, ironMg: 2 },
      1,
    );
    const recs = recommendMeals({
      remaining: gap.remaining,
      targets,
      profile,
      catalog: SAMPLE_CATALOG,
      mbgFoodNames: ["Nasi putih hangat"],
    });
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      for (const item of rec.items) {
        const matched = SAMPLE_CATALOG.find((c) => c.name === item.name);
        expect(matched?.allergens ?? []).not.toContain("telur");
      }
    }
  });

  it("Pembagian slot: sisa 650 kkal -> sarapan 250, selingan 100, makan_malam 300", () => {
    const remaining: NutrientTotals = {
      energyKcal: 650,
      proteinG: 26,
      fatG: 19.5,
      carbG: 97.5,
      fiberG: 13,
      ironMg: 6.5,
    };
    const slots = splitRemainingBySlot(remaining);
    expect(slots.sarapan.energyKcal).toBeCloseTo(250, 4);
    expect(slots.selingan.energyKcal).toBeCloseTo(100, 4);
    expect(slots.makan_malam.energyKcal).toBeCloseTo(300, 4);
  });

  it("Menu kosong: menuTotals null -> hasil aman tanpa throw", () => {
    const targets = computeDailyTargets({
      sex: "female",
      age: 10,
      weightKg: 32,
      activity: "light",
    });
    const gap = computeGap(targets, null);
    expect(gap.consumed.energyKcal).toBe(0);
    expect(gap.percent.energyKcal).toBe(0);
    expect(gap.remaining).toEqual(targets);
  });

  it("Determinisme: input sama -> output identik (urutan stabil)", () => {
    const profile: NutritionProfileInput = {
      sex: "female",
      age: 13,
      weightKg: 42,
      activity: "moderate",
      allergies: [],
      dislikes: ["kangkung"],
    };
    const targets = computeDailyTargets(profile);
    const gap = computeGap(
      targets,
      { energyKcal: 550, proteinG: 22, fatG: 15, carbG: 75, fiberG: 5, ironMg: 3 },
      1,
    );
    const first = recommendMeals({
      remaining: gap.remaining,
      targets,
      profile,
      catalog: SAMPLE_CATALOG,
      mbgFoodNames: ["Nasi putih hangat"],
    });
    const second = recommendMeals({
      remaining: gap.remaining,
      targets,
      profile,
      catalog: SAMPLE_CATALOG,
      mbgFoodNames: ["Nasi putih hangat"],
    });
    expect(first).toEqual(second);
    // Also verify dislike filtering ("kangkung")
    for (const rec of first) {
      for (const item of rec.items) {
        expect(item.name.toLowerCase()).not.toContain("kangkung");
      }
    }
  });
});

describe("AKG reference, recommendations edge cases, activity kcal, and Zod profile schema", () => {
  it("looks up AKG for all age brackets and floors fractional age", () => {
    expect(getAkgReference("male", 4.9).energyKcal).toBe(1400);
    expect(getAkgReference("female", 7).energyKcal).toBe(1650);
    expect(getAkgReference("male", 10).energyKcal).toBe(2000);
    expect(getAkgReference("female", 12).energyKcal).toBe(1900);
    expect(getAkgReference("male", 15).energyKcal).toBe(2400);
    expect(getAkgReference("female", 15).ironMg).toBe(15);
    expect(getAkgReference("male", 18).energyKcal).toBe(2650);
    expect(getAkgReference("female", 18).energyKcal).toBe(2100);
  });

  it("returns positive completion message when all nutrients >= 90% met", () => {
    const profile: NutritionProfileInput = {
      sex: "male",
      age: 6,
      weightKg: 20,
      activity: "light",
      allergies: [],
      dislikes: [],
    };
    const targets = computeDailyTargets(profile);
    const remaining: NutrientTotals = {
      energyKcal: targets.energyKcal * 0.05,
      proteinG: targets.proteinG * 0.05,
      fatG: targets.fatG * 0.05,
      carbG: targets.carbG * 0.05,
      fiberG: targets.fiberG * 0.05,
      ironMg: targets.ironMg * 0.05,
    };
    const recs = recommendMeals({
      remaining,
      targets,
      profile,
      catalog: SAMPLE_CATALOG,
      mbgFoodNames: [],
    });
    expect(recs[0]?.items).toEqual([]);
    expect(recs[0]?.summaryText).toContain("Hari ini gizimu sudah hampir lengkap");
  });

  it("estimates activity kcal using MET x weightKg x hours", () => {
    expect(estimateActivityKcal("futsal", 40, 1)).toBeCloseTo(280, 4);
    expect(estimateActivityKcal("jalan_santai", 50, 0.5)).toBeCloseTo(87.5, 4);
    expect(estimateActivityKcal("lari", 45, 0)).toBe(0);
  });

  it("validates ChildProfileSchema and ProfileExportSchema", () => {
    const validProfile = {
      id: "prof-1",
      nickname: "Budi",
      age: 8,
      sex: "male" as const,
      weightKg: 25,
      heightCm: 128,
      activity: "moderate" as const,
      allergies: ["telur" as const],
      dislikes: ["pare"],
      level: "sd_low" as const,
      createdAt: "2026-11-25T00:00:00.000Z",
      updatedAt: "2026-11-25T00:00:00.000Z",
    };
    expect(ChildProfileSchema.safeParse(validProfile).success).toBe(true);
    expect(validateChildProfile({ ...validProfile, age: 3 }).success).toBe(false);
    expect(validateChildProfile({ ...validProfile, weightKg: 5 }).success).toBe(false);
    expect(
      validateProfileExport({
        schemaVersion: 1,
        activeId: "prof-1",
        profiles: [validProfile],
      }).success,
    ).toBe(true);
    expect(validateProfileExport({ schemaVersion: 2, profiles: [] }).success).toBe(false);
  });
});
