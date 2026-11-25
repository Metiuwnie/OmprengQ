import type { Allergen, Level } from "@mbg/shared";
import { AlertTriangle, Minimize2 } from "lucide-react";
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

/** High-contrast claymorphism classroom projection view (`?mode=kelas`). */
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
        <header className="clay-card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="text-lg font-bold text-primary sm:text-xl">
              {schoolName} ({LEVEL_LABELS[level]})
            </p>
            <p className="text-base text-foreground/85 sm:text-lg">{dateLabel}</p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-sky-soft/80 px-4 py-2 text-sm font-semibold text-foreground shadow-xs hover:bg-sky-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <Minimize2 className="h-4 w-4" aria-hidden="true" />
            Keluar mode kelas
          </button>
        </header>

        <section className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-4">
            <h1 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
              {menu.name}
            </h1>

            {portion && (
              <div className="flex flex-wrap gap-3.5">
                <div className="clay-card bg-sun-soft px-5 py-3">
                  <p className="text-sm font-semibold text-muted-foreground">Energi</p>
                  <p className="font-display text-2xl font-bold text-foreground tabular-nums sm:text-3xl">
                    {Math.round(portion.totals.energyKcal)} kkal
                  </p>
                </div>
                <div className="clay-card bg-coral-soft px-5 py-3">
                  <p className="text-sm font-semibold text-muted-foreground">Protein</p>
                  <p className="font-display text-2xl font-bold text-foreground tabular-nums sm:text-3xl">
                    {portion.totals.proteinG.toFixed(1)} g
                  </p>
                </div>
                <div className="clay-card bg-mint-soft px-5 py-3">
                  <p className="text-sm font-semibold text-muted-foreground">Serat</p>
                  <p className="font-display text-2xl font-bold text-foreground tabular-nums sm:text-3xl">
                    {portion.totals.fiberG.toFixed(1)} g
                  </p>
                </div>
              </div>
            )}
          </div>

          <img
            src="/mascots/mascot-ayam-ompreng.png"
            alt="Maskot ayam membawa ompreng gizi"
            width={511}
            height={560}
            className="mascot-float hidden h-28 w-auto shrink-0 object-contain md:block"
          />
        </section>

        {portion ? (
          <section aria-label="Komposisi menu hari ini" className="grid gap-4 sm:grid-cols-2">
            {portion.items.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="clay-card flex items-start gap-4 p-5"
              >
                <span className="clay-pill inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <CategoryIcon category={item.category} className="h-6 w-6" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-xl font-bold text-foreground sm:text-2xl">{item.label}</p>
                  {item.visualUnit && (
                    <p className="text-base font-semibold text-primary sm:text-lg">
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
          <p className="clay-card p-6 text-xl text-foreground">
            Rincian porsi untuk jenjang {LEVEL_LABELS[level]} belum tersedia.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {menu.funFact && (
            <div className="clay-card flex items-center justify-between gap-4 bg-mint-soft p-5">
              <div className="space-y-1">
                <p className="text-lg font-bold text-foreground">Tahukah kamu?</p>
                <p className="text-lg text-foreground/90">{menu.funFact}</p>
              </div>
              <img
                src="/mascots/mascot-sayur-tanya.png"
                alt="Maskot sayur bertanya"
                width={538}
                height={560}
                className="mascot-float hidden h-16 w-auto shrink-0 object-contain sm:block"
              />
            </div>
          )}

          {portion && portion.allergens.length > 0 && (
            <div className="clay-card flex items-start gap-3 bg-sun-soft p-5">
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
