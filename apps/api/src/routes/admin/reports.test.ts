import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../app.js";
import { closeDb, getDb } from "../../db/client.js";
import { runSeed } from "../../db/seed/index.js";
import { foods, menus, schools, sppg, usageEvents, users } from "../../db/schema/index.js";
import { ensureEnvLoaded } from "../../lib/env.js";
import { savePortion } from "../../services/menu-nutrition.js";
import { hashPassword } from "../../services/password.js";

const SUFFIX = Date.now().toString(36);
const SPPG_NAME = `Uji M9 SPPG ${SUFFIX}`;
const SCHOOL_SLUG = `uji-m9-sd-${SUFFIX}`;
const ADMIN_EMAIL = `uji-m9-${SUFFIX}@omprengq.local`;
const ADMIN_PASS = "sandi-uji-m9";

function extractCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  return setCookie ? setCookie.split(";")[0]! : "";
}

describe("M9 anonymous events & admin reports", () => {
  let testSppgId = "";
  let adminCookie = "";

  async function cleanup() {
    const db = getDb();
    if (testSppgId) {
      await db.delete(menus).where(eq(menus.sppgId, testSppgId));
      await db.delete(schools).where(eq(schools.sppgId, testSppgId));
      await db.delete(users).where(eq(users.sppgId, testSppgId));
    }
    await db.delete(sppg).where(like(sppg.name, "Uji M9 SPPG%"));
  }

  beforeAll(async () => {
    ensureEnvLoaded();
    const db = getDb();
    await runSeed(db);
    await cleanup();

    testSppgId = crypto.randomUUID();
    await db.insert(sppg).values({ id: testSppgId, name: SPPG_NAME, region: "M9" });
    await db.insert(schools).values({
      id: crypto.randomUUID(),
      sppgId: testSppgId,
      name: "SDN Uji M9",
      slug: SCHOOL_SLUG,
      levels: ["sd_low", "sd_high"],
      timezone: "Asia/Jakarta",
      active: true,
    });
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email: ADMIN_EMAIL,
      passwordHash: await hashPassword(ADMIN_PASS),
      name: "Admin M9",
      role: "sppg_admin",
      sppgId: testSppgId,
      schoolId: null,
    });

    const [rice] = await db
      .select()
      .from(foods)
      .where(eq(foods.code, "TKPI-SAMPLE-NASI-PUTIH"))
      .limit(1);

    const menuId = crypto.randomUUID();
    await db.insert(menus).values({
      id: menuId,
      sppgId: testSppgId,
      date: "2026-11-20",
      name: "Nasi Putih",
      status: "published",
    });
    if (rice) {
      await savePortion(db, menuId, "sd_low", [{ foodId: rice.id, grams: 150 }]);
    }

    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
    });
    adminCookie = extractCookie(loginRes);
  });

  afterAll(async () => {
    await cleanup();
    await closeDb();
  });

  it("rejects profile/extra fields on POST /api/public/events and aggregates daily counts", async () => {
    const badRes = await app.request("/api/public/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolSlug: SCHOOL_SLUG,
        date: "2026-11-20",
        type: "menu_view",
        nickname: "Budi",
      }),
    });
    expect(badRes.status).toBe(400);

    const ok1 = await app.request("/api/public/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolSlug: SCHOOL_SLUG, date: "2026-11-20", type: "menu_view" }),
    });
    const ok2 = await app.request("/api/public/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolSlug: SCHOOL_SLUG, date: "2026-11-20", type: "menu_view" }),
    });
    const ok3 = await app.request("/api/public/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolSlug: SCHOOL_SLUG, date: "2026-11-20", type: "quiz_done" }),
    });

    expect(ok1.status).toBe(202);
    expect(ok2.status).toBe(202);
    expect(ok3.status).toBe(202);

    const [schoolRow] = await getDb()
      .select()
      .from(schools)
      .where(eq(schools.slug, SCHOOL_SLUG))
      .limit(1);
    const eventRows = await getDb()
      .select()
      .from(usageEvents)
      .where(eq(usageEvents.schoolId, schoolRow!.id));
    expect(eventRows).toHaveLength(2);
  });

  it("requires auth and returns usage + nutrition report summary", async () => {
    const unauth = await app.request("/api/admin/reports/summary");
    expect(unauth.status).toBe(401);

    const res = await app.request(
      "/api/admin/reports/summary?from=2026-11-19&to=2026-11-21",
      { headers: { Cookie: adminCookie } },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      usageTotals: Record<string, number>;
      dailyUsage: Array<{ date: string; menu_view: number; quiz_done: number }>;
      nutritionByLevel: Array<{ level: string; menuCount: number; avgEnergyKcal: number }>;
    };

    expect(body.usageTotals.menu_view).toBe(2);
    expect(body.usageTotals.quiz_done).toBe(1);
    expect(body.dailyUsage).toHaveLength(1);
    expect(body.dailyUsage[0]?.menu_view).toBe(2);
    const sdLow = body.nutritionByLevel.find((row) => row.level === "sd_low");
    expect(sdLow?.menuCount).toBe(1);
    expect(sdLow?.avgEnergyKcal).toBeGreaterThan(0);
  });
});
