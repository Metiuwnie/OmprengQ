import type { Allergen, Level } from "@mbg/shared";
import { AlertTriangle, Minimize2, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { ALLERGEN_LABELS, LEVEL_LABELS } from "@/features/admin/lib/labels";
import type { PublicTodayResponse } from "../api/public-api";
import { CategoryIcon } from "./category-icon";

interface PresentationViewProps {
  schoolName: string;
  dateLabel: string;
  level: Level;
  menu: NonNullable<PublicTodayResponse["menu"]>;
  onExit: () => void;
}

/** High-contrast classroom projection view (`?mode=kelas`) designed for distance readability. */
export function PresentationView({
  schoolName,
  dateLabel,
  level,
  menu,
  onExit,
}: PresentationViewProps) {
  const portion = menu.portions[level];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit]);

  return (
    <div className="min-h-screen bg-background px-5 py-6 text-foreground sm:px-10 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-primary sm:text-xl">
              {schoolName} ({LEVEL_LABELS[level]})
            </p>
            <p className="text-base text-foreground/80 sm:text-lg">{dateLabel}</p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <Minimize2 className="h-4 w-4" aria-hidden="true" />
            Keluar mode kelas
          </button>
        </header>

        <section className="space-y-4">
          <h1 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            {menu.name}
          </h1>

          {portion && (
            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg border border-border bg-card px-5 py-3">
                <p className="text-sm text-muted-foreground">Energi</p>
                <p className="font-mono text-2xl font-bold text-foreground tabular-nums sm:text-3xl">
                  {Math.round(portion.totals.energyKcal)} kkal
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-3">
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="font-mono text-2xl font-bold text-foreground tabular-nums sm:text-3xl">
                  {portion.totals.proteinG.toFixed(1)} g
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card px-5 py-3">
                <p className="text-sm text-muted-foreground">Serat</p>
                <p className="font-mono text-2xl font-bold text-foreground tabular-nums sm:text-3xl">
                  {portion.totals.fiberG.toFixed(1)} g
                </p>
              </div>
            </div>
          )}
        </section>

        {portion ? (
          <section aria-label="Komposisi menu hari ini" className="grid gap-4 sm:grid-cols-2">
            {portion.items.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="flex items-start gap-4 rounded-lg border border-border bg-card p-5"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <CategoryIcon category={item.category} className="h-6 w-6" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-xl font-bold text-foreground sm:text-2xl">{item.label}</p>
                  {item.visualUnit && (
                    <p className="text-base font-medium text-primary sm:text-lg">
                      {item.visualUnit}
                    </p>
                  )}
                  {item.benefit && (
                    <p className="text-base text-foreground/85 sm:text-lg">{item.benefit}</p>
                  )}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <p className="rounded-lg border border-border bg-card p-6 text-xl text-foreground">
            Rincian porsi untuk jenjang {LEVEL_LABELS[level]} belum tersedia.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {menu.funFact && (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-mint/35 p-5">
              <Sparkles className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-lg font-bold text-foreground">Tahukah kamu?</p>
                <p className="text-lg text-foreground/90">{menu.funFact}</p>
              </div>
            </div>
          )}

          {portion && portion.allergens.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-accent/35 p-5">
              <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-lg font-bold text-foreground">Info alergen</p>
                <p className="text-lg text-foreground">
                  Mengandung:{" "}
                  {portion.allergens.map((a: Allergen) => ALLERGEN_LABELS[a].toLowerCase()).join(", ")}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
