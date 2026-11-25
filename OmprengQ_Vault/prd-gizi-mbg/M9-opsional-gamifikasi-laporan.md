# M9 (Opsional) — Gamifikasi Edukasi Gizi & Modul Laporan

**Estimasi:** 3+ hari · **Prasyarat:** M8 selesai (jalur utama stabil) · **Baca:** 02, 03

> Rancangan awal berfokus pada informasi & kalkulator. Milestone ini menambah **keterlibatan** (gamifikasi) dan **bukti dampak** (laporan) tanpa melanggar prinsip privasi. Kerjakan hanya bila MVP sudah mantap — sesuaikan dengan ketentuan lomba/penilaian bila ada.

## A. Gamifikasi (data di perangkat)
1. **Kuis Menu Hari Ini:** 3 pertanyaan otomatis dari menu (mis. "Bahan mana yang kaya zat besi?"), jawaban diambil dari data gizi; umpan balik positif.
2. **Misi Harian:** "Habiskan sayurmu" / "Tambah 1 mangkuk sayur di rumah" — dicentang manual oleh anak/orang tua.
3. **Streak & lencana:** hari berturut-turut menyelesaikan misi/kuis; lencana tematik (Pahlawan Serat, Jagoan Protein). Disimpan di `localStorage` (`mbg.progress.v1`), **per profil**, tanpa papan peringkat antar anak (hindari perbandingan).
4. **Kartu Koleksi Pangan:** membuka kartu bahan baru setiap kali kuis/misi selesai; berisi fakta singkat.
5. Aturan: tidak ada poin yang berkaitan dengan berat badan atau pembatasan makan.

## B. Laporan Agregat Anonim (opsional, opt-in)
1. Endpoint `POST /api/public/events` menerima **hanya** peristiwa anonim: `{ schoolSlug, date, type: "menu_view" | "share_wa" | "calculator_open" | "quiz_done" }`. **Tanpa** profil, usia, atau identitas apa pun.
2. Tabel `usage_events` (agregat harian; simpan hitungan, bukan log per pengguna jika memungkinkan).
3. **Dasbor Laporan** (admin SPPG/sekolah): jumlah scan/tayang menu per hari, jumlah share WA, jumlah pembukaan kalkulator, kuis selesai; filter rentang tanggal & sekolah; ekspor **CSV/PDF**.
4. **Laporan Gizi Menu:** rata-rata energi/protein/serat menu per minggu & per jenjang dibanding target porsi MBG (data dari menu, bukan dari anak).
5. Pernyataan privasi diperbarui di halaman Privasi.

## C. Konten Edukasi
- Modul "Tahukah kamu?" mingguan; materi lintas SDG 2/3/4 (gizi baik, kesehatan, pendidikan).

## Skill Desain (Wajib)
Untuk kuis, misi harian, lencana, kartu koleksi, dan grafik dasbor laporan, **panggil UI UX Pro Max dan Hallmark** sesuai alur di `02` §9: rujuk `design-system/MASTER.md`, bangun dengan Hallmark, terjemahkan ke React + Tailwind + shadcn/ui memakai token yang ada, lalu `hallmark audit`.
- Khusus milestone ini: gunakan panduan jenis grafik dari UI UX Pro Max; animasi ringan & hormati `prefers-reduced-motion`; tanpa elemen kompetitif antar anak.
- Aturan produk di PRD (tanpa label status gizi, bahasa positif, kontras AA) menang bila bertentangan dengan saran skill.
- Simpan ringkasan audit di `docs/ui-audit/M9.md`. Jangan menghapus `.hallmark/log.json`.

## Kriteria Penerimaan
- [ ] UI UX Pro Max & Hallmark benar-benar dipanggil (bukti: laporan agent + `docs/ui-audit/M9.md`); `hallmark audit` tanpa temuan berat
- [ ] Kuis dibuat otomatis dari menu hari itu dan bekerja offline
- [ ] Progress gamifikasi tersimpan per profil di perangkat, tanpa pengiriman ke server
- [ ] `usage_events` tidak memuat data profil (diperiksa lewat review skema & payload)
- [ ] Dasbor laporan menampilkan grafik dan bisa diekspor CSV/PDF
- [ ] Tidak ada elemen kompetisi antar anak maupun poin terkait berat badan
- [ ] Test: pembuat kuis, perhitungan streak, agregasi laporan

## Prompt Siap Pakai
```text
Kerjakan M9 bagian A dulu (gamifikasi di localStorage), tunjukkan hasil, baru bagian B.
Pastikan event anonim tidak memuat data profil. Jangan membuat peringkat antar anak.
WAJIB: panggil skill ui-ux-pro-max dan hallmark untuk semua UI (rujuk design-system/MASTER.md),
lalu jalankan hallmark audit dan tulis ringkasannya ke docs/ui-audit/M9.md.
```
