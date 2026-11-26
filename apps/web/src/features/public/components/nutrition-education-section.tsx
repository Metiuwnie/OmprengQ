import type { Level, NutrientTotals } from "@mbg/shared";
import { BatteryCharging, CheckCircle2, Circle, Sparkles, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  estimateLunchAkgShare,
  getLevelEducationGuide,
  getPlateGroupChecklist,
  LEVEL_DAILY_ENERGY_REF,
} from "../lib/nutrition-education";

interface NutritionEducationSectionProps {
  level: Level;
  totals: NutrientTotals;
  categories: readonly string[];
}

/** Playful magazine-style nutrition facts and Isi Piringku spread for students. */
export function NutritionEducationSection({
  level,
  totals,
  categories,
}: NutritionEducationSectionProps) {
  const guide = getLevelEducationGuide(level);
  const lunchSharePct = estimateLunchAkgShare(totals.energyKcal, level);
  const plateGroups = getPlateGroupChecklist(categories);
  const presentCount = plateGroups.filter((group) => group.present).length;
  const missingLabels = plateGroups.filter((group) => !group.present).map((group) => group.label);

  return (
    <section
      aria-label="Majalah mini edukasi gizi"
      className="grid items-start gap-4 lg:grid-cols-3"
    >
      <div className="clay-card space-y-4 bg-gradient-to-br from-card via-sun-soft/55 to-sun-soft p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="accent">
            <BatteryCharging className="h-3.5 w-3.5" aria-hidden="true" />
            {guide.energyBadge}
          </Badge>
          <span className="text-xs font-semibold text-muted-foreground sm:text-sm">
            {guide.audienceLabel}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-foreground tabular-nums sm:text-5xl">
              {lunchSharePct}%
            </span>
            <span className="text-sm font-semibold text-muted-foreground tabular-nums">
              dari ~{LEVEL_DAILY_ENERGY_REF[level]} kkal/hari
            </span>
          </div>
          <Progress
            value={lunchSharePct}
            max={100}
            label={`Kontribusi energi makan siang ${lunchSharePct}%`}
          />
        </div>

        <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
          {guide.energyCaption}
        </p>
      </div>

      <div className="clay-card space-y-4 bg-gradient-to-br from-card via-mint-soft/55 to-mint-soft p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="mint">
            <Utensils className="h-3.5 w-3.5" aria-hidden="true" />
            Misi Piring Warna
          </Badge>
          <span className="text-sm font-bold text-primary tabular-nums">
            {presentCount}/4 lengkap
          </span>
        </div>

        <ul className="grid grid-cols-2 gap-2">
          {plateGroups.map((group) => (
            <li
              key={group.id}
              className={`clay-well flex min-h-11 items-center gap-2 px-3 py-2 text-sm font-semibold ${
                group.present ? "bg-mint-soft text-foreground" : "text-muted-foreground"
              }`}
            >
              {group.present ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span>{group.label}</span>
            </li>
          ))}
        </ul>

        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {missingLabels.length === 0
            ? "Keren! Keempat kelompok pangan Isi Piringku hadir di ompreng hari ini."
            : `Lengkapi ${missingLabels.join(" & ")} saat di rumah supaya makin seimbang!`}
        </p>
      </div>

      <div className="clay-card space-y-4 bg-gradient-to-br from-card via-sky-soft/45 to-coral-soft/55 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <Badge variant="coral">{guide.magazineBadge}</Badge>
            <h2 className="pt-1 text-xl font-bold leading-snug text-foreground sm:text-2xl">
              {guide.magazineTitle}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
              {guide.magazineBody}
            </p>
          </div>
          <img
            src="/mascots/mascot-pisang-ceria.png"
            alt="Maskot pisang ceria mengacungkan jempol"
            width={450}
            height={560}
            className="mascot-float hidden h-24 w-auto shrink-0 object-contain sm:block sm:h-28"
          />
        </div>

        <div className="clay-well flex items-start gap-2 p-4 text-sm font-medium leading-relaxed text-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{guide.quickHabit}</span>
        </div>
      </div>
    </section>
  );
}
