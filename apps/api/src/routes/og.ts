import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../db/client.js";
import { menuPortions, menus, schools } from "../db/schema/index.js";
import { getTodayInTimezone } from "../lib/date-timezone.js";
import { getAppBaseUrl } from "../lib/env.js";

const OG_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=600";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeJsonForInlineScript(value: string): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

/**
 * `/api/og` — Lightweight Open Graph HTML preview for WhatsApp/social crawlers,
 * redirecting human visitors to the SPA route.
 */
export const ogRoutes = new Hono().get("/s/:slug/hari-ini", async (c) => {
  const rawSlug = c.req.param("slug").trim().toLowerCase();
  const to = c.req.query("to");
  const baseUrl = getAppBaseUrl();
  const database = getDb();

  const schoolRows = await database
    .select()
    .from(schools)
    .where(and(eq(schools.slug, rawSlug), eq(schools.active, true)))
    .limit(1);

  const school = schoolRows[0];
  if (!school) {
    return c.html(
      `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Sekolah tidak ditemukan — OmprengQ</title></head><body><p>Sekolah tidak ditemukan.</p><a href="${escapeHtml(baseUrl)}">Ke Beranda OmprengQ</a></body></html>`,
      404,
    );
  }

  const today = getTodayInTimezone(school.timezone);
  const menuRows = await database
    .select()
    .from(menus)
    .where(
      and(
        eq(menus.sppgId, school.sppgId),
        eq(menus.date, today),
        eq(menus.status, "published"),
      ),
    )
    .limit(1);

  const menu = menuRows[0] ?? null;
  const portionRows = menu
    ? await database
        .select()
        .from(menuPortions)
        .where(eq(menuPortions.menuId, menu.id))
        .limit(1)
    : [];
  const portion = portionRows[0] ?? null;

  const targetUrl =
    to === "kalkulator"
      ? `${baseUrl}/kalkulator?school=${encodeURIComponent(school.slug)}`
      : `${baseUrl}/s/${encodeURIComponent(school.slug)}/hari-ini`;

  const ogUrl = `${baseUrl}/api/og/s/${encodeURIComponent(school.slug)}/hari-ini${
    to === "kalkulator" ? "?to=kalkulator" : ""
  }`;
  const ogImage = menu?.photoUrl || `${baseUrl}/mascots/mascot-ayam-ompreng.png`;

  const ogTitle = menu
    ? `Menu MBG ${school.name} (${today})`
    : `Menu MBG ${school.name} — OmprengQ`;

  const nutritionSummary = portion
    ? `Energi ${Math.round(portion.totals.energyKcal)} kkal, protein ${portion.totals.proteinG.toFixed(1)} g, serat ${portion.totals.fiberG.toFixed(1)} g.`
    : "Cek komposisi bahan dan sisa kebutuhan gizi anak di rumah.";

  const ogDescription = menu
    ? `${menu.name}. ${nutritionSummary}`
    : `Lihat jadwal menu Makan Bergizi Gratis ${school.name} dan hitung kebutuhan gizi harian anak di rumah.`;

  c.header("Cache-Control", OG_CACHE_CONTROL);
  return c.html(`<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(ogTitle)}</title>
    <meta name="description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="OmprengQ" />
    <meta property="og:title" content="${escapeHtml(ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:url" content="${escapeHtml(ogUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}" />
    <script>window.location.replace(${safeJsonForInlineScript(targetUrl)});</script>
  </head>
  <body>
    <p>Membuka OmprengQ… <a href="${escapeHtml(targetUrl)}">Klik di sini jika tidak otomatis berpindah.</a></p>
  </body>
</html>`);
});
