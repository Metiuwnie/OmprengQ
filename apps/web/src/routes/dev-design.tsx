import { useState } from "react";
import { ArrowLeft, CheckCircle2, Sparkles, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
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
      className="clay-elevated bg-background p-5 text-foreground sm:p-6"
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
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">520 kkal</span>
          </div>
          <CardTitle className="pt-1">{sampleHeading}</CardTitle>
          <CardDescription>{sampleNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Energi Harian Terpenuhi</span>
              <span className="text-xs font-semibold tabular-nums">{energyPercent}%</span>
            </div>
            <Progress value={energyPercent} label={`Energi ${title}`} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Protein Harian Terpenuhi</span>
              <span className="text-xs font-semibold tabular-nums">{proteinPercent}%</span>
            </div>
            <Progress value={proteinPercent} label={`Protein ${title}`} />
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button variant="primary" size="sm">
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
  { name: "Sky Canvas", className: "bg-background border border-border" },
  { name: "Clay Card", className: "bg-card border border-border" },
  { name: "Leaf Green (Primary)", className: "bg-primary" },
  { name: "Sunny Gold (Accent)", className: "bg-accent" },
  { name: "Coral Berry", className: "bg-coral" },
  { name: "Mint Growth", className: "bg-mint" },
] as const;

const MASCOT_GALLERY = [
  { src: "/mascots/mascot-sayur.png", name: "Sayur Sapa", bg: "bg-mint-soft" },
  { src: "/mascots/mascot-sayur-tanya.png", name: "Sayur Tanya", bg: "bg-sky-soft" },
  { src: "/mascots/mascot-ayam.png", name: "Ayam Sapa", bg: "bg-sun-soft" },
  { src: "/mascots/mascot-ayam-ompreng.png", name: "Ayam Ompreng", bg: "bg-coral-soft" },
] as const;

/** Design system verification page comparing Mode Anak, Mode Remaja, and all 4 mascot poses. */
export function DevDesignPage() {
  const [activeTheme, setActiveTheme] = useState<ThemeVariant>("anak");

  return (
    <div
      data-theme={activeTheme}
      className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6"
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="clay-card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/" className="inline-block">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Beranda
              </Button>
            </Link>
            <BrandLogo size="sm" />
            <h1 className="text-xl font-bold sm:text-2xl">Design System</h1>
          </div>

          <div
            className="clay-well flex flex-wrap items-center gap-1 p-1"
            role="group"
            aria-label="Pilih tema aktif"
          >
            <Button
              variant={activeTheme === "anak" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTheme("anak")}
              aria-pressed={activeTheme === "anak"}
            >
              Mode Anak
            </Button>
            <Button
              variant={activeTheme === "remaja" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTheme("remaja")}
              aria-pressed={activeTheme === "remaja"}
            >
              Mode Remaja
            </Button>
          </div>
        </header>

        <section aria-label="Palet claymorphism" className="space-y-4">
          <h2 className="text-xl font-bold">Palet Claymorphism</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TOKEN_SWATCHES.map((swatch) => (
              <div key={swatch.name} className="clay-card p-3">
                <div className={`mb-2 h-11 w-full rounded-md ${swatch.className}`} />
                <p className="text-xs font-semibold">{swatch.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Galeri pose maskot" className="space-y-4">
          <h2 className="text-xl font-bold">Empat Pose Maskot Clay</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {MASCOT_GALLERY.map((mascot) => (
              <div
                key={mascot.name}
                className={`clay-card flex flex-col items-center gap-3 p-4 ${mascot.bg}`}
              >
                <img
                  src={mascot.src}
                  alt={mascot.name}
                  width={520}
                  height={560}
                  className="mascot-float h-28 w-auto object-contain"
                />
                <p className="text-sm font-bold text-foreground">{mascot.name}</p>
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
