import type { Sex } from "@mbg/shared";

export interface AkgSeedRow {
  sex: Sex;
  ageMin: number;
  ageMax: number;
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  fiberG: number;
  ironMg: number;
}

/**
 * Tabel AKG harian anak & remaja (usia 4-18 tahun) sesuai MD/04 §2.3.
 * Catatan verifikasi: sudah dicocokkan dengan angka Permenkes RI No. 28 Tahun 2019;
 * tetap perlu verifikasi akhir terhadap Lampiran I PDF resmi Permenkes 28/2019 sebelum rilis publik.
 * Kelompok 4-6 dan 7-9 diduplikasi untuk `male` dan `female` agar lookup `(sex, age)` selalu konsisten.
 */
export const AKG_SEED_ROWS: readonly AkgSeedRow[] = [
  { sex: "male", ageMin: 4, ageMax: 6, energyKcal: 1400, proteinG: 25, fatG: 50, carbG: 220, fiberG: 20, ironMg: 9 },
  { sex: "female", ageMin: 4, ageMax: 6, energyKcal: 1400, proteinG: 25, fatG: 50, carbG: 220, fiberG: 20, ironMg: 9 },
  { sex: "male", ageMin: 7, ageMax: 9, energyKcal: 1650, proteinG: 40, fatG: 55, carbG: 250, fiberG: 23, ironMg: 10 },
  { sex: "female", ageMin: 7, ageMax: 9, energyKcal: 1650, proteinG: 40, fatG: 55, carbG: 250, fiberG: 23, ironMg: 10 },
  { sex: "male", ageMin: 10, ageMax: 12, energyKcal: 2000, proteinG: 50, fatG: 65, carbG: 300, fiberG: 28, ironMg: 8 },
  { sex: "female", ageMin: 10, ageMax: 12, energyKcal: 1900, proteinG: 55, fatG: 65, carbG: 280, fiberG: 27, ironMg: 8 },
  { sex: "male", ageMin: 13, ageMax: 15, energyKcal: 2400, proteinG: 70, fatG: 80, carbG: 350, fiberG: 34, ironMg: 11 },
  { sex: "female", ageMin: 13, ageMax: 15, energyKcal: 2050, proteinG: 65, fatG: 70, carbG: 300, fiberG: 29, ironMg: 15 },
  { sex: "male", ageMin: 16, ageMax: 18, energyKcal: 2650, proteinG: 75, fatG: 85, carbG: 400, fiberG: 37, ironMg: 11 },
  { sex: "female", ageMin: 16, ageMax: 18, energyKcal: 2100, proteinG: 65, fatG: 70, carbG: 300, fiberG: 29, ironMg: 15 },
];
