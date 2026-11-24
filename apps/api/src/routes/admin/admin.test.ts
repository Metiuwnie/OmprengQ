import type { AuthUser } from "@mbg/shared";
import { and, gte, inArray, like, lte } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../app.js";
import { closeDb, getDb } from "../../db/client.js";
import { runSeed } from "../../db/seed/index.js";
import { foods, menus, schools, sppg, users } from "../../db/schema/index.js";
import { ensureEnvLoaded } from "../../lib/env.js";
import { SESSION_COOKIE_NAME, signSessionToken } from "../../middleware/auth.js";

const SUFFIX = Date.now().toString(36);
const MENU_DATE_FROM = "2031-03-01";
const MENU_DATE_TO = "2031-03-31";
const SCHOOL_SLUG_PREFIX = "uji-m2-";
const FOOD_CODE_PREFIX = "UJI-M2-";

interface CallOptions {
  method?: string;
  token?: string;
  body?: unknown;
}

function call(path: string, options: CallOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Cookie = `${SESSION_COOKIE_NAME}=${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  return Promise.resolve(
    app.request(path, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    }),
  );
}

async function json<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

describe("admin API (M2): SPPG, schools, foods, menus", () => {
  let superToken = "";
  let sppgToken = "";
  let otherToken = "";
  let demoSppgId = "";
  let otherSppgId = "";
  const food: Record<"rice" | "egg" | "tempe", string> = { rice: "", egg: "", tempe: "" };

  async function cleanup() {
    const database = getDb();
    await database
      .delete(menus)
      .where(and(gte(menus.date, MENU_DATE_FROM), lte(menus.date, MENU_DATE_TO)));
    await database.delete(schools).where(like(schools.slug, `${SCHOOL_SLUG_PREFIX}%`));
    await database.delete(foods).where(like(foods.code, `${FOOD_CODE_PREFIX}%`));
    await database.delete(sppg).where(like(sppg.name, "Uji M2 SPPG%"));
  }

  beforeAll(async () => {
    ensureEnvLoaded();
    const database = getDb();
    await runSeed(database);
    await cleanup();

    const accounts = await database
      .select()
      .from(users)
      .where(inArray(users.email, [
        (process.env.SEED_SUPER_ADMIN_EMAIL ?? "").toLowerCase(),
        (process.env.SEED_SPPG_ADMIN_EMAIL ?? "").toLowerCase(),
      ]));
    const toAuthUser = (row: (typeof accounts)[number]): AuthUser => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      sppgId: row.sppgId ?? null,
      schoolId: row.schoolId ?? null,
    });
    const superRow = accounts.find((row) => row.role === "super_admin")!;
    const sppgRow = accounts.find((row) => row.role === "sppg_admin")!;
    superToken = await signSessionToken(toAuthUser(superRow));
    sppgToken = await signSessionToken(toAuthUser(sppgRow));
    demoSppgId = sppgRow.sppgId!;

    const created = await call("/api/admin/sppg", {
      method: "POST",
      token: superToken,
      body: { name: `Uji M2 SPPG ${SUFFIX}`, region: "Uji" },
    });
    expect(created.status).toBe(201);
    otherSppgId = (await json<{ sppg: { id: string } }>(created)).sppg.id;
    otherToken = await signSessionToken({
      id: "00000000-0000-4000-8000-0000000000aa",
      email: "other@omprengq.local",
      name: "Admin SPPG Lain",
      role: "sppg_admin",
      sppgId: otherSppgId,
      schoolId: null,
    });

    const seeded = await database
      .select()
      .from(foods)
      .where(inArray(foods.code, ["TKPI-SAMPLE-NASI-PUTIH", "TKPI-SAMPLE-TELUR-AYAM", "TKPI-SAMPLE-TEMPE-KEDELAI"]));
    food.rice = seeded.find((row) => row.code === "TKPI-SAMPLE-NASI-PUTIH")!.id;
    food.egg = seeded.find((row) => row.code === "TKPI-SAMPLE-TELUR-AYAM")!.id;
    food.tempe = seeded.find((row) => row.code === "TKPI-SAMPLE-TEMPE-KEDELAI")!.id;
  });

  afterAll(async () => {
    await cleanup();
    await closeDb();
  });

  it("rejects unauthenticated requests", async () => {
    const res = await call("/api/admin/menus");
    expect(res.status).toBe(401);
  });

  it("limits SPPG management to super_admin", async () => {
    expect((await call("/api/admin/sppg", { token: sppgToken })).status).toBe(403);

    const list = await call("/api/admin/sppg", { token: superToken });
    expect(list.status).toBe(200);

    const update = await call(`/api/admin/sppg/${otherSppgId}`, {
      method: "PUT",
      token: superToken,
      body: { region: "Wilayah Uji" },
    });
    expect(update.status).toBe(200);
    expect((await json<{ sppg: { region: string } }>(update)).sppg.region).toBe("Wilayah Uji");
  });

  it("manages schools with auto slug, duplicate protection and tenant isolation", async () => {
    const name = `Uji M2 ${SUFFIX}`;
    const create = await call("/api/admin/schools", {
      method: "POST",
      token: sppgToken,
      body: { name, levels: ["sd_low", "sd_high"] },
    });
    expect(create.status).toBe(201);
    const school = (await json<{ school: { id: string; slug: string; sppgId: string } }>(create)).school;
    expect(school.slug).toBe(`uji-m2-${SUFFIX}`);
    expect(school.sppgId).toBe(demoSppgId);

    const duplicate = await call("/api/admin/schools", {
      method: "POST",
      token: sppgToken,
      body: { name, levels: ["smp"] },
    });
    expect(duplicate.status).toBe(409);

    const empty = await call("/api/admin/schools", {
      method: "POST",
      token: sppgToken,
      body: { name: "Tanpa Jenjang", levels: [] },
    });
    expect(empty.status).toBe(400);

    const foreignList = await json<{ schools: Array<{ id: string }> }>(
      await call("/api/admin/schools", { token: otherToken }),
    );
    expect(foreignList.schools.some((row) => row.id === school.id)).toBe(false);

    const foreignUpdate = await call(`/api/admin/schools/${school.id}`, {
      method: "PUT",
      token: otherToken,
      body: { name: "Dibajak" },
    });
    expect(foreignUpdate.status).toBe(404);
    expect((await call(`/api/admin/schools/${school.id}/qr`, { token: otherToken })).status).toBe(404);

    const png = await call(`/api/admin/schools/${school.id}/qr?format=png&size=256`, { token: sppgToken });
    expect(png.status).toBe(200);
    expect(png.headers.get("content-type")).toContain("image/png");
    const bytes = Buffer.from(await png.arrayBuffer());
    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");

    const svg = await call(`/api/admin/schools/${school.id}/qr?format=svg`, { token: sppgToken });
    expect(svg.headers.get("content-type")).toContain("image/svg+xml");
    expect(await svg.text()).toContain("<svg");
  });

  it("searches foods and only allows editing custom foods", async () => {
    const search = await json<{ foods: Array<{ name: string }> }>(
      await call("/api/admin/foods?q=Nasi%20putih", { token: sppgToken }),
    );
    expect(search.foods.length).toBeGreaterThan(0);

    const create = await call("/api/admin/foods", {
      method: "POST",
      token: sppgToken,
      body: {
        code: `${FOOD_CODE_PREFIX}${SUFFIX}`,
        name: `Bahan Uji ${SUFFIX}`,
        category: "lainnya",
        energyKcal: 100,
        proteinG: 5,
        fatG: 2,
        carbG: 15,
        fiberG: 1,
        ironMg: 0.5,
        allergens: ["kacang"],
      },
    });
    expect(create.status).toBe(201);
    const custom = (await json<{ food: { id: string; isCustom: boolean; energyKcal: number } }>(create)).food;
    expect(custom.isCustom).toBe(true);
    expect(custom.energyKcal).toBe(100);

    const update = await call(`/api/admin/foods/${custom.id}`, {
      method: "PUT",
      token: sppgToken,
      body: { energyKcal: 120 },
    });
    expect(update.status).toBe(200);
    expect((await json<{ food: { energyKcal: number } }>(update)).food.energyKcal).toBe(120);

    expect(
      (await call(`/api/admin/foods/${food.rice}`, { method: "PUT", token: sppgToken, body: { energyKcal: 1 } })).status,
    ).toBe(403);
    expect((await call(`/api/admin/foods/${custom.id}`, { method: "DELETE", token: sppgToken })).status).toBe(200);
  });

  it("creates menus, recalculates portions server-side, publishes, copies and deletes", async () => {
    const create = await call("/api/admin/menus", {
      method: "POST",
      token: sppgToken,
      body: { date: "2031-03-10", name: "Nasi, Telur, Tempe", photoUrl: "" },
    });
    expect(create.status).toBe(201);
    const menu = (await json<{ menu: { id: string; status: string; photoUrl: string | null } }>(create)).menu;
    expect(menu.status).toBe("draft");
    expect(menu.photoUrl).toBeNull();

    const duplicate = await call("/api/admin/menus", {
      method: "POST",
      token: sppgToken,
      body: { date: "2031-03-10", name: "Menu ganda" },
    });
    expect(duplicate.status).toBe(409);

    expect((await call(`/api/admin/menus/${menu.id}`, { token: otherToken })).status).toBe(404);

    expect((await call(`/api/admin/menus/${menu.id}/publish`, { method: "POST", token: sppgToken })).status).toBe(400);

    const badGrams = await call(`/api/admin/menus/${menu.id}/portions/sd_high`, {
      method: "PUT",
      token: sppgToken,
      body: { items: [{ foodId: food.rice, grams: 0 }] },
    });
    expect(badGrams.status).toBe(400);
    const tooMuch = await call(`/api/admin/menus/${menu.id}/portions/sd_high`, {
      method: "PUT",
      token: sppgToken,
      body: { items: [{ foodId: food.rice, grams: 1001 }] },
    });
    expect(tooMuch.status).toBe(400);

    const sdHigh = await call(`/api/admin/menus/${menu.id}/portions/sd_high`, {
      method: "PUT",
      token: sppgToken,
      body: {
        items: [
          { foodId: food.rice, grams: 150, label: "Nasi putih", visualUnit: "1 centong" },
          { foodId: food.egg, grams: 55 },
        ],
      },
    });
    expect(sdHigh.status).toBe(200);
    const sdHighBody = await json<{ totals: { energyKcal: number; proteinG: number }; allergens: string[] }>(sdHigh);
    expect(sdHighBody.totals.energyKcal).toBeCloseTo(352.5, 1);
    expect(sdHighBody.totals.proteinG).toBeCloseTo(11.32, 1);
    expect(sdHighBody.allergens).toEqual(["telur"]);

    const smp = await call(`/api/admin/menus/${menu.id}/portions/smp`, {
      method: "PUT",
      token: sppgToken,
      body: { items: [{ foodId: food.tempe, grams: 100 }] },
    });
    expect((await json<{ allergens: string[] }>(smp)).allergens).toEqual(["kedelai"]);

    // Saving again replaces the items instead of appending.
    await call(`/api/admin/menus/${menu.id}/portions/sd_high`, {
      method: "PUT",
      token: sppgToken,
      body: { items: [{ foodId: food.rice, grams: 100 }] },
    });
    const detail = await json<{
      portions: Array<{ level: string; items: unknown[]; allergens: string[] }>;
    }>(await call(`/api/admin/menus/${menu.id}`, { token: sppgToken }));
    const sdHighDetail = detail.portions.find((portion) => portion.level === "sd_high")!;
    expect(sdHighDetail.items).toHaveLength(1);
    expect(sdHighDetail.allergens).toEqual([]);

    const published = await call(`/api/admin/menus/${menu.id}/publish`, { method: "POST", token: sppgToken });
    expect(published.status).toBe(200);
    expect((await json<{ menu: { status: string } }>(published)).menu.status).toBe("published");

    const copied = await call("/api/admin/menus/copy", {
      method: "POST",
      token: sppgToken,
      body: { menuId: menu.id, targetDate: "2031-03-12" },
    });
    expect(copied.status).toBe(201);
    const copy = (await json<{ menu: { id: string; status: string; date: string } }>(copied)).menu;
    expect(copy.status).toBe("draft");
    expect(copy.date).toBe("2031-03-12");
    const copyDetail = await json<{ portions: Array<{ items: unknown[] }> }>(
      await call(`/api/admin/menus/${copy.id}`, { token: sppgToken }),
    );
    expect(copyDetail.portions).toHaveLength(2);
    expect(copyDetail.portions.every((portion) => portion.items.length > 0)).toBe(true);

    const copyAgain = await call("/api/admin/menus/copy", {
      method: "POST",
      token: sppgToken,
      body: { menuId: menu.id, targetDate: "2031-03-12" },
    });
    expect(copyAgain.status).toBe(409);

    const list = await json<{ menus: Array<{ id: string }> }>(
      await call(`/api/admin/menus?from=${MENU_DATE_FROM}&to=${MENU_DATE_TO}`, { token: sppgToken }),
    );
    expect(list.menus.map((row) => row.id)).toEqual(expect.arrayContaining([menu.id, copy.id]));
    const foreignList = await json<{ menus: Array<{ id: string }> }>(
      await call(`/api/admin/menus?from=${MENU_DATE_FROM}&to=${MENU_DATE_TO}`, { token: otherToken }),
    );
    expect(foreignList.menus).toHaveLength(0);

    const unconfirmed = await call(`/api/admin/menus/${menu.id}`, { method: "DELETE", token: sppgToken });
    expect(unconfirmed.status).toBe(400);
    expect((await json<{ error: { code: string } }>(unconfirmed)).error.code).toBe("CONFIRMATION_REQUIRED");
    const confirmed = await call(`/api/admin/menus/${menu.id}?confirm=true`, { method: "DELETE", token: sppgToken });
    expect(confirmed.status).toBe(200);
    expect((await call(`/api/admin/menus/${copy.id}`, { method: "DELETE", token: sppgToken })).status).toBe(200);
  });

  it("requires an explicit SPPG when super_admin creates a menu", async () => {
    const missing = await call("/api/admin/menus", {
      method: "POST",
      token: superToken,
      body: { date: "2031-03-20", name: "Tanpa SPPG" },
    });
    expect(missing.status).toBe(400);

    const withSppg = await call("/api/admin/menus", {
      method: "POST",
      token: superToken,
      body: { sppgId: otherSppgId, date: "2031-03-20", name: "Menu SPPG lain" },
    });
    expect(withSppg.status).toBe(201);
  });
});
