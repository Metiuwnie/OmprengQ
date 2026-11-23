import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground shadow-[0_4px_0_0_var(--color-accent-deep)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_0_var(--color-accent-deep)]",
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:opacity-95 active:translate-y-0.5",
        secondary:
          "border border-border bg-card text-card-foreground shadow-[0_3px_0_0_var(--color-edge)] hover:-translate-y-0.5 active:translate-y-0.5",
        ghost: "bg-transparent text-foreground hover:bg-secondary",
      },
      size: {
        default: "min-h-11 px-5 py-2.5 text-sm",
        lg: "min-h-13 px-6 py-3 text-base",
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

/** Accessible button component mapped to OmprengQ semantic tokens (min 44px touch target). */
export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
