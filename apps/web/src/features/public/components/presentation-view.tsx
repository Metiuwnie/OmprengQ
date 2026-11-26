import type { Allergen, Level } from "@mbg/shared";
import { AlertTriangle, Minimize2 } from "lucide-react";
import { useEffect } from "react";
import { ClaySkyDecor } from "@/components/clay-sky-decor";
import { Badge } from "@/components/ui/badge";
import { ALLERGEN_LABELS, LEVEL_LABELS } from "@/features/admin/lib/labels";
import type { PublicTodayResponse } from "../api/public-api";
import { getDefaultDisplayMode } from "../lib/level-storage";
import { estimateLunchAkgShare, getCategoryBenefit } from "../lib/nutrition-education";
import { ShareToWhatsApp } from "../../share/components/share-to-whatsapp";
import { CategoryIcon } from "./category-icon";
import { NutritionEducationSection } from "./nutrition-education-section";

interface PresentationViewProps {
  schoolName: string;
  schoolSlug: string;
  dateLabel: string;
  level: Level;
  menu: NonNullable<PublicTodayResponse["menu"]>;
  onExit: () => void;
}

/** High-contrast claymorphism classroom projection view (`?mode=kelas`). */
export function PresentationView({
  schoolName,
  schoolSlug,
  dateLabel,
  level,
  menu,
  onExit,
}: PresentationViewProps) {
  const portion = menu.portions[level];
  const displayMode = getDefaultDisplayMode(level);
  const lunchSharePct = portion ? estimateLunchAkgShare(portion.totals.energyKcal, level) : 0;
  const isTeenLevel = level === "smp" || level === "sma";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit]);

  return (
    <div className="clay-sky-canvas relative min-h-screen overflow-hidden px-4 py-6 text-foreground sm:px-8 sm:py-8">
      <ClaySkyDecor showSchool />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <header className="clay-card flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-lg font-bold text-primary sm:text-xl">
              {schoolName} ({LEVEL_LABELS[level]})
            </p>
            <p className="text-sm text-muted-foreground sm:text-base">{dateLabel}</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <ShareToWhatsApp
              school={{ name: schoolName, slug: schoolSlug }}
              menu={menu}
              portion={portion}
              className="w-full sm:w-auto"
            />
            <button
              type="button"
              onClick={onExit}
              className="clay-pill inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-background px-4 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              <Minimize2 className="h-4 w-4" aria-hidden="true" />
              Keluar mode kelas
            </button>
          </div>
        </header>

        <section className="clay-elevated flex flex-wrap items-center justify-between gap-6 bg-gradient-to-br from-card via-card to-sun-soft/65 p-6 sm:p-8">
          <div className="min-w-0 flex-1 space-y-2">
            <Badge variant="mint">Menu Hari Ini</Badge>
            <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {menu.name}
            </h1>
            {menu.description && (
              <p className="max-w-prose text-sm text-muted-foreground sm:text-lg">
                {menu.description}
              </p>
            )}
          </div>

          <img
            src="/mascots/mascot-susu-papan.png"
            alt="Maskot susu membawa papan kelas OmprengQ"
            width={640}
            height={560}
            className="mascot-float hidden h-32 w-auto shrink-0 object-contain sm:block sm:h-40"
          />
        </section>

        {portion && (
          <section
            aria-label="Sorotan gizi utama"
            className={`grid grid-cols-3 gap-2 sm:gap-4 ${isTeenLevel ? "lg:grid-cols-6" : ""}`}
          >
            <div className="clay-card bg-gradient-to-br from-card to-sun-soft p-4 sm:p-5">
              <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Energi</p>
              <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                {Math.round(portion.totals.energyKcal)} kkal
              </p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums">
                ~{lunchSharePct}% AKG
              </p>
            </div>
            <div className="clay-card bg-gradient-to-br from-card to-coral-soft p-4 sm:p-5">
              <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Protein</p>
              <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                {portion.totals.proteinG.toFixed(1)} g
              </p>
            </div>
            <div className="clay-card bg-gradient-to-br from-card to-mint-soft p-4 sm:p-5">
              <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Serat</p>
              <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                {portion.totals.fiberG.toFixed(1)} g
              </p>
            </div>
            {isTeenLevel && (
              <>
                <div className="clay-card bg-gradient-to-br from-card to-sky-soft p-4 sm:p-5">
                  <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
                    Karbohidrat
                  </p>
                  <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                    {portion.totals.carbG.toFixed(1)} g
                  </p>
                </div>
                <div className="clay-card bg-gradient-to-br from-card to-sun-soft/80 p-4 sm:p-5">
                  <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Lemak</p>
                  <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                    {portion.totals.fatG.toFixed(1)} g
                  </p>
                </div>
                <div className="clay-card bg-gradient-to-br from-card to-mint-soft/80 p-4 sm:p-5">
                  <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Zat Besi</p>
                  <p className="mt-2 font-display text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                    {portion.totals.ironMg.toFixed(1)} mg
                  </p>
                </div>
              </>
            )}
          </section>
        )}

        {portion && portion.allergens.length > 0 && (
          <div
            role="note"
            className="clay-card flex items-center gap-4 bg-gradient-to-r from-sun-soft via-sun-soft/80 to-card px-4 py-4 sm:px-6"
          >
            <AlertTriangle className="h-6 w-6 shrink-0 text-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground sm:text-lg">
              Info alergen: Mengandung{" "}
              {portion.allergens.map((a: Allergen) => ALLERGEN_LABELS[a].toLowerCase()).join(", ")}.
            </p>
          </div>
        )}

        {portion ? (
          <section aria-label="Komposisi menu hari ini" className="grid gap-4 sm:grid-cols-2">
            {portion.items.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="clay-card flex items-start gap-4 p-4 sm:p-6"
              >
                <span className="clay-pill inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <CategoryIcon category={item.category} className="h-6 w-6" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-lg font-bold text-foreground sm:text-2xl">{item.label}</p>
                  {item.visualUnit && (
                    <p className="text-sm font-semibold text-primary sm:text-base">
                      {item.visualUnit}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground sm:text-base">
                    {item.benefit || getCategoryBenefit(item.category, displayMode)}
                  </p>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <p className="clay-card p-6 text-xl text-foreground">
            Rincian porsi untuk jenjang {LEVEL_LABELS[level]} belum tersedia.
          </p>
        )}

        {menu.funFact && (
          <div className="clay-card flex items-center justify-between gap-4 bg-gradient-to-r from-mint-soft/75 via-card to-mint-soft/85 p-6">
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground sm:text-lg">Tahukah kamu?</p>
              <p className="text-base leading-relaxed text-foreground/90 sm:text-xl">
                {menu.funFact}
              </p>
            </div>
            <img
              src="/mascots/mascot-sayur-tanya.png"
              alt="Maskot sayur bertanya"
              width={538}
              height={560}
              className="mascot-float hidden h-24 w-auto shrink-0 object-contain sm:block"
            />
          </div>
        )}

        {portion && (
          <NutritionEducationSection
            level={level}
            totals={portion.totals}
            categories={portion.items.map((item) => item.category)}
          />
        )}
      </div>
    </div>
  );
}
