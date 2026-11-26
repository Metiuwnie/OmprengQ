import type { Level } from "@mbg/shared";
import type { DisplayMode } from "./level-storage";

/** Representative daily AKG energy benchmarks (Permenkes 28/2019) per school level. */
export const LEVEL_DAILY_ENERGY_REF: Record<Level, number> = {
  sd_low: 1650,
  sd_high: 2000,
  smp: 2225,
  sma: 2375,
};

export interface PlateGroupItem {
  id: string;
  label: string;
  present: boolean;
}

export interface LevelEducationGuide {
  audienceLabel: string;
  energyBadge: string;
  energyCaption: string;
  magazineBadge: string;
  magazineTitle: string;
  magazineBody: string;
  quickHabit: string;
}

const CATEGORY_BENEFIT_ANAK: Record<string, string> = {
  karbohidrat: "Sumber tenaga supaya kuat bermain dan fokus belajar di kelas.",
  lauk_hewani: "Tinggi protein untuk membantu otot tumbuh kuat dan daya tahan tubuh.",
  lauk_nabati: "Protein nabati dan zat besi yang bikin badan tetap bugar.",
  sayur: "Kaya serat dan vitamin untuk menjaga pencernaan dan mata tetap sehat.",
  buah: "Vitamin alami dan serat segar agar tubuh tidak mudah lelah.",
  susu: "Kalsium dan protein untuk membantu tulang serta gigi tumbuh kuat.",
  lainnya: "Pelengkap rasa agar makan siang makin lahap dan seimbang.",
};

const CATEGORY_BENEFIT_REMAJA: Record<string, string> = {
  karbohidrat: "Karbohidrat kompleks penyedia glukosa stabil untuk konsentrasi belajar.",
  lauk_hewani: "Protein hewani dengan asam amino esensial dan zat besi heme.",
  lauk_nabati: "Protein nabati rendah lemak jenuh serta sumber mineral penting.",
  sayur: "Sumber serat pangan, folat, vitamin, dan antioksidan harian.",
  buah: "Sumber vitamin C, kalium, dan serat untuk pemulihan energi.",
  susu: "Sumber kalsium, riboflavin, dan protein pendukung kepadatan tulang.",
  lainnya: "Komponen pelengkap cita rasa dan energi tambahan dalam porsi.",
};

const LEVEL_GUIDES: Record<Level, LevelEducationGuide> = {
  sd_low: {
    audienceLabel: "SD 1–3",
    energyBadge: "Baterai Tenaga",
    energyCaption:
      "Makan siang ini ikut mengisi tenaga bermain dan belajar; sisanya dilengkapi saat sarapan dan makan malam di rumah.",
    magazineBadge: "Misi Jagoan SD",
    magazineTitle: "Sayur + Lauk = Badan Kuat!",
    magazineBody:
      "Nasi bikin tubuh bertenaga, lauk bikin otot kuat, dan sayur menjaga perut serta mata tetap sehat.",
    quickHabit: "Cuci tangan pakai sabun sebelum makan dan minum air putih setelahnya, ya!",
  },
  sd_high: {
    audienceLabel: "SD 4–6",
    energyBadge: "Baterai Tenaga",
    energyCaption:
      "Cocok untuk mengisi ulang energi setelah belajar dan olahraga; lengkapi sisanya dengan menu sehat di rumah.",
    magazineBadge: "Fakta Keren SD",
    magazineTitle: "Duet Hewani & Nabati",
    magazineBody:
      "Memadukan lauk hewani (ayam, telur, ikan) dan nabati (tempe, tahu) bikin asupan protein dan zat besi makin lengkap.",
    quickHabit: "Sisakan ruang untuk buah segar di rumah dan cek alergen sebelum makan!",
  },
  smp: {
    audienceLabel: "SMP",
    energyBadge: "Bahan Bakar Fokus",
    energyCaption:
      "Menutup sebagian kebutuhan energi harianmu (acuan AKG Permenkes 28/2019) agar konsentrasi belajar tetap terjaga.",
    magazineBadge: "Info Gizi SMP",
    magazineTitle: "Rahasia Fokus: Protein & Zat Besi",
    magazineBody:
      "Di masa pertumbuhan cepat, tubuh butuh protein dan zat besi (terutama bagi remaja putri) agar tidak mudah mengantuk di kelas.",
    quickHabit: "Hindari langsung minum teh manis saat makan supaya zat besi terserap maksimal.",
  },
  sma: {
    audienceLabel: "SMA / SMK",
    energyBadge: "Bahan Bakar Fokus",
    energyCaption:
      "Kontribusi energi makan siang terhadap acuan harian (~2.375 kkal) untuk mendukung jam belajar, praktik, dan ekskul.",
    magazineBadge: "Wawasan SMA / SMK",
    magazineTitle: "Melek AKG untuk Performa Harian",
    magazineBody:
      "Mengombinasikan zat besi dari lauk/sayur hijau dengan vitamin C dari buah membantu menjaga daya tahan dan fokus seharian.",
    quickHabit: "Jika ada jam olahraga atau praktik padat, cek sisa kebutuhan energimu di kalkulator.",
  },
};

/** Return an age-appropriate Indonesian benefit description for a TKPI food category. */
export function getCategoryBenefit(category: string, mode: DisplayMode): string {
  const table = mode === "anak" ? CATEGORY_BENEFIT_ANAK : CATEGORY_BENEFIT_REMAJA;
  return table[category] ?? table["lainnya"] ?? "Pelengkap menu harian.";
}

/** Estimate the percentage of daily AKG energy covered by the school lunch portion. */
export function estimateLunchAkgShare(energyKcal: number, level: Level): number {
  const dailyRef = LEVEL_DAILY_ENERGY_REF[level];
  if (dailyRef <= 0 || energyKcal <= 0) return 0;
  return Math.min(100, Math.round((energyKcal / dailyRef) * 100));
}

/** Check which Isi Piringku food groups are present in the current menu portion. */
export function getPlateGroupChecklist(categories: readonly string[]): PlateGroupItem[] {
  const set = new Set(categories);
  return [
    { id: "pokok", label: "Makanan Pokok", present: set.has("karbohidrat") },
    {
      id: "lauk",
      label: "Lauk Pauk",
      present: set.has("lauk_hewani") || set.has("lauk_nabati"),
    },
    { id: "sayur", label: "Sayur", present: set.has("sayur") },
    { id: "buah_susu", label: "Buah / Susu", present: set.has("buah") || set.has("susu") },
  ];
}

/** Return level-tailored magazine-style nutrition facts and habits. */
export function getLevelEducationGuide(level: Level): LevelEducationGuide {
  return LEVEL_GUIDES[level];
}
