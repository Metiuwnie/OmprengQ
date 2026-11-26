import {
  ACTIVITY_METS,
  estimateActivityKcal,
  NUTRIENT_KEYS,
  type ChildProfile,
  type EatenFraction,
  type SportActivity,
} from "@mbg/shared";
import { Activity, Flame, Shield } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SPORT_ACTIVITY_LABELS,
  type CalculatorSummary,
} from "../lib/calculator-logic";
import { AllergyBanner } from "./allergy-banner";
import { EatenSelector } from "./eaten-selector";
import { NutrientBar } from "./nutrient-bar";
import { RecommendationCard } from "./recommendation-card";

interface TeenModeViewProps {
  profile: ChildProfile;
  menuName: string;
  summary: CalculatorSummary;
  eaten: EatenFraction;
  onChangeEaten: (value: EatenFraction) => void;
  skipAllergenPart: boolean;
  onToggleSkipAllergen: (next: boolean) => void;
}

const SPORT_OPTIONS = Object.keys(ACTIVITY_METS) as SportActivity[];

/** Teen Mode Remaja view with full macronutrients, iron highlight, and optional activity estimator. */
export function TeenModeView({
  profile,
  menuName,
  summary,
  eaten,
  onChangeEaten,
  skipAllergenPart,
  onToggleSkipAllergen,
}: TeenModeViewProps) {
  const [sport, setSport] = useState<SportActivity>("jalan_santai");
  const [hoursText, setHoursText] = useState("1");

  const hours = Math.min(8, Math.max(0, Number(hoursText) || 0));
  const activityKcal = Math.round(estimateActivityKcal(sport, profile.weightKg, hours));
  const showFemaleIronNote = profile.sex === "female" && profile.age >= 10;

  return (
    <div className="space-y-6">
      <section className="clay-card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-card via-sky-soft/45 to-mint-soft/45 p-4 sm:p-6">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="mint">Mode Remaja</Badge>
            <span className="text-xs font-semibold text-muted-foreground">
              {profile.nickname}, {profile.age} th, {profile.weightKg} kg
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Analisis Gizi: {menuName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Perhitungan target harian berdasarkan AKG dan tingkat aktivitasmu.
          </p>
        </div>

        <img
          src="/mascots/mascot-sayur.png"
          alt="Maskot sayur OmprengQ"
          width={538}
          height={560}
          className="mascot-float hidden h-20 w-auto shrink-0 object-contain sm:block"
        />
      </section>

      <AllergyBanner
        warnings={summary.allergenWarnings}
        skipAllergenPart={skipAllergenPart}
        onToggleSkip={onToggleSkipAllergen}
        replacements={summary.proteinReplacements}
      />

      <EatenSelector value={eaten} onChange={onChangeEaten} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Pemenuhan Makronutrien &amp; Zat Besi</CardTitle>
            <CardDescription>
              Persentase dihitung dari porsi MBG yang kamu habiskan terhadap target harianmu.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {NUTRIENT_KEYS.map((key) => (
              <NutrientBar
                key={key}
                nutrient={key}
                consumed={summary.gap.consumed[key]}
                target={summary.targets[key]}
                percent={summary.gap.percent[key]}
                remaining={summary.gap.remaining[key]}
                showDetails
              />
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-b from-card to-mint-soft/45">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                Sorotan Zat Besi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground">
              <p className="tabular-nums">
                Terpenuhi{" "}
                <strong>{summary.gap.consumed.ironMg.toFixed(1)} mg</strong> dari target{" "}
                <strong>{summary.targets.ironMg.toFixed(1)} mg</strong> (
                {Math.round(summary.gap.percent.ironMg)}%).
              </p>
              <p className="text-muted-foreground">
                {showFemaleIronNote
                  ? "Remaja putri membutuhkan asupan zat besi lebih tinggi untuk menjaga energi belajar dan mencegah anemia."
                  : "Zat besi membantu menjaga konsentrasi belajar dan daya tahan tubuh saat beraktivitas."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
                Perkiraan Kalori Aktivitas (Opsional)
              </CardTitle>
              <CardDescription>
                Perkiraan energi tambahan olahraga berdasarkan berat badanmu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="teen-sport">Jenis aktivitas</Label>
                  <select
                    id="teen-sport"
                    value={sport}
                    onChange={(e) => setSport(e.target.value as SportActivity)}
                    className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm text-foreground shadow-[var(--shadow-clay-inset)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
                  >
                    {SPORT_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {SPORT_ACTIVITY_LABELS[item]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teen-hours">Durasi (jam)</Label>
                  <Input
                    id="teen-hours"
                    type="number"
                    min={0}
                    max={8}
                    step="0.5"
                    value={hoursText}
                    onChange={(e) => setHoursText(e.target.value)}
                  />
                </div>
              </div>

              <div className="clay-well flex items-center justify-between gap-2 p-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Flame className="h-4 w-4 text-coral" aria-hidden="true" />
                  Perkiraan kalori terpakai
                </span>
                <span className="font-display text-lg font-bold text-primary tabular-nums">
                  {activityKcal} kkal
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Angka ini merupakan perkiraan kasar berbasis MET, bukan pengukuran klinis.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <RecommendationCard recommendations={summary.recommendations} />
    </div>
  );
}
