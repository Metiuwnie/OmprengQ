# M2 — Dasbor Admin: Sekolah, Bahan, Menu & Kalkulasi Gizi

**Estimasi:** 3–4 hari · **Prasyarat:** M1 · **Baca:** 02, 03, 04 (bagian 1)

## Tujuan
Ahli gizi/admin dapat mengelola sekolah, membuat menu harian per jenjang, dan melihat total gizi satu porsi yang terhitung otomatis dari data TKPI. Admin juga dapat membuat & mengunduh QR statis sekolah.

## Tugas

### Backend
1. CRUD `/admin/sppg` (super_admin), `/admin/schools` (slug unik, otomatis dari nama bisa diedit, validasi huruf kecil-angka-strip), `/admin/foods` (pencarian `?q=`, bahan custom).
2. `packages/shared/nutrition/computePortionTotals` + test (lihat `04` bagian 1).
3. `/admin/menus`: daftar per rentang tanggal, buat/ubah/hapus, **satu menu per SPPG per tanggal**.
4. `PUT /admin/menus/:id/portions/:level`: terima daftar item → validasi Zod → hitung `totals` & `allergens` → simpan (transaksi).
5. `POST /admin/menus/:id/publish`, `POST /admin/menus/copy` (salin ke tanggal lain/minggu depan).
6. `GET /admin/schools/:id/qr?format=png|svg` menghasilkan QR ke `APP_BASE_URL/s/:slug/hari-ini` (pustaka `qrcode`), plus opsi `size`.
7. (Opsional) `POST /admin/uploads/presign` untuk foto menu ke S3/R2.

### Frontend (shadcn/ui)
1. **Daftar menu** tampilan kalender mingguan/bulanan: status draft/published per tanggal.
2. **Form menu:** nama menu, deskripsi, fun fact, foto (opsional), tab per jenjang (`sd_low`, `sd_high`, `smp`, `sma`).
3. **Editor bahan per porsi:** combobox cari bahan TKPI → isi gram, label tampil, satuan visual ("1 centong"), manfaat singkat. Tombol "Salin dari jenjang lain".
4. **Panel gizi langsung** (live): total energi, karbo, protein, lemak, serat, zat besi + daftar alergen otomatis. Tampilkan catatan "Perkiraan berdasarkan TKPI".
5. **Salin menu** ke tanggal lain; tombol **Publikasikan**.
6. **Halaman Sekolah:** tabel sekolah, form tambah/ubah, dan kartu **QR Code** dengan tombol Unduh PNG/SVG + tombol "Cetak" (CSS print: QR besar + nama sekolah + teks "Pindai untuk menu & gizi hari ini").
7. **Halaman Bahan:** cari bahan, tambah bahan custom (gizi per 100 g + alergen).

## Aturan Bisnis
- Menu `draft` tidak tampil di endpoint publik.
- Hapus menu published memerlukan konfirmasi.
- Total gizi dihitung ulang setiap kali item disimpan (jangan percaya angka dari klien).
- Validasi: gram > 0 dan ≤ 1000; setidaknya 1 item sebelum publish.

## Skill Desain (Wajib)
Untuk seluruh UI dasbor admin (kalender menu, form menu, editor bahan, panel gizi live, halaman sekolah & QR cetak), **panggil UI UX Pro Max dan Hallmark** sesuai alur di `02` §9: rujuk `design-system/MASTER.md`, bangun dengan Hallmark, terjemahkan ke React + Tailwind + shadcn/ui memakai token yang ada, lalu `hallmark audit`.
- Khusus milestone ini: override halaman `admin`; pakai pola tabel/form yang konsisten, empty/error state ramah.
- Aturan produk di PRD (tanpa label status gizi, bahasa positif, kontras AA) menang bila bertentangan dengan saran skill.
- Simpan ringkasan audit di `docs/ui-audit/M2.md`. Jangan menghapus `.hallmark/log.json`.

## Kriteria Penerimaan
- [x] UI UX Pro Max & Hallmark benar-benar dipanggil (bukti: `docs/ui-audit/M2.md`; `sloplint: 0 FAIL, 0 REFLEX, 0 WARN` pada 12 file)
- [ ] Membuat menu lengkap untuk 1 tanggal & 2 jenjang < 5 menit (uji dengan data demo) *(menunggu uji manual di browser)*
- [x] Total gizi di UI sama dengan hitungan manual sampel (toleransi pembulatan ≤ 0,1) *(memakai `computePortionTotals` tunggal di `@mbg/shared`, 9/9 unit test lolos)*
- [x] Alergen ter-agregasi otomatis (menu dengan telur → "telur") *(`collectPortionAllergens` di `@mbg/shared` & `savePortion` terverifikasi)*
- [x] QR yang diunduh bila dipindai membuka `/s/:slug/hari-ini` *(`services/qr.ts` & `qr.test.ts` 4/4 test lolos)*
- [x] `sppg_admin` hanya melihat data SPPG-nya *(terverifikasi di `admin.test.ts` 6/6 lolos)*
- [x] Test: `computePortionTotals`, validasi, filter RBAC *(terverifikasi di `packages/shared` 9/9 & `admin.test.ts` 6/6 lolos)*
- [ ] Tampilan admin nyaman di laptop dan tidak rusak di 360px *(teraudit di `docs/ui-audit/M2.md`; menunggu verifikasi visual manual di browser)*

## Di Luar Cakupan
Halaman publik (M3), kalkulator (M4–M5).

## Prompt Siap Pakai
```text
Kerjakan M2 dalam 3 tahap berurutan dan berhenti untuk konfirmasi di antaranya:
(1) backend + test, (2) UI menu & editor bahan, (3) QR & halaman sekolah.
Perhitungan gizi harus memakai fungsi di packages/shared saja.
WAJIB: panggil skill ui-ux-pro-max dan hallmark untuk semua UI (rujuk design-system/MASTER.md),
lalu jalankan hallmark audit dan tulis ringkasannya ke docs/ui-audit/M2.md.
```
