import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Surface card container using OmprengQ paper/card tokens. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}

/** Card header wrapper. */
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

/** Card heading element. */
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xl font-bold leading-tight", className)} {...props} />;
}

/** Card subtitle/description text. */
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/** Card main body wrapper. */
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
