import { zValidator } from "@hono/zod-validator";
import { createSppgSchema, updateSppgSchema } from "@mbg/shared";
import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../../db/client.js";
import { sppg } from "../../db/schema/index.js";
import { zodErrorHook } from "../../lib/validation.js";
import { mapDbError } from "../../lib/tenant.js";
import { requireAuth, requireRole, type AuthContextVariables } from "../../middleware/auth.js";
import { AppError } from "../../middleware/error.js";

/** `/api/admin/sppg` (super_admin only). */
export const sppgRoutes = new Hono<{ Variables: AuthContextVariables }>()
  .use("*", requireAuth, requireRole("super_admin"))
  .get("/", async (c) => {
    const rows = await getDb().select().from(sppg).orderBy(asc(sppg.name));
    return c.json({ sppg: rows });
  })
  .post("/", zValidator("json", createSppgSchema, zodErrorHook), async (c) => {
    const body = c.req.valid("json");
    const database = getDb();
    const id = crypto.randomUUID();
    await database.insert(sppg).values({ id, name: body.name, region: body.region ?? null });
    const rows = await database.select().from(sppg).where(eq(sppg.id, id)).limit(1);
    return c.json({ sppg: rows[0]! }, 201);
  })
  .put("/:id", zValidator("json", updateSppgSchema, zodErrorHook), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const database = getDb();

    const existing = await database.select().from(sppg).where(eq(sppg.id, id)).limit(1);
    if (!existing[0]) throw new AppError(404, "NOT_FOUND", "SPPG tidak ditemukan.");

    const changes: Partial<typeof sppg.$inferInsert> = {};
    if (body.name !== undefined) changes.name = body.name;
    if (body.region !== undefined) changes.region = body.region;
    if (Object.keys(changes).length > 0) {
      await database.update(sppg).set(changes).where(eq(sppg.id, id));
    }
    const rows = await database.select().from(sppg).where(eq(sppg.id, id)).limit(1);
    return c.json({ sppg: rows[0]! });
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const database = getDb();
    const existing = await database.select().from(sppg).where(eq(sppg.id, id)).limit(1);
    if (!existing[0]) throw new AppError(404, "NOT_FOUND", "SPPG tidak ditemukan.");
    try {
      await database.delete(sppg).where(eq(sppg.id, id));
    } catch (error) {
      mapDbError(error, { referenced: "SPPG masih memiliki sekolah, menu, atau akun." });
    }
    return c.json({ ok: true as const });
  });
