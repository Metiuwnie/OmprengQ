import type { AuthUser } from "@mbg/shared";
import { CalendarDays, CheckCircle2, Database, QrCode, ShieldCheck } from "lucide-react";
import { useOutletContext } from "react-router-dom";
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

      <section aria-label="Rencana fitur M2" className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
              Editor Menu Harian (M2)
            </CardTitle>
            <CardDescription>
              Susun komposisi bahan per jenjang dan lihat perkiraan total gizi otomatis berbasis TKPI.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
              Sekolah &amp; Cetak QR (M2)
            </CardTitle>
            <CardDescription>
              Kelola daftar sekolah binaan SPPG serta unduh poster QR siap cetak untuk ruang kelas.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
