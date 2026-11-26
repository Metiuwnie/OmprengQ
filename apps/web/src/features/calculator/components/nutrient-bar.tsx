import { NUTRIENT_FRIENDLY_NAMES, type NutrientKey } from "@mbg/shared";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NUTRIENT_UNITS } from "../lib/calculator-logic";

interface NutrientBarProps {
  nutrient: NutrientKey;
  consumed: number;
  target: number;
  percent: number;
  remaining: number;
  showDetails?: boolean;
}

function formatAmount(value: number, nutrient: NutrientKey): string {
  const unit = NUTRIENT_UNITS[nutrient];
  if (nutrient === "energyKcal") {
    return `${Math.round(value)} ${unit}`;
  }
  return `${value.toFixed(1)} ${unit}`;
}

function getPositiveStatus(percent: number): {
  badgeText: string;
  helperText: string;
  variant: "mint" | "accent";
} {
  if (percent >= 100) {
    return {
      badgeText: "Sudah tercukupi",
      helperText: "Kebutuhan hari ini sudah terpenuhi dari menu MBG.",
      variant: "mint",
    };
  }
  if (percent >= 75) {
    return {
      badgeText: "Hampir penuh",
      helperText: "Tinggal sedikit lagi untuk melengkapi target harian.",
      variant: "mint",
    };
  }
  return {
    badgeText: "Yuk tambah di rumah",
    helperText: "Bisa dilengkapi saat makan malam atau sarapan.",
    variant: "accent",
  };
}

/** Accessible positive-tone nutrition fulfillment progress bar (never red/punitive). */
export function NutrientBar({
  nutrient,
  consumed,
  target,
  percent,
  remaining,
  showDetails = true,
}: NutrientBarProps) {
  const friendlyRaw = NUTRIENT_FRIENDLY_NAMES[nutrient];
  const title = friendlyRaw.charAt(0).toUpperCase() + friendlyRaw.slice(1);
  const roundedPct = Math.round(percent);
  const barPercent = Math.min(100, Math.max(0, percent));
  const status = getPositiveStatus(percent);

  return (
    <div className="clay-well space-y-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground sm:text-base">{title}</p>
          <Badge variant={status.variant}>{status.badgeText}</Badge>
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${
            roundedPct >= 100 ? "text-primary" : "text-sky"
          }`}
        >
          {roundedPct}%
        </span>
      </div>

      <Progress value={barPercent} max={100} label={`Pemenuhan ${title}`} />

      {showDetails ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
          <span>
            Dari MBG: <strong className="text-foreground">{formatAmount(consumed, nutrient)}</strong>{" "}
            / target {formatAmount(target, nutrient)}
          </span>
          <span>
            {remaining > 0 ? `Perlu tambah ${formatAmount(remaining, nutrient)}` : "Target tercapai"}
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{status.helperText}</p>
      )}
    </div>
  );
}
