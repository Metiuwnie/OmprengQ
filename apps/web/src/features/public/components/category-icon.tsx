import {
  Apple,
  Drumstick,
  Milk,
  Salad,
  Sprout,
  Utensils,
  Wheat,
} from "lucide-react";

interface CategoryIconProps {
  category: string;
  className?: string;
}

/** Lightweight Lucide SVG icon per food category (never emojis as UI icons). */
export function CategoryIcon({ category, className = "h-5 w-5" }: CategoryIconProps) {
  switch (category) {
    case "karbohidrat":
      return <Wheat className={className} aria-hidden="true" />;
    case "lauk_hewani":
      return <Drumstick className={className} aria-hidden="true" />;
    case "lauk_nabati":
      return <Sprout className={className} aria-hidden="true" />;
    case "sayur":
      return <Salad className={className} aria-hidden="true" />;
    case "buah":
      return <Apple className={className} aria-hidden="true" />;
    case "susu":
      return <Milk className={className} aria-hidden="true" />;
    default:
      return <Utensils className={className} aria-hidden="true" />;
  }
}
