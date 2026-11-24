import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../app.js";
import { closeDb, getDb } from "../db/client.js";
import { runSeed } from "../db/seed/index.js";
import { foods, menus, schools, sppg } from "../db/schema/index.js";
import { getTodayInTimezone } from "../lib/date-timezone.js";
import { ensureEnvLoaded } from "../lib/env.js";
import { savePortion } from "../services/menu-nutrition.js";

const SUFFIX = Date.now().toString(36);
const TEST_SPPG_NAME = `Uji M3 SPPG ${SUFFIX}`;
const TEST_SLUG = `uji-m3-sd-${SUFFIX}`;

describe("public routes (/api/public)", () => {
  let testSppgId = "";
  let todayJakarta = "";

  async function cleanup() {
    const database = getDb();
    if (testSppgId) {
      await database.delete(menus).where(eq(menus.sppgId, testSppgId));
      await database.delete(schools).where(eq(schools.sppgId, testSppgId));
    }
    await database.delete(sppg).where(like(sppg.name, "Uji M3 SPPG%"));
  }

  beforeAll(async () => {
    ensureEnvLoaded();
    const database = getDb();
    await runSeed(database);
    await cleanup();

    todayJakarta = getTodayInTimezone("Asia/Jakarta");
    testSppgId = crypto.randomUUID();
    await database.insert(sppg).values({
      id: testSppgId,
      name: TEST_SPPG_NAME,
      region: "Uji M3",
    });

    await database.insert(schools).values({
      id: crypto.randomUUID(),
      sppgId: testSppgId,
      name: "SDN Uji M3",
      slug: TEST_SLUG,
      levels: ["sd_low", "sd_high"],
      timezone: "Asia/Jakarta",
      active: true,
    });

    const seededFoods = await database
      .select()
      .from(foods)
      .where(inArray(foods.code, ["TKPI-SAMPLE-NASI-PUTIH", "TKPI-SAMPLE-TELUR-AYAM"]));
    const riceId = seededFoods.find((f) => f.code === "TKPI-SAMPLE-NASI-PUTIH")!.id;
    const eggId = seededFoods.find((f) => f.code === "TKPI-SAMPLE-TELUR-AYAM")!.id;

    // 1) Draft menu for today (MUST NOT appear on public endpoints)
    const draftId = crypto.randomUUID();
    await database.insert(menus).values({
      id: draftId,
      sppgId: testSppgId,
      date: todayJakarta,
      name: "Menu Draf Rahasia",
      status: "draft",
    });

    // 2) Published menu for a future date (fallback `next`)
    const futureMenuId = crypto.randomUUID();
    await database.insert(menus).values({
      id: futureMenuId,
      sppgId: testSppgId,
      date: "2035-05-15",
      name: "Nasi, Telur Rebus",
      funFact: "Telur membantu pertumbuhan otot!",
      status: "published",
    });
    await savePortion(database, futureMenuId, "sd_low", [
      { foodId: riceId, grams: 100, label: "Nasi putih", visualUnit: "1 centong", benefit: "Sumber tenaga" },
      { foodId: eggId, grams: 55, label: "Telur rebus", visualUnit: "1 butir", benefit: "Kaya protein" },
    ]);
  });

  afterAll(async () => {
    await cleanup();
    await closeDb();
  });

  it("returns 404 for unknown school slug", async () => {
    const res = await app.request("/api/public/schools/tidak-ada-sekolah/today");
    expect(res.status).toBe(404);
  });

  it("never exposes draft menus and returns fallback next menu when today has no published menu", async () => {
    const res = await app.request(`/api/public/schools/${TEST_SLUG}/today`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("max-age=300");

    const body = (await res.json()) as {
      school: { slug: string; timezone: string };
      date: string;
      menu: unknown;
      next: { name: string; portions: Record<string, { allergens: string[]; items: unknown[] }> } | null;
    };
    expect(body.school.slug).toBe(TEST_SLUG);
    expect(body.date).toBe(todayJakarta);
    expect(body.menu).toBeNull();
    expect(body.next).not.toBeNull();
    expect(body.next?.name).toBe("Nasi, Telur Rebus");
    expect(body.next?.portions.sd_low?.allergens).toEqual(["telur"]);
    expect(body.next?.portions.sd_low?.items).toHaveLength(2);
  });

  it("returns published menu for today and weekly schedule without cookies", async () => {
    const database = getDb();
    await database
      .update(menus)
      .set({ status: "published", name: "Menu Terbit Hari Ini" })
      .where(eq(menus.sppgId, testSppgId))
      .limit(1);

    const todayRes = await app.request(`/api/public/schools/${TEST_SLUG}/today`);
    expect(todayRes.status).toBe(200);
    const todayBody = (await todayRes.json()) as {
      menu: { name: string } | null;
      next: unknown;
    };
    expect(todayBody.menu?.name).toBe("Menu Terbit Hari Ini");
    expect(todayBody.next).toBeNull();

    const weekRes = await app.request(`/api/public/schools/${TEST_SLUG}/week?start=2035-05-14`);
    expect(weekRes.status).toBe(200);
    expect(weekRes.headers.get("cache-control")).toContain("max-age=300");
    const weekBody = (await weekRes.json()) as {
      start: string;
      end: string;
      menus: Array<{ name: string; date: string }>;
    };
    expect(weekBody.start).toBe("2035-05-14");
    expect(weekBody.end).toBe("2035-05-20");
    expect(weekBody.menus).toHaveLength(1);
    expect(weekBody.menus[0]?.name).toBe("Nasi, Telur Rebus");
  });
});
