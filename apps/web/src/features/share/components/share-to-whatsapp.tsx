import type { Allergen, NutrientTotals } from "@mbg/shared";
import { Check, Copy, ExternalLink, MessageCircle, Share2, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PublicTodayResponse } from "@/features/public/api/public-api";
import { trackAnonymousEvent } from "@/features/public/lib/usage-events";
import {
  buildWhatsAppMessage,
  buildWhatsAppShareUrl,
  MAX_WA_MESSAGE_LENGTH,
} from "../lib/whatsapp";

interface SharePortionSummary {
  totals: NutrientTotals;
  allergens: readonly Allergen[];
}

interface ShareToWhatsAppProps {
  school: {
    name: string;
    slug: string;
  };
  menu: PublicTodayResponse["menu"];
  portion?: SharePortionSummary | null;
  className?: string;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback to hidden textarea selection when clipboard API is blocked.
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

/** One-click WhatsApp parent-group share trigger + preview & copy-fallback dialog. */
export function ShareToWhatsApp({ school, menu, portion, className }: ShareToWhatsAppProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://omprengq.example.id";

  const message = useMemo(() => {
    const activePortion = portion ?? (menu ? Object.values(menu.portions)[0] : undefined);
    return buildWhatsAppMessage(
      menu
        ? {
            date: menu.date,
            name: menu.name,
            totals: activePortion?.totals,
            allergens: activePortion?.allergens,
          }
        : null,
      school,
      baseUrl,
    );
  }, [baseUrl, menu, portion, school]);

  const shareUrl = useMemo(() => buildWhatsAppShareUrl(message), [message]);

  const handleCopy = async () => {
    setCopyFailed(false);
    const ok = await copyTextToClipboard(message);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } else {
      setCopyFailed(true);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        className={className}
        disabled={!menu}
        onClick={() => {
          setCopied(false);
          setCopyFailed(false);
          setOpen(true);
          if (menu) {
            trackAnonymousEvent({ schoolSlug: school.slug, date: menu.date, type: "share_wa" });
          }
        }}
        title={menu ? "Bagikan ringkasan menu ke WhatsApp" : "Belum ada menu hari ini untuk dibagikan"}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        <span>Bagikan WA</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-foreground/45"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="clay-elevated relative z-[501] w-full max-w-lg space-y-4 p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="clay-pill inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mint-soft text-primary">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id={titleId} className="text-lg font-bold text-foreground sm:text-xl">
                    Bagikan ke WhatsApp
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Kirim ringkasan menu &amp; tautan kalkulator ke grup orang tua.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup dialog bagikan"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-sky-soft/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Pratinjau pesan</span>
                <span className="tabular-nums">
                  {message.length}/{MAX_WA_MESSAGE_LENGTH} karakter
                </span>
              </div>
              <pre className="clay-well max-h-60 overflow-y-auto whitespace-pre-wrap break-words p-3.5 font-sans text-sm leading-relaxed text-foreground">
                {message}
              </pre>
            </div>

            {copied && (
              <p
                role="status"
                className="rounded-md bg-mint-soft px-3.5 py-2 text-sm font-semibold text-foreground"
              >
                Tersalin! Pesan siap ditempel ke grup WhatsApp.
              </p>
            )}

            {copyFailed && (
              <p
                role="alert"
                className="rounded-md bg-sun-soft px-3.5 py-2 text-sm text-foreground"
              >
                Salin otomatis tidak diizinkan browser. Silakan salin teks pratinjau di atas secara
                manual.
              </p>
            )}

            <div className="grid w-full grid-cols-2 gap-2.5 pt-1 sm:flex sm:w-auto sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </Button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-clay-primary)] transition-[transform,opacity] duration-150 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
              >
                <span>Buka WhatsApp</span>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
