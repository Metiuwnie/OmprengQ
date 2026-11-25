# M1 — Database, Seed Referensi & Autentikasi Admin

**Estimasi:** 1–2 hari · **Prasyarat:** M0 · **Baca:** 02, 03, 04 (bagian 2.3)

## Tujuan
Skema Drizzle + migrasi berjalan, data referensi (bahan TKPI, AKG, pangan URT) ter-seed, dan admin bisa login/logout dengan peran.

## Tugas
1. Implementasi skema Drizzle **MySQL** sesuai `03` (impor dari `drizzle-orm/mysql-core`; ikuti seluruh catatan MySQL di `03` §2), satu file per domain di `db/schema/`; `drizzle.config.ts` dengan `dialect: "mysql"`; hasilkan & jalankan migrasi.
2. `db/client.ts` memakai `mysql2` (pool, `timezone: "Z"`, charset `utf8mb4`) + `drizzle-orm/mysql2`; baca `DATABASE_URL`. Karena tidak ada `.returning()`, buat helper `insertAndGet` yang memakai id buatan aplikasi lalu `select` ulang.
3. **Seed** (`pnpm db:seed`, idempoten via `onDuplicateKeyUpdate` — aman dijalankan ulang):
   - `akg_reference` dari tabel di `04` bagian 2.3 (tandai di komentar: *perlu verifikasi vs Permenkes 28/2019*).
   - `foods`: ±80–150 bahan umum menu MBG (beras/nasi, ayam, telur, ikan, tempe, tahu, kangkung, bayam, wortel, pisang, jeruk, susu, dll.) dari file `seed/foods.tkpi.json`. Struktur kolom mengikuti `03`. **Nilai harus diisi dari TKPI**; bila agen tidak punya data pasti, buat file template dengan `TODO` dan sebagian kecil contoh — jangan mengarang angka lalu menganggapnya final.
   - `household_foods`: ±40–60 pangan lokal murah dengan URT (tempe bacem, tumis kangkung, sayur bayam, pisang, telur rebus, dll.), file `seed/household-foods.json`.
   - 1 SPPG demo, 2 sekolah demo (`sdn-01-demo`, `smpn-01-demo`), 1 `super_admin`, 1 `sppg_admin` (kredensial dari env/seed, bukan hardcode di kode produksi).
4. **Auth:** `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. Hash **argon2**, JWT di cookie httpOnly (`SameSite=Lax`, `Secure` via env).
5. Middleware `requireAuth` dan `requireRole(...roles)`; middleware error seragam.
6. Rate limit sederhana pada `/auth/login` (mis. 5 percobaan/menit/IP, in-memory cukup).
7. **Web:** halaman `/admin/login`, guard rute `/admin/*` memakai `GET /auth/me`, layout admin kosong (sidebar + header) dengan tombol keluar.

## Skill Desain (Wajib)
Untuk halaman `/admin/login` dan layout admin (sidebar + header), **panggil UI UX Pro Max dan Hallmark** sesuai alur di `02` §9: rujuk `design-system/MASTER.md`, bangun dengan Hallmark, terjemahkan ke React + Tailwind + shadcn/ui memakai token yang ada, lalu `hallmark audit`.
- Khusus milestone ini: override halaman `admin`: padat-data, nyaman di laptop, tetap rapi di 360px.
- Aturan produk di PRD (tanpa label status gizi, bahasa positif, kontras AA) menang bila bertentangan dengan saran skill.
- Simpan ringkasan audit di `docs/ui-audit/M1.md`. Jangan menghapus `.hallmark/log.json`.

## Kriteria Penerimaan
- [x] UI UX Pro Max & Hallmark benar-benar dipanggil (bukti: `docs/ui-audit/M1.md`; `sloplint: 0 FAIL, 0 REFLEX, 0 WARN`)
- [x] `pnpm db:migrate && pnpm db:seed` berhasil di database MySQL kosong, dan aman dijalankan dua kali *(terverifikasi 2x run di MySQL 8.4: 10 AKG, 97 foods, 45 household_foods, 2 sekolah, 2 admin)*
- [x] Kolom daftar (alergen, jenjang, slot makan) tersimpan sebagai JSON dan terbaca kembali sebagai array bertipe *(terverifikasi di skema Drizzle & `seed.test.ts`)*
- [x] Nilai `decimal` kembali sebagai `number` (bukan string) di lapisan service *(`decimalNumbers: true` & `toNumber()`, terverifikasi di `seed.test.ts`)*
- [ ] Login benar → masuk `/admin`; salah → pesan error ramah; tanpa login → diarahkan ke `/admin/login` *(backend `routes/auth.test.ts` 3/3 lolos; menunggu uji UI di browser)*
- [x] Cookie bersifat httpOnly (tidak terbaca JS) *(diset `httpOnly: true` di `routes/auth.ts` & terverifikasi di `routes/auth.test.ts`)*
- [x] `sppg_admin` tidak bisa memanggil endpoint `super_admin` (403) *(lolos `middleware/auth.test.ts` 4/4 test)*
- [x] Test: hash/verify sandi, middleware RBAC, seed idempoten *(semua lolos: `password.test.ts` 2/2, `middleware/auth.test.ts` 4/4, `routes/auth.test.ts` 3/3, `seed.test.ts` 1/1)*
- [x] Sandi tidak pernah muncul di log/respons *(`safeUser` & `/me` terverifikasi di `routes/auth.test.ts`)*

## Di Luar Cakupan
CRUD menu/sekolah, UI admin selain login & layout.

## Prompt Siap Pakai
```text
Kerjakan M1. Implementasikan skema Drizzle MySQL persis relasi di 03 (ikuti catatan MySQL), seed idempoten,
dan auth cookie httpOnly. Untuk data TKPI: JANGAN mengarang nilai; gunakan file seed
yang saya isi/verifikasi. Jika data belum ada, buat template + contoh kecil dan tandai TODO.
WAJIB: panggil skill ui-ux-pro-max dan hallmark untuk semua UI (rujuk design-system/MASTER.md),
lalu jalankan hallmark audit dan tulis ringkasannya ke docs/ui-audit/M1.md.
```

> **Catatan untuk Anda (manusia):** siapkan data TKPI sendiri (mis. dari buku/lampiran resmi Kemenkes) dalam CSV, minta AI membuat skrip impor, lalu **sampel-cek** 10 bahan secara manual.
