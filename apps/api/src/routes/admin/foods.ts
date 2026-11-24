import { zValidator } from "@hono/zod-validator";
import { createFoodSchema, foodCategorySchema, updateFoodSchema } from "@mbg/shared";
import { asc, eq, like, or, and } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../../db/client.js";
import { foods } from "../../db/schema/index.js";
import { mapDbError } from "../../lib/tenant.js";
import { zodErrorHook } from "../../lib/validation.js";
import { requireAuth, requireRole, type AuthContextVariables } from "../../middleware/auth.js";
import { AppError } from "../../middleware/error.js";

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: foodCategorySchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

async function findFood(id: string) {
  const rows = await getDb().select().from(foods).where(eq(foods.id, id)).limit(1);
  const food = rows[0];
  if (!food) throw new AppError(404, "NOT_FOUND", "Bahan tidak ditemukan.");
  return food;
}

function assertCustom(food: { isCustom: boolean }) {
  if (!food.isCustom) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Bahan TKPI bawaan tidak dapat diubah. Tambahkan bahan custom bila perlu.",
    );
  }
}

/** `/api/admin/foods` (all admin roles; only custom foods can be edited or deleted). */
export const foodRoutes = new Hono<{ Variables: AuthContextVariables }>()
  .use("*", requireAuth, requireRole("super_admin", "sppg_admin", "school_admin"))
  .get("/", zValidator("query", listQuerySchema, zodErrorHook), async (c) => {
    const { q, category, limit } = c.req.valid("query");
    const conditions = [];
    if (q) {
      const pattern = `%${escapeLike(q)}%`;
      conditions.push(or(like(foods.name, pattern), like(foods.code, pattern)));
    }
    if (category) conditions.push(eq(foods.category, category));

    const rows = await getDb()
      .select()
      .from(foods)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(foods.name))
      .limit(limit);
    return c.json({ foods: rows });
  })
  .post("/", zValidator("json", createFoodSchema, zodErrorHook), async (c) => {
    const body = c.req.valid("json");
    const database = getDb();
    const id = crypto.randomUUID();
    try {
      await database.insert(foods).values({
        id,
        code: body.code ?? null,
        name: body.name,
        category: body.category,
        energyKcal: body.energyKcal,
        proteinG: body.proteinG,
        fatG: body.fatG,
        carbG: body.carbG,
        fiberG: body.fiberG,
        ironMg: body.ironMg,
        ediblePct: body.ediblePct,
        allergens: body.allergens,
        isCustom: true,
      });
    } catch (error) {
      mapDbError(error, { duplicate: "Kode bahan sudah dipakai." });
    }
    return c.json({ food: await findFood(id) }, 201);
  })
  .put("/:id", zValidator("json", updateFoodSchema, zodErrorHook), async (c) => {
    const food = await findFood(c.req.param("id"));
    assertCustom(food);
    const body = c.req.valid("json");

    const changes: Partial<typeof foods.$inferInsert> = {};
    if (body.code !== undefined) changes.code = body.code;
    if (body.name !== undefined) changes.name = body.name;
    if (body.category !== undefined) changes.category = body.category;
    if (body.energyKcal !== undefined) changes.energyKcal = body.energyKcal;
    if (body.proteinG !== undefined) changes.proteinG = body.proteinG;
    if (body.fatG !== undefined) changes.fatG = body.fatG;
    if (body.carbG !== undefined) changes.carbG = body.carbG;
    if (body.fiberG !== undefined) changes.fiberG = body.fiberG;
    if (body.ironMg !== undefined) changes.ironMg = body.ironMg;
    if (body.ediblePct !== undefined) changes.ediblePct = body.ediblePct;
    if (body.allergens !== undefined) changes.allergens = body.allergens;

    if (Object.keys(changes).length > 0) {
      try {
        await getDb().update(foods).set(changes).where(eq(foods.id, food.id));
      } catch (error) {
        mapDbError(error, { duplicate: "Kode bahan sudah dipakai." });
      }
    }
    return c.json({ food: await findFood(food.id) });
  })
  .delete("/:id", async (c) => {
    const food = await findFood(c.req.param("id"));
    assertCustom(food);
    try {
      await getDb().delete(foods).where(eq(foods.id, food.id));
    } catch (error) {
      mapDbError(error, { referenced: "Bahan masih dipakai pada menu dan tidak dapat dihapus." });
    }
    return c.json({ ok: true as const });
  });
