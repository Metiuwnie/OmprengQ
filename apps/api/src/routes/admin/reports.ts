import { zValidator } from "@hono/zod-validator";
import {
  LEVELS,
  reportQuerySchema,
  USAGE_EVENT_TYPES,
  type Level,
  type UsageEventType,
} from "@mbg/shared";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../../db/client.js";
import { menuPortions, menus, schools, usageEvents } from "../../db/schema/index.js";
import { addDaysIso, getTodayInTimezone } from "../../lib/date-timezone.js";
import { resolveTargetSppgId } from "../../lib/tenant.js";
import { zodErrorHook } from "../../lib/validation.js";
import { requireAuth, requireRole, type AuthContextVariables } from "../../middleware/auth.js";

/** Representative MBG lunch portion benchmark (~35% of daily AKG per level). */
const MBG_LUNCH_TARGETS: Record<
  Level,
  { energyKcal: number; proteinG: number; fiberG: number; ironMg: number }
> = {
  sd_low: { energyKcal: 575, proteinG: 14, fiberG: 8, ironMg: 3.5 },
  sd_high: { energyKcal: 700, proteinG: 19, fiberG: 10, ironMg: 4.5 },
  smp: { energyKcal: 780, proteinG: 23, fiberG: 11, ironMg: 5.5 },
  sma: { energyKcal: 830, proteinG: 25, fiberG: 12, ironMg: 5.5 },
};

/** `/api/admin/reports` — anonymous aggregate usage & published menu nutrition reports. */
export const reportRoutes = new Hono<{ Variables: AuthContextVariables }>()
  .use("*", requireAuth, requireRole("super_admin", "sppg_admin", "school_admin"))
  .get("/summary", zValidator("query", reportQuerySchema, zodErrorHook), async (c) => {
    const user = c.get("user");
    const query = c.req.valid("query");
    const database = getDb();

    const today = getTodayInTimezone("Asia/Jakarta");
    const to = query.to ?? today;
    const from = query.from ?? addDaysIso(to, -13);

    const sppgId = resolveTargetSppgId(user, query.sppgId);

    const schoolRows = await database
      .select({ id: schools.id, name: schools.name, slug: schools.slug })
      .from(schools)
      .where(
        user.role === "school_admin" && user.schoolId
          ? and(eq(schools.sppgId, sppgId), eq(schools.id, user.schoolId))
          : eq(schools.sppgId, sppgId),
      )
      .orderBy(asc(schools.name));

    const allowedSchoolIds = schoolRows.map((s) => s.id);
    const filteredSchoolIds =
      query.schoolId && allowedSchoolIds.includes(query.schoolId)
        ? [query.schoolId]
        : allowedSchoolIds;

    const usageTotals: Record<UsageEventType, number> = {
      menu_view: 0,
      share_wa: 0,
      calculator_open: 0,
      quiz_done: 0,
    };

    const dailyMap = new Map<
      string,
      {
        date: string;
        menu_view: number;
        share_wa: number;
        calculator_open: number;
        quiz_done: number;
      }
    >();

    if (filteredSchoolIds.length > 0) {
      const eventRows = await database
        .select()
        .from(usageEvents)
        .where(
          and(
            inArray(usageEvents.schoolId, filteredSchoolIds),
            gte(usageEvents.date, from),
            lte(usageEvents.date, to),
          ),
        )
        .orderBy(asc(usageEvents.date));

      for (const row of eventRows) {
        if (!USAGE_EVENT_TYPES.includes(row.eventType)) continue;
        usageTotals[row.eventType] += row.count;
        const entry = dailyMap.get(row.date) ?? {
          date: row.date,
          menu_view: 0,
          share_wa: 0,
          calculator_open: 0,
          quiz_done: 0,
        };
        entry[row.eventType] += row.count;
        dailyMap.set(row.date, entry);
      }
    }

    const publishedMenus = await database
      .select({ id: menus.id })
      .from(menus)
      .where(
        and(
          eq(menus.sppgId, sppgId),
          eq(menus.status, "published"),
          gte(menus.date, from),
          lte(menus.date, to),
        ),
      );

    const portionRows =
      publishedMenus.length > 0
        ? await database
            .select()
            .from(menuPortions)
            .where(
              inArray(
                menuPortions.menuId,
                publishedMenus.map((m) => m.id),
              ),
            )
        : [];

    const nutritionByLevel = LEVELS.map((level) => {
      const rows = portionRows.filter((p) => p.level === level);
      const count = rows.length;
      const sum = rows.reduce(
        (acc, p) => ({
          energyKcal: acc.energyKcal + p.totals.energyKcal,
          proteinG: acc.proteinG + p.totals.proteinG,
          fiberG: acc.fiberG + p.totals.fiberG,
          ironMg: acc.ironMg + p.totals.ironMg,
        }),
        { energyKcal: 0, proteinG: 0, fiberG: 0, ironMg: 0 },
      );

      return {
        level,
        menuCount: count,
        avgEnergyKcal: count ? Math.round(sum.energyKcal / count) : 0,
        avgProteinG: count ? Number((sum.proteinG / count).toFixed(1)) : 0,
        avgFiberG: count ? Number((sum.fiberG / count).toFixed(1)) : 0,
        avgIronMg: count ? Number((sum.ironMg / count).toFixed(1)) : 0,
        target: MBG_LUNCH_TARGETS[level],
      };
    });

    return c.json({
      range: { from, to },
      schools: schoolRows,
      usageTotals,
      dailyUsage: Array.from(dailyMap.values()),
      nutritionByLevel,
    });
  });
