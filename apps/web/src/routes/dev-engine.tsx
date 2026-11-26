import {
  ACTIVITIES,
  ACTIVITY_LABELS,
  ALLERGEN_LABELS,
  ALLERGENS,
  ChildProfileInputSchema,
  computeDailyTargets,
  computeGap,
  EATEN_FRACTIONS,
  estimateActivityKcal,
  findMenuAllergenWarnings,
  LEVELS,
  NUTRIENT_FRIENDLY_NAMES,
  NUTRIENT_KEYS,
  recommendMeals,
  splitRemainingBySlot,
  type ActivityLevel,
  type Allergen,
  type ChildProfileInput,
  type EatenFraction,
  type HouseholdFoodCatalogItem,
  type Level,
  type NutrientKey,
  type NutrientTotals,
  type Sex,
} from "@mbg/shared";
import {
  ArrowLeft,
  Download,
  Info,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserCheck,
  Utensils,
} from "lucide-react";
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { usePublicTodayQuery } from "@/features/public/hooks/use-public-menu";
import { downloadProfilesBackup, useProfileStore } from "@/stores/profiles";

const LEVEL_LABELS: Record<Level, string> = {
  sd_low: "SD Kelas 1–3",
  sd_high: "SD Kelas 4–6",
  smp: "SMP",
  sma: "SMA",
};

const NUTRIENT_UNITS: Record<NutrientKey, string> = {
  energyKcal: "kkal",
  proteinG: "g",
  fatG: "g",
  carbG: "g",
  fiberG: "g",
  ironMg: "mg",
};

const SAMPLE_PROFILES: readonly ChildProfileInput[] = [
  {
    nickname: "Budi (SD Rendah)",
    age: 8,
    sex: "male",
    weightKg: 25,
    heightCm: 128,
    activity: "moderate",
    allergies: ["telur"],
    dislikes: [],
    level: "sd_low",
  },
  {
    nickname: "Ayu (SD Tinggi)",
    age: 11,
    sex: "female",
    weightKg: 35,
    heightCm: 142,
    activity: "light",
    allergies: [],
    dislikes: ["kangkung"],
    level: "sd_high",
  },
  {
    nickname: "Sari (SMP)",
    age: 14,
    sex: "female",
    weightKg: 45,
    heightCm: 155,
    activity: "moderate",
    allergies: ["kacang"],
    dislikes: [],
    level: "smp",
  },
  {
    nickname: "Raka (SMA)",
    age: 17,
    sex: "male",
    weightKg: 60,
    heightCm: 170,
    activity: "active",
    allergies: [],
    dislikes: [],
    level: "sma",
  },
];

