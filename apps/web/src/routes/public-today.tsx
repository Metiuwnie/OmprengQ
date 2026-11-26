import type { Allergen, Level } from "@mbg/shared";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Calculator, CalendarDays, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClaySkyDecor } from "@/components/clay-sky-decor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALLERGEN_LABELS, formatDateId, LEVEL_LABELS, LEVEL_SHORT_LABELS } from "@/features/admin/lib/labels";
import { GamificationPanel } from "@/features/gamification/components/gamification-panel";
import { useProfileStore } from "@/stores/profiles";
import {
  fetchAkgReference,
  fetchHouseholdFoods,
  fetchPublicWeek,
  NotFoundError,
} from "../features/public/api/public-api";
import { CategoryIcon } from "../features/public/components/category-icon";
import { NutritionEducationSection } from "../features/public/components/nutrition-education-section";
import { isMenuDateStale } from "../features/pwa/lib/pwa-helpers";
import { ShareToWhatsApp } from "../features/share/components/share-to-whatsapp";
import { usePublicTodayQuery } from "../features/public/hooks/use-public-menu";
import {
  getDefaultDisplayMode,
  readStoredLevel,
  writeStoredLevel,
} from "../features/public/lib/level-storage";
import {
  estimateLunchAkgShare,
  getCategoryBenefit,
} from "../features/public/lib/nutrition-education";
import { trackAnonymousEvent } from "../features/public/lib/usage-events";

