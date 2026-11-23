import { useState } from "react";
import { ArrowLeft, CheckCircle2, Sparkles, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ThemeVariant = "anak" | "remaja";

interface ThemeShowcaseProps {
  variant: ThemeVariant;
  title: string;
  subtitle: string;
  sampleHeading: string;
  sampleNote: string;
  energyPercent: number;
  proteinPercent: number;
}

function ThemeShowcasePanel({
  variant,
  title,
  subtitle,
  sampleHeading,
  sampleNote,
  energyPercent,
  proteinPercent,
}: ThemeShowcaseProps) {
  return (
    <section
      data-theme={variant}
      aria-label={title}
      className="rounded-lg border border-border bg-background p-5 text-foreground shadow-[var(--shadow-card)] sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Badge variant="accent">data-theme=&quot;{variant}&quot;</Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="mint">
              <Utensils className="h-3.5 w-3.5" aria-hidden="true" />
              Menu Hari Ini
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">520 kkal</span>
          </div>
          <CardTitle className="pt-1">{sampleHeading}</CardTitle>
          <CardDescription>{sampleNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Energi Harian Terpenuhi</span>
              <span className="font-mono text-xs">{energyPercent}%</span>
            </div>
            <Progress value={energyPercent} label={`Energi ${title}`} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Protein Harian Terpenuhi</span>
              <span className="font-mono text-xs">{proteinPercent}%</span>
            </div>
            <Progress value={proteinPercent} label={`Protein ${title}`} />
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button variant="default" size="sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Cek Porsi Saya
            </Button>
            <Button variant="secondary" size="sm">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Lihat Bahan
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

const TOKEN_SWATCHES = [
  { name: "Paper (Background)", className: "bg-background border border-border" },
  { name: "Card Surface", className: "bg-card border border-border" },
  { name: "Accent (Pear)", className: "bg-accent" },
  { name: "Primary (Blue)", className: "bg-primary" },
  { name: "Mint (Growth)", className: "bg-mint" },
  { name: "Secondary", className: "bg-secondary border border-border" },
] as const;

/** Design system verification page comparing Mode Anak and Mode Remaja variants. */
export function DevDesignPage() {
  const [activeTheme, setActiveTheme] = useState<ThemeVariant>("anak");

  return (
    <div
      data-theme={activeTheme}
      className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <Link to="/" className="inline-block">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Beranda
              </Button>
            </Link>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Design System OmprengQ (UI UX Pro Max + Hallmark)
            </h1>
            <p className="text-sm text-muted-foreground">
              Satu sistem token untuk Mode Anak (SD) dan Mode Remaja (SMP/SMA) dengan bahasa positif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Pilih tema aktif">
            <Button
              variant={activeTheme === "anak" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveTheme("anak")}
              aria-pressed={activeTheme === "anak"}
            >
              Mode Anak
            </Button>
            <Button
              variant={activeTheme === "remaja" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveTheme("remaja")}
              aria-pressed={activeTheme === "remaja"}
            >
              Mode Remaja
            </Button>
          </div>
        </header>

        <section aria-label="Token warna dan tipografi" className="space-y-4">
          <h2 className="text-xl font-bold">Token Warna & Tipografi Aktif</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TOKEN_SWATCHES.map((swatch) => (
              <div key={swatch.name} className="rounded-md border border-border bg-card p-3">
                <div className={`mb-2 h-10 w-full rounded-sm ${swatch.className}`} />
                <p className="text-xs font-semibold">{swatch.name}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <ThemeShowcasePanel
            variant="anak"
            title="Varian Mode Anak (SD)"
            subtitle="Sudut membulat ramah anak, aksen kuning hangat, tombol mudah disentuh."
            sampleHeading="Nasi, Ayam Goreng, Tumis Kangkung"
            sampleNote="Membantu kamu tetap bertenaga saat belajar dan bermain bersama teman."
            energyPercent={32}
            proteinPercent={45}
          />

          <ThemeShowcasePanel
            variant="remaja"
            title="Varian Mode Remaja (SMP/SMA)"
            subtitle="Radius lebih ringkas dan tenang dengan struktur token yang sama."
            sampleHeading="Nasi, Ayam Goreng, Perkedel, Tumis Kangkung"
            sampleNote="Porsi makan siang ini menutup sebagian kebutuhan energi dan protein harianmu."
            energyPercent={28}
            proteinPercent={38}
          />
        </div>
      </div>
    </div>
  );
}
