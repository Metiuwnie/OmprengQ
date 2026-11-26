# OmprengQ — Edukasi Gizi Harian & Kalkulator Porsi Personal MBG

Web/PWA yang mengubah data menu harian Makan Bergizi Gratis (MBG) menjadi tampilan edukasi ramah anak & remaja, lengkap dengan QR kelas, ringkasan WhatsApp orang tua, serta kalkulator selisih gizi lokal (tanpa mengirim data profil anak ke server).

## Fitur Utama

- **Dashboard Admin SPPG & Sekolah (`/admin`):** Kelola unit SPPG, daftar sekolah, kode QR cetak (PNG/SVG), bahan pangan TKPI + custom, dan kalender menu harian per jenjang (`SD 1-3`, `SD 4-6`, `SMP`, `SMA`) dengan hitungan gizi otomatis dari `@mbg/shared`.
- **Halaman Menu Publik (`/s/:slug/hari-ini`, `/s/:slug/minggu`):** Tanpa login, otomatis menyesuaikan zona waktu sekolah (`WIB`/`WITA`/`WIT`), Mode Anak & Mode Remaja, **Mode Presentasi Kelas** (`?mode=kelas`), serta tombol **Bagikan WA** dengan pratinjau Open Graph (`/api/og/s/:slug/hari-ini`).
- **Kalkulator Gizi Lokal (`/kalkulator`, `/kalkulator/profil`):** Multi-profil anak tersimpan hanya di `localStorage` (`mbg.profiles.v1`), mendukung ekspor/impor `profil-gizi.json`, pemilih porsi dimakan (`Habis` / `¾` / `½` / `¼`), peringatan alergi + pengganti protein aman, dan rekomendasi pangan URT di rumah.
- **PWA Offline-First:** Dapat dipasang ke layar utama, melakukan prefetch jadwal mingguan & tabel referensi, serta tetap menghitung ulang kebutuhan gizi saat offline.
- **Privasi & Sumber Data:** Halaman `/privasi` dan `/tentang`.

## Menjalankan di Lokal

1. Salin `.env.example` menjadi `.env` lalu sesuaikan `DATABASE_URL`, `JWT_SECRET`, `APP_BASE_URL`, dan kredensial seed awal.
2. Nyalakan MySQL 8.4 (mis. lewat `docker compose up -d`), lalu pasang dependensi dan isi database:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Web dev server: `http://localhost:5173`
- API server: `http://localhost:3000`

## Panduan Singkat Admin & Guru

1. **Masuk Admin:** Buka `/admin/login` lalu masuk menggunakan akun seed di `.env`.
2. **Tambah Sekolah & Unduh QR:** Buka **Sekolah & QR** (`/admin/schools`), buat sekolah baru (slug otomatis terbentuk), lalu klik tombol **QR** untuk mengunduh PNG/SVG atau mencetak poster kelas.
3. **Buat & Publikasikan Menu Pertama:** Buka **Menu Harian** (`/admin/menus`), pilih tanggal, isi nama menu, lalu susun komposisi bahan TKPI per jenjang dan klik **Publikasikan**.
4. **Bagikan ke Kelas & Grup WA:** Pindai QR sekolah (`/s/:slug/hari-ini`), gunakan **Tampilkan ke kelas** untuk proyektor, atau klik **Bagikan WA** untuk mengirim ringkasan menu dan tautan kalkulator ke grup orang tua.

## Pengujian & Audit

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test
pnpm test:e2e
```

## Deploy Produksi (Docker / Railway / Render)

1. Gunakan `Dockerfile` multi-stage di root repo (membangun `@mbg/shared` dan `@mbg/web`, lalu menjalankan `apps/api` yang menyajikan API dan `apps/web/dist` dalam satu origin).
2. Set variabel lingkungan produksi: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` (acak minimal 32 karakter), `COOKIE_SECURE=true`, dan `APP_BASE_URL=https://domain-anda.id`.
3. Pastikan domain memakai **HTTPS** (syarat PWA & cookie `Secure`), dan `APP_BASE_URL` sesuai domain produksi agar QR cetak serta tautan Open Graph WhatsApp mengarah ke alamat yang benar.
4. Untuk mengisi data referensi awal (AKG, TKPI, pangan URT) di database produksi baru, jalankan `pnpm db:seed` sekali setelah `pnpm db:migrate`.
