import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALLERGENS,
  FOOD_CATEGORIES,
  MEAL_SLOTS,
  type Level,
} from "@mbg/shared";
import { z } from "zod";
import { hashPassword } from "../../services/password.js";
import { ensureEnvLoaded } from "../../lib/env.js";
import { closeDb, getDb, type AppDatabase } from "../client.js";
import {
  akgReference,
  foods,
  householdFoods,
  schools,
  sppg,
  users,
} from "../schema/index.js";
import { AKG_SEED_ROWS } from "./akg.data.js";
import { foodSeedItemSchema } from "./import-tkpi-csv.js";

const householdFoodSeedSchema = z.object({
  name: z.string().trim().min(1),
  category: z.enum(FOOD_CATEGORIES),
  urtLabel: z.string().trim().min(1),
  grams: z.number().positive(),
  energyKcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  carbG: z.number().nonnegative(),
  fiberG: z.number().nonnegative(),
  ironMg: z.number().nonnegative(),
  allergens: z.array(z.enum(ALLERGENS)),
  mealSlots: z.array(z.enum(MEAL_SLOTS)).min(1),
  priceTier: z.number().int().min(1).max(3),
  emoji: z.string().max(16).optional(),
  verified: z.boolean().optional(),
  todo: z.string().optional(),
});

export interface SeedSummary {
  akgCount: number;
  foodsCount: number;
  householdFoodsCount: number;
  schoolsCount: number;
  usersCount: number;
}

function readJsonSeed<T>(relativeFile: string, itemSchema: z.ZodType<T>): T[] {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(resolve(currentDir, relativeFile), "utf8");
  return z.array(itemSchema).parse(JSON.parse(raw));
}

function requireSeedEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required seed environment variable: ${key}`);
  }
  return value;
}

/**
 * Idempotent seed for reference tables (`akg_reference`, `foods`, `household_foods`)
 * and demo tenant/admin accounts. Safe to run repeatedly.
 */
export async function runSeed(database: AppDatabase = getDb()): Promise<SeedSummary> {
  ensureEnvLoaded();

  for (const row of AKG_SEED_ROWS) {
    await database
      .insert(akgReference)
      .values(row)
      .onDuplicateKeyUpdate({
        set: {
          energyKcal: row.energyKcal,
          proteinG: row.proteinG,
          fatG: row.fatG,
          carbG: row.carbG,
          fiberG: row.fiberG,
          ironMg: row.ironMg,
        },
      });
  }

  const foodItems = readJsonSeed("foods.tkpi.json", foodSeedItemSchema);
  for (const item of foodItems) {
    await database
      .insert(foods)
      .values({
        code: item.code,
        name: item.name,
        category: item.category,
        energyKcal: item.energyKcal,
        proteinG: item.proteinG,
        fatG: item.fatG,
        carbG: item.carbG,
        fiberG: item.fiberG,
        ironMg: item.ironMg,
        ediblePct: item.ediblePct,
        allergens: item.allergens,
        isCustom: false,
      })
      .onDuplicateKeyUpdate({
        set: {
          name: item.name,
          category: item.category,
          energyKcal: item.energyKcal,
          proteinG: item.proteinG,
          fatG: item.fatG,
          carbG: item.carbG,
          fiberG: item.fiberG,
          ironMg: item.ironMg,
          ediblePct: item.ediblePct,
          allergens: item.allergens,
          isCustom: false,
        },
      });
  }

  const householdItems = readJsonSeed("household-foods.json", householdFoodSeedSchema);
  for (const item of householdItems) {
    await database
      .insert(householdFoods)
      .values({
        name: item.name,
        category: item.category,
        urtLabel: item.urtLabel,
        grams: item.grams,
        energyKcal: item.energyKcal,
        proteinG: item.proteinG,
        fatG: item.fatG,
        carbG: item.carbG,
        fiberG: item.fiberG,
        ironMg: item.ironMg,
        allergens: item.allergens,
        mealSlots: item.mealSlots,
        priceTier: item.priceTier,
        emoji: item.emoji ?? null,
      })
      .onDuplicateKeyUpdate({
        set: {
          category: item.category,
          urtLabel: item.urtLabel,
          grams: item.grams,
          energyKcal: item.energyKcal,
          proteinG: item.proteinG,
          fatG: item.fatG,
          carbG: item.carbG,
          fiberG: item.fiberG,
          ironMg: item.ironMg,
          allergens: item.allergens,
          mealSlots: item.mealSlots,
          priceTier: item.priceTier,
          emoji: item.emoji ?? null,
        },
      });
  }

  const DEMO_SPPG_ID = "00000000-0000-4000-8000-000000000001";
  await database
    .insert(sppg)
    .values({
      id: DEMO_SPPG_ID,
      name: "SPPG Demo Nasional",
      region: "Nasional",
    })
    .onDuplicateKeyUpdate({
      set: {
        name: "SPPG Demo Nasional",
        region: "Nasional",
      },
    });
  const demoSppg = { id: DEMO_SPPG_ID };

  const demoSchools: Array<{
    name: string;
    slug: string;
    levels: Level[];
    timezone: string;
  }> = [
    {
      name: "SDN 01 Demo",
      slug: "sdn-01-demo",
      levels: ["sd_low", "sd_high"],
      timezone: "Asia/Jakarta",
    },
    {
      name: "SMPN 01 Demo",
      slug: "smpn-01-demo",
      levels: ["smp"],
      timezone: "Asia/Jakarta",
    },
  ];

  for (const school of demoSchools) {
    await database
      .insert(schools)
      .values({
        sppgId: demoSppg.id,
        name: school.name,
        slug: school.slug,
        levels: school.levels,
        timezone: school.timezone,
        active: true,
      })
      .onDuplicateKeyUpdate({
        set: {
          sppgId: demoSppg.id,
          name: school.name,
          levels: school.levels,
          timezone: school.timezone,
          active: true,
        },
      });
  }

  const superAdminEmail = requireSeedEnv("SEED_SUPER_ADMIN_EMAIL").toLowerCase();
  const superAdminPassword = requireSeedEnv("SEED_SUPER_ADMIN_PASSWORD");
  const sppgAdminEmail = requireSeedEnv("SEED_SPPG_ADMIN_EMAIL").toLowerCase();
  const sppgAdminPassword = requireSeedEnv("SEED_SPPG_ADMIN_PASSWORD");

  const demoUsers = [
    {
      email: superAdminEmail,
      passwordHash: await hashPassword(superAdminPassword),
      name: "Super Admin OmprengQ",
      role: "super_admin" as const,
      sppgId: null,
      schoolId: null,
    },
    {
      email: sppgAdminEmail,
      passwordHash: await hashPassword(sppgAdminPassword),
      name: "Ahli Gizi SPPG Demo",
      role: "sppg_admin" as const,
      sppgId: demoSppg.id,
      schoolId: null,
    },
  ];

  for (const account of demoUsers) {
    await database
      .insert(users)
      .values(account)
      .onDuplicateKeyUpdate({
        set: {
          passwordHash: account.passwordHash,
          name: account.name,
          role: account.role,
          sppgId: account.sppgId,
          schoolId: account.schoolId,
        },
      });
  }

  return {
    akgCount: AKG_SEED_ROWS.length,
    foodsCount: foodItems.length,
    householdFoodsCount: householdItems.length,
    schoolsCount: demoSchools.length,
    usersCount: demoUsers.length,
  };
}

const isCli =
  process.argv[1] &&
  (process.argv[1].endsWith("seed\\index.ts") ||
    process.argv[1].endsWith("seed/index.ts") ||
    process.argv[1].endsWith("seed\\index.js") ||
    process.argv[1].endsWith("seed/index.js"));

if (isCli) {
  runSeed()
    .then(async (summary) => {
      console.log("Seed completed:", summary);
      await closeDb();
    })
    .catch(async (error) => {
      console.error("Seed failed:", error);
      await closeDb();
      process.exitCode = 1;
    });
}
