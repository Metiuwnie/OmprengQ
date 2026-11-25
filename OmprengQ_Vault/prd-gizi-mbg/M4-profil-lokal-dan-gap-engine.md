# M4 — Profil Lokal Multi-Anak & Nutritional Gap Engine

**Estimasi:** 2 hari · **Prasyarat:** M2 (boleh paralel dengan M3) · **Baca:** 02, 04 (seluruhnya)

## Tujuan
Mesin perhitungan gizi di `packages/shared` selesai dan teruji, plus penyimpanan profil anak di perangkat (multi-profil) — **tanpa UI kalkulator penuh** (UI di M5).

## Tugas

### Paket `shared`
1. Implementasikan fungsi di `nutrition/` sesuai `04`:
   `computeBmr`, `computeDailyTargets`, `getAkgReference`, `computeGap`, `splitRemainingBySlot`, `recommendMeals`, `estimateActivityKcal`.
2. Konstanta: `PAL`, `MEAL_SPLIT`, daftar alergen, nama ramah nutrien (`"serat"`, `"zat besi"`).
3. Skema Zod `ChildProfileSchema` (lihat bawah) dan fungsi validasi.
4. **Semua kasus uji di `04` bagian 7** harus ada dan lolos. Cakupan test fungsi inti ≥ 90%.

### Profil di klien (`apps/web/src/stores/profiles.ts`)
```ts
type ChildProfile = {
  id: string;            // uuid lokal
  nickname: string;      // nama panggilan (bukan nama lengkap)
  age: number;           // 4–18
  sex: "male" | "female";
  weightKg: number;      // 10–120
  heightCm: number;      // 80–200
  activity: "light" | "moderate" | "active";
  allergies: Allergen[];
  dislikes: string[];
  level: Level;          // jenjang sekolah
  createdAt: string; updatedAt: string;
};
type ProfileState = { profiles: ChildProfile[]; activeId: string | null; schemaVersion: 1 };
```
4. Zustand + `persist` ke `localStorage` (key `mbg.profiles.v1`), dengan `version` dan fungsi `migrate` kosong siap pakai.
5. Aksi: `addProfile`, `updateProfile`, `removeProfile` (konfirmasi), `setActive`.
6. **Ekspor/Impor:** tombol unduh `profil-gizi.json` dan impor dari file (validasi Zod; tolak bila rusak). Tetap lokal, tidak ada upload.
7. **Penanganan localStorage tidak tersedia** (mode privat/penuh): fallback state memori + banner "Data tidak tersimpan di perangkat ini".
8. Komponen headless sementara (halaman `/dev/engine`, hanya aktif di dev) untuk mencoba engine dengan data menu nyata dari `/public/.../today`.

## Aturan Privasi (kritis)
- Profil **tidak pernah** dikirim ke jaringan. Tambahkan test/lint-rule sederhana: modul `stores/profiles` tidak boleh mengimpor klien API.
- Jangan menyimpan nama lengkap, alamat, atau nama sekolah di profil selain `level`.
- Jangan tampilkan/menghitung IMT atau kategori status gizi.

## Kriteria Penerimaan
- [ ] Semua kasus uji `04` §7 lolos; fungsi bersifat murni & deterministik
- [ ] Profil bertahan setelah refresh dan restart browser
- [ ] Bisa membuat ≥ 3 profil dan berganti aktif
- [ ] Ekspor → hapus data → impor memulihkan profil identik
- [ ] DevTools → Network: tidak ada request berisi data profil
- [ ] Data rusak di localStorage tidak membuat aplikasi crash (reset aman)
- [ ] `/dev/engine` menampilkan target, konsumsi MBG, persen, dan sisa untuk 4 profil contoh

## Di Luar Cakupan
UI kalkulator final, bar pemenuhan, ilustrasi (M5).

## Prompt Siap Pakai
```text
Kerjakan M4 dengan TDD: tulis test dari tabel kasus uji di 04 §7 terlebih dahulu, lalu
implementasi. Semua fungsi harus murni (tanpa I/O). Profil hanya di localStorage via zustand persist.
```
