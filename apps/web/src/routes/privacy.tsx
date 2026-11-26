import { ArrowLeft, Database, ShieldCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
import { ClaySkyDecor } from "@/components/clay-sky-decor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Public Privacy Policy page at `/privasi` explaining local-only child profile storage. */
export function PrivacyPage() {
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

          <BrandLogo size="sm" />
        </header>
      </div>

      <main className="relative z-10 mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card className="bg-gradient-to-br from-card via-card to-mint-soft/45">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Kebijakan Privasi OmprengQ</CardTitle>
            <CardDescription className="text-base">
              OmprengQ dirancang agar guru, siswa, dan orang tua dapat memeriksa menu serta
              menghitung kebutuhan gizi harian tanpa membuat akun dan tanpa mengirim data anak ke
              server.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-primary" aria-hidden="true" />
                Apa yang Disimpan di Perangkat?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground">
              <p>
                Saat Anda memakai Kalkulator Gizi atau Kuis/Misi Harian, data berikut disimpan secara
                lokal di browser perangkat Anda (kunci{" "}
                <code className="font-mono text-xs">mbg.profiles.v1</code>,{" "}
                <code className="font-mono text-xs">mbg.progress.v1</code>, dan{" "}
                <code className="font-mono text-xs">mbg.level</code>):
              </p>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>Nama panggilan anak, usia, jenis kelamin, berat badan, dan tinggi badan.</li>
                <li>Tingkat aktivitas harian, jenjang sekolah, alergi makanan, dan makanan kurang disukai.</li>
                <li>Progres kuis harian, checklist misi, streak, dan kartu koleksi pangan per profil.</li>
                <li>Cache menu sekolah sementara agar tetap bisa dibuka saat offline.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                Tidak Ada Pengiriman Data Anak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground">
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                  Seluruh perhitungan kebutuhan harian dan saran menu rumah dijalankan langsung di
                  perangkat Anda.
                </li>
                <li>
                  Server OmprengQ hanya melayani data menu sekolah publik dan tabel referensi gizi
                  secara baca-saja (read-only).
                </li>
                <li>
                  Kami mencatat hitungan agregat anonim harian per sekolah (tayang menu, bagikan WA,
                  buka kalkulator, kuis selesai) tanpa identitas, usia, atau profil anak apa pun.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trash2 className="h-5 w-5 text-primary" aria-hidden="true" />
              Cara Mengelola &amp; Menghapus Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Anda dapat mengubah, menghapus satu profil, atau mengunduh salinan cadangan{" "}
              <code className="font-mono text-xs">profil-gizi.json</code> kapan saja di halaman{" "}
              <Link
                to="/kalkulator/profil"
                className="font-semibold text-primary underline hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                Kelola Profil
              </Link>
              . Untuk menghapus seluruh data lokal sekaligus, bersihkan data situs (*Site Data /
              localStorage*) melalui pengaturan browser Anda.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
