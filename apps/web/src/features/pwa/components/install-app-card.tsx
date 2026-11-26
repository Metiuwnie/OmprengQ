import { Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "../hooks/use-pwa";

/** Install-to-home-screen prompt card shown on `/kalkulator` (with iOS Safari guide). */
export function InstallAppCard() {
  const { canInstall, showIosGuide, promptInstall } = useInstallPrompt();

  if (!canInstall && !showIosGuide) {
    return null;
  }

  return (
    <section
      aria-label="Pasang aplikasi OmprengQ"
      className="clay-card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-card to-sky-soft/60 p-4 sm:p-6"
    >
      <div className="flex min-w-0 items-start gap-4">
        <span className="clay-pill inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mint-soft text-primary">
          <Smartphone className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-bold text-foreground sm:text-base">
            Simpan OmprengQ ke Layar Utama
          </p>
          {canInstall ? (
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Buka kalkulator gizi lebih cepat dan tetap bisa dipakai saat sinyal lemah.
            </p>
          ) : (
            <p className="flex flex-wrap items-center gap-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              <span>Di Safari iOS, ketuk ikon</span>
              <Share className="inline h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Bagikan lalu pilih Tambah ke Layar Utama.</span>
            </p>
          )}
        </div>
      </div>

      {canInstall && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
          onClick={() => void promptInstall()}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>Pasang aplikasi</span>
        </Button>
      )}
    </section>
  );
}
