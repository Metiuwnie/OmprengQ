import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-transparent px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground shadow-[var(--shadow-clay-accent)] hover:-translate-y-0.5 active:translate-y-0.5",
        primary:
          "bg-primary text-primary-foreground shadow-[var(--shadow-clay-primary)] hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0.5",
        sky:
          "bg-sky text-sky-foreground shadow-[var(--shadow-clay-sky)] hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0.5",
        secondary:
          "border-[var(--clay-rim)] bg-card text-card-foreground shadow-[var(--shadow-clay-pill)] hover:-translate-y-0.5 hover:bg-sky-soft/60 active:translate-y-0.5",
        ghost: "bg-transparent text-foreground hover:bg-card/70 active:translate-y-0.5",
      },
      size: {
        default: "min-h-11 px-5 py-2.5 text-sm",
        lg: "min-h-12 px-6 py-3 text-base",
        sm: "min-h-11 px-4 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/** Tactile 3D clay button mapped to OmprengQ semantic tokens (min 44px touch target). */
export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
