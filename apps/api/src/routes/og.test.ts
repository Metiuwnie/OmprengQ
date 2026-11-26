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
const TEST_SPPG_NAME = `Uji M6 SPPG ${SUFFIX}`;
const TEST_SLUG = `uji-m6-sd-${SUFFIX}`;

describe("Open Graph preview routes (/api/og)", () => {
  let testSppgId = "";
  let todayJakarta = "";
  let menuId = "";

  async function cleanup() {
    const database = getDb();
    if (testSppgId) {
      await database.delete(menus).where(eq(menus.sppgId, testSppgId));
      await database.delete(schools).where(eq(schools.sppgId, testSppgId));
    }
    await database.delete(sppg).where(like(sppg.name, "Uji M6 SPPG%"));
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
      region: "Uji M6",
    });

    await database.insert(schools).values({
      id: crypto.randomUUID(),
      sppgId: testSppgId,
      name: "SDN Uji & <M6>",
      slug: TEST_SLUG,
      levels: ["sd_low"],
      timezone: "Asia/Jakarta",
      active: true,
    });

    const seededFoods = await database
      .select()
      .from(foods)
      .where(inArray(foods.code, ["TKPI-SAMPLE-NASI-PUTIH", "TKPI-SAMPLE-TELUR-AYAM"]));
    const riceId = seededFoods.find((f) => f.code === "TKPI-SAMPLE-NASI-PUTIH")!.id;
    const eggId = seededFoods.find((f) => f.code === "TKPI-SAMPLE-TELUR-AYAM")!.id;

    menuId = crypto.randomUUID();
    await database.insert(menus).values({
      id: menuId,
      sppgId: testSppgId,
      date: todayJakarta,
      name: "Nasi & <Ayam> Spesial",
      status: "draft",
    });

    await savePortion(database, menuId, "sd_low", [
      { foodId: riceId, grams: 100, label: "Nasi putih" },
      { foodId: eggId, grams: 55, label: "Telur rebus" },
    ]);
  });

  afterAll(async () => {
    await cleanup();
    await closeDb();
  });

  it("returns 404 HTML when school slug is unknown", async () => {
    const res = await app.request("/api/og/s/tidak-ada-sekolah/hari-ini");
    expect(res.status).toBe(404);
    const html = await res.text();
    expect(html).toContain("Sekolah tidak ditemukan");
  });

  it("never exposes draft menus in OG tags", async () => {
    const res = await app.request(`/api/og/s/${TEST_SLUG}/hari-ini`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).not.toContain("Nasi &amp; &lt;Ayam&gt; Spesial");
    expect(html).toContain("og:title");
    expect(html).toContain("og:description");
  });

  it("returns escaped OG metadata with nutrition summary and calculator redirect for published menu", async () => {
    const database = getDb();
    await database.update(menus).set({ status: "published" }).where(eq(menus.id, menuId));

    const res = await app.request(`/api/og/s/${TEST_SLUG}/hari-ini?to=kalkulator`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("max-age=300");

    const html = await res.text();
    expect(html).toContain('property="og:title"');
    expect(html).toContain("SDN Uji &amp; &lt;M6&gt;");
    expect(html).toContain("Nasi &amp; &lt;Ayam&gt; Spesial");
    expect(html).toContain("kkal");
    expect(html).toContain(`kalkulator?school=${TEST_SLUG}`);
  });
});