const DEV_HOUSEHOLD_CATALOG: readonly HouseholdFoodCatalogItem[] = [
  {
    name: "Nasi putih hangat",
    category: "karbohidrat",
    urtLabel: "1 centong penuh",
    grams: 100,
    energyKcal: 180,
    proteinG: 3,
    fatG: 0.3,
    carbG: 39.8,
    fiberG: 0.3,
    ironMg: 0.4,
    allergens: [],
    mealSlots: ["sarapan", "makan_malam"],
    priceTier: 1,
    emoji: "🍚",
  },
  {
    name: "Telur dadar",
    category: "lauk_hewani",
    urtLabel: "1 butir sedang",
    grams: 55,
    energyKcal: 110,
    proteinG: 7,
    fatG: 8,
    carbG: 0.5,
    fiberG: 0,
    ironMg: 1.5,
    allergens: ["telur"],
    mealSlots: ["sarapan", "makan_malam"],
    priceTier: 1,
    emoji: "🍳",
  },
  {
    name: "Ayam panggang kecap",
    category: "lauk_hewani",
    urtLabel: "1 potong sedang",
    grams: 60,
    energyKcal: 140,
    proteinG: 15,
    fatG: 7,
    carbG: 3,
    fiberG: 0,
    ironMg: 1.2,
    allergens: [],
    mealSlots: ["makan_malam"],
    priceTier: 2,
    emoji: "🍗",
  },
  {
    name: "Tempe bacem",
    category: "lauk_nabati",
    urtLabel: "2 potong sedang",
    grams: 50,
    energyKcal: 75,
    proteinG: 7.5,
    fatG: 3,
    carbG: 7.5,
    fiberG: 0.7,
    ironMg: 2.0,
    allergens: ["kedelai"],
    mealSlots: ["sarapan", "makan_malam"],
    priceTier: 1,
    emoji: "🟫",
  },
  {
    name: "Sayur bayam bening",
    category: "sayur",
    urtLabel: "1 mangkuk sedang",
    grams: 100,
    energyKcal: 36,
    proteinG: 2.5,
    fatG: 0.4,
    carbG: 6.5,
    fiberG: 3.5,
    ironMg: 3.9,
    allergens: [],
    mealSlots: ["sarapan", "makan_malam"],
    priceTier: 1,
    emoji: "🥬",
  },
  {
    name: "Tumis kangkung",
    category: "sayur",
    urtLabel: "1 mangkuk sedang",
    grams: 100,
    energyKcal: 55,
    proteinG: 2.2,
    fatG: 2.5,
    carbG: 6,
    fiberG: 3.2,
    ironMg: 2.5,
    allergens: [],
    mealSlots: ["makan_malam"],
    priceTier: 1,
    emoji: "🥦",
  },
  {
    name: "Pepaya potong",
    category: "buah",
    urtLabel: "1 potong besar",
    grams: 110,
    energyKcal: 46,
    proteinG: 0.5,
    fatG: 0.1,
    carbG: 12,
    fiberG: 2.0,
    ironMg: 0.3,
    allergens: [],
    mealSlots: ["sarapan", "selingan", "makan_malam"],
    priceTier: 1,
    emoji: "🍈",
  },
  {
    name: "Pisang ambon",
    category: "buah",
    urtLabel: "1 buah sedang",
    grams: 100,
    energyKcal: 99,
    proteinG: 1.2,
    fatG: 0.2,
    carbG: 25.8,
    fiberG: 2.6,
    ironMg: 0.5,
    allergens: [],
    mealSlots: ["sarapan", "selingan", "makan_malam"],
    priceTier: 1,
    emoji: "🍌",
  },
];

const FALLBACK_MENU_TOTALS: NutrientTotals = {
  energyKcal: 520,
  proteinG: 21,
  fatG: 15,
  carbG: 74,
  fiberG: 4.5,
  ironMg: 2.8,
};

