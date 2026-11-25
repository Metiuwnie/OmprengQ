# 04 — Spesifikasi Rumus & Mesin Gizi (Nutritional Gap Engine)

> Dipakai di **M2** (total gizi menu) dan **M4–M5** (selisih & rekomendasi).
> Seluruh kode berada di `packages/shared/src/nutrition/` sebagai **fungsi murni** (tanpa I/O, tanpa `Date.now()`), agar mudah dites dan jalan offline.

> ⚠️ **Verifikasi wajib oleh manusia.** Angka AKG, faktor PAL, dan nilai MET di bawah adalah nilai kerja untuk membangun fitur. Cocokkan tabel AKG dengan dokumen resmi **Permenkes No. 28 Tahun 2019**, dan nilai gizi bahan dengan **TKPI** sebelum dipakai publik. Idealnya diperiksa ahli gizi.

## 1. Total Gizi Menu (server, M2)

Untuk setiap `menu_item`:

```text
gizi_item[n] = (grams / 100) × food[n] per 100 g
```

- `grams` = berat siap makan per porsi (yang tampil ke pengguna).
- Jika admin mengisi **berat mentah**, kalikan `ediblePct/100` lebih dulu. Tentukan satu konvensi saja dan tampilkan jelas di form (default: **berat matang yang dimakan**, nilai TKPI diasumsikan setara BDD).
- `totals = Σ gizi_item` untuk 6 nutrien: `energyKcal, proteinG, fatG, carbG, fiberG, ironMg`.
- `allergens = union(food.allergens)` seluruh bahan porsi.

Fungsi: `computePortionTotals(items, foodsById): NutrientTotals`.

## 2. Tahap 1 — Kebutuhan Harian Personal

### 2.1 BMR — persamaan Schofield (berat badan saja), kkal/hari

| Jenis kelamin | Usia | BMR |
|---|---|---|
| Laki-laki | 3–<10 | 22,7 × BB + 495 |
| Laki-laki | 10–18 | 17,5 × BB + 651 |
| Perempuan | 3–<10 | 22,5 × BB + 499 |
| Perempuan | 10–18 | 12,2 × BB + 746 |

BB dalam kg. Tinggi badan dikumpulkan untuk kelengkapan profil, **tidak dipakai** pada rumus ini (jangan hitung IMT/status gizi di UI).

### 2.2 Faktor aktivitas (PAL), dapat dikonfigurasi di `constants/`

| Pilihan UI | PAL |
|---|---|
| Ringan | 1,4 |
| Sedang | 1,6 |
| Aktif olahraga | 1,8 |

`energi_personal = BMR × PAL`

### 2.3 Zat gizi lain dari tabel AKG

Cari baris `akg_reference` berdasarkan `sex` dan `age` (usia dalam tahun, dibulatkan ke bawah). Nilai kerja (**verifikasi!**):

| Kelompok | Energi (kkal) | Protein (g) | Lemak (g) | Karbo (g) | Serat (g) | Zat besi (mg) |
|---|---|---|---|---|---|---|
| 4–6 th (L/P) | 1400 | 25 | 50 | 220 | 20 | 9 |
| 7–9 th (L/P) | 1650 | 40 | 55 | 250 | 23 | 10 |
| 10–12 th L | 2000 | 50 | 65 | 300 | 28 | 8 |
| 10–12 th P | 1900 | 55 | 65 | 280 | 27 | 8 |
| 13–15 th L | 2400 | 70 | 80 | 350 | 34 | 11 |
| 13–15 th P | 2050 | 65 | 70 | 300 | 29 | 15 |
| 16–18 th L | 2650 | 75 | 85 | 400 | 37 | 11 |
| 16–18 th P | 2100 | 65 | 70 | 300 | 29 | 15 |

### 2.4 Menyelaraskan energi personal dengan AKG

```text
energi_akhir  = clamp(energi_personal, 0.8 × AKG.energi, 1.25 × AKG.energi)
rasio         = energi_akhir / AKG.energi
target.energi = energi_akhir
target.lemak  = AKG.lemak × rasio
target.karbo  = AKG.karbo × rasio
target.protein, target.serat, target.besi = nilai AKG apa adanya
```

Fungsi: `computeDailyTargets(profile): NutrientTotals`.

## 3. Tahap 2 — Selisih Gizi dengan Menu MBG

Input tambahan **porsi dimakan** `eaten ∈ {1, 0.75, 0.5, 0.25}` (default 1).

```text
konsumsi_mbg[n] = totals_menu[n] × eaten
persen[n]       = konsumsi_mbg[n] / target[n] × 100        // untuk progress bar
sisa[n]         = max(0, target[n] − konsumsi_mbg[n])       // jangan pernah negatif
```

Fungsi: `computeGap(targets, menuTotals, eaten) → { consumed, percent, remaining }`.

Aturan tampilan persen:
- Bar dibatasi visual 100%, angka boleh >100% (teks netral: "sudah tercukupi").
- Tidak ada warna merah/peringatan keras. Palet: hijau/kuning lembut. Nada pesan selalu positif.

