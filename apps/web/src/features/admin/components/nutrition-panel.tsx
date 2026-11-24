import {
  collectPortionAllergens,
  computePortionTotals,
  type Allergen,
  type NutrientKey,
  type PortionFoodLike,
} from "@mbg/shared";
import { AlertTriangle, Calculator } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALLERGEN_LABELS } from "../lib/labels";

export interface NutritionPanelItem {
  foodId: string;
  grams: number;
  food: PortionFoodLike;
}

interface NutritionPanelProps {
  levelLabel: string;
  items: readonly NutritionPanelItem[];
  isDirty: boolean;
}

const NUTRIENT_ROWS: ReadonlyArray<{
  key: NutrientKey;
  label: string;
  unit: string;
  decimals: number;
}> = [
  { key: "energyKcal", label: "Energi", unit: "kkal", decimals: 0 },
  { key: "carbG", label: "Karbohidrat", unit: "g", decimals: 1 },
  { key: "proteinG", label: "Protein", unit: "g", decimals: 1 },
  { key: "fatG", label: "Lemak", unit: "g", decimals: 1 },
  { key: "fiberG", label: "Serat", unit: "g", decimals: 1 },
  { key: "ironMg", label: "Zat Besi", unit: "mg", decimals: 1 },
];

/** Live portion nutrition summary computed exclusively via `@mbg/shared`. */
export function NutritionPanel({ levelLabel, items, isDirty }: NutritionPanelProps) {
  const { totals, allergens } = useMemo(() => {
    const foodsById = new Map<string, PortionFoodLike>();
    const validItems = items
      .filter((item) => Number.isFinite(item.grams) && item.grams > 0)
      .map((item) => {
        foodsById.set(item.foodId, item.food);
        return { foodId: item.foodId, grams: item.grams };
      });

    return {
      totals: computePortionTotals(validItems, foodsById),
      allergens: collectPortionAllergens(validItems, foodsById),
    };
  }, [items]);

  return (
    <Card className="lg:sticky lg:top-22">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant={isDirty ? "accent" : "mint"}>
            {isDirty ? "Belum disimpan" : "Tersimpan"}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {items.length} bahan
          </span>
        </div>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
          Ringkasan Gizi: {levelLabel}
        </CardTitle>
        <CardDescription>
          Dihitung otomatis dari berat matang siap makan per 1 porsi.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <dl className="divide-y divide-border rounded-md border border-border bg-background/60 px-3.5">
          {NUTRIENT_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-mono font-semibold text-foreground tabular-nums">
                {totals[row.key].toFixed(row.decimals)} {row.unit}
              </dd>
            </div>
          ))}
        </dl>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Alergen terdeteksi</p>
          {allergens.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {allergens.map((allergen: Allergen) => (
                <Badge key={allergen} variant="accent">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  {ALLERGEN_LABELS[allergen]}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada alergen utama terdeteksi.</p>
          )}
        </div>

        <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
          Perkiraan berdasarkan TKPI. Nilai akhir tetap divalidasi ulang di server saat porsi
          disimpan.
        </p>
      </CardContent>
    </Card>
  );
}
