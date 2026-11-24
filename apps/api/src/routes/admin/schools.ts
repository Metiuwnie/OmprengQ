import { zValidator } from "@hono/zod-validator";
import {
  createSchoolSchema,
  slugifySchoolName,
  SLUG_REGEX,
  updateSchoolSchema,
} from "@mbg/shared";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../../db/client.js";
import { schools } from "../../db/schema/index.js";
import {
  assertTenantAccess,
  mapDbError,
  resolveReadableSppgId,
  resolveTargetSppgId,
} from "../../lib/tenant.js";
import { zodErrorHook } from "../../lib/validation.js";
import { requireAuth, requireRole, type AuthContextVariables } from "../../middleware/auth.js";
import { AppError } from "../../middleware/error.js";
import { generateSchoolQr } from "../../services/qr.js";

const listQuerySchema = z.object({ sppgId: z.string().uuid().optional() });
const qrQuerySchema = z.object({
  format: z.enum(["png", "svg"]).default("png"),
  size: z.coerce.number().int().optional(),
});

async function findSchool(id: string) {
  const rows = await getDb().select().from(schools).where(eq(schools.id, id)).limit(1);
  const school = rows[0];
  if (!school) throw new AppError(404, "NOT_FOUND", "Sekolah tidak ditemukan.");
  return school;
}

/** `/api/admin/schools`. */
export const schoolRoutes = new Hono<{ Variables: AuthContextVariables }>()
  .use("*", requireAuth)
  .get(
    "/",
    requireRole("super_admin", "sppg_admin", "school_admin"),
    zValidator("query", listQuerySchema, zodErrorHook),
    async (c) => {
      const user = c.get("user");
      const { sppgId } = c.req.valid("query");
      const readableSppgId = resolveReadableSppgId(user, sppgId);

      const conditions = [];
      if (readableSppgId) conditions.push(eq(schools.sppgId, readableSppgId));
      if (user.role === "school_admin") {
        if (!user.schoolId) throw new AppError(403, "FORBIDDEN", "Akun belum terhubung ke sekolah.");
        conditions.push(eq(schools.id, user.schoolId));
      }

      const rows = await getDb()
        .select()
        .from(schools)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(schools.name));
      return c.json({ schools: rows });
    },
  )
  .post(
    "/",
    requireRole("super_admin", "sppg_admin"),
    zValidator("json", createSchoolSchema, zodErrorHook),
    async (c) => {
      const user = c.get("user");
      const body = c.req.valid("json");
      const sppgId = resolveTargetSppgId(user, body.sppgId);

      const slug = body.slug ?? slugifySchoolName(body.name);
      if (!slug || !SLUG_REGEX.test(slug)) {
        throw new AppError(400, "VALIDATION_ERROR", "Slug sekolah tidak valid. Isi slug secara manual.");
      }

      const database = getDb();
      const id = crypto.randomUUID();
      try {
        await database.insert(schools).values({
          id,
          sppgId,
          name: body.name,
          slug,
          levels: body.levels,
          timezone: body.timezone,
          active: body.active,
        });
      } catch (error) {
        mapDbError(error, { duplicate: "Slug sekolah sudah dipakai. Gunakan slug lain." });
      }
      return c.json({ school: await findSchool(id) }, 201);
    },
  )
  .put(
    "/:id",
    requireRole("super_admin", "sppg_admin"),
    zValidator("json", updateSchoolSchema, zodErrorHook),
    async (c) => {
      const user = c.get("user");
      const school = await findSchool(c.req.param("id"));
      assertTenantAccess(user, school.sppgId);
      const body = c.req.valid("json");

      const changes: Partial<typeof schools.$inferInsert> = {};
      if (body.name !== undefined) changes.name = body.name;
      if (body.slug !== undefined) changes.slug = body.slug;
      if (body.levels !== undefined) changes.levels = body.levels;
      if (body.timezone !== undefined) changes.timezone = body.timezone;
      if (body.active !== undefined) changes.active = body.active;

      if (Object.keys(changes).length > 0) {
        try {
          await getDb().update(schools).set(changes).where(eq(schools.id, school.id));
        } catch (error) {
          mapDbError(error, { duplicate: "Slug sekolah sudah dipakai. Gunakan slug lain." });
        }
      }
      return c.json({ school: await findSchool(school.id) });
    },
  )
  .delete("/:id", requireRole("super_admin", "sppg_admin"), async (c) => {
    const user = c.get("user");
    const school = await findSchool(c.req.param("id"));
    assertTenantAccess(user, school.sppgId);
    try {
      await getDb().delete(schools).where(eq(schools.id, school.id));
    } catch (error) {
      mapDbError(error, { referenced: "Sekolah masih dipakai oleh akun admin sekolah." });
    }
    return c.json({ ok: true as const });
  })
  .get(
    "/:id/qr",
    requireRole("super_admin", "sppg_admin", "school_admin"),
    zValidator("query", qrQuerySchema, zodErrorHook),
    async (c) => {
      const user = c.get("user");
      const school = await findSchool(c.req.param("id"));
      assertTenantAccess(user, school.sppgId, school.id);
      const { format, size } = c.req.valid("query");

      const qr = await generateSchoolQr({ slug: school.slug, format, size });
      const contentType = format === "svg" ? "image/svg+xml; charset=utf-8" : "image/png";
      const body = typeof qr === "string" ? qr : new Uint8Array(qr);
      return c.body(body, 200, {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      });
    },
  );
