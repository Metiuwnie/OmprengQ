import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Download,
  Palette,
  Search,
  Share,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
import { ClaySkyDecor } from "@/components/clay-sky-decor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInstallPrompt } from "@/features/pwa/hooks/use-pwa";

/** Public production-ready landing page at `/` for parents, schools, and admins. */
export function HomePage() {
  const navigate = useNavigate();
  const [schoolSlug, setSchoolSlug] = useState("");
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const { canInstall, isInstalled, showIosGuide, promptInstall } = useInstallPrompt();

  const handleOpenSchool = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = schoolSlug.trim().toLowerCase();
    if (!cleaned) return;
    navigate(`/s/${encodeURIComponent(cleaned)}/hari-ini`);
  };

  const handleInstallClick = () => {
    if (canInstall) {
      setShowInstallGuide(false);
      void promptInstall();
      return;
    }
    setShowInstallGuide((prev) => !prev);
  };

  return (
    <div className="clay-sky-canvas relative flex min-h-screen flex-col overflow-hidden text-foreground">
      <ClaySkyDecor />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="clay-card flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <BrandLogo size="md" />
          </Link>

          <nav aria-label="Navigasi utama" className="flex flex-wrap items-center gap-2.5">
            {isInstalled ? (
              <Badge variant="mint" className="min-h-11 px-3.5 text-sm">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Aplikasi Terpasang
              </Badge>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleInstallClick}
                className="min-h-11 px-4 text-sm"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh Aplikasi
              </Button>
            )}
          </nav>
        </header>

        {showInstallGuide && !isInstalled && (
          <div
            role="status"
            className="clay-card mt-3 flex items-start justify-between gap-3 px-4 py-3 text-xs leading-relaxed text-foreground sm:px-6 sm:text-sm"
          >
            <div className="space-y-1">
              <p className="font-bold text-foreground">Pasang OmprengQ ke Layar Utama</p>
              {showIosGuide ? (
                <p className="flex flex-wrap items-center gap-1 text-muted-foreground">
                  <span>Di Safari iOS, ketuk ikon</span>
                  <Share className="inline h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>Bagikan lalu pilih Tambah ke Layar Utama.</span>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Buka menu browser (ikon titik tiga atau ikon pasang di bilah alamat), lalu pilih
                  &ldquo;Instal aplikasi&rdquo; atau &ldquo;Tambah ke Layar Utama&rdquo; agar
                  OmprengQ bisa dibuka langsung seperti aplikasi dan tetap jalan saat sinyal lemah.
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Tutup panduan pasang aplikasi"
              onClick={() => setShowInstallGuide(false)}
              className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-card/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="grid items-stretch gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
          <div className="clay-card flex flex-col justify-center space-y-6 p-6 sm:p-8">
            <Badge variant="mint" className="w-fit">
              Edukasi Gizi Harian MBG
            </Badge>
            <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              Gizi Menu Sekolah, Jelas Setiap Hari
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Lihat menu Makan Bergizi Gratis hari ini, hitung sisa kebutuhan gizi anak di rumah,
              dan cek alergen tanpa perlu akun.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/kalkulator"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[var(--shadow-clay-primary)] transition-[transform,opacity] duration-150 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
              >
                <Calculator className="h-4 w-4" aria-hidden="true" />
                Buka Kalkulator Gizi
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <aside
            aria-label="Buka menu sekolah"
            className="clay-elevated overflow-hidden bg-gradient-to-b from-sky-soft via-card to-sun-soft/60 p-4 sm:p-6"
          >
            <div className="flex items-center justify-between gap-4 pb-4">
              <div className="space-y-2">
                <Badge variant="accent">Tanpa Login</Badge>
                <h2 className="text-xl font-bold text-foreground">Buka Menu Sekolah</h2>
              </div>
              <img
                src="/mascots/mascot-ayam-ompreng.png"
                alt="Maskot ayam OmprengQ membawa nampan makan bergizi"
                width={511}
                height={560}
                className="mascot-float -mt-2 h-28 w-auto shrink-0 object-contain sm:h-32"
              />
            </div>

            <form
              onSubmit={handleOpenSchool}
              className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="home-school-slug">Kode / slug sekolah</Label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="home-school-slug"
                    placeholder="mis. sdn-01-demo"
                    value={schoolSlug}
                    onChange={(event) => setSchoolSlug(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={!schoolSlug.trim()}
              >
                Lihat Menu
              </Button>
            </form>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Contoh sekolah aktif</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  to="/s/sdn-01-demo/hari-ini"
                  className="clay-pill flex min-h-11 items-center justify-between gap-2 rounded-md bg-background px-3.5 py-2 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sun-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="truncate">SDN 01 Demo</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                </Link>

                <Link
                  to="/s/smpn-01-demo/hari-ini"
                  className="clay-pill flex min-h-11 items-center justify-between gap-2 rounded-md bg-background px-3.5 py-2 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-mint-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="truncate">SMPN 01 Demo</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8">
        <footer className="clay-card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-card via-card to-mint-soft/70 px-4 py-4 text-sm text-muted-foreground sm:px-6">
          <div className="flex flex-wrap items-center gap-3.5">
            <img
              src="/mascots/mascot-sayur.png"
              alt="Maskot sayur OmprengQ melambaikan tangan"
              width={538}
              height={560}
              className="mascot-float hidden h-16 w-auto shrink-0 object-contain sm:block"
            />
            <span>Rujukan gizi TKPI &amp; AKG Permenkes 28/2019</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin"
              className="clay-pill inline-flex min-h-11 items-center gap-1.5 rounded-md bg-card px-3.5 font-medium text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Dashboard Admin
            </Link>
            <Link
              to="/privasi"
              className="clay-pill inline-flex min-h-11 items-center rounded-md bg-card px-3.5 font-medium text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              Privasi
            </Link>
            <Link
              to="/tentang"
              className="clay-pill inline-flex min-h-11 items-center rounded-md bg-card px-3.5 font-medium text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              Tentang
            </Link>
            {import.meta.env.DEV && (
              <Link
                to="/dev/design"
                className="clay-pill inline-flex min-h-11 items-center gap-1.5 rounded-md bg-card px-3.5 font-medium text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
                Design System
              </Link>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