/** Public daily menu page at `/s/:slug/hari-ini`. */
export function PublicTodayPage() {
  const { slug } = useParams<{ slug: string }>();

  const todayQuery = usePublicTodayQuery(slug);
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const prefetchedSlug = todayQuery.data?.school.slug;
  const viewedDate = todayQuery.data?.date;
  const trackedViewRef = useRef<string | null>(null);
  const activeProfileId = useProfileStore((s) => s.activeId ?? s.profiles[0]?.id ?? "tamu");

  useEffect(() => {
    if (!prefetchedSlug || !viewedDate) return;
    const key = `${prefetchedSlug}:${viewedDate}`;
    if (trackedViewRef.current === key) return;
    trackedViewRef.current = key;
    trackAnonymousEvent({ schoolSlug: prefetchedSlug, date: viewedDate, type: "menu_view" });
  }, [prefetchedSlug, viewedDate]);

  useEffect(() => {
    if (!prefetchedSlug || (typeof navigator !== "undefined" && !navigator.onLine)) return;
    void queryClient.prefetchQuery({
      queryKey: ["public", "week", prefetchedSlug, "current"],
      queryFn: () => fetchPublicWeek(prefetchedSlug),
      staleTime: 1000 * 60 * 5,
    });
    void queryClient.prefetchQuery({
      queryKey: ["public", "reference", "household-foods"],
      queryFn: fetchHouseholdFoods,
      staleTime: 1000 * 60 * 60,
    });
    void queryClient.prefetchQuery({
      queryKey: ["public", "reference", "akg"],
      queryFn: fetchAkgReference,
      staleTime: 1000 * 60 * 60,
    });
  }, [prefetchedSlug, queryClient]);

  if (todayQuery.isPending) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6" role="status" aria-live="polite">
          <div className="clay-card h-16 motion-safe:animate-pulse" />
          <div className="clay-card h-48 motion-safe:animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="clay-card h-28 motion-safe:animate-pulse" />
            <div className="clay-card h-28 motion-safe:animate-pulse" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Memuat menu sekolah hari ini…</p>
        </div>
      </div>
    );
  }

  if (todayQuery.isError) {
    const isNotFound = todayQuery.error instanceof NotFoundError;
    return (
      <div className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {isNotFound ? "Sekolah tidak ditemukan" : "Menu belum dapat dimuat"}
              </CardTitle>
              <CardDescription>
                {isNotFound
                  ? "Periksa kembali kode QR atau tautan sekolah yang Anda buka."
                  : todayQuery.error.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {!isNotFound && (
                <Button type="button" variant="primary" onClick={() => todayQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Coba lagi
                </Button>
              )}
              <Link
                to="/"
                className="clay-pill inline-flex min-h-11 items-center rounded-md bg-card px-4 text-sm font-semibold text-foreground hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                Ke Beranda OmprengQ
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const data = todayQuery.data;
  const allowedLevels = data.school.levels;
  const activeLevel: Level =
    (selectedLevel && allowedLevels.includes(selectedLevel) ? selectedLevel : null) ??
    readStoredLevel(allowedLevels) ??
    allowedLevels[0] ??
    "sd_low";

  const displayMode = getDefaultDisplayMode(activeLevel);
  const dateLabel = formatDateId(data.date, true);
  const isTeenLevel = activeLevel === "smp" || activeLevel === "sma";

  const handleSelectLevel = (lvl: Level) => {
    setSelectedLevel(lvl);
    writeStoredLevel(lvl);
  };

  const activePortion = data.menu?.portions[activeLevel];
  const lunchSharePct = activePortion
    ? estimateLunchAkgShare(activePortion.totals.energyKcal, activeLevel)
    : 0;

  return (
    <div
      data-theme={displayMode}
      className="clay-sky-canvas relative min-h-screen overflow-hidden text-foreground"
    >
      <ClaySkyDecor showSchool />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <header className="clay-card flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              aria-label="Kembali ke Beranda"
              className="clay-pill inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-background px-3.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Beranda</span>
            </Link>
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-bold leading-tight text-foreground">
                {data.school.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">{dateLabel}</p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <ShareToWhatsApp
              school={{ name: data.school.name, slug: data.school.slug }}
              menu={data.menu}
              portion={activePortion}
              className="w-full sm:w-auto"
            />
            <Link
              to={`/s/${data.school.slug}/minggu`}
              className="clay-pill inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-card px-3.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              Jadwal Minggu
            </Link>
          </div>
        </header>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {isMenuDateStale(data.date) && (
          <div
            role="status"
            className="clay-card flex items-center gap-2.5 bg-sun-soft/90 px-4 py-3 text-sm text-foreground"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>Menu mungkin belum diperbarui karena menampilkan data cache terakhir.</span>
          </div>
        )}
        {allowedLevels.length > 1 && (
          <div className="clay-card flex flex-col gap-2 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
            <span className="px-2 text-xs font-semibold text-muted-foreground sm:text-sm">
              Porsi jenjang
            </span>
            <div
              role="group"
              aria-label="Pilih jenjang"
              className="clay-well grid w-full grid-cols-2 gap-1 p-1 sm:flex sm:w-auto"
            >
              {allowedLevels.map((lvl) => (
                <Button
                  key={lvl}
                  type="button"
                  size="sm"
                  className="w-full sm:w-auto"
                  variant={lvl === activeLevel ? "sky" : "ghost"}
                  onClick={() => handleSelectLevel(lvl)}
                >
                  {LEVEL_SHORT_LABELS[lvl]}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!data.menu ? (
          <Card className="overflow-hidden bg-gradient-to-b from-card to-sky-soft/60">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Belum ada menu untuk hari ini</CardTitle>
                  <CardDescription className="max-w-lg text-base">
                    Hari ini tidak ada menu MBG yang terjadwal (akhir pekan, hari libur, atau masih
                    disiapkan ahli gizi).
                  </CardDescription>
                </div>
                <img
                  src="/mascots/mascot-sayur-tanya.png"
                  alt="Maskot sayur bertanya saat belum ada menu"
                  width={538}
                  height={560}
                  className="mascot-float mx-auto h-28 w-auto object-contain sm:mx-0"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.next ? (
                <div className="clay-well p-4">
                  <p className="text-xs font-semibold text-primary">
                    Menu berikutnya: {formatDateId(data.next.date, true)}
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">{data.next.name}</p>
                  {data.next.funFact && (
                    <p className="mt-1 text-sm text-muted-foreground">{data.next.funFact}</p>
                  )}
                </div>
              ) : null}

              <Link
                to={`/s/${data.school.slug}/minggu`}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-clay-primary)] transition-[transform,opacity] duration-150 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Lihat jadwal mingguan
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="clay-elevated flex flex-wrap items-center justify-between gap-6 bg-gradient-to-br from-card via-card to-sun-soft/65 p-6 sm:p-8">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="mint">Menu Hari Ini ({LEVEL_LABELS[activeLevel]})</Badge>
                  <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Perkiraan berdasarkan TKPI
                  </span>
                </div>
                <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                  {data.menu.name}
                </h1>
                {data.menu.description && (
                  <p className="max-w-prose text-sm text-muted-foreground sm:text-lg">
                    {data.menu.description}
                  </p>
                )}
              </div>

              <img
                src="/mascots/mascot-susu-papan.png"
                alt="Maskot susu membawa papan kelas OmprengQ"
                width={640}
                height={560}
                className="mascot-float hidden h-32 w-auto shrink-0 object-contain sm:block sm:h-40"
              />
            </section>

            {data.menu.photoUrl && (
              <div className="clay-card overflow-hidden p-2">
                <img
                  src={data.menu.photoUrl}
                  alt={`Foto menu ${data.menu.name}`}
                  className="max-h-80 w-full rounded-md object-cover"
                />
              </div>
            )}

            {activePortion ? (
              <>
                <section
                  aria-label="Sorotan gizi utama"
                  className={`grid grid-cols-3 gap-2 sm:gap-4 ${isTeenLevel ? "lg:grid-cols-6" : ""}`}
                >
                  <div className="clay-card bg-gradient-to-br from-card to-sun-soft p-4 sm:p-5">
                    <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Energi</p>
                    <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-3xl">
                      {Math.round(activePortion.totals.energyKcal)} kkal
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums sm:text-sm">
                      ~{lunchSharePct}% AKG
                    </p>
                  </div>
                  <div className="clay-card bg-gradient-to-br from-card to-coral-soft p-4 sm:p-5">
                    <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Protein</p>
                    <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-3xl">
                      {activePortion.totals.proteinG.toFixed(1)} g
                    </p>
                  </div>
                  <div className="clay-card bg-gradient-to-br from-card to-mint-soft p-4 sm:p-5">
                    <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Serat</p>
                    <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-3xl">
                      {activePortion.totals.fiberG.toFixed(1)} g
                    </p>
                  </div>
                  {isTeenLevel && (
                    <>
                      <div className="clay-card bg-gradient-to-br from-card to-sky-soft p-4 sm:p-5">
                        <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
                          Karbohidrat
                        </p>
                        <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-3xl">
                          {activePortion.totals.carbG.toFixed(1)} g
                        </p>
                      </div>
                      <div className="clay-card bg-gradient-to-br from-card to-sun-soft/80 p-4 sm:p-5">
                        <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
                          Lemak
                        </p>
                        <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-3xl">
                          {activePortion.totals.fatG.toFixed(1)} g
                        </p>
                      </div>
                      <div className="clay-card bg-gradient-to-br from-card to-mint-soft/80 p-4 sm:p-5">
                        <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
                          Zat Besi
                        </p>
                        <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-3xl">
                          {activePortion.totals.ironMg.toFixed(1)} mg
                        </p>
                      </div>
                    </>
                  )}
                </section>

                {activePortion.allergens.length > 0 && (
                  <div
                    role="note"
                    className="clay-card flex items-center gap-4 bg-gradient-to-r from-sun-soft via-sun-soft/80 to-card px-4 py-4 sm:px-6"
                  >
                    <AlertTriangle className="h-6 w-6 shrink-0 text-foreground" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground sm:text-lg">
                      Info alergen: Mengandung{" "}
                      {activePortion.allergens
                        .map((a: Allergen) => ALLERGEN_LABELS[a].toLowerCase())
                        .join(", ")}
                      . Bicarakan dengan guru atau orang tua bila memiliki alergi.
                    </p>
                  </div>
                )}

                <section aria-label="Komposisi menu hari ini" className="grid gap-4 sm:grid-cols-2">
                  {activePortion.items.map((item, idx) => (
                    <div
                      key={`${item.label}-${idx}`}
                      className="clay-card flex items-start gap-4 p-4 sm:p-6"
                    >
                      <span className="clay-pill inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <CategoryIcon category={item.category} className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <p className="text-lg font-bold text-foreground sm:text-2xl">{item.label}</p>
                        {(item.visualUnit || isTeenLevel) && (
                          <p className="text-sm font-semibold text-primary sm:text-base">
                            {isTeenLevel
                              ? item.visualUnit
                                ? `${item.visualUnit} (${item.grams} g)`
                                : `${item.grams} g`
                              : item.visualUnit}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                          {item.benefit || getCategoryBenefit(item.category, displayMode)}
                        </p>
                      </div>
                    </div>
                  ))}
                </section>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Porsi untuk jenjang {LEVEL_LABELS[activeLevel]} belum diisi
                  </CardTitle>
                  <CardDescription>
                    Silakan pilih jenjang lain yang tersedia di atas.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {data.menu.funFact && (
              <div className="clay-card flex items-center justify-between gap-4 bg-gradient-to-r from-mint-soft/75 via-card to-mint-soft/85 p-6">
                <div className="space-y-1">
                  <p className="text-base font-bold text-foreground sm:text-lg">Tahukah kamu?</p>
                  <p className="text-base leading-relaxed text-foreground/90 sm:text-xl">
                    {data.menu.funFact}
                  </p>
                </div>
                <img
                  src="/mascots/mascot-sayur-tanya.png"
                  alt="Maskot sayur bertanya fakta seru gizi"
                  width={538}
                  height={560}
                  className="mascot-float hidden h-24 w-auto shrink-0 object-contain sm:block"
                />
              </div>
            )}

            {activePortion && (
              <>
                <NutritionEducationSection
                  level={activeLevel}
                  totals={activePortion.totals}
                  categories={activePortion.items.map((item) => item.category)}
                />
                <GamificationPanel
                  profileId={activeProfileId}
                  schoolSlug={data.school.slug}
                  menuDate={data.menu.date}
                  menuName={data.menu.name}
                  items={activePortion.items}
                  totals={activePortion.totals}
                  level={activeLevel}
                />
              </>
            )}

            <div className="clay-elevated flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-card via-card to-sun-soft/80 p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <img
                  src="/mascots/mascot-ayam.png"
                  alt="Maskot ayam melambaikan tangan mengajak hitung gizi"
                  width={511}
                  height={560}
                  className="mascot-float hidden h-20 w-auto shrink-0 object-contain sm:block"
                />
                <div className="space-y-1">
                  <p className="font-display text-lg font-bold text-foreground">
                    Penasaran sisa kebutuhan gizi harianmu di rumah?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hitung secara privat di perangkatmu tanpa perlu membuat akun.
                  </p>
                </div>
              </div>
              <Link
                to={`/kalkulator?school=${encodeURIComponent(data.school.slug)}`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-clay-primary)] transition-[transform,opacity] duration-150 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
              >
                <Calculator className="h-4 w-4" aria-hidden="true" />
                Hitung kebutuhan gizimu
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
