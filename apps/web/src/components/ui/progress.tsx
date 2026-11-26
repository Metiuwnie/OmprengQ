import { cn } from "@/lib/utils";

export interface ProgressProps {
  value: number;
  max?: number;
  label: string;
  className?: string;
}

/** Accessible clay nutrition fulfillment progress bar animated via transform: scaleX. */
export function Progress({ value, max = 100, label, className }: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  const percent = Math.round(ratio * 100);

  return (
    <div className={cn("w-full", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round(value)}
        aria-valuetext={`${percent}%`}
        className="h-4 w-full overflow-hidden rounded-full border border-border bg-sky-soft p-0.5 shadow-[var(--shadow-clay-inset)]"
      >
        <div
          className={cn(
            "h-full w-full origin-left rounded-full shadow-xs motion-safe:transition-transform motion-safe:duration-300 motion-reduce:transition-none",
            percent >= 100 ? "bg-primary" : "bg-sky",
          )}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
    </div>
  );
}
