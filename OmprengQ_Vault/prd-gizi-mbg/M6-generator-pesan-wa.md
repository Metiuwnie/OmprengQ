# M6 — Generator Pesan WhatsApp Orang Tua & Pratinjau Tautan

**Estimasi:** 1 hari · **Prasyarat:** M3 (kalkulator dari M5 untuk tujuan tautan) · **Baca:** 02, 03

## Tujuan
Guru menekan satu tombol untuk membagikan ringkasan menu hari ini + tautan kalkulator ke grup WA orang tua; tautan menampilkan pratinjau yang menarik di WhatsApp.

## Tugas
1. Komponen `ShareToWhatsApp` di halaman menu & mode presentasi.
2. Susun pesan otomatis (Bahasa Indonesia, ringkas, rapi), contoh:
   ```text
   🍱 Menu MBG hari ini — Selasa, 24 Nov 2026
   Nasi, Ayam Goreng, Perkedel, Tumis Kangkung

   ✨ Sorotan gizi: energi 520 kkal • protein 22 g • serat 4 g
   ⚠️ Mengandung: telur

   Cek kebutuhan gizi anak & saran menu di rumah:
   https://domain/kalkulator?school=sdn-01
   ```
3. Aksi: buka `https://wa.me/?text=<encodeURIComponent(pesan)>`; fallback tombol **Salin Pesan** (clipboard) dengan notifikasi "Tersalin".
4. Pratinjau tautan (Open Graph): endpoint Hono `GET /og/s/:slug/hari-ini` mengembalikan HTML kecil berisi `og:title`, `og:description` (nama menu + sorotan gizi), `og:image` (foto menu atau gambar default), lalu memuat SPA / redirect untuk pengguna biasa. Bagikan tautan **OG** ini pada pesan (atau gunakan deteksi User-Agent crawler untuk rute yang sama).
5. Pembatas panjang: pesan ≤ ~700 karakter; potong daftar bahan bila terlalu panjang.
6. Template pesan dapat disesuaikan sekolah (opsional: field `waGreeting` di `schools`; bila ditambah, buat migrasi).
7. Pengujian: fungsi `buildWhatsAppMessage(menu, school, baseUrl)` murni + test snapshot.

## Skill Desain (Wajib)
Untuk tombol & dialog bagikan WhatsApp serta notifikasi 'Tersalin', **panggil UI UX Pro Max dan Hallmark** sesuai alur di `02` §9: rujuk `design-system/MASTER.md`, bangun dengan Hallmark, terjemahkan ke React + Tailwind + shadcn/ui memakai token yang ada, lalu `hallmark audit`.
- Khusus milestone ini: komponen kecil yang konsisten dengan token; jangan menambah gaya baru di luar design system.
- Aturan produk di PRD (tanpa label status gizi, bahasa positif, kontras AA) menang bila bertentangan dengan saran skill.
- Simpan ringkasan audit di `docs/ui-audit/M6.md`. Jangan menghapus `.hallmark/log.json`.

## Kriteria Penerimaan
- [ ] UI UX Pro Max & Hallmark benar-benar dipanggil (bukti: laporan agent + `docs/ui-audit/M6.md`); `hallmark audit` tanpa temuan berat
- [ ] Satu klik membuka WhatsApp (mobile & web) dengan pesan terisi
- [ ] Fallback salin berfungsi di browser tanpa `wa.me`
- [ ] Tautan yang ditempel ke WhatsApp menampilkan judul & deskripsi (uji dengan tautan produksi/tunnel HTTPS)
- [ ] Teks aman dari karakter spesial (`&`, `#`, baris baru) lewat encoding
- [ ] Tautan di pesan membuka kalkulator dengan sekolah yang benar
- [ ] Hari tanpa menu: tombol dinonaktifkan atau pesan netral

## Di Luar Cakupan
Integrasi WhatsApp Business API / pengiriman otomatis.

## Prompt Siap Pakai
```text
Kerjakan M6. Buat fungsi murni buildWhatsAppMessage + test snapshot, tombol bagikan dengan
fallback salin, dan route Hono untuk meta Open Graph. Jelaskan cara menguji pratinjau di WhatsApp.
WAJIB: panggil skill ui-ux-pro-max dan hallmark untuk semua UI (rujuk design-system/MASTER.md),
lalu jalankan hallmark audit dan tulis ringkasannya ke docs/ui-audit/M6.md.
```
