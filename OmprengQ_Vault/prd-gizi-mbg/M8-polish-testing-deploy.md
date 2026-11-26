# M8 — Polish UX, Aksesibilitas, Pengujian & Deploy

**Estimasi:** 2–3 hari · **Prasyarat:** M0–M7 · **Baca:** 02

## Tujuan
Aplikasi siap dipakai pengguna nyata: tampilan konsisten, aksesibel, teruji, aman, dan ter-deploy dengan HTTPS.

## Tugas

### 1. Desain & UX
- Tema: palet cerah hangat untuk Mode Anak, palet tenang untuk Mode Remaja dan admin; tipografi terbaca (≥ 16px body, ≥ 20px di mode kelas).
- Ilustrasi/ikon makanan konsisten (SVG ringan atau emoji terkontrol), empty state & error state ramah di semua halaman.
- Mode gelap opsional untuk admin.
- Tulis ulang seluruh teks UI agar bernada positif, bahasa sederhana (setara kelas 6 SD untuk Mode Anak).

### 2. Aksesibilitas
- Navigasi keyboard, fokus terlihat, `alt` gambar, label form, kontras WCAG AA, `prefers-reduced-motion`.
- Uji dengan pembaca layar dasar (TalkBack/VoiceOver) pada layar hasil kalkulator.

### 3. Performa
- Code splitting per area (publik/kalkulator/admin), kompres gambar, font sistem/subset.
- Target: LCP < 2,5 dtk (4G), TTI baik di HP Android kelas bawah.

### 4. Pengujian
- Unit: engine (≥ 90%), util tanggal/timezone, pembuat pesan WA.
- Integrasi API: auth, RBAC, perhitungan menu, endpoint publik (Vitest + database uji).
- **E2E (Playwright), minimal 4 skenario:**
  1. Admin login → buat menu → publikasi.
  2. Guru buka `/s/:slug/hari-ini` → mode presentasi → tombol WA.
  3. Orang tua isi profil → lihat hasil → rekomendasi.
  4. Offline: muat sekali → matikan jaringan → kalkulator tetap jalan.
- Uji manual 5 pengguna nyata (guru, orang tua, siswa SMP) dengan catatan kebingungan.

### 5. Keamanan & Privasi
- Header keamanan (CSP dasar, `X-Content-Type-Options`, `Referrer-Policy`), `secure` cookies, rate limit login.
- Audit: tidak ada data profil di log, request, atau analytics. Bila memakai analytics, hanya yang tanpa cookie & tanpa data profil.
- Halaman **Kebijakan Privasi** singkat (Bahasa Indonesia): data anak hanya di perangkat, apa yang disimpan, cara menghapus.
- Halaman **Tentang & Sumber Data**: rujukan TKPI & AKG, disclaimer edukasi.

### 6. Deploy
- Dockerfile multi-stage (build web → salin `dist` → jalankan Hono) atau konfigurasi Railway/Render sesuai `02` bagian 8.
- Migrasi otomatis saat rilis (`drizzle-kit migrate` pada langkah start/predeploy); seed referensi dijalankan sekali.
- Variabel lingkungan produksi; backup database (fitur penyedia).
- Domain + HTTPS; cek QR mengarah ke domain produksi (`APP_BASE_URL`).
- Skrip `README` pengguna: cara membuat sekolah, QR, dan menu pertama (panduan untuk ahli gizi/guru, dengan tangkapan layar).

## Skill Desain (Wajib)
Untuk **audit menyeluruh** seluruh antarmuka, **panggil UI UX Pro Max dan Hallmark** sesuai alur di `02` §9: rujuk `design-system/MASTER.md`, bangun dengan Hallmark, terjemahkan ke React + Tailwind + shadcn/ui memakai token yang ada, lalu `hallmark audit`.
- Khusus milestone ini: jalankan `hallmark audit` pada seluruh `apps/web/src`, perbaiki temuan, dan lengkapi dengan checklist UX/aksesibilitas UI UX Pro Max (`--stack react`); pastikan konsistensi token di semua halaman.
- Aturan produk di PRD (tanpa label status gizi, bahasa positif, kontras AA) menang bila bertentangan dengan saran skill.
- Simpan ringkasan audit di `docs/ui-audit/M8.md`. Jangan menghapus `.hallmark/log.json`.

## Kriteria Penerimaan
- [x] UI UX Pro Max & Hallmark benar-benar dipanggil (bukti: laporan agent + `docs/ui-audit/M8.md`); `hallmark audit` tanpa temuan berat *(`sloplint: 0 FAIL, 0 REFLEX, 0 WARN across 45 file(s)`)*
- [ ] 4 skenario E2E hijau di CI *(`playwright.config.ts` & `e2e/omprengq.spec.ts` siap; menunggu eksekusi browser Playwright & CI)*
- [ ] Lighthouse mobile (rute publik): Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90, PWA installable *(menunggu uji Lighthouse di browser)*
- [ ] Aplikasi produksi dapat dibuka via HTTPS; QR cetak menuju domain produksi *(`Dockerfile`, `.dockerignore`, & static serving Hono siap; menunggu deploy ke hosting HTTPS)*
- [x] Tidak ada secret di repo; `.env.example` mutakhir *(`.env` ter-ignore, `.env.example` tersedia)*
- [x] Panduan pengguna admin tersedia *(tertulis di `README.md`)*
- [ ] 5 uji pengguna selesai, temuan prioritas tinggi diperbaiki *(menunggu uji pengguna nyata)*
- [x] Grep kata terlarang (label status gizi) bersih di seluruh `apps/web/src` *(terverifikasi 0 temuan)*

## Prompt Siap Pakai
```text
Kerjakan M8 bertahap: (1) audit a11y & perf + perbaikan, (2) E2E Playwright 4 skenario,
(3) header keamanan + halaman privasi/tentang, (4) Dockerfile + panduan deploy.
Laporkan skor Lighthouse sebelum dan sesudah.
WAJIB: panggil skill ui-ux-pro-max dan hallmark untuk semua UI (rujuk design-system/MASTER.md),
lalu jalankan hallmark audit dan tulis ringkasannya ke docs/ui-audit/M8.md.
```
