import type { EatenFraction, HouseholdFoodCatalogItem, Level } from "@mbg/shared";
import { ArrowLeft, CalendarDays, Info, RefreshCw, School } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
import { ClaySkyDecor } from "@/components/clay-sky-decor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateId, LEVEL_LABELS, LEVEL_SHORT_LABELS } from "@/features/admin/lib/labels";
import { ChildModeView } from "@/features/calculator/components/child-mode-view";
import { ProfileSwitcher } from "@/features/calculator/components/profile-switcher";
import { ProfileWizard } from "@/features/calculator/components/profile-wizard";
import { TeenModeView } from "@/features/calculator/components/teen-mode-view";
import {
  useAkgReferenceQuery,
  useGapResult,
  useHouseholdFoodsQuery,
  useTodayMenu,
} from "@/features/calculator/hooks/use-calculator";
import { GamificationPanel } from "@/features/gamification/components/gamification-panel";
import { NotFoundError } from "@/features/public/api/public-api";
import { getDefaultDisplayMode } from "@/features/public/lib/level-storage";
import { trackAnonymousEvent } from "@/features/public/lib/usage-events";
import { InstallAppCard } from "@/features/pwa/components/install-app-card";
import { isMenuDateStale } from "@/features/pwa/lib/pwa-helpers";
import { useProfileStore } from "@/stores/profiles";

