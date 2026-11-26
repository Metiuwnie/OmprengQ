import { ALLERGEN_LABELS, type Allergen, type HouseholdFoodCatalogItem } from "@mbg/shared";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AllergyBannerProps {
  warnings: readonly Allergen[];
  skipAllergenPart: boolean;
  onToggleSkip: (next: boolean) => void;
  replacements: readonly HouseholdFoodCatalogItem[];
}

/** Gentle allergen alert banner with skip-part toggle and safe protein alternatives. */
export function AllergyBanner({
  warnings,
  skipAllergenPart,
  onToggleSkip,
  replacements,
}: AllergyBannerProps) {
  if (warnings.length === 0) return null;

  const allergenListText = warnings.map((a) => ALLERGEN_LABELS[a].toLowerCase()).join(", ");

  return (
    <div
      role="note"
      className="clay-card space-y-3 bg-sun-soft/90 p-4 text-foreground sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="clay-pill inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold sm:text-base">Perhatian alergi makanan</p>
          <p className="text-sm text-foreground/90">
            Menu ini mengandung <strong>{allergenListText}</strong>. Bicarakan dengan guru atau
            orang tua ya.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold text-foreground">
          <input
            type="checkbox"
            checked={skipAllergenPart}
            onChange={(e) => onToggleSkip(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Aku tidak makan bagian ini
        </label>

        {replacements.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Pengganti protein aman:
            </span>
            {replacements.map((item) => (
              <Badge key={item.name} variant="mint">
                {item.name} ({item.urtLabel})
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
