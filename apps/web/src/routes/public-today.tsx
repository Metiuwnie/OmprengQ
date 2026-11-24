import type { Allergen, Level } from "@mbg/shared";
import {
  AlertTriangle,
  Calculator,
  CalendarDays,
  Maximize2,
  RefreshCw,
  Sparkles,
  Utensils,
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
      <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6" role="status" aria-live="polite">
          <div className="h-14 motion-safe:animate-pulse rounded-lg bg-secondary" />
          <div className="h-44 motion-safe:animate-pulse rounded-lg bg-secondary" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-28 motion-safe:animate-pulse rounded-lg bg-secondary" />
            <div className="h-28 motion-safe:animate-pulse rounded-lg bg-secondary" />
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
                className="inline-flex min-h-11 items-center rounded-md border border-border bg-secondary px-4 text-sm font-semibold text-foreground hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Utensils className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-bold leading-tight text-foreground">
                {data.school.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">{dateLabel}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/s/${data.school.slug}/minggu`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-secondary px-3.5 text-sm font-semibold text-foreground hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Jadwal Minggu
            </Link>
            {data.menu && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSearchParams({ mode: "kelas" })}
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                Tampilkan ke kelas
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {allowedLevels.length > 1 && (
            <div role="group" aria-label="Pilih jenjang" className="flex flex-wrap gap-1.5">
              {allowedLevels.map((lvl) => (
                <Button
                  key={lvl}
                  type="button"
                  size="sm"
                  variant={lvl === activeLevel ? "primary" : "secondary"}
                  onClick={() => handleSelectLevel(lvl)}
                >
                  {LEVEL_SHORT_LABELS[lvl]}
                </Button>
              ))}
            </div>
          )}

          <div role="group" aria-label="Tampilan usia" className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={displayMode === "anak" ? "default" : "secondary"}
              onClick={() => setManualMode("anak")}
            >
              Mode Anak
            </Button>
            <Button
              type="button"
              size="sm"
              variant={displayMode === "remaja" ? "default" : "secondary"}
              onClick={() => setManualMode("remaja")}
            >
              Mode Remaja
            </Button>
          </div>
        </div>

        {!data.menu ? (
          <Card>
            <CardHeader>
              <Badge variant="default">Hari tanpa jadwal MBG</Badge>
              <CardTitle className="pt-2 text-2xl">Belum ada menu untuk hari ini</CardTitle>
              <CardDescription className="text-base">
                Hari ini tidak ada menu MBG yang terjadwal (akhir pekan, hari libur, atau masih
                disiapkan ahli gizi).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.next ? (
                <div className="rounded-md border border-border bg-background p-4">
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
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Lihat jadwal mingguan
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="mint">Menu Hari Ini ({LEVEL_LABELS[activeLevel]})</Badge>
                  <span className="text-xs text-muted-foreground">Perkiraan berdasarkan TKPI</span>
                </div>
                <CardTitle className="pt-1 text-2xl sm:text-3xl">{data.menu.name}</CardTitle>
                {data.menu.description && (
                  <CardDescription className="max-w-prose text-base">
                    {data.menu.description}
                  </CardDescription>
                )}
              </CardHeader>

              {data.menu.photoUrl && (
                <CardContent>
                  <img
                    src={data.menu.photoUrl}
                    alt={`Foto menu ${data.menu.name}`}
                    className="max-h-72 w-full rounded-md object-cover"
                  />
                </CardContent>
              )}
            </Card>

            {activePortion ? (
              <>
                <section aria-label="Sorotan gizi utama" className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border bg-card p-3.5 sm:p-4">
                    <p className="text-xs text-muted-foreground sm:text-sm">Energi</p>
                    <p className="mt-1 font-mono text-lg font-bold text-foreground tabular-nums sm:text-2xl">
                      {Math.round(activePortion.totals.energyKcal)} kkal
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3.5 sm:p-4">
                    <p className="text-xs text-muted-foreground sm:text-sm">Protein</p>
                    <p className="mt-1 font-mono text-lg font-bold text-foreground tabular-nums sm:text-2xl">
                      {activePortion.totals.proteinG.toFixed(1)} g
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3.5 sm:p-4">
                    <p className="text-xs text-muted-foreground sm:text-sm">Serat</p>
                    <p className="mt-1 font-mono text-lg font-bold text-foreground tabular-nums sm:text-2xl">
                      {activePortion.totals.fiberG.toFixed(1)} g
                    </p>
                  </div>
                </section>

                {activePortion.allergens.length > 0 && (
                  <div
                    role="note"
                    className="flex items-start gap-3 rounded-lg border border-border bg-accent/30 px-4 py-3.5 text-sm text-foreground"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
                    <p>
                      <span className="font-semibold">Info alergen:</span> Menu ini mengandung{" "}
                      {activePortion.allergens
                        .map((a: Allergen) => ALLERGEN_LABELS[a].toLowerCase())
                        .join(", ")}
                      . Bicarakan dengan guru atau orang tua bila memiliki alergi.
                    </p>
                  </div>
                )}

                {displayMode === "anak" ? (
                  <section aria-label="Isi piring hari ini" className="space-y-3">
                    <h2 className="text-xl font-bold text-foreground">Isi Piringku Hari Ini</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activePortion.items.map((item, idx) => (
                        <div
                          key={`${item.label}-${idx}`}
                          className="flex items-start gap-3.5 rounded-lg border border-border bg-card p-4"
                        >
                          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
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
                  <section aria-label="Rincian menu remaja" className="space-y-4">
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
                                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
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
              <div className="flex items-start gap-3 rounded-lg border border-border bg-mint/30 p-4">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="space-y-0.5 text-sm sm:text-base">
                  <p className="font-bold text-foreground">Tahukah kamu?</p>
                  <p className="text-foreground/90">{data.menu.funFact}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-5">
              <div className="space-y-1">
                <p className="font-display text-lg font-bold text-foreground">
                  Penasaran sisa kebutuhan gizi harianmu di rumah?
                </p>
                <p className="text-sm text-muted-foreground">
                  Hitung secara privat di perangkatmu tanpa perlu membuat akun.
                </p>
              </div>
              <Link
                to={`/kalkulator?school=${encodeURIComponent(data.school.slug)}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_4px_0_0_var(--color-accent-deep)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
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