/** Public local-first nutrition gap & URT recommendation calculator at `/kalkulator`. */
export function CalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const schoolSlug = searchParams.get("school")?.trim() || "";
  const [slugInput, setSlugInput] = useState("");

  const profiles = useProfileStore((state) => state.profiles);
  const activeId = useProfileStore((state) => state.activeId);
  const storageUnavailable = useProfileStore((state) => state.storageUnavailable);
  const addProfile = useProfileStore((state) => state.addProfile);
  const setActive = useProfileStore((state) => state.setActive);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null;

  const [eaten, setEaten] = useState<EatenFraction>(1);
  const [skipAllergenPart, setSkipAllergenPart] = useState(false);
  const [levelOverride, setLevelOverride] = useState<Level | null>(null);

  const effectiveLevel: Level = levelOverride ?? activeProfile?.level ?? "sd_low";
  const displayMode = activeProfile ? getDefaultDisplayMode(activeProfile.level) : "anak";

  const todayMenu = useTodayMenu(schoolSlug || undefined, effectiveLevel);
  const householdFoodsQuery = useHouseholdFoodsQuery();
  useAkgReferenceQuery();

  const activePortion = todayMenu.portion;
  const trackedCalcRef = useRef<string | null>(null);
  const calcMenuDate = todayMenu.activeMenu?.date;

  useEffect(() => {
    if (!schoolSlug || !calcMenuDate) return;
    const key = `${schoolSlug}:${calcMenuDate}`;
    if (trackedCalcRef.current === key) return;
    trackedCalcRef.current = key;
    trackAnonymousEvent({ schoolSlug, date: calcMenuDate, type: "calculator_open" });
  }, [schoolSlug, calcMenuDate]);
  const catalog = (householdFoodsQuery.data?.foods ?? []) as readonly HouseholdFoodCatalogItem[];
  const mbgFoodNames = activePortion?.items.map((item) => item.label) ?? [];

  const summary = useGapResult({
    profile: activeProfile,
    portionTotals: activePortion?.totals,
    portionAllergens: activePortion?.allergens,
    mbgFoodNames,
    eaten,
    skipAllergenPart,
    catalog,
  });

  const handleSelectSchoolSlug = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = slugInput.trim().toLowerCase();
    if (!cleaned) return;
    setSearchParams({ school: cleaned });
  };

  return (
    <div
      data-theme={displayMode}
      className="clay-sky-canvas relative flex min-h-screen flex-col overflow-hidden text-foreground"
    >
      <ClaySkyDecor />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="clay-card flex flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="clay-pill inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-background px-3.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Beranda</span>
            </Link>

            {schoolSlug && (
              <Link
                to={`/s/${encodeURIComponent(schoolSlug)}/hari-ini`}
                className="clay-pill inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-card px-3.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <span>Menu Hari Ini</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            {todayMenu.school && (
              <Badge variant="mint" className="hidden sm:inline-flex">
                {todayMenu.school.name}
              </Badge>
            )}
            <Link
              to="/"
              aria-label="Kembali ke Beranda OmprengQ"
              className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <BrandLogo size="sm" />
            </Link>
          </div>
        </header>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {storageUnavailable && (
          <div
            role="status"
            className="clay-card flex items-start gap-2.5 bg-sun-soft/90 px-4 py-3 text-sm text-foreground"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Penyimpanan browser sedang dibatasi; profil tetap berfungsi selama halaman terbuka.
            </span>
          </div>
        )}

        {!schoolSlug ? (
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl leading-snug sm:text-2xl">
                <span className="clay-pill inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mint-soft text-primary">
                  <School className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>Pilih Sekolah</span>
              </CardTitle>
              <CardDescription>
                Kalkulator membaca menu harian MBG sesuai sekolah agar hitungan sisa gizi akurat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setSearchParams({ school: "sdn-01-demo" })}
                >
                  SDN 01 Demo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setSearchParams({ school: "smpn-01-demo" })}
                >
                  SMPN 01 Demo
                </Button>
              </div>

              <form
                onSubmit={handleSelectSchoolSlug}
                className="flex flex-col gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-end"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="calc-school-slug">Atau masukkan kode sekolah</Label>
                  <Input
                    id="calc-school-slug"
                    placeholder="mis. sdn-01-demo"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={!slugInput.trim()}
                >
                  Buka Sekolah
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : !activeProfile ? (
          <div className="mx-auto max-w-3xl">
            <ProfileWizard
              defaultLevel={todayMenu.school?.levels[0] ?? "sd_low"}
              onSave={(input) => {
                addProfile(input);
                setLevelOverride(null);
              }}
            />
          </div>
        ) : (
          <>
            <ProfileSwitcher
              profiles={profiles}
              activeId={activeProfile.id}
              onSelect={(id) => {
                setActive(id);
                setLevelOverride(null);
                setSkipAllergenPart(false);
              }}
              schoolSlug={schoolSlug}
              isChildMode={displayMode === "anak"}
            />

            {todayMenu.isPending ? (
              <div className="space-y-4" role="status" aria-live="polite">
                <div className="clay-card h-28 motion-safe:animate-pulse" />
                <div className="clay-card h-56 motion-safe:animate-pulse" />
                <p className="text-center text-sm text-muted-foreground">
                  Memuat menu sekolah untuk dihitung…
                </p>
              </div>
            ) : todayMenu.isError ? (
              <Card className="mx-auto max-w-xl">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {todayMenu.error instanceof NotFoundError
                      ? "Sekolah tidak ditemukan"
                      : "Menu belum dapat dimuat"}
                  </CardTitle>
                  <CardDescription>{todayMenu.error.message}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2.5">
                  {!(todayMenu.error instanceof NotFoundError) && (
                    <Button type="button" variant="primary" onClick={() => todayMenu.refetch()}>
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Coba lagi
                    </Button>
                  )}
                  <Link
                    to="/"
                    className="clay-pill inline-flex min-h-11 items-center rounded-md bg-background px-4 text-sm font-semibold text-foreground hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Ke Beranda
                  </Link>
                </CardContent>
              </Card>
            ) : !todayMenu.activeMenu ? (
              <Card className="overflow-hidden bg-gradient-to-b from-card to-sky-soft/50">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">
                        Belum ada menu MBG untuk dihitung
                      </CardTitle>
                      <CardDescription className="max-w-xl text-base">
                        Sekolah ini belum memiliki menu terbit untuk hari ini maupun hari berikutnya.
                      </CardDescription>
                    </div>
                    <img
                      src="/mascots/mascot-sayur-tanya.png"
                      alt="Maskot sayur bertanya OmprengQ"
                      width={538}
                      height={560}
                      className="mascot-float h-24 w-auto object-contain"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Link
                    to={`/s/${encodeURIComponent(schoolSlug)}/minggu`}
                    className="clay-pill inline-flex min-h-11 items-center gap-2 rounded-md bg-background px-4 text-sm font-semibold text-foreground hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    Lihat jadwal mingguan
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {isMenuDateStale(todayMenu.date) && (
                  <div
                    role="status"
                    className="clay-card flex items-center gap-2.5 bg-sun-soft/90 px-4 py-3 text-sm text-foreground"
                  >
                    <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>Menu mungkin belum diperbarui karena memakai data cache terakhir.</span>
                  </div>
                )}

                {todayMenu.isUsingNextFallback && (
                  <div
                    role="status"
                    className="clay-card flex flex-wrap items-center justify-between gap-3 bg-sky-soft/80 px-4 py-3 text-sm text-foreground"
                  >
                    <span>
                      Hari ini belum ada menu MBG. Menampilkan perkiraan berdasarkan menu terdekat:{" "}
                      <strong>{todayMenu.activeMenu.name}</strong> (
                      {formatDateId(todayMenu.activeMenu.date, true)}).
                    </span>
                  </div>
                )}

                {!activePortion ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">
                        Porsi jenjang {LEVEL_LABELS[effectiveLevel]} belum diisi
                      </CardTitle>
                      <CardDescription>
                        Menu {todayMenu.activeMenu.name} belum memiliki komposisi untuk jenjang ini.
                        Anda bisa memilih jenjang lain yang tersedia di bawah ini.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {todayMenu.availableLevels.map((lvl) => (
                        <Button
                          key={lvl}
                          type="button"
                          variant="secondary"
                          onClick={() => setLevelOverride(lvl)}
                        >
                          Gunakan porsi {LEVEL_SHORT_LABELS[lvl]}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                ) : summary ? (
                  <>
                    {displayMode === "anak" ? (
                      <ChildModeView
                        profile={activeProfile}
                        menuName={todayMenu.activeMenu.name}
                        summary={summary}
                        eaten={eaten}
                        onChangeEaten={setEaten}
                        skipAllergenPart={skipAllergenPart}
                        onToggleSkipAllergen={setSkipAllergenPart}
                      />
                    ) : (
                      <TeenModeView
                        profile={activeProfile}
                        menuName={todayMenu.activeMenu.name}
                        summary={summary}
                        eaten={eaten}
                        onChangeEaten={setEaten}
                        skipAllergenPart={skipAllergenPart}
                        onToggleSkipAllergen={setSkipAllergenPart}
                      />
                    )}
                    {activePortion && (
                      <GamificationPanel
                        profileId={activeProfile.id}
                        schoolSlug={schoolSlug}
                        menuDate={todayMenu.activeMenu.date}
                        menuName={todayMenu.activeMenu.name}
                        items={activePortion.items}
                        totals={activePortion.totals}
                        level={effectiveLevel}
                      />
                    )}
                  </>
                ) : null}
              </>
            )}
          </>
        )}

        <InstallAppCard />
      </main>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-5 sm:px-6 sm:pb-6 lg:px-8">
        <footer className="clay-card flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-xs text-muted-foreground sm:text-sm">
          <span>
            Perkiraan untuk edukasi, bukan pengganti saran ahli gizi/dokter. Rujukan AKG Permenkes
            28/2019 &amp; TKPI.
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/privasi"
              className="font-semibold text-primary underline hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              Privasi
            </Link>
            <Link
              to="/tentang"
              className="font-semibold text-primary underline hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              Tentang &amp; Sumber Data
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
