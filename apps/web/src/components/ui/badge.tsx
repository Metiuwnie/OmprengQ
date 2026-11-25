import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--clay-rim)] px-3 py-1 text-xs font-semibold shadow-2xs",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        accent: "bg-accent text-accent-foreground",
        mint: "bg-mint text-foreground",
        coral: "bg-coral-soft text-coral",
        primary: "bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/** Puffy clay pill badge using semantic color tokens. */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
