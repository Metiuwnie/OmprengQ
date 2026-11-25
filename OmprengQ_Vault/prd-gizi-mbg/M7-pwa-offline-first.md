# M7 — PWA Offline-First

**Estimasi:** 1–2 hari · **Prasyarat:** M3, M5 · **Baca:** 02

## Tujuan
Aplikasi dapat dipasang ke layar utama dan **jadwal menu mingguan serta kalkulator tetap berjalan tanpa internet** setelah kunjungan pertama.

## Tugas
1. Konfigurasi `vite-plugin-pwa` (`registerType: "prompt"` agar pengguna memilih update), manifest: nama, `short_name`, `theme_color`, `display: standalone`, `start_url: "/"`, ikon 192/512 + maskable.
2. **Precache** app shell (JS/CSS/ikon/ilustrasi penting). Rute admin **tidak** dicache untuk offline (hindari data basi); gunakan `navigateFallbackDenylist` untuk `/api` dan `/admin`.
3. **Runtime caching** (Workbox):
   - `GET /api/public/schools/:slug/today|week` → **StaleWhileRevalidate**, expiration 7 hari.
   - `GET /api/public/reference/*` → **StaleWhileRevalidate** atau **CacheFirst** dengan versi.
   - Gambar menu (jika ada) → CacheFirst, maks. 60 entri.
   - Endpoint `/api/auth`, `/api/admin` → **NetworkOnly**.
4. **Prefetch mingguan:** saat halaman menu dibuka online, panggil `/week` agar menu 5–7 hari ke depan siap offline.
5. Indikator status: banner kecil "Mode offline — menampilkan data terakhir (diperbarui {waktu})" memakai `navigator.onLine` + event.
6. **Tampilan menu basi:** bila data cache lebih lama dari tanggal hari ini, tampilkan peringatan lembut "Menu mungkin belum diperbarui".
7. **Prompt pemasangan:** tangkap `beforeinstallprompt`; tombol "Pasang aplikasi" di halaman kalkulator (jangan mengganggu di halaman guru mode presentasi). Panduan singkat untuk iOS (Bagikan → Tambah ke Layar Utama).
8. **Update flow:** toast "Versi baru tersedia — Muat ulang".
9. Penanganan penyimpanan: `navigator.storage.persist()` dicoba agar localStorage/cache tidak mudah dihapus; jangan paksa.
10. Dokumentasikan cara menguji: DevTools → Application → Service Workers, mode Offline, Lighthouse PWA.

## Skill Desain (Wajib)
Untuk banner offline, toast pembaruan, tombol & panduan pasang aplikasi (termasuk iOS), **panggil UI UX Pro Max dan Hallmark** sesuai alur di `02` §9: rujuk `design-system/MASTER.md`, bangun dengan Hallmark, terjemahkan ke React + Tailwind + shadcn/ui memakai token yang ada, lalu `hallmark audit`.
- Khusus milestone ini: ringan dan tidak mengganggu halaman guru/mode presentasi.
- Aturan produk di PRD (tanpa label status gizi, bahasa positif, kontras AA) menang bila bertentangan dengan saran skill.
- Simpan ringkasan audit di `docs/ui-audit/M7.md`. Jangan menghapus `.hallmark/log.json`.

## Kriteria Penerimaan
- [ ] UI UX Pro Max & Hallmark benar-benar dipanggil (bukti: laporan agent + `docs/ui-audit/M7.md`); `hallmark audit` tanpa temuan berat
- [ ] Setelah satu kunjungan online, matikan jaringan → `/s/:slug/hari-ini`, `/s/:slug/minggu`, dan `/kalkulator` tetap terbuka dengan data terakhir
- [ ] Kalkulator menghitung ulang offline (profil dari localStorage, engine di klien)
- [ ] Lighthouse PWA: installable ✔ (HTTPS), ikon & manifest valid
- [ ] Rute admin tidak tersimpan di cache offline; logout tidak meninggalkan data sensitif di cache
- [ ] Update versi baru tidak merusak sesi pengguna yang sedang membuka kalkulator
- [ ] Ukuran precache wajar (< ~1 MB gzip)

## Di Luar Cakupan
Push notification, background sync, offline admin.

## Prompt Siap Pakai
```text
Kerjakan M7 dengan vite-plugin-pwa. Rancang strategi cache sesuai daftar di dokumen
(SWR untuk data publik, NetworkOnly untuk auth/admin). Sertakan langkah uji offline manual
dan tampilkan hasil Lighthouse PWA.
WAJIB: panggil skill ui-ux-pro-max dan hallmark untuk semua UI (rujuk design-system/MASTER.md),
lalu jalankan hallmark audit dan tulis ringkasannya ke docs/ui-audit/M7.md.
```
