import type { Allergen, Level } from "@mbg/shared";
import {
  AlertTriangle,
  Calculator,
  CalendarDays,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALLERGEN_LABELS, formatDateId, LEVEL_LABELS, LEVEL_SHORT_LABELS } from "@/features/admin/lib/labels";
import { NotFoundError } from "../features/public/api/public-api";
import { CategoryIcon } from "../features/public/components/category-icon";
import { PresentationView } from "../features/public/components/presentation-view";
import { usePublicTodayQuery } from "../features/public/hooks/use-public-menu";
import {
  getDefaultDisplayMode,
  readStoredLevel,
  writeStoredLevel,
  type DisplayMode,
} from "../features/public/lib/level-storage";

/** Public daily menu page at `/s/:slug/hari-ini` (also supports `?mode=kelas`). */
export function PublicTodayPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPresentation = searchParams.get("mode") === "kelas";

  const todayQuery = usePublicTodayQuery(slug);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [manualMode, setManualMode] = useState<DisplayMode | null>(null);

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

  const displayMode: DisplayMode = manualMode ?? getDefaultDisplayMode(activeLevel);
  const dateLabel = formatDateId(data.date, true);

  const handleSelectLevel = (lvl: Level) => {
    setSelectedLevel(lvl);
    writeStoredLevel(lvl);
  };

  if (isPresentation && data.menu) {
    return (
      <div data-theme={displayMode}>
        <PresentationView
          schoolName={data.school.name}
          dateLabel={dateLabel}
          level={activeLevel}
          menu={data.menu}
          onExit={() => setSearchParams({})}
        />
      </div>
    );
  }

  const activePortion = data.menu?.portions[activeLevel];

  return (
    <div data-theme={displayMode} className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <header className="clay-card flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold leading-tight text-foreground">
              {data.school.name}
            </p>
            <p className="truncate text-sm text-muted-foreground">{dateLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/s/${data.school.slug}/minggu`}
              className="clay-pill inline-flex min-h-11 items-center gap-2 rounded-md bg-card px-3.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              Jadwal Minggu
            </Link>
            {data.menu && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSearchParams({ mode: "kelas" })}
              >
                <Maximize2 className="h-4 w-4 text-primary" aria-hidden="true" />
                Tampilkan ke kelas
              </Button>
            )}
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="clay-card flex flex-wrap items-center justify-between gap-3 p-2.5">
          {allowedLevels.length > 1 ? (
            <div role="group" aria-label="Pilih jenjang" className="clay-well flex flex-wrap gap-1 p-1">
              {allowedLevels.map((lvl) => (
                <Button
                  key={lvl}
                  type="button"
                  size="sm"
                  variant={lvl === activeLevel ? "primary" : "ghost"}
                  onClick={() => handleSelectLevel(lvl)}
                >
                  {LEVEL_SHORT_LABELS[lvl]}
                </Button>
              ))}
            </div>
          ) : (
            <span className="px-3 text-xs font-semibold text-muted-foreground">
              {LEVEL_LABELS[activeLevel]}
            </span>
          )}

          <div
            role="group"
            aria-label="Tampilan usia"
            className="clay-well flex items-center gap-1 p-1"
          >
            <Button
              type="button"
              size="sm"
              variant={displayMode === "anak" ? "default" : "ghost"}
              onClick={() => setManualMode("anak")}
            >
              Mode Anak
            </Button>
            <Button
              type="button"
              size="sm"
              variant={displayMode === "remaja" ? "default" : "ghost"}
              onClick={() => setManualMode("remaja")}
            >
              Mode Remaja
            </Button>
          </div>
        </div>

        {!data.menu ? (
          <Card className="overflow-hidden bg-gradient-to-b from-card to-sky-soft/60">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <Badge variant="default">Hari tanpa jadwal MBG</Badge>
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
                  className="mascot-float h-28 w-auto object-contain"
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
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-clay-primary)] transition-[transform,opacity] duration-150 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Lihat jadwal mingguan
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-sun-soft/60">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="mint">Menu Hari Ini ({LEVEL_LABELS[activeLevel]})</Badge>
                      <span className="text-xs text-muted-foreground">Perkiraan berdasarkan TKPI</span>
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl">{data.menu.name}</CardTitle>
                    {data.menu.description && (
                      <CardDescription className="max-w-prose text-base">
                        {data.menu.description}
                      </CardDescription>
                    )}
                  </div>

                  {displayMode === "anak" && (
                    <img
                      src="/mascots/mascot-ayam-ompreng.png"
                      alt="Maskot ayam membawa nampan makan siang bergizi"
                      width={511}
                      height={560}
                      className="mascot-float hidden h-28 w-auto shrink-0 object-contain sm:block"
                    />
                  )}
                </div>
              </CardHeader>

              {data.menu.photoUrl && (
                <CardContent>
                  <img
                    src={data.menu.photoUrl}
                    alt={`Foto menu ${data.menu.name}`}
                    className="max-h-72 w-full rounded-md object-cover shadow-xs"
                  />
                </CardContent>
              )}
            </Card>

            {activePortion ? (
              <>
                <section aria-label="Sorotan gizi utama" className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="clay-card bg-sun-soft p-3.5 sm:p-5">
                    <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Energi</p>
                    <p className="mt-1 font-display text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                      {Math.round(activePortion.totals.energyKcal)} kkal
                    </p>
                  </div>
                  <div className="clay-card bg-coral-soft p-3.5 sm:p-5">
                    <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Protein</p>
                    <p className="mt-1 font-display text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                      {activePortion.totals.proteinG.toFixed(1)} g
                    </p>
                  </div>
                  <div className="clay-card bg-mint-soft p-3.5 sm:p-5">
                    <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Serat</p>
                    <p className="mt-1 font-display text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                      {activePortion.totals.fiberG.toFixed(1)} g
                    </p>
                  </div>
                </section>

                {activePortion.allergens.length > 0 && (
                  <div
                    role="note"
                    className="clay-card flex items-start gap-3 bg-sun-soft/90 px-4 py-3.5 text-sm text-foreground"
                  >
                    <span className="clay-pill inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <p className="pt-1">
                      <span className="font-semibold">Info alergen:</span> Menu ini mengandung{" "}
                      {activePortion.allergens
                        .map((a: Allergen) => ALLERGEN_LABELS[a].toLowerCase())
                        .join(", ")}
                      . Bicarakan dengan guru atau orang tua bila memiliki alergi.
                    </p>
                  </div>
                )}

                {displayMode === "anak" ? (
                  <section aria-label="Isi piring hari ini" className="clay-card space-y-4 p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-foreground">Isi Piringku Hari Ini</h2>
                    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      {activePortion.items.map((item, idx) => (
                        <div
                          key={`${item.label}-${idx}`}
                          className="clay-well flex items-start gap-3.5 p-4"
                        >
                          <span className="clay-pill inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                            <CategoryIcon category={item.category} className="h-6 w-6" />
                          </span>
                          <div className="min-w-0 space-y-1">
                            <p className="text-base font-bold text-foreground">{item.label}</p>
                            {item.visualUnit && (
                              <p className="text-sm font-semibold text-primary">{item.visualUnit}</p>
                            )}
                            {item.benefit && (
                              <p className="text-sm text-muted-foreground">{item.benefit}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <section
                    aria-label="Rincian menu remaja"
                    className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Komposisi Menu &amp; Manfaat</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="divide-y divide-border">
                          {activePortion.items.map((item, idx) => (
                            <li
                              key={`${item.label}-${idx}`}
                              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="clay-pill inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-mint-soft text-primary">
                                  <CategoryIcon category={item.category} className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground">{item.label}</p>
                                  {item.benefit && (
                                    <p className="text-xs text-muted-foreground">{item.benefit}</p>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                {item.visualUnit ? `${item.visualUnit} (${item.grams} g)` : `${item.grams} g`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Ringkasan Makronutrien &amp; Zat Besi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-left text-sm">
                            <thead className="border-b border-border text-xs font-semibold text-muted-foreground">
                              <tr>
                                <th className="py-2 pr-3">Zat gizi</th>
                                <th className="py-2 text-right">Jumlah per porsi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              <tr>
                                <td className="py-2 pr-3">Energi</td>
                                <td className="py-2 text-right tabular-nums">
                                  {Math.round(activePortion.totals.energyKcal)} kkal
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 pr-3">Karbohidrat</td>
                                <td className="py-2 text-right tabular-nums">
                                  {activePortion.totals.carbG.toFixed(1)} g
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 pr-3">Protein</td>
                                <td className="py-2 text-right tabular-nums">
                                  {activePortion.totals.proteinG.toFixed(1)} g
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 pr-3">Lemak</td>
                                <td className="py-2 text-right tabular-nums">
                                  {activePortion.totals.fatG.toFixed(1)} g
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 pr-3">Serat</td>
                                <td className="py-2 text-right tabular-nums">
                                  {activePortion.totals.fiberG.toFixed(1)} g
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 pr-3">Zat Besi</td>
                                <td className="py-2 text-right tabular-nums">
                                  {activePortion.totals.ironMg.toFixed(1)} mg
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </section>
                )}
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
              <div className="clay-card flex items-center justify-between gap-4 bg-mint-soft p-4 sm:p-5">
                <div className="space-y-0.5 text-sm sm:text-base">
                  <p className="font-bold text-foreground">Tahukah kamu?</p>
                  <p className="text-foreground/90">{data.menu.funFact}</p>
                </div>
                <img
                  src="/mascots/mascot-sayur-tanya.png"
                  alt="Maskot sayur bertanya fakta seru gizi"
                  width={538}
                  height={560}
                  className="mascot-float hidden h-20 w-auto shrink-0 object-contain sm:block"
                />
              </div>
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
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-clay-primary)] transition-[transform,opacity] duration-150 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
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
