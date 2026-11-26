import type { Level, NutrientTotals } from "@mbg/shared";
import { getCategoryBenefit } from "@/features/public/lib/nutrition-education";

export interface QuizMenuItem {
  label: string;
  category: string;
  benefit?: string | null;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: readonly string[];
  correctIndex: number;
  positiveFeedback: string;
}

export interface DailyMission {
  id: string;
  label: string;
  hint: string;
  badgeText: string;
  actionStep: string;
  iconKey: "veggie" | "water" | "home";
}

export interface UnlockedFoodCard {
  name: string;
  category: string;
  fact: string;
  unlockedDate: string;
}

export interface ProfileGamificationProgress {
  completedDates: string[];
  checkedMissionsByDate: Record<string, string[]>;
  completedQuizDates: string[];
  unlockedCards: UnlockedFoodCard[];
}

export interface ThematicBadge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}

export interface SdgSpotlight {
  weekNumber: number;
  sdgTag: string;
  title: string;
  summary: string;
}

/** Three positive daily missions (zero weight/restriction framing). */
export const DAILY_MISSIONS: readonly DailyMission[] = [
  {
    id: "habiskan_sayur",
    label: "Habiskan sayur di ompreng",
    actionStep: "Makan sayur bergantian dengan nasi dan lauk sampai habis.",
    hint: "Serat dan vitamin dari sayur menjaga pencernaan dan fokus belajar.",
    badgeText: "Misi Ompreng",
    iconKey: "veggie",
  },
  {
    id: "minum_air",
    label: "Minum 1 gelas air putih setelah makan",
    actionStep: "Pilih air putih setelah makan siang dan kurangi minuman manis.",
    hint: "Cairan yang cukup membantu tubuh menyerap zat gizi dengan baik.",
    badgeText: "Misi Segar",
    iconKey: "water",
  },
  {
    id: "lengkapi_rumah",
    label: "Tambah buah atau sayur di rumah",
    actionStep: "Lengkapi 1 porsi buah segar atau sayur saat makan di rumah.",
    hint: "Melengkapi variasi warna piring saat sarapan atau makan malam.",
    badgeText: "Misi Rumah",
    iconKey: "home",
  },
];

/** Build 3 menu-aware, age-appropriate daily missions for the active menu. */
export function getDailyMissions(items: readonly QuizMenuItem[], level: Level): DailyMission[] {
  const veggieItem = findFirstByCategory(items, ["sayur"]);
  const hasFruit = items.some((item) => item.category === "buah");
  const hasMilk = items.some((item) => item.category === "susu");
  const isTeen = level === "smp" || level === "sma";

  const veggieMission: DailyMission = {
    id: "habiskan_sayur",
    label: veggieItem ? `Habiskan ${veggieItem.label} di ompreng` : "Habiskan sayur di ompreng",
    actionStep: veggieItem
      ? `Nikmati ${veggieItem.label} bergantian bersama nasi dan lauk sampai habis.`
      : "Makan sayur bergantian dengan nasi dan lauk sampai habis.",
    hint: "Serat, vitamin, dan mineralnya membantu pencernaan dan fokus di kelas.",
    badgeText: "Misi Ompreng",
    iconKey: "veggie",
  };

  const waterMission: DailyMission = {
    id: "minum_air",
    label: "Minum 1 gelas air putih setelah makan",
    actionStep: isTeen
      ? "Minum air putih yang cukup setelah makan siang untuk menjaga konsentrasi sore."
      : "Minum air putih setelah makan siang supaya tubuh segar dan tidak cepat haus.",
    hint: "Cairan yang cukup membantu tubuh menyerap zat gizi dengan optimal.",
    badgeText: "Misi Segar",
    iconKey: "water",
  };

  let homeLabel = "Tambah warna sayur atau buah di rumah";
  let homeStep = "Tambahkan potongan buah atau sayur berwarna cerah saat makan malam.";
  if (!hasFruit) {
    homeLabel = "Lengkapi 1 porsi buah segar di rumah";
    homeStep = "Makan 1 porsi buah segar (pisang, pepaya, atau jeruk) sebagai camilan sore.";
  } else if (!hasMilk) {
    homeLabel = "Lengkapi segelas susu atau camilan buah di rumah";
    homeStep = "Tambahkan segelas susu atau buah segar saat sarapan atau sore hari.";
  }

  const homeMission: DailyMission = {
    id: "lengkapi_rumah",
    label: homeLabel,
    actionStep: homeStep,
    hint: "Melengkapi variasi kelompok pangan Isi Piringku sepanjang hari.",
    badgeText: "Misi Rumah",
    iconKey: "home",
  };

  return [veggieMission, waterMission, homeMission];
}

