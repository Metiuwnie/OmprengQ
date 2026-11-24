import { zValidator } from "@hono/zod-validator";
import { DATE_REGEX, type Allergen, type Level, type NutrientTotals } from "@mbg/shared";
import { and, asc, eq, gt, gte, inArray, lte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getDb, type AppDatabase } from "../db/client.js";
import { foods, menuItems, menuPortions, menus, schools } from "../db/schema/index.js";
import { addDaysIso, getMondayOfWeek, getTodayInTimezone } from "../lib/date-timezone.js";
import { zodErrorHook } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";

const PUBLIC_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=600";

const weekQuerySchema = z.object({
  start: z.string().regex(DATE_REGEX, "Format tanggal harus YYYY-MM-DD").optional(),
});

export interface PublicPortionItem {
  label: string;
  grams: number;
  visualUnit: string | null;
  category: string;
  benefit: string | null;
}

export interface PublicPortion {
  totals: NutrientTotals;
  allergens: Allergen[];
  items: PublicPortionItem[];
}

export interface PublicMenuPayload {
  id: string;
  date: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  funFact: string | null;
  portions: Partial<Record<Level, PublicPortion>>;
}

async function findActiveSchoolBySlug(database: AppDatabase, rawSlug: string) {
  const slug = rawSlug.trim().toLowerCase();
  const rows = await database
    .select()
    .from(schools)
    .where(and(eq(schools.slug, slug), eq(schools.active, true)))
    .limit(1);

  const school = rows[0];
  if (!school) {
    throw new AppError(404, "SCHOOL_NOT_FOUND", "Sekolah tidak ditemukan atau tidak aktif.");
  }
  return school;
}

async function hydrateMenus(
  database: AppDatabase,
  menuRows: Array<typeof menus.$inferSelect>,
): Promise<PublicMenuPayload[]> {
  if (menuRows.length === 0) return [];

  const menuIds = menuRows.map((m) => m.id);
  const portionRows = await database
    .select()
    .from(menuPortions)
    .where(inArray(menuPortions.menuId, menuIds));

  const portionIds = portionRows.map((p) => p.id);
  const itemRows = portionIds.length
    ? await database
        .select({
          item: menuItems,
          foodName: foods.name,
          foodCategory: foods.category,
        })
        .from(menuItems)
        .innerJoin(foods, eq(menuItems.foodId, foods.id))
        .where(inArray(menuItems.portionId, portionIds))
    : [];

  return menuRows.map((menu) => {
    const portions: Partial<Record<Level, PublicPortion>> = {};
    for (const portion of portionRows) {
      if (portion.menuId !== menu.id) continue;
      portions[portion.level] = {
        totals: portion.totals,
        allergens: portion.allergens,
        items: itemRows
          .filter((row) => row.item.portionId === portion.id)
          .map((row) => ({
            label: row.item.label?.trim() || row.foodName,
            grams: row.item.grams,
            visualUnit: row.item.visualUnit ?? null,
            category: row.foodCategory,
            benefit: row.item.benefit ?? null,
          })),
      };
    }

    return {
      id: menu.id,
      date: menu.date,
      name: menu.name,
      description: menu.description ?? null,
      photoUrl: menu.photoUrl ?? null,
      funFact: menu.funFact ?? null,
      portions,
    };
  });
}

function toPublicSchool(school: typeof schools.$inferSelect) {
  return {
    name: school.name,
    slug: school.slug,
    levels: school.levels,
    timezone: school.timezone,
  };
}

/** `/api/public` — read-only, cache-friendly endpoints without login or cookies. */
export const publicRoutes = new Hono()
  .get("/schools/:slug", async (c) => {
    const school = await findActiveSchoolBySlug(getDb(), c.req.param("slug"));
    c.header("Cache-Control", PUBLIC_CACHE_CONTROL);
    return c.json({ school: toPublicSchool(school) });
  })
  .get("/schools/:slug/today", async (c) => {
    const database = getDb();
    const school = await findActiveSchoolBySlug(database, c.req.param("slug"));
    const date = getTodayInTimezone(school.timezone);

    const todayRows = await database
      .select()
      .from(menus)
      .where(
        and(
          eq(menus.sppgId, school.sppgId),
          eq(menus.date, date),
          eq(menus.status, "published"),
        ),
      )
      .limit(1);

    c.header("Cache-Control", PUBLIC_CACHE_CONTROL);

    if (todayRows[0]) {
      const [menu] = await hydrateMenus(database, [todayRows[0]]);
      return c.json({
        school: toPublicSchool(school),
        date,
        menu: menu!,
        next: null as PublicMenuPayload | null,
      });
    }

    const nextRows = await database
      .select()
      .from(menus)
      .where(
        and(
          eq(menus.sppgId, school.sppgId),
          gt(menus.date, date),
          eq(menus.status, "published"),
        ),
      )
      .orderBy(asc(menus.date))
      .limit(1);

    const nextHydrated = nextRows[0] ? (await hydrateMenus(database, [nextRows[0]]))[0] ?? null : null;

    return c.json({
      school: toPublicSchool(school),
      date,
      menu: null as PublicMenuPayload | null,
      next: nextHydrated,
    });
  })
  .get(
    "/schools/:slug/week",
    zValidator("query", weekQuerySchema, zodErrorHook),
    async (c) => {
      const database = getDb();
      const school = await findActiveSchoolBySlug(database, c.req.param("slug"));
      const { start: requestedStart } = c.req.valid("query");
      const today = getTodayInTimezone(school.timezone);
      const start = requestedStart ?? getMondayOfWeek(today);
      const end = addDaysIso(start, 6);

      const menuRows = await database
        .select()
        .from(menus)
        .where(
          and(
            eq(menus.sppgId, school.sppgId),
            gte(menus.date, start),
            lte(menus.date, end),
            eq(menus.status, "published"),
          ),
        )
        .orderBy(asc(menus.date));

      const hydrated = await hydrateMenus(database, menuRows);
      c.header("Cache-Control", PUBLIC_CACHE_CONTROL);
      return c.json({
        school: toPublicSchool(school),
        today,
        start,
        end,
        menus: hydrated,
      });
    },
  );