## 4. Tahap 3 — Rekomendasi Takaran Rumah Tangga (rule-based)

### 4.1 Pembagian sisa ke waktu makan

Konfigurasi default (`constants/meal-split.ts`): sarapan 25%, **MBG (makan siang) 35%**, selingan 10%, makan malam 30%.

```text
bobot_slot = { sarapan: 25, selingan: 10, makan_malam: 30 }  // dinormalisasi jumlah = 65
target_slot[s][n] = sisa[n] × bobot_slot[s] / 65
```

Jika sisa kecil (semua nutrien ≥ 90% terpenuhi) → tampilkan pesan "Hari ini gizimu sudah hampir lengkap 🎉", tanpa rekomendasi tambahan selain saran air putih/buah.

### 4.2 Pemilihan pangan (greedy)

Untuk tiap slot yang diminta (default: **makan_malam**, lalu sarapan keesokan hari bila ingin):

1. Kandidat = `household_foods` dengan `mealSlots` memuat slot tsb.
2. **Saring** kandidat yang mengandung alergen profil, atau cocok dengan daftar tak suka (pencocokan nama/kategori).
3. Bobot kekurangan: `w[n] = target_slot[n] / target_harian[n]` (kekurangan relatif), lalu **tambah pengali**: serat ×1,5; zat besi ×1,5 bila perempuan usia ≥ 10; protein ×1,2.
4. Skor kandidat `c`: `Σ_n w[n] × min(c[n], sisa_slot[n]) / target_slot[n]` (hanya mengejar yang masih kurang; tidak memberi poin untuk kelebihan).
5. Pilih kandidat berskor tertinggi, kurangi `sisa_slot`, ulangi. **Batasan:** maks. 1 item per kategori, maks. 4 item/slot, berhenti bila semua nutrien slot ≥ 85% atau skor < ambang.
6. Tiebreak: `priceTier` lebih rendah lebih dulu (terjangkau), lalu variasi (hindari pangan yang sama dengan menu MBG hari itu).

Fungsi: `recommendMeals({ remaining, targets, profile, catalog, mbgFoodNames }) → Recommendation[]`.

```ts
type Recommendation = {
  slot: "sarapan" | "selingan" | "makan_malam";
  items: { name: string; urtLabel: string; emoji?: string; covers: NutrientKey[] }[];
  summaryText: string; // kalimat siap tampil
};
```

### 4.3 Templat pesan (positif, kontekstual)

```text
"Menu MBG hari ini sudah memenuhi {energi%}% energimu, tetapi {nutrien_kurang} masih kurang.
Untuk makan malam di rumah, tambahkan {urt_1} dan {urt_2} supaya kebutuhan harianmu terpenuhi."
```

- `nutrien_kurang` = 1–2 nutrien dengan persen terendah (nama ramah: "serat", "zat besi", "protein").
- Mode Anak: kalimat pendek + satuan visual + manfaat ("Biar kuat berlari").

## 5. Alergi & Pantangan

- Profil menyimpan `allergies: Allergen[]` dan `dislikes: string[]`.
- Jika `menu.allergens ∩ profile.allergies ≠ ∅` → tampilkan **penanda peringatan** pada menu (ikon + teks lembut: "Menu ini mengandung telur. Bicarakan dengan guru/orang tua ya.") dan hitung `konsumsi_mbg` tetap apa adanya, tetapi tawarkan toggle "Aku tidak makan bagian ini" → mengurangi porsi dimakan.
- Saran pengganti: pilih pangan **sekategori protein** (hewani/nabati) tanpa alergen; masuk sebagai bagian rekomendasi makan malam.

## 6. Estimasi Kalori Aktivitas (Mode Remaja, opsional)

`kkal ≈ MET × BB(kg) × jam`. Nilai MET perkiraan: jalan santai 3,5 · bersepeda santai 6 · bulu tangkis 5 · futsal/sepak bola 7 · basket 6,5 · berenang 6 · lari 8. Tampilkan sebagai perkiraan, bukan ukuran akurat.

## 7. Kasus Uji Wajib (Vitest)

| Kasus | Input | Ekspektasi |
|---|---|---|
| BMR laki-laki 8 th | BB 25 kg | 1062,5 kkal |
| Energi laki-laki 8 th sedang | BB 25, PAL 1,6 | 1700 kkal (dalam rentang AKG 1650 ±) |
| BMR perempuan 14 th | BB 45 kg | 1295 kkal; ×1,6 = 2072 |
| Clamp | Energi hitung 3000 untuk AKG 2000 | 2500 (1,25×) |
| Selisih tidak negatif | konsumsi > target | `remaining = 0` |
| Porsi dimakan 0,5 | menu 520 kkal | konsumsi 260 kkal |
| Alergen | profil alergi telur, menu ada telur | peringatan aktif; rekomendasi tidak memuat telur |
| Pembagian slot | sisa 650 kkal | sarapan 250, selingan 100, makan malam 300 |
| Menu kosong | `menuTotals` null | fungsi mengembalikan hasil aman (tanpa throw) |
| Determinisme | input sama | output identik (urutan stabil) |
