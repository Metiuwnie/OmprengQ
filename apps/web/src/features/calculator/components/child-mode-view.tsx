import type { ChildProfile, EatenFraction } from "@mbg/shared";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PRIMARY_CHILD_NUTRIENTS,
  type CalculatorSummary,
} from "../lib/calculator-logic";
import { AllergyBanner } from "./allergy-banner";
import { EatenSelector } from "./eaten-selector";
import { NutrientBar } from "./nutrient-bar";
import { RecommendationCard } from "./recommendation-card";

interface ChildModeViewProps {
  profile: ChildProfile;
  menuName: string;
  summary: CalculatorSummary;
  eaten: EatenFraction;
  onChangeEaten: (value: EatenFraction) => void;
  skipAllergenPart: boolean;
  onToggleSkipAllergen: (next: boolean) => void;
}

/** Child-friendly Mode Anak view hiding technical gram/mg figures behind "Lihat rincian". */
export function ChildModeView({
  profile,
  menuName,
  summary,
  eaten,
  onChangeEaten,
  skipAllergenPart,
  onToggleSkipAllergen,
}: ChildModeViewProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-6">
      <section className="clay-card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-card via-sun-soft/50 to-mint-soft/50 p-4 sm:p-6">
        <div className="min-w-0 flex-1 space-y-2">
          <Badge variant="accent">Halo, {profile.nickname}!</Badge>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Yuk cek isi gizi dari {menuName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Pilih seberapa banyak porsi makan siangmu yang habis hari ini.
          </p>
        </div>

        <img
          src="/mascots/mascot-ayam-ompreng.png"
          alt="Maskot ayam membawa ompreng OmprengQ"
          width={511}
          height={560}
          className="mascot-float hidden h-24 w-auto shrink-0 object-contain sm:block"
        />
      </section>

      <AllergyBanner
        warnings={summary.allergenWarnings}
        skipAllergenPart={skipAllergenPart}
        onToggleSkip={onToggleSkipAllergen}
        replacements={summary.proteinReplacements}
      />

      <EatenSelector value={eaten} onChange={onChangeEaten} />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl">Pemenuhan Gizimu Hari Ini</CardTitle>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowDetails((prev) => !prev)}
            >
              {showDetails ? (
                <>
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                  Sembunyikan rincian
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Lihat rincian
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {PRIMARY_CHILD_NUTRIENTS.map((key) => (
            <NutrientBar
              key={key}
              nutrient={key}
              consumed={summary.gap.consumed[key]}
              target={summary.targets[key]}
              percent={summary.gap.percent[key]}
              remaining={summary.gap.remaining[key]}
              showDetails={showDetails}
            />
          ))}
        </CardContent>
      </Card>

      <RecommendationCard recommendations={summary.recommendations} isChildMode />
    </div>
  );
}
