import { zValidator } from "@hono/zod-validator";
import {
  copyMenuSchema,
  createMenuSchema,
  DATE_REGEX,
  levelSchema,
  putPortionSchema,
  updateMenuSchema,
} from "@mbg/shared";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../../db/client.js";
import { menuPortions, menus } from "../../db/schema/index.js";
import {
  assertTenantAccess,
  mapDbError,
  resolveReadableSppgId,
  resolveTargetSppgId,
} from "../../lib/tenant.js";
import { zodErrorHook } from "../../lib/validation.js";
import { requireAuth, requireRole, type AuthContextVariables } from "../../middleware/auth.js";
import { AppError } from "../../middleware/error.js";
import {
  copyMenuToDate,
  countMenuItems,
  loadMenuDetail,
  savePortion,
} from "../../services/menu-nutrition.js";

const dateParam = z.string().regex(DATE_REGEX, "Format tanggal harus YYYY-MM-DD");
const listQuerySchema = z.object({
  from: dateParam.optional(),
  to: dateParam.optional(),
  sppgId: z.string().uuid().optional(),
});
const deleteQuerySchema = z.object({ confirm: z.enum(["true", "false"]).optional() });

const DUPLICATE_DATE = "Sudah ada menu pada tanggal tersebut untuk SPPG ini.";

async function findMenu(id: string) {
  const rows = await getDb().select().from(menus).where(eq(menus.id, id)).limit(1);
  const menu = rows[0];
  if (!menu) throw new AppError(404, "NOT_FOUND", "Menu tidak ditemukan.");
  return menu;
}

