# M3 — Laman Menu Harian Publik, QR Dinamis & Mode Presentasi Guru

**Estimasi:** 2 hari · **Prasyarat:** M2 · **Baca:** 02, 03

## Tujuan
Guru memindai QR statis dan langsung melihat menu **hari ini** dengan tampilan ramah anak. Tanpa login, cepat, dan terbaca di proyektor.

## Rute
- `/s/:slug/hari-ini` — menu hari ini (beda tanggal otomatis; berdasarkan `school.timezone` di **server**)
- `/s/:slug/minggu` — jadwal menu mingguan
- `/s/:slug/hari-ini?mode=kelas` — **Mode Presentasi** (layar penuh, huruf besar)
- Bila `slug` tidak ada → halaman 404 ramah.

## Tugas
1. Endpoint publik `GET /public/schools/:slug`, `/today`, `/week` sesuai `03` (cache header: `Cache-Control: public, max-age=300, stale-while-revalidate=600`).
2. **Pemilihan jenjang:** bila sekolah punya >1 jenjang, tampilkan pilihan jenjang (diingat di `localStorage`, key `mbg.level`).
3. **Halaman Menu Harian:**
   - Header: nama sekolah, tanggal Indonesia ("Selasa, 24 November 2026").
   - Foto menu (jika ada) atau ilustrasi/emoji per bahan.
   - Daftar komposisi: nama, satuan visual, ikon kategori, **manfaat fungsi tubuh** per bahan.
   - **Sorotan gizi utama:** 2–3 kartu (mis. "Energi 520 kkal", "Serat 4 g").
   - Edukasi mikro (`funFact`).
   - Penanda alergen menu ("Mengandung: telur, ikan").
   - Tombol utama: **Hitung kebutuhan gizimu** → `/kalkulator?school=:slug` (diisi M5).
4. **Mode Anak (SD)** vs **Mode Remaja (SMP/SMA)** pada tampilan menu: mode Anak = ikon piring besar, kalimat pendek; Remaja = tabel makronutrien ringkas. Mode otomatis dari jenjang, bisa diubah manual.
5. **Mode Presentasi:** tombol "Tampilkan ke kelas" → layar penuh, tipografi besar, kontras tinggi, sembunyikan elemen navigasi, tombol keluar kecil.
6. **Fallback hari tanpa menu:** pesan ramah + menu hari kerja berikutnya (`next`).
7. **Loading/skeleton** dan state error dengan tombol coba lagi.
8. Optimasi: halaman publik di-*lazy load* terpisah dari bundel admin; target < 150 KB gzip untuk rute ini.

## Skill Desain (Wajib)
Untuk halaman menu harian, mode Anak/Remaja, dan **Mode Presentasi**, **panggil UI UX Pro Max dan Hallmark** sesuai alur di `02` §9: rujuk `design-system/MASTER.md`, bangun dengan Hallmark, terjemahkan ke React + Tailwind + shadcn/ui memakai token yang ada, lalu `hallmark audit`.
- Khusus milestone ini: override `mode-kelas` (huruf sangat besar, kontras tinggi, terbaca dari jauh) dan Mode Anak (ikon piring, kalimat pendek); tetap < 150 KB gzip.
- Aturan produk di PRD (tanpa label status gizi, bahasa positif, kontras AA) menang bila bertentangan dengan saran skill.
- Simpan ringkasan audit di `docs/ui-audit/M3.md`. Jangan menghapus `.hallmark/log.json`.

## Kriteria Penerimaan
- [x] UI UX Pro Max & Hallmark benar-benar dipanggil (bukti: `docs/ui-audit/M3.md`; `sloplint: 0 FAIL, 0 REFLEX, 0 WARN` pada 6 file)
- [ ] Scan QR dari M2 → menu hari ini tampil < 3 dtk di throttle "Fast 3G/4G" DevTools *(bundel build terpisah `public-today` 5.29 kB gzip, total muatan awal ~139 kB gzip; menunggu uji DevTools)*
- [ ] Ganti tanggal sistem server/test → menu berpindah sesuai timezone sekolah *(`date-timezone.test.ts` 3/3 lolos; `public.test.ts` menunggu MySQL lokal)*
- [ ] Sabtu/Minggu/hari tanpa menu menampilkan fallback, bukan error *(API fallback `next` lolos di `public.test.ts` 3/3; tinggal uji tampilan UI di browser)*
- [x] Menu `draft` tidak pernah terlihat *(terverifikasi di `public.test.ts` 3/3 lolos)*
- [ ] Mode Presentasi terbaca dari jarak jauh (uji di layar besar/zoom) *(implementasi di `presentation-view.tsx`; menunggu uji visual)*
- [x] Tidak ada ketergantungan pada login atau cookie *(endpoint `/api/public/*` & rute publik tanpa login/cookie)*
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 90 *(belum dijalankan)*
- [x] Test: logika penentuan "hari ini" dengan 3 timezone *(`src/lib/date-timezone.test.ts` 3/3 test lolos)*

## Di Luar Cakupan
Kalkulator (M5), pesan WA (M6), cache offline (M7).

## Prompt Siap Pakai
```text
Kerjakan M3. Tentukan "hari ini" di server memakai school.timezone (jangan jam klien).
Bangun halaman publik yang ringan dan ramah anak; pisahkan bundel dari admin.
Sertakan test untuk logika tanggal.
WAJIB: panggil skill ui-ux-pro-max dan hallmark untuk semua UI (rujuk design-system/MASTER.md),
lalu jalankan hallmark audit dan tulis ringkasannya ke docs/ui-audit/M3.md.
```
