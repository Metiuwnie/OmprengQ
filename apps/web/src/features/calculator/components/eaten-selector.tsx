import type { EatenFraction } from "@mbg/shared";
import { Utensils } from "lucide-react";
import { EATEN_OPTIONS } from "../lib/calculator-logic";

interface EatenSelectorProps {
  value: EatenFraction;
  onChange: (value: EatenFraction) => void;
}

/** Selector for how much of the MBG meal portion was eaten (1, 0.75, 0.5, 0.25). */
export function EatenSelector({ value, onChange }: EatenSelectorProps) {
  return (
    <div className="clay-card space-y-4 p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Utensils className="h-4 w-4 text-primary" aria-hidden="true" />
        <p className="text-sm font-bold text-foreground sm:text-base">
          Porsi MBG yang dimakan hari ini
        </p>
      </div>

      <div
        role="group"
        aria-label="Pilih porsi yang dimakan"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {EATEN_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-md border px-3 py-2 text-center transition-[transform,background-color,border-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${
                active
                  ? "border-transparent bg-accent text-accent-foreground shadow-[var(--shadow-clay-accent)]"
                  : "border-border bg-background text-foreground hover:bg-sky-soft/60"
              }`}
            >
              <span className="text-sm font-bold">{option.shortLabel}</span>
              <span
                className={`text-xs ${
                  active ? "text-accent-foreground/80" : "text-muted-foreground"
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