function formatNum(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

interface ProfileGapCardProps {
  profile: ChildProfileInput;
  menuTotals: NutrientTotals | null;
  menuAllergens: readonly Allergen[];
  mbgFoodNames: readonly string[];
  eaten: EatenFraction;
  isActive?: boolean;
}

function ProfileGapCard({
  profile,
  menuTotals,
  menuAllergens,
  mbgFoodNames,
  eaten,
  isActive = false,
}: ProfileGapCardProps) {
  const targets = useMemo(() => computeDailyTargets(profile), [profile]);
  const gap = useMemo(() => computeGap(targets, menuTotals, eaten), [targets, menuTotals, eaten]);
  const slots = useMemo(() => splitRemainingBySlot(gap.remaining), [gap.remaining]);
  const warnings = useMemo(
    () => findMenuAllergenWarnings(menuAllergens, profile.allergies),
    [menuAllergens, profile.allergies],
  );
  const recs = useMemo(
    () =>
      recommendMeals({
        remaining: gap.remaining,
        targets,
        profile,
        catalog: DEV_HOUSEHOLD_CATALOG,
        mbgFoodNames,
        slots: ["makan_malam"],
      }),
    [gap.remaining, targets, profile, mbgFoodNames],
  );
  const sampleSportKcal = useMemo(
    () => estimateActivityKcal("futsal", profile.weightKg, 0.5),
    [profile.weightKg],
  );

  return (
    <Card className={isActive ? "ring-2 ring-primary" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{profile.nickname}</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="mint">{LEVEL_LABELS[profile.level]}</Badge>
            <Badge variant="accent">
              {profile.age} th · {profile.weightKg} kg · {ACTIVITY_LABELS[profile.activity]}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Alergi:{" "}
          {profile.allergies.length > 0
            ? profile.allergies.map((a) => ALLERGEN_LABELS[a]).join(", ")
            : "Tidak ada"}{" "}
          · Perkiraan 30 mnt futsal ≈ {Math.round(sampleSportKcal)} kkal
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {warnings.length > 0 && (
          <div
            role="note"
            className="flex items-start gap-2 rounded-2xl border border-border bg-accent/25 px-3 py-2 text-xs text-foreground"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Menu ini mengandung{" "}
              <strong>{warnings.map((a) => ALLERGEN_LABELS[a].toLowerCase()).join(", ")}</strong>.
              Bicarakan dengan guru/orang tua ya.
            </span>
          </div>
        )}

        <div className="space-y-2.5">
          {NUTRIENT_KEYS.map((key) => {
            const pct = Math.round(gap.percent[key]);
            return (
              <div key={key} className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                  <span className="font-semibold capitalize">{NUTRIENT_FRIENDLY_NAMES[key]}</span>
                  <span className="tabular-nums text-muted-foreground">
                    MBG {formatNum(gap.consumed[key])} / Target {formatNum(targets[key])}{" "}
                    {NUTRIENT_UNITS[key]} ({pct}%{pct >= 100 ? " · sudah tercukupi" : ""} · sisa{" "}
                    {formatNum(gap.remaining[key])})
                  </span>
                </div>
                <Progress value={Math.min(100, pct)} label={`${NUTRIENT_FRIENDLY_NAMES[key]} ${profile.nickname}`} />
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-background/70 p-3 text-xs">
          <p className="font-semibold text-foreground">Pembagian sisa energi per waktu makan:</p>
          <p className="mt-1 tabular-nums text-muted-foreground">
            Sarapan {Math.round(slots.sarapan.energyKcal)} kkal · Selingan{" "}
            {Math.round(slots.selingan.energyKcal)} kkal · Makan malam{" "}
            {Math.round(slots.makan_malam.energyKcal)} kkal
          </p>
        </div>

        {recs[0] && (
          <div className="rounded-2xl border border-border bg-mint-soft/50 p-3 text-xs">
            <p className="font-semibold text-foreground">Rekomendasi Makan Malam:</p>
            <p className="mt-1 text-muted-foreground">{recs[0].summaryText}</p>
            {recs[0].items.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recs[0].items.map((item) => (
                  <Badge key={item.name} variant="default">
                    {item.emoji ? `${item.emoji} ` : ""}
                    {item.name} ({item.urtLabel})
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Dev-only harness for M4 local profiles store & nutritional gap engine. */
export function DevEnginePage() {
  const [slugInput, setSlugInput] = useState("sdn-01-demo");
  const [activeSlug, setActiveSlug] = useState("sdn-01-demo");
  const [eaten, setEaten] = useState<EatenFraction>(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("9");
  const [sex, setSex] = useState<Sex>("male");
  const [weightKg, setWeightKg] = useState("28");
  const [heightCm, setHeightCm] = useState("132");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [level, setLevel] = useState<Level>("sd_low");
  const [allergies, setAllergies] = useState<Allergen[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profiles,
    activeId,
    storageUnavailable,
    addProfile,
    removeProfile,
    setActive,
    exportProfilesJson,
    importProfilesJson,
  } = useProfileStore();

  const { data: todayData, isLoading, isError, refetch } = usePublicTodayQuery(activeSlug);

  const activeMenu = todayData?.menu ?? todayData?.next ?? null;

  function resolveMenuForLevel(targetLevel: Level): {
    totals: NutrientTotals | null;
    allergens: Allergen[];
    foodNames: string[];
    sourceLabel: string;
  } {
    const portion = activeMenu?.portions[targetLevel];
    if (portion) {
      return {
        totals: portion.totals,
        allergens: portion.allergens,
        foodNames: portion.items.map((i) => i.label),
        sourceLabel: `${activeMenu.name} (${activeMenu.date})`,
      };
    }
    const firstAvailable = activeMenu ? Object.values(activeMenu.portions)[0] : undefined;
    if (firstAvailable && activeMenu) {
      return {
        totals: firstAvailable.totals,
        allergens: firstAvailable.allergens,
        foodNames: firstAvailable.items.map((i) => i.label),
        sourceLabel: `${activeMenu.name} (${activeMenu.date}, porsi tersedia)`,
      };
    }
    return {
      totals: FALLBACK_MENU_TOTALS,
      allergens: ["telur"],
      foodNames: ["Nasi putih hangat"],
      sourceLabel: "Contoh menu lokal (520 kkal, mengandung telur)",
    };
  }

  function handleToggleAllergy(allergen: Allergen) {
    setAllergies((prev) =>
      prev.includes(allergen) ? prev.filter((item) => item !== allergen) : [...prev, allergen],
    );
  }

  function handleAddProfile(event: FormEvent) {
    event.preventDefault();
    const parsed = ChildProfileInputSchema.safeParse({
      nickname,
      age: Number(age),
      sex,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      activity,
      allergies,
      dislikes: [],
      level,
    });
    if (!parsed.success) {
      setStatusMessage(parsed.error.issues[0]?.message ?? "Data profil tidak valid.");
      return;
    }
    const created = addProfile(parsed.data);
    setNickname("");
    setAllergies([]);
    setStatusMessage(`Profil "${created.nickname}" berhasil disimpan di perangkat ini.`);
  }

  function handleSeedSampleProfiles() {
    for (const sample of SAMPLE_PROFILES) {
      addProfile(sample);
    }
    setStatusMessage("4 profil contoh berhasil ditambahkan ke localStorage.");
  }

  function handleExport() {
    const json = exportProfilesJson();
    downloadProfilesBackup(json);
    setStatusMessage("File profil-gizi.json berhasil diunduh (lokal).");
  }

  async function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    const result = importProfilesJson(text);
    if (result.ok) {
      setStatusMessage(`Berhasil mengimpor ${result.count} profil secara lokal.`);
    } else {
      setStatusMessage(result.error);
    }
  }

  const activeStoredProfile = profiles.find((p) => p.id === activeId) ?? null;

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="clay-card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/" className="inline-block">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Beranda
              </Button>
            </Link>
            <BrandLogo />
            <Badge variant="accent">DEV ONLY · M4 Engine &amp; Profil Lokal</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {EATEN_FRACTIONS.map((fraction) => (
              <Button
                key={fraction}
                type="button"
                size="sm"
                variant={eaten === fraction ? "primary" : "secondary"}
                onClick={() => setEaten(fraction)}
              >
                Porsi {Math.round(fraction * 100)}%
              </Button>
            ))}
          </div>
        </header>

        {storageUnavailable && (
          <div
            role="status"
            className="clay-card border border-border bg-accent/30 px-4 py-3 text-sm font-medium text-foreground"
          >
            Data tidak tersimpan di perangkat ini (mode privat / penyimpanan penuh — berjalan di memori sementara).
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Utensils className="h-5 w-5" aria-hidden="true" />
              Sumber Menu Publik (/api/public/schools/:slug/today)
            </CardTitle>
            <CardDescription>
              Hanya mengambil data menu publik (read-only). Data profil anak tidak pernah dikirim ke jaringan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1 space-y-1.5">
              <Label htmlFor="dev-school-slug">Slug Sekolah</Label>
              <Input
                id="dev-school-slug"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="sdn-01-demo"
              />
            </div>
            <Button type="button" onClick={() => setActiveSlug(slugInput.trim() || "sdn-01-demo")}>
              Muat Menu
            </Button>
            <Button type="button" variant="secondary" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Segarkan
            </Button>
            <div className="flex gap-1.5">
              {["sdn-01-demo", "smpn-01-demo"].map((slug) => (
                <Button
                  key={slug}
                  type="button"
                  size="sm"
                  variant={activeSlug === slug ? "primary" : "secondary"}
                  onClick={() => {
                    setSlugInput(slug);
                    setActiveSlug(slug);
                  }}
                >
                  {slug}
                </Button>
              ))}
            </div>
            <div className="w-full text-xs text-muted-foreground">
              {isLoading && "Memuat menu dari API publik..."}
              {isError && "Menu sekolah tidak ditemukan; menggunakan contoh menu lokal 520 kkal."}
              {!isLoading && !isError && (
                <span>
                  Sekolah: <strong>{todayData?.school.name ?? activeSlug}</strong> · Sumber:{" "}
                  <strong>{resolveMenuForLevel("sd_low").sourceLabel}</strong>
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">4 Profil Contoh (Verifikasi Engine)</h2>
            <Button type="button" variant="secondary" size="sm" onClick={handleSeedSampleProfiles}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Salin 4 Contoh ke Profil Lokal
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {SAMPLE_PROFILES.map((sample) => {
              const resolved = resolveMenuForLevel(sample.level);
              return (
                <ProfileGapCard
                  key={sample.nickname}
                  profile={sample}
                  menuTotals={resolved.totals}
                  menuAllergens={resolved.allergens}
                  mbgFoodNames={resolved.foodNames}
                  eaten={eaten}
                />
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profil Lokal Tersimpan ({profiles.length})</CardTitle>
              <CardDescription>
                Key localStorage: <code>mbg.profiles.v1</code> · Bertahan setelah refresh &amp; restart browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={handleExport}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Ekspor profil-gizi.json
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Impor JSON
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => void handleImportChange(e)}
                />
              </div>

              {statusMessage && (
                <p role="status" className="rounded-xl bg-mint-soft/60 px-3 py-2 text-xs font-medium">
                  {statusMessage}
                </p>
              )}

              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada profil tersimpan. Tambahkan profil baru atau klik &quot;Salin 4 Contoh ke Profil Lokal&quot;.
                </p>
              ) : (
                <ul className="space-y-2">
                  {profiles.map((profile) => {
                    const isCurrent = profile.id === activeId;
                    return (
                      <li
                        key={profile.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-background/70 px-3 py-2.5 text-sm"
                      >
                        <div>
                          <p className="font-semibold">
                            {profile.nickname}{" "}
                            {isCurrent && <Badge variant="primary">Aktif</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {profile.age} th · {profile.sex === "male" ? "Laki-laki" : "Perempuan"} ·{" "}
                            {profile.weightKg} kg · {LEVEL_LABELS[profile.level]}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant={isCurrent ? "primary" : "secondary"}
                            onClick={() => setActive(profile.id)}
                          >
                            <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Pilih
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              if (window.confirm(`Hapus profil "${profile.nickname}"?`)) {
                                removeProfile(profile.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Hapus
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {activeStoredProfile && (
                <div className="pt-2">
                  <ProfileGapCard
                    profile={activeStoredProfile}
                    menuTotals={resolveMenuForLevel(activeStoredProfile.level).totals}
                    menuAllergens={resolveMenuForLevel(activeStoredProfile.level).allergens}
                    mbgFoodNames={resolveMenuForLevel(activeStoredProfile.level).foodNames}
                    eaten={eaten}
                    isActive
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tambah Profil Anak (Lokal)</CardTitle>
              <CardDescription>
                Hanya nama panggilan &amp; data antropometri dasar. Tanpa nama lengkap, alamat, atau IMT.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProfile} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="prof-nickname">Nama Panggilan</Label>
                  <Input
                    id="prof-nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Contoh: Dafa"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="prof-age">Usia (4–18)</Label>
                    <Input
                      id="prof-age"
                      type="number"
                      min={4}
                      max={18}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prof-weight">BB (kg)</Label>
                    <Input
                      id="prof-weight"
                      type="number"
                      min={10}
                      max={120}
                      step="0.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prof-height">TB (cm)</Label>
                    <Input
                      id="prof-height"
                      type="number"
                      min={80}
                      max={200}
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="prof-sex">Jenis Kelamin</Label>
                    <select
                      id="prof-sex"
                      value={sex}
                      onChange={(e) => setSex(e.target.value as Sex)}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                    >
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prof-activity">Aktivitas</Label>
                    <select
                      id="prof-activity"
                      value={activity}
                      onChange={(e) => setActivity(e.target.value as ActivityLevel)}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                    >
                      {ACTIVITIES.map((act) => (
                        <option key={act} value={act}>
                          {ACTIVITY_LABELS[act]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prof-level">Jenjang</Label>
                    <select
                      id="prof-level"
                      value={level}
                      onChange={(e) => setLevel(e.target.value as Level)}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                    >
                      {LEVELS.map((lv) => (
                        <option key={lv} value={lv}>
                          {LEVEL_LABELS[lv]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Alergi (opsional)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALLERGENS.map((allergen) => {
                      const active = allergies.includes(allergen);
                      return (
                        <Button
                          key={allergen}
                          type="button"
                          size="sm"
                          variant={active ? "primary" : "secondary"}
                          onClick={() => handleToggleAllergy(allergen)}
                        >
                          {ALLERGEN_LABELS[allergen]}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Simpan Profil di Perangkat Ini
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
