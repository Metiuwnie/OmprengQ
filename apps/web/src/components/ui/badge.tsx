import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-secondary-foreground",
        accent: "border-transparent bg-accent text-accent-foreground",
        mint: "border-transparent bg-mint text-foreground",
        primary: "border-transparent bg-primary text-primary-foreground",
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

/** Pill badge using semantic color tokens. */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
