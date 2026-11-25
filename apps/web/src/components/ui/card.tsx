import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Plush 3D claymorphism surface card container mapped to OmprengQ semantic tokens. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-[var(--clay-rim)] bg-card text-card-foreground shadow-[var(--shadow-clay-card)]",
        className,
      )}
      {...props}
    />
  );
}

/** Card header wrapper. */
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5 sm:p-6", className)} {...props} />;
}

/** Card heading element. */
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-bold leading-snug sm:text-xl", className)} {...props} />;
}

/** Card subtitle/description text. */
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/** Card main body wrapper. */
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />;
}
