import { count } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { closeDb, getDb } from "../client.js";
import { akgReference, foods, householdFoods, schools, users } from "../schema/index.js";
import { runSeed } from "./index.js";

describe("idempotent seed and MySQL data mapping", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("is idempotent across repeated executions and maps JSON/decimals cleanly", async () => {
    const database = getDb();

    const first = await runSeed(database);
    const [akg1] = await database.select({ total: count() }).from(akgReference);
    const [foods1] = await database.select({ total: count() }).from(foods);
    const [hf1] = await database.select({ total: count() }).from(householdFoods);
    const [schools1] = await database.select({ total: count() }).from(schools);
    const [users1] = await database.select({ total: count() }).from(users);

    const second = await runSeed(database);
    const [akg2] = await database.select({ total: count() }).from(akgReference);
    const [foods2] = await database.select({ total: count() }).from(foods);
    const [hf2] = await database.select({ total: count() }).from(householdFoods);
    const [schools2] = await database.select({ total: count() }).from(schools);
    const [users2] = await database.select({ total: count() }).from(users);

    expect(second).toEqual(first);
    expect(akg2?.total).toBe(akg1?.total);
    expect(foods2?.total).toBe(foods1?.total);
    expect(hf2?.total).toBe(hf1?.total);
    expect(schools2?.total).toBe(schools1?.total);
    expect(users2?.total).toBe(users1?.total);

    const sampleFoodRows = await database.select().from(foods).limit(5);
    expect(sampleFoodRows.length).toBeGreaterThan(0);
    for (const row of sampleFoodRows) {
      expect(typeof row.energyKcal).toBe("number");
      expect(typeof row.proteinG).toBe("number");
      expect(typeof row.ediblePct).toBe("number");
      expect(Array.isArray(row.allergens)).toBe(true);
    }

    const sampleSchoolRows = await database.select().from(schools).limit(2);
    for (const row of sampleSchoolRows) {
      expect(Array.isArray(row.levels)).toBe(true);
    }

    const sampleHouseholdRows = await database.select().from(householdFoods).limit(5);
    for (const row of sampleHouseholdRows) {
      expect(typeof row.grams).toBe("number");
      expect(typeof row.energyKcal).toBe("number");
      expect(Array.isArray(row.allergens)).toBe(true);
      expect(Array.isArray(row.mealSlots)).toBe(true);
    }
  });
});
