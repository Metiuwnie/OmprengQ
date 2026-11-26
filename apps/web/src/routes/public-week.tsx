import type { Level } from "@mbg/shared";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateId, LEVEL_SHORT_LABELS, shiftIsoDate } from "@/features/admin/lib/labels";
import { NotFoundError } from "../features/public/api/public-api";
import { usePublicWeekQuery } from "../features/public/hooks/use-public-menu";
import {
  getDefaultDisplayMode,
  readStoredLevel,
  writeStoredLevel,
} from "../features/public/lib/level-storage";

/** Public weekly schedule page at `/s/:slug/minggu`. */
export function PublicWeekPage() {
  const { slug } = useParams<{ slug: string }>();
  const [weekStart, setWeekStart] = useState<string | undefined>(undefined);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  const weekQuery = usePublicWeekQuery(slug, weekStart);

  const weekDates = useMemo(() => {
    const start = weekQuery.data?.start;
    if (!start) return [];
    return Array.from({ length: 7 }, (_, i) => shiftIsoDate(start, i));
  }, [weekQuery.data?.start]);

  if (weekQuery.isPending) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4" role="status">
          <div className="clay-card h-14 motion-safe:animate-pulse" />
          <div className="clay-card h-32 motion-safe:animate-pulse" />
          <p className="text-center text-sm text-muted-foreground">Memuat jadwal mingguan…</p>
        </div>
      </div>
    );
  }

  if (weekQuery.isError) {
    const isNotFound = weekQuery.error instanceof NotFoundError;
    return (
      <div className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {isNotFound ? "Sekolah tidak ditemukan" : "Jadwal belum dapat dimuat"}
              </CardTitle>
              <CardDescription>{weekQuery.error.message}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {!isNotFound && (
                <Button type="button" variant="primary" onClick={() => weekQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Coba lagi
                </Button>
              )}
              <Link
                to="/"
                className="clay-pill inline-flex min-h-11 items-center rounded-md bg-card px-4 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                Ke Beranda
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const data = weekQuery.data;
  const allowedLevels = data.school.levels;
  const activeLevel: Level =
    (selectedLevel && allowedLevels.includes(selectedLevel) ? selectedLevel : null) ??
    readStoredLevel(allowedLevels) ??
    allowedLevels[0] ??
    "sd_low";

  const menusByDate = new Map(data.menus.map((m) => [m.date, m]));

  return (
    <div
      data-theme={getDefaultDisplayMode(activeLevel)}
      className="min-h-screen bg-background text-foreground"
    >
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <header className="clay-card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
          <div className="min-w-0 space-y-2">
            <Link
              to={`/s/${data.school.slug}/hari-ini`}
              className="clay-pill inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-background px-4 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Kembali ke Menu Hari Ini
            </Link>
            <h1 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
              Jadwal Mingguan: {data.school.name}
            </h1>
          </div>

          {allowedLevels.length > 1 && (
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
                  onClick={() => {
                    setSelectedLevel(lvl);
                    writeStoredLevel(lvl);
                  }}
                >
                  {LEVEL_SHORT_LABELS[lvl]}
                </Button>
              ))}
            </div>
          )}
        </header>
      </div>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="clay-card flex flex-col gap-2.5 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:items-center sm:gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full px-2 sm:w-auto sm:px-3"
              onClick={() => setWeekStart(shiftIsoDate(data.start, -7))}
            >
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sm:hidden">Lalu</span>
              <span className="hidden sm:inline">Minggu Lalu</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full px-2 sm:w-auto sm:px-3"
              onClick={() => setWeekStart(undefined)}
            >
              <span className="sm:hidden">Ini</span>
              <span className="hidden sm:inline">Minggu Ini</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full px-2 sm:w-auto sm:px-3"
              onClick={() => setWeekStart(shiftIsoDate(data.start, 7))}
            >
              <span className="sm:hidden">Depan</span>
              <span className="hidden sm:inline">Minggu Depan</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Button>
          </div>
          <p className="w-full text-center text-sm font-semibold text-foreground sm:w-auto sm:px-2 sm:text-left">
            {formatDateId(data.start)} s.d. {formatDateId(data.end)}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {weekDates.map((iso) => {
            const menu = menusByDate.get(iso);
            const portion = menu?.portions[activeLevel];
            const isToday = iso === data.today;

            return (
              <div
                key={iso}
                className={`clay-card p-4 sm:p-5 ${
                  isToday ? "bg-gradient-to-r from-card to-mint-soft/70 ring-2 ring-primary/35" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{formatDateId(iso, true)}</p>
                    {isToday && <Badge variant="mint">Hari ini</Badge>}
                  </div>
                  {portion && (
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {Math.round(portion.totals.energyKcal)} kkal,{" "}
                      {portion.totals.proteinG.toFixed(1)} g protein
                    </span>
                  )}
                </div>

                {menu ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-base font-semibold text-foreground">{menu.name}</p>
                    {menu.funFact && (
                      <p className="text-sm text-muted-foreground">{menu.funFact}</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Belum ada jadwal menu pada tanggal ini.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
