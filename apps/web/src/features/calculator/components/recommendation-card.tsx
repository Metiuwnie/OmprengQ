import {
  MEAL_SLOTS,
  NUTRIENT_FRIENDLY_NAMES,
  type MealSlot,
  type Recommendation,
} from "@mbg/shared";
import { CheckCircle2, Home } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/features/public/components/category-icon";
import { MEAL_SLOT_LABELS } from "../lib/calculator-logic";

interface RecommendationCardProps {
  recommendations: Record<MealSlot, Recommendation>;
  isChildMode?: boolean;
}

const ORDERED_SLOTS: readonly MealSlot[] = ["makan_malam", "sarapan", "selingan"];

/** Home meal URT recommendations grouped by meal slot (default: makan_malam). */
export function RecommendationCard({
  recommendations,
  isChildMode = false,
}: RecommendationCardProps) {
  const [activeSlot, setActiveSlot] = useState<MealSlot>("makan_malam");
  const slotsToRender = ORDERED_SLOTS.filter((slot) => MEAL_SLOTS.includes(slot));
  const current = recommendations[activeSlot];

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-mint-soft/45">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Home className="h-5 w-5 text-primary" aria-hidden="true" />
              Rekomendasi di Rumah
            </CardTitle>
            <CardDescription>
              Saran porsi takaran rumah tangga (URT) yang terjangkau dan sesuai profilmu.
            </CardDescription>
          </div>

          <div
            role="tablist"
            aria-label="Waktu makan di rumah"
            className="clay-well grid w-full grid-cols-3 gap-1 p-1 sm:flex sm:w-auto"
          >
            {slotsToRender.map((slot) => {
              const selected = slot === activeSlot;
              return (
                <button
                  key={slot}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveSlot(slot)}
                  className={`min-h-11 cursor-pointer rounded-md px-2 text-center text-xs font-semibold transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 sm:px-3 sm:text-sm ${
                    selected
                      ? "bg-sky text-sky-foreground shadow-[var(--shadow-clay-sky)]"
                      : "text-foreground hover:bg-card/70"
                  }`}
                >
                  {MEAL_SLOT_LABELS[slot]}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="clay-well p-3.5 text-sm leading-relaxed text-foreground sm:text-base">
          {current.summaryText}
        </p>

        {current.items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {current.items.map((item) => (
              <div
                key={item.name}
                className="clay-well flex items-start gap-3 p-3.5"
              >
                <span className="clay-pill inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent text-lg text-accent-foreground">
                  {item.emoji ? (
                    <span aria-hidden="true">{item.emoji}</span>
                  ) : (
                    <CategoryIcon category="lainnya" className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-sm font-bold text-foreground sm:text-base">{item.name}</p>
                  <p className="text-sm font-semibold text-primary">{item.urtLabel}</p>
                  {!isChildMode && item.covers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.covers.map((nutrient) => (
                        <Badge key={nutrient} variant="mint">
                          +{NUTRIENT_FRIENDLY_NAMES[nutrient]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="clay-well flex items-center gap-3 p-4 text-sm text-foreground">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Kebutuhan gizi pada waktu makan ini sudah sangat baik. Lengkapi dengan air putih
              secukupnya dan buah segar.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