const SDG_SPOTLIGHTS: readonly Omit<SdgSpotlight, "weekNumber">[] = [
  {
    sdgTag: "SDG 2 — Tanpa Kelaparan",
    title: "Pangan Lokal Bergizi di Setiap Ompreng",
    summary:
      "Menu MBG memadukan beras, tempe, tahu, ikan, dan sayur lokal Nusantara agar siswa mendapatkan energi dan protein seimbang setiap hari sekolah.",
  },
  {
    sdgTag: "SDG 3 — Kehidupan Sehat & Sejahtera",
    title: "Kenali Alergen & Lengkapi Serat Harian",
    summary:
      "Membaca komposisi bahan dan melengkapi buah serta sayur di rumah membantu menjaga daya tahan tubuh dan kesehatan pencernaan.",
  },
  {
    sdgTag: "SDG 4 — Pendidikan Berkualitas",
    title: "Gizi Cukup Membantu Konsentrasi Belajar",
    summary:
      "Energi stabil dari karbohidrat, protein, dan zat besi mendukung daya ingat serta semangat mengikuti pelajaran di kelas.",
  },
];

function findFirstByCategory(
  items: readonly QuizMenuItem[],
  categories: readonly string[],
): QuizMenuItem | undefined {
  return items.find((item) => categories.includes(item.category));
}

/** Generate 3 automatic offline multiple-choice quiz questions from today's menu. */
export function generateDailyQuiz(
  menuName: string,
  items: readonly QuizMenuItem[],
  totals: NutrientTotals,
  level: Level,
): QuizQuestion[] {
  const proteinItem = findFirstByCategory(items, ["lauk_hewani", "lauk_nabati"]);
  const fiberItem = findFirstByCategory(items, ["sayur", "buah"]);
  const carbItem = findFirstByCategory(items, ["karbohidrat"]);

  const q1Correct = proteinItem?.label ?? "Lauk berprotein";
  const q1Options = [
    q1Correct,
    carbItem?.label ?? "Nasi / sumber karbohidrat",
    fiberItem?.label ?? "Sayur & buah segar",
  ];
  if (q1Options[0] === q1Options[1]) q1Options[1] = "Air putih hangat";
  if (q1Options[0] === q1Options[2] || q1Options[1] === q1Options[2]) {
    q1Options[2] = "Kerupuk tapioka";
  }

  const q2Correct = fiberItem?.label ?? "Sayur dan buah warna-warni";
  const q2Options = [
    "Minyak goreng",
    q2Correct,
    carbItem?.label && carbItem.label !== q2Correct ? carbItem.label : "Nasi putih",
  ];

  const isTeen = level === "smp" || level === "sma";
  const q3Prompt = isTeen
    ? `Berapa perkiraan energi dari porsi menu "${menuName}" hari ini?`
    : "Apa manfaat utama makan siang lengkap dengan sayur dan lauk?";
  const roundedKcal = Math.round(totals.energyKcal);
  const q3Options = isTeen
    ? [
        `${roundedKcal} kkal`,
        `${Math.max(120, roundedKcal - 220)} kkal`,
        `${roundedKcal + 280} kkal`,
      ]
    : [
        "Memberi tenaga, bantu tumbuh kuat, dan menjaga fokus belajar",
        "Supaya cepat mengantuk saat jam pelajaran",
        "Agar tidak perlu minum air putih seharian",
      ];

  return [
    {
      id: "quiz-protein",
      prompt: `Dari menu "${menuName}" hari ini, bahan mana yang menjadi sumber protein utama?`,
      options: q1Options,
      correctIndex: 0,
      positiveFeedback: `Hebat! ${q1Correct} kaya protein untuk membantu pertumbuhan dan daya tahan tubuh.`,
    },
    {
      id: "quiz-fiber",
      prompt: "Bahan mana yang paling membantu menyumbang serat dan vitamin untuk pencernaan?",
      options: q2Options,
      correctIndex: 1,
      positiveFeedback: `Tepat sekali! ${q2Correct} kaya serat dan vitamin agar tubuh tetap bugar.`,
    },
    {
      id: "quiz-energy",
      prompt: q3Prompt,
      options: q3Options,
      correctIndex: 0,
      positiveFeedback: isTeen
        ? `Benar! Menu ini menyumbang sekitar ${roundedKcal} kkal untuk energi belajarmu.`
        : "Keren! Kombinasi makanan pokok, lauk, dan sayur membuatmu siap belajar dan bermain.",
    },
  ];
}

