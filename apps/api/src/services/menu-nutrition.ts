import {
  collectPortionAllergens,
  computePortionTotals,
  type Allergen,
  type Level,
  type NutrientTotals,
  type PortionFoodLike,
  type PutPortionInput,
} from "@mbg/shared";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { AppDatabase } from "../db/client.js";
import { foods, menuItems, menuPortions, menus } from "../db/schema/index.js";
import { AppError } from "../middleware/error.js";

export interface PortionSummary {
  totals: NutrientTotals;
  allergens: Allergen[];
}

/**
 * Save one level's portion of a menu. Totals and allergens are always recomputed on the server
 * from the TKPI foods in the database (client-sent numbers are never trusted). Runs in a transaction.
 */
export async function savePortion(
  database: AppDatabase,
  menuId: string,
  level: Level,
  items: PutPortionInput["items"],
): Promise<PortionSummary> {
  const foodIds = [...new Set(items.map((item) => item.foodId))];
  const foodRows = foodIds.length
    ? await database.select().from(foods).where(inArray(foods.id, foodIds))
    : [];
  const foodsById = new Map<string, PortionFoodLike>(foodRows.map((row) => [row.id, row]));

  for (const id of foodIds) {
    if (!foodsById.has(id)) {
      throw new AppError(400, "FOOD_NOT_FOUND", "Ada bahan yang tidak ditemukan di database.");
    }
  }

  const totals = computePortionTotals(items, foodsById);
  const allergens = collectPortionAllergens(items, foodsById);

  await database.transaction(async (tx) => {
    const existing = await tx
      .select({ id: menuPortions.id })
      .from(menuPortions)
      .where(and(eq(menuPortions.menuId, menuId), eq(menuPortions.level, level)))
      .limit(1);

    let portionId = existing[0]?.id;
    if (portionId) {
      await tx.update(menuPortions).set({ totals, allergens }).where(eq(menuPortions.id, portionId));
      await tx.delete(menuItems).where(eq(menuItems.portionId, portionId));
    } else {
      portionId = crypto.randomUUID();
      await tx.insert(menuPortions).values({ id: portionId, menuId, level, totals, allergens });
    }

    if (items.length > 0) {
      await tx.insert(menuItems).values(
        items.map((item) => ({
          id: crypto.randomUUID(),
          portionId: portionId as string,
          foodId: item.foodId,
          grams: item.grams,
          label: item.label ?? null,
          visualUnit: item.visualUnit ?? null,
          benefit: item.benefit ?? null,
        })),
      );
    }
  });

  return { totals, allergens };
}

/** Count ingredient lines across every portion of a menu. */
export async function countMenuItems(database: AppDatabase, menuId: string): Promise<number> {
  const rows = await database
    .select({ total: sql<number>`count(*)` })
    .from(menuItems)
    .innerJoin(menuPortions, eq(menuItems.portionId, menuPortions.id))
    .where(eq(menuPortions.menuId, menuId));
  return Number(rows[0]?.total ?? 0);
}

/** Full menu with portions and ingredient lines (joined with food name, category, allergens). */
export async function loadMenuDetail(database: AppDatabase, menuId: string) {
  const menuRows = await database.select().from(menus).where(eq(menus.id, menuId)).limit(1);
  const menu = menuRows[0];
  if (!menu) return null;

  const portionRows = await database.select().from(menuPortions).where(eq(menuPortions.menuId, menuId));
  const portionIds = portionRows.map((portion) => portion.id);

  const itemRows = portionIds.length
    ? await database
        .select({
          item: menuItems,
          foodName: foods.name,
          foodCategory: foods.category,
          foodAllergens: foods.allergens,
          foodEnergyKcal: foods.energyKcal,
          foodProteinG: foods.proteinG,
          foodFatG: foods.fatG,
          foodCarbG: foods.carbG,
          foodFiberG: foods.fiberG,
          foodIronMg: foods.ironMg,
        })
        .from(menuItems)
        .innerJoin(foods, eq(menuItems.foodId, foods.id))
        .where(inArray(menuItems.portionId, portionIds))
    : [];

  const portions = portionRows.map((portion) => ({
    id: portion.id,
    level: portion.level,
    totals: portion.totals,
    allergens: portion.allergens,
    items: itemRows
      .filter((row) => row.item.portionId === portion.id)
      .map((row) => ({
        id: row.item.id,
        foodId: row.item.foodId,
        grams: row.item.grams,
        label: row.item.label,
        visualUnit: row.item.visualUnit,
        benefit: row.item.benefit,
        foodName: row.foodName,
        foodCategory: row.foodCategory,
        foodAllergens: row.foodAllergens,
        foodEnergyKcal: row.foodEnergyKcal,
        foodProteinG: row.foodProteinG,
        foodFatG: row.foodFatG,
        foodCarbG: row.foodCarbG,
        foodFiberG: row.foodFiberG,
        foodIronMg: row.foodIronMg,
      })),
  }));

  return { menu, portions };
}

/** Copy a menu (as draft) with all portions and items to another date, inside a transaction. */
export async function copyMenuToDate(database: AppDatabase, sourceMenuId: string, targetDate: string) {
  const source = await loadMenuDetail(database, sourceMenuId);
  if (!source) {
    throw new AppError(404, "NOT_FOUND", "Menu tidak ditemukan.");
  }

  const newMenuId = crypto.randomUUID();
  await database.transaction(async (tx) => {
    await tx.insert(menus).values({
      id: newMenuId,
      sppgId: source.menu.sppgId,
      date: targetDate,
      name: source.menu.name,
      description: source.menu.description,
      photoUrl: source.menu.photoUrl,
      funFact: source.menu.funFact,
      status: "draft",
    });

    for (const portion of source.portions) {
      const newPortionId = crypto.randomUUID();
      await tx.insert(menuPortions).values({
        id: newPortionId,
        menuId: newMenuId,
        level: portion.level,
        totals: portion.totals,
        allergens: portion.allergens,
      });
      if (portion.items.length > 0) {
        await tx.insert(menuItems).values(
          portion.items.map((item) => ({
            id: crypto.randomUUID(),
            portionId: newPortionId,
            foodId: item.foodId,
            grams: item.grams,
            label: item.label,
            visualUnit: item.visualUnit,
            benefit: item.benefit,
          })),
        );
      }
    }
  });

  const created = await database.select().from(menus).where(eq(menus.id, newMenuId)).limit(1);
  return created[0];
}
