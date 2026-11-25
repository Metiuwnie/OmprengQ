import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Maximize2, Palette, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
import { ClaySkyDecor } from "@/components/clay-sky-decor";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

/** Public landing page at `/` with distributed 3D clay mascots and quick demo links. */
export function HomePage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await api.api.health.$get();
      if (!response.ok) {
        throw new Error("Gagal terhubung ke API");
      }
      return response.json();
    },
  });

  return (
    <div className="clay-sky-canvas relative min-h-screen overflow-hidden text-foreground">
      <ClaySkyDecor />
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="clay-card flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <BrandLogo size="md" />
          </Link>

          <nav aria-label="Navigasi utama" className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/s/sdn-01-demo/hari-ini"
              className="clay-pill inline-flex min-h-11 items-center gap-2 rounded-md bg-card px-4 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              Menu Demo
            </Link>
            <Link
              to="/admin"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-clay-primary)] transition-[transform,opacity] duration-150 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
          </nav>
        </header>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="grid items-stretch gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
          <div className="clay-card flex flex-col justify-center space-y-6 p-6 sm:p-8">
            <Badge variant="mint" className="w-fit">
              Edukasi Gizi Harian MBG
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              Gizi Menu Sekolah, Jelas Setiap Hari
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Pindai QR di kelas untuk melihat menu Makan Bergizi Gratis hari ini, informasi zat
              gizi berbasis TKPI, dan penanda alergen tanpa perlu login.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                to="/s/sdn-01-demo/hari-ini"
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[var(--shadow-clay-primary)] transition-[transform,opacity] duration-150 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                Lihat Menu Demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/admin"
                className="clay-pill inline-flex min-h-12 items-center gap-2 rounded-md bg-card px-5 text-base font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                Masuk Dashboard
              </Link>
            </div>
          </div>

          <aside
            aria-label="Akses cepat sekolah demo"
            className="clay-elevated overflow-hidden bg-gradient-to-b from-sky-soft via-card to-sun-soft/60 p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-4 pb-4">
              <div className="space-y-1">
                <Badge variant="accent">Siap Dipindai</Badge>
                <h2 className="pt-1 text-xl font-bold text-foreground">Sekolah Demo</h2>
              </div>
              <img
                src="/mascots/mascot-ayam-ompreng.png"
                alt="Maskot ayam OmprengQ membawa nampan makan bergizi"
                width={511}
                height={560}
                className="mascot-float -mt-2 h-32 w-auto shrink-0 object-contain sm:h-36"
              />
            </div>

            <div className="space-y-2.5">
              <Link
                to="/s/sdn-01-demo/hari-ini"
                className="clay-pill flex min-h-14 items-center justify-between gap-3 rounded-md bg-card px-4 py-2.5 transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sun-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">SDN 01 Demo</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    /s/sdn-01-demo/hari-ini
                  </p>
                </div>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>

              <Link
                to="/s/smpn-01-demo/hari-ini"
                className="clay-pill flex min-h-14 items-center justify-between gap-3 rounded-md bg-card px-4 py-2.5 transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-mint-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">SMPN 01 Demo</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    /s/smpn-01-demo/hari-ini
                  </p>
                </div>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint text-foreground">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>

              <Link
                to="/s/sdn-01-demo/hari-ini?mode=kelas"
                className="clay-pill flex min-h-14 items-center justify-between gap-3 rounded-md bg-card px-4 py-2.5 transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-coral-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">Mode Presentasi Kelas</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Tampilan proyektor kontras tinggi
                  </p>
                </div>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral">
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </div>
          </aside>
        </section>

        <footer className="clay-card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-card via-card to-mint-soft/70 px-5 py-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3.5">
            <img
              src="/mascots/mascot-sayur.png"
              alt="Maskot sayur OmprengQ melambaikan tangan"
              width={538}
              height={560}
              className="mascot-float hidden h-16 w-auto shrink-0 object-contain sm:block"
            />
            <div className="flex flex-wrap items-center gap-3">
              {healthQuery.isPending && <Badge variant="default">Memeriksa API…</Badge>}
              {healthQuery.isError && <Badge variant="coral">API belum terhubung</Badge>}
              {healthQuery.isSuccess && (
                <Badge variant="mint">
                  API aktif ({healthQuery.data.ok ? "ok: true" : "status lain"})
                </Badge>
              )}
              <span>Rujukan gizi TKPI &amp; AKG Permenkes 28/2019</span>
            </div>
          </div>

          <Link
            to="/dev/design"
            className="clay-pill inline-flex min-h-11 items-center gap-1.5 rounded-md bg-card px-3.5 font-medium text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
            Design System
          </Link>
        </footer>
      </main>
    </div>
  );
}
