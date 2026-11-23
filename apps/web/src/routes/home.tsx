import { useQuery } from "@tanstack/react-query";
import { Activity, Palette, ShieldCheck, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

/** Home placeholder page proving end-to-end typed Hono RPC integration. */
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Utensils className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-xl font-bold leading-none">OmprengQ</p>
              <p className="text-xs text-muted-foreground">Edukasi Gizi Harian MBG</p>
            </div>
          </div>
          <nav aria-label="Navigasi utama" className="flex flex-wrap items-center gap-2">
            <Link to="/dev/design">
              <Button variant="secondary" size="sm">
                <Palette className="h-4 w-4" aria-hidden="true" />
                Design System
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="primary" size="sm">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Dasbor Admin
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="max-w-2xl space-y-4">
          <Badge variant="accent">Tahap M0 — Setup Monorepo</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Kenali Gizi Menu Sekolah Hari Ini
          </h1>
          <p className="text-base text-muted-foreground">
            Fondasi monorepo OmprengQ telah aktif. Halaman ini terhubung langsung ke server Hono
            melalui klien RPC bertipe end-to-end (<code className="font-mono text-sm">hc&lt;AppType&gt;</code>).
          </p>
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
                Status Koneksi API
              </CardTitle>
              <CardDescription>
                Memanggil endpoint <code className="font-mono text-xs">GET /api/health</code> melalui proxy Vite.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthQuery.isPending && (
                <Badge variant="default">Memeriksa koneksi server...</Badge>
              )}
              {healthQuery.isError && (
                <Badge variant="default">Server API belum aktif di port 3000</Badge>
              )}
              {healthQuery.isSuccess && (
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="mint">
                    Terhubung: {healthQuery.data.ok ? "ok: true" : "tidak diketahui"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Tipe respons divalidasi langsung dari <code className="font-mono text-xs">@mbg/api</code>.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pratinjau Design System</CardTitle>
              <CardDescription>
                Token Hallmark dan panduan UI UX Pro Max untuk Mode Anak dan Mode Remaja.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link to="/dev/design">
                <Button variant="default">Buka /dev/design</Button>
              </Link>
              <Link to="/admin">
                <Button variant="secondary">Ke Halaman /admin</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
