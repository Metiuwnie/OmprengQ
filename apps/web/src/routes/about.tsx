import { ArrowLeft, BookOpen, Calculator, Globe, HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
import { ClaySkyDecor } from "@/components/clay-sky-decor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeeklySdgSpotlight } from "@/features/gamification/lib/gamification-engine";

/** Public About & Data Sources page at `/tentang`. */
export function AboutPage() {
  const spotlight = getWeeklySdgSpotlight(new Date().toISOString().slice(0, 10));
  return (
    <div className="clay-sky-canvas relative min-h-screen overflow-hidden text-foreground">
      <ClaySkyDecor />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="clay-card flex items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="clay-pill inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-background px-3.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Beranda
          </Link>

          <div className="flex items-center gap-2.5">
            <Badge variant="accent" className="hidden sm:inline-flex">
              SDG 2, 3 &amp; 4
            </Badge>
            <BrandLogo size="sm" />
          </div>
        </header>
      </div>

      <main className="relative z-10 mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card className="bg-gradient-to-br from-card via-card to-sun-soft/45">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Tentang OmprengQ &amp; Sumber Data</CardTitle>
            <CardDescription className="text-base">
              OmprengQ membantu sekolah, guru, siswa, dan orang tua memahami kandungan gizi menu
              harian Makan Bergizi Gratis (MBG) serta melengkapinya dengan pilihan pangan lokal di
              rumah.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                Rujukan Data Gizi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-foreground">TKPI (Tabel Komposisi Pangan Indonesia):</strong>{" "}
                  rujukan nilai energi, protein, lemak, karbohidrat, serat, dan zat besi per 100 g
                  bagian dapat dimakan.
                </li>
                <li>
                  <strong className="text-foreground">AKG Permenkes No. 28 Tahun 2019:</strong> acuan
                  angka kecukupan gizi harian anak dan remaja usia 4 hingga 18 tahun.
                </li>
                <li>
                  <strong className="text-foreground">Persamaan BMR Schofield &amp; PAL:</strong>{" "}
                  perkiraan kebutuhan energi personal berdasarkan usia, jenis kelamin, berat badan,
                  dan tingkat aktivitas.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
                Prinsip Edukasi Positif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                OmprengQ menggunakan bahasa yang membangun dan satuan takaran rumah tangga (URT)
                seperti centong, potong, atau mangkuk agar mudah diterapkan keluarga, tanpa label
                penilaian status tubuh klinis.
              </p>
              <div className="clay-well flex items-start gap-2 p-4 text-xs text-foreground">
                <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  Perkiraan untuk edukasi, bukan pengganti saran ahli gizi atau dokter. Konsultasikan
                  dengan tenaga kesehatan bila anak memiliki kondisi medis atau alergi khusus.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-card via-card to-mint-soft/60">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
                Sorotan Edukasi Mingguan (Pekan {spotlight.weekNumber})
              </CardTitle>
              <Badge variant="mint">{spotlight.sdgTag}</Badge>
            </div>
            <CardDescription className="text-base font-semibold text-foreground">
              {spotlight.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{spotlight.summary}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
