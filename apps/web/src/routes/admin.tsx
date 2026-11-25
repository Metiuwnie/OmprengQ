import type { AuthUser } from "@mbg/shared";
import {
  Apple,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Database,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleLabel } from "@/features/admin/lib/role-label";

interface AdminOutletContext {
  user: AuthUser;
}

/** Authenticated admin dashboard overview rendered inside `AdminLayout`. */
export function AdminPage() {
  const { user } = useOutletContext<AdminOutletContext>();
  const roleLabel = getRoleLabel(user.role);

  return (
    <div className="w-full space-y-6">
      <section className="clay-card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-card via-sky-soft/50 to-sun-soft/60 px-5 py-4 sm:px-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="mint">Sesi Aktif</Badge>
            <Badge variant="default">{roleLabel}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Halo, {user.name}
          </h1>
        </div>

        <img
          src="/mascots/mascot-ayam-ompreng.png"
          alt="Maskot ayam membawa ompreng OmprengQ"
          width={511}
          height={560}
          className="mascot-float hidden h-20 w-auto object-contain sm:block"
        />
      </section>

      <section
        aria-label="Menu operasional dashboard"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Link
          to="/admin/menus"
          className="clay-card group flex flex-col justify-between gap-4 p-5 transition-[transform,box-shadow] duration-150 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
        >
          <div className="space-y-3">
            <span className="clay-pill inline-flex h-12 w-12 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Menu Harian</h2>
              <p className="text-sm text-muted-foreground">
                Susun komposisi bahan per jenjang dan publikasikan jadwal.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Buka Kalender Menu
            <ArrowRight
              className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </Link>

        <Link
          to="/admin/schools"
          className="clay-card group flex flex-col justify-between gap-4 p-5 transition-[transform,box-shadow] duration-150 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
        >
          <div className="space-y-3">
            <span className="clay-pill inline-flex h-12 w-12 items-center justify-center rounded-md bg-mint text-foreground">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Sekolah &amp; QR Cetak</h2>
              <p className="text-sm text-muted-foreground">
                Kelola sekolah binaan SPPG dan unduh poster QR kelas.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Kelola Sekolah &amp; QR
            <ArrowRight
              className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </Link>

        <Link
          to="/admin/foods"
          className="clay-card group flex flex-col justify-between gap-4 p-5 transition-[transform,box-shadow] duration-150 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
        >
          <div className="space-y-3">
            <span className="clay-pill inline-flex h-12 w-12 items-center justify-center rounded-md bg-coral-soft text-coral">
              <Apple className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Bahan Pangan TKPI</h2>
              <p className="text-sm text-muted-foreground">
                Cari referensi TKPI atau tambah bahan custom dapur SPPG.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Buka Bahan TKPI
            <ArrowRight
              className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </Link>

        {user.role === "super_admin" && (
          <Link
            to="/admin/sppg"
            className="clay-card group flex flex-col justify-between gap-4 p-5 transition-[transform,box-shadow] duration-150 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
          >
            <div className="space-y-3">
              <span className="clay-pill inline-flex h-12 w-12 items-center justify-center rounded-md bg-sky-soft text-primary">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Kelola SPPG</h2>
                <p className="text-sm text-muted-foreground">
                  Atur unit SPPG yang menaungi sekolah dan menu harian.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Buka Daftar SPPG
              <ArrowRight
                className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        )}
      </section>

      <section aria-label="Informasi akun dan referensi" className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Profil Sesi
            </CardTitle>
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
                {user.sppgId ? user.sppgId : "Seluruh SPPG"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-mint-soft/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Database className="h-4 w-4 text-primary" aria-hidden="true" />
              Basis Data Referensi
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4 text-sm text-foreground">
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]"
                  aria-hidden="true"
                />
                <span>Tabel AKG anak &amp; remaja (Permenkes 28/2019) aktif.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]"
                  aria-hidden="true"
                />
                <span>97 referensi bahan TKPI &amp; 45 pangan URT siap digunakan.</span>
              </div>
            </div>
            <img
              src="/mascots/mascot-sayur.png"
              alt="Maskot sayur OmprengQ"
              width={538}
              height={560}
              className="mascot-float hidden h-20 w-auto shrink-0 object-contain sm:block"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
