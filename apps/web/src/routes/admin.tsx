import type { AuthUser } from "@mbg/shared";
import { Apple, Building2, CalendarDays, CheckCircle2, Database, QrCode, ShieldCheck } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleLabel } from "@/features/admin/lib/role-label";

interface AdminOutletContext {
  user: AuthUser;
}

/** Authenticated admin overview rendered inside `AdminLayout` (M1 shell). */
export function AdminPage() {
  const { user } = useOutletContext<AdminOutletContext>();
  const roleLabel = getRoleLabel(user.role);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="mint">Sesi Aktif</Badge>
          <Badge variant="default">{roleLabel}</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Halo, {user.name}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Autentikasi admin dan fondasi data referensi (AKG, TKPI, dan pangan URT) telah aktif.
          Menu pengelolaan harian, sekolah, dan kode QR akan tersedia pada tahap M2.
        </p>
      </section>

      <section aria-label="Status sesi dan kesiapan modul" className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              Profil Sesi Saat Ini
            </CardTitle>
            <CardDescription>
              Sesi diamankan dengan cookie httpOnly dan validasi peran di server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
              <span className="text-muted-foreground">Email</span>
              <span className="truncate font-medium text-foreground">{user.email}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
              <span className="text-muted-foreground">Peran</span>
              <span className="font-medium text-foreground">{roleLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Cakupan SPPG</span>
              <span className="font-mono text-xs text-foreground">
                {user.sppgId ? user.sppgId : "Seluruh SPPG (Super Admin)"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" aria-hidden="true" />
              Kesiapan Data Referensi M1
            </CardTitle>
            <CardDescription>
              Data referensi siap digunakan untuk kalkulasi gizi menu pada tahap berikutnya.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm text-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
              <span>Tabel AKG anak &amp; remaja (Permenkes 28/2019) terpasang di database.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
              <span>Template 97 bahan MBG nasional &amp; 45 pangan URT siap diverifikasi dan diimpor.</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-label="Menu cepat operasional" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
              Menu Harian
            </CardTitle>
            <CardDescription>
              Susun komposisi bahan per jenjang dan lihat perkiraan total gizi otomatis berbasis TKPI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/menus"
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-secondary px-4 text-sm font-semibold text-foreground hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
            >
              Buka Kalender Menu
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
              Sekolah &amp; QR Cetak
            </CardTitle>
            <CardDescription>
              Kelola daftar sekolah binaan SPPG serta unduh poster QR siap cetak untuk ruang kelas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/schools"
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-secondary px-4 text-sm font-semibold text-foreground hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
            >
              Kelola Sekolah &amp; QR
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Apple className="h-5 w-5 text-primary" aria-hidden="true" />
              Bahan Pangan TKPI
            </CardTitle>
            <CardDescription>
              Telusuri referensi TKPI dan tambahkan bahan custom sesuai olahan dapur SPPG.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/foods"
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-secondary px-4 text-sm font-semibold text-foreground hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
            >
              Buka Bahan TKPI
            </Link>
          </CardContent>
        </Card>

        {user.role === "super_admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
                Kelola SPPG
              </CardTitle>
              <CardDescription>
                Tambah atau perbarui unit SPPG yang menaungi sekolah dan menu harian.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/admin/sppg"
                className="inline-flex min-h-11 items-center rounded-md border border-border bg-secondary px-4 text-sm font-semibold text-foreground hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
              >
                Buka Daftar SPPG
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
