import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Accessible form input mapped to OmprengQ semantic tokens with >= 44px touch target. */
export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
