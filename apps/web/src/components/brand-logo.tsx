import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-2xl sm:text-3xl",
};

/** Playful rounded OmprengQ text wordmark. */
export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-[family-name:var(--font-logo)] font-bold leading-none tracking-tight text-foreground",
        SIZE_CLASSES[size],
        className,
      )}
    >
      Ompreng<span className="text-primary">Q</span>
    </span>
  );
}