function shiftIso(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + deltaDays));
  return dt.toISOString().slice(0, 10);
}

/** Count consecutive completed days ending at today (or yesterday if today not yet done). */
export function computeStreak(completedDates: readonly string[], todayIso: string): number {
  const set = new Set(completedDates);
  let cursor = set.has(todayIso) ? todayIso : shiftIso(todayIso, -1);
  if (!set.has(cursor)) return 0;

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = shiftIso(cursor, -1);
  }
  return streak;
}

/** Compute earned thematic badges for a single child profile (never cross-child ranking). */
export function computeBadges(
  progress: ProfileGamificationProgress,
  todayIso: string,
): ThematicBadge[] {
  const streak = computeStreak(progress.completedDates, todayIso);
  const allCheckedMissions = Object.values(progress.checkedMissionsByDate).flat();
  const vegCount = allCheckedMissions.filter((id) => id === "habiskan_sayur").length;

  return [
    {
      id: "penjelajah_gizi",
      title: "Penjelajah Gizi",
      description: "Menyelesaikan kuis menu harian pertamamu.",
      earned: progress.completedQuizDates.length >= 1,
    },
    {
      id: "pahlawan_serat",
      title: "Pahlawan Serat",
      description: "Menyelesaikan misi habiskan sayur.",
      earned: vegCount >= 1,
    },
    {
      id: "jagoan_protein",
      title: "Jagoan Protein",
      description: "Mengoleksi minimal 2 kartu pangan bergizi.",
      earned: progress.unlockedCards.length >= 2,
    },
    {
      id: "bintang_konsisten",
      title: "Bintang Konsisten",
      description: "Menjaga streak misi atau kuis 3 hari berturut-turut.",
      earned: streak >= 3,
    },
  ];
}

/** Pick an unlocked food card from today's menu items. */
export function pickCardToUnlock(
  items: readonly QuizMenuItem[],
  existingNames: readonly string[],
  todayIso: string,
): UnlockedFoodCard | null {
  const existing = new Set(existingNames);
  const candidate = items.find((item) => !existing.has(item.label)) ?? items[0];
  if (!candidate) return null;
  if (existing.has(candidate.label)) return null;
  return {
    name: candidate.label,
    category: candidate.category,
    fact: candidate.benefit?.trim() || getCategoryBenefit(candidate.category, "anak"),
    unlockedDate: todayIso,
  };
}

/** Weekly rotating SDG 2/3/4 educational spotlight (Part C). */
export function getWeeklySdgSpotlight(isoDate: string): SdgSpotlight {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
  const startOfYear = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((dt.getTime() - startOfYear.getTime()) / 86_400_000) + 1;
  const weekNumber = Math.max(1, Math.ceil(dayOfYear / 7));
  const item = SDG_SPOTLIGHTS[(weekNumber - 1) % SDG_SPOTLIGHTS.length]!;
  return { weekNumber, ...item };
}