/** `/api/admin/menus` — daily menus per SPPG (one per date), portions per level, publish and copy. */
export const menuRoutes = new Hono<{ Variables: AuthContextVariables }>()
  .use("*", requireAuth)
  .get(
    "/",
    requireRole("super_admin", "sppg_admin", "school_admin"),
    zValidator("query", listQuerySchema, zodErrorHook),
    async (c) => {
      const user = c.get("user");
      const { from, to, sppgId } = c.req.valid("query");
      const readableSppgId = resolveReadableSppgId(user, sppgId);

      const conditions = [];
      if (readableSppgId) conditions.push(eq(menus.sppgId, readableSppgId));
      if (from) conditions.push(gte(menus.date, from));
      if (to) conditions.push(lte(menus.date, to));

      const database = getDb();
      const menuRows = await database
        .select()
        .from(menus)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(menus.date));

      const ids = menuRows.map((menu) => menu.id);
      const portionRows = ids.length
        ? await database.select().from(menuPortions).where(inArray(menuPortions.menuId, ids))
        : [];

      return c.json({
        menus: menuRows.map((menu) => ({
          ...menu,
          portions: portionRows
            .filter((portion) => portion.menuId === menu.id)
            .map((portion) => ({
              level: portion.level,
              totals: portion.totals,
              allergens: portion.allergens,
            })),
        })),
      });
    },
  )
  .post(
    "/copy",
    requireRole("super_admin", "sppg_admin"),
    zValidator("json", copyMenuSchema, zodErrorHook),
    async (c) => {
      const user = c.get("user");
      const { menuId, targetDate } = c.req.valid("json");
      const source = await findMenu(menuId);
      assertTenantAccess(user, source.sppgId);

      const occupied = await getDb()
        .select({ id: menus.id })
        .from(menus)
        .where(and(eq(menus.sppgId, source.sppgId), eq(menus.date, targetDate)))
        .limit(1);
      if (occupied[0]) throw new AppError(409, "DUPLICATE", DUPLICATE_DATE);

      try {
        const created = await copyMenuToDate(getDb(), source.id, targetDate);
        return c.json({ menu: created! }, 201);
      } catch (error) {
        mapDbError(error, { duplicate: DUPLICATE_DATE });
      }
    },
  )
  .get("/:id", requireRole("super_admin", "sppg_admin", "school_admin"), async (c) => {
    const user = c.get("user");
    const menu = await findMenu(c.req.param("id"));
    assertTenantAccess(user, menu.sppgId);
    const detail = await loadMenuDetail(getDb(), menu.id);
    return c.json(detail!);
  })
  .post(
    "/",
    requireRole("super_admin", "sppg_admin"),
    zValidator("json", createMenuSchema, zodErrorHook),
    async (c) => {
      const user = c.get("user");
      const body = c.req.valid("json");
      const sppgId = resolveTargetSppgId(user, body.sppgId);

      const database = getDb();
      const id = crypto.randomUUID();
      try {
        await database.insert(menus).values({
          id,
          sppgId,
          date: body.date,
          name: body.name,
          description: body.description ?? null,
          photoUrl: body.photoUrl ?? null,
          funFact: body.funFact ?? null,
          status: "draft",
        });
      } catch (error) {
        mapDbError(error, { duplicate: DUPLICATE_DATE });
      }
      return c.json({ menu: await findMenu(id) }, 201);
    },
  )
  .put(
    "/:id",
    requireRole("super_admin", "sppg_admin"),
    zValidator("json", updateMenuSchema, zodErrorHook),
    async (c) => {
      const user = c.get("user");
      const menu = await findMenu(c.req.param("id"));
      assertTenantAccess(user, menu.sppgId);
      const body = c.req.valid("json");

      const changes: Partial<typeof menus.$inferInsert> = {};
      if (body.date !== undefined) changes.date = body.date;
      if (body.name !== undefined) changes.name = body.name;
      if (body.description !== undefined) changes.description = body.description;
      if (body.photoUrl !== undefined) changes.photoUrl = body.photoUrl;
      if (body.funFact !== undefined) changes.funFact = body.funFact;

      if (Object.keys(changes).length > 0) {
        try {
          await getDb().update(menus).set(changes).where(eq(menus.id, menu.id));
        } catch (error) {
          mapDbError(error, { duplicate: DUPLICATE_DATE });
        }
      }
      return c.json({ menu: await findMenu(menu.id) });
    },
  )
  .delete(
    "/:id",
    requireRole("super_admin", "sppg_admin"),
    zValidator("query", deleteQuerySchema, zodErrorHook),
    async (c) => {
      const user = c.get("user");
      const menu = await findMenu(c.req.param("id"));
      assertTenantAccess(user, menu.sppgId);
      const { confirm } = c.req.valid("query");

      if (menu.status === "published" && confirm !== "true") {
        throw new AppError(
          400,
          "CONFIRMATION_REQUIRED",
          "Menu ini sudah dipublikasikan. Konfirmasi penghapusan diperlukan.",
        );
      }
      await getDb().delete(menus).where(eq(menus.id, menu.id));
      return c.json({ ok: true as const });
    },
  )
  .put(
    "/:id/portions/:level",
    requireRole("super_admin", "sppg_admin"),
    zValidator("json", putPortionSchema, zodErrorHook),
    async (c) => {
      const user = c.get("user");
      const menu = await findMenu(c.req.param("id"));
      assertTenantAccess(user, menu.sppgId);

      const level = levelSchema.safeParse(c.req.param("level"));
      if (!level.success) {
        throw new AppError(400, "VALIDATION_ERROR", "Jenjang tidak valid.");
      }
      const { items } = c.req.valid("json");
      const summary = await savePortion(getDb(), menu.id, level.data, items);
      return c.json({ level: level.data, ...summary });
    },
  )
  .post("/:id/publish", requireRole("super_admin", "sppg_admin"), async (c) => {
    const user = c.get("user");
    const menu = await findMenu(c.req.param("id"));
    assertTenantAccess(user, menu.sppgId);

    if ((await countMenuItems(getDb(), menu.id)) === 0) {
      throw new AppError(
        400,
        "EMPTY_MENU",
        "Tambahkan minimal satu bahan sebelum menu dipublikasikan.",
      );
    }
    await getDb().update(menus).set({ status: "published" }).where(eq(menus.id, menu.id));
    return c.json({ menu: await findMenu(menu.id) });
  });
