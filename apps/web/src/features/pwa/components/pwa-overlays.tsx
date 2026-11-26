import { RefreshCw, WifiOff, X } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "../hooks/use-pwa";
import { formatLastUpdatedLabel, requestPersistentStorage } from "../lib/pwa-helpers";

/**
 * Non-intrusive offline indicator banner and prompt-based Service Worker update toast.
 * Automatically hidden in classroom presentation mode (`?mode=kelas`).
 */
export function PwaOverlays() {
  const [searchParams] = useSearchParams();
  const isPresentationMode = searchParams.get("mode") === "kelas";
  const { isOnline, lastUpdatedAt } = useOnlineStatus();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    void requestPersistentStorage();
  }, []);

  if (isPresentationMode) {
    return null;
  }

  return (
    <>
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-4 left-4 z-[450] max-w-md"
        >
          <div className="clay-card flex items-center gap-2.5 bg-sun-soft/95 px-4 py-2.5 text-xs font-semibold text-foreground sm:text-sm">
            <WifiOff className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Mode offline: menampilkan data terakhir (diperbarui{" "}
              {formatLastUpdatedLabel(lastUpdatedAt)})
            </span>
          </div>
        </div>
      )}

      {needRefresh && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-4 right-4 z-[460] w-[calc(100vw-2rem)] max-w-sm"
        >
          <div className="clay-elevated flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Versi baru tersedia</p>
              <p className="text-xs text-muted-foreground">
                Muat ulang untuk memakai pembaruan terbaru.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => updateServiceWorker(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Muat ulang</span>
              </Button>
              <button
                type="button"
                onClick={() => setNeedRefresh(false)}
                aria-label="Tutup pemberitahuan pembaruan"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-sky-soft/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
