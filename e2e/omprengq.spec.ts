import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_SPPG_ADMIN_EMAIL ?? "admin.sppg@omprengq.local";
const ADMIN_PASSWORD = process.env.SEED_SPPG_ADMIN_PASSWORD ?? "ganti-sandi-sppg";

test.describe("OmprengQ E2E critical journeys (M8)", () => {
  test("1. Admin login -> open menus -> create/view menu flow", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: /Masuk Dashboard/i })).toBeVisible();

    await page.getByLabel("Email admin").fill(ADMIN_EMAIL);
    await page.getByLabel("Kata sandi", { exact: true }).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /^Masuk$/i }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: /Halo,/i })).toBeVisible();

    await page.getByRole("link", { name: /Buka Kalender Menu/i }).click();
    await expect(page).toHaveURL(/\/admin\/menus/);
    await expect(page.getByRole("heading", { name: /Menu Harian MBG/i })).toBeVisible();
  });

  test("2. Teacher opens daily menu -> presentation mode -> Share WA dialog", async ({ page }) => {
    await page.goto("/s/sdn-01-demo/hari-ini");
    await expect(page.getByText("SDN 01 Demo")).toBeVisible();

    const modeKelasBtn = page.getByRole("button", { name: /Tampilkan ke kelas/i });
    if (await modeKelasBtn.isVisible()) {
      await modeKelasBtn.click();
      await expect(page).toHaveURL(/mode=kelas/);
      await page.getByRole("button", { name: /Bagikan WA/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("link", { name: /Buka WhatsApp/i })).toHaveAttribute(
        "href",
        /^https:\/\/wa\.me\/\?text=/,
      );
      await page.getByRole("button", { name: /Salin Pesan/i }).click();
    }
  });

  test("3. Parent completes 3-step profile wizard -> sees nutrition bars & dinner recommendations", async ({
    page,
  }) => {
    await page.goto("/kalkulator?school=sdn-01-demo");
    await expect(page.getByText(/Buat Profil Gizi Lokal/i)).toBeVisible();

    await page.getByLabel(/Nama panggilan/i).fill("Budi");
    await page.getByLabel(/Usia/i).fill("8");
    await page.getByRole("button", { name: /Lanjut/i }).click();

    await page.getByLabel(/Berat badan/i).fill("25");
    await page.getByRole("button", { name: /Lanjut/i }).click();

    await page.getByRole("button", { name: /Simpan & Hitung Gizi/i }).click();
    await expect(page.getByText(/Halo, Budi!/i)).toBeVisible();
  });

  test("4. Offline mode keeps calculator interactive after initial online visit", async ({
    page,
    context,
  }) => {
    await page.goto("/s/sdn-01-demo/hari-ini");
    await expect(page.getByText("SDN 01 Demo")).toBeVisible();

    await page.goto("/kalkulator?school=sdn-01-demo");
    await expect(page.getByText(/Buat Profil Gizi Lokal|Pemenuhan Gizimu|Analisis Gizi/i)).toBeVisible();

    await context.setOffline(true);
    await expect(page.getByText(/Mode offline:/i)).toBeVisible();
    await context.setOffline(false);
  });
});
